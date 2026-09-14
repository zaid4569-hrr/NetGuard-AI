import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.scoring import ScoringEngine
from app.models.db_models import AssessmentModel, DeviceModel, FindingModel, CategoryScoreModel, UserModel
from app.schemas.api_schemas import AssessmentDetailResponse, AssessmentSummaryResponse
from app.security.validator import FileSecurityValidator
from app.security.sanitizer import SecuritySanitizer
from app.parsers.registry import ParserRegistry
from app.parsers.log_analyzer import analyze_log, looks_like_log
from app.compliance.engine import ComplianceEngine, RuleFindingResult
from app.ai.summarizer import AISummarizer
from app.api.deps import get_current_user
from app.blockchain.ledger import BlockchainLedger

router = APIRouter(prefix="/assessment", tags=["Assessments"])

@router.post("/upload", response_model=AssessmentDetailResponse)
async def upload_and_assess(
    files: List[UploadFile] = File(...),
    assessment_name: Optional[str] = Form(None),
    manual_vendor: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Ingests one or multiple network configuration or security log files.
    Configurations are normalized into the vendor-neutral model; logs are
    analyzed with bounded, explainable anomaly heuristics. Both paths produce
    the same persisted findings, scores, AI correlation, and ledger anchor.
    """
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files uploaded.")

    assessment_id = str(uuid.uuid4())
    name = assessment_name or f"Audit Job — {datetime.utcnow().strftime('%b %d, %Y %H:%M')}"

    assessment = AssessmentModel(
        id=assessment_id,
        user_id=current_user.id,
        name=name,
        total_devices=len(files),
        created_at=datetime.utcnow()
    )

    device_models = []
    all_findings_list: List[RuleFindingResult] = []
    device_findings_map = {}
    device_types_map = {}
    device_scores_list = []

    for file in files:
        raw_bytes = await file.read()
        clean_filename = FileSecurityValidator.sanitize_filename(file.filename or "config.cfg")
        FileSecurityValidator.validate_file(clean_filename, raw_bytes)

        raw_text = raw_bytes.decode("utf-8", errors="replace")

        if looks_like_log(clean_filename, raw_text):
            # Logs do not contain a device configuration AST. Keep their
            # findings in the same assessment contract for shared reporting.
            log_result = analyze_log(raw_text=raw_text, filename=clean_filename)
            normalized_config = None
            vendor = "Log Analyzer"
            confidence = log_result.confidence
            hostname = log_result.hostname
            device_type = "Security Log"
            findings = log_result.findings
        else:
            # Step 1: Parse and normalize (includes internal sanitization)
            normalized_config, vendor, confidence = ParserRegistry.auto_detect_and_parse(
                raw_text=raw_text,
                filename=clean_filename,
                manual_vendor_override=manual_vendor
            )
            hostname = normalized_config.metadata.hostname
            device_type = normalized_config.metadata.device_type

            # Step 2: Run Compliance Rule Audit
            findings = ComplianceEngine.run_audit(normalized_config)
        all_findings_list.extend(findings)

        # Step 3: Compute Device Scores
        dev_score, dev_cat_scores, dev_counts = ScoringEngine.calculate_device_score(findings)
        device_scores_list.append(dev_score)

        device_id = str(uuid.uuid4())
        device_findings_map[hostname] = findings
        device_types_map[device_id] = device_type

        # Create Device DB Record
        dev_model = DeviceModel(
            id=device_id,
            assessment_id=assessment_id,
            filename=clean_filename,
            hostname=hostname,
            vendor=vendor,
            vendor_confidence=confidence,
            os_version=normalized_config.metadata.os_version if normalized_config else None,
            device_type=device_type,
            security_score=dev_score,
            critical_count=dev_counts["CRITICAL"],
            high_count=dev_counts["HIGH"],
            medium_count=dev_counts["MEDIUM"],
            low_count=dev_counts["LOW"],
            info_count=dev_counts["INFO"]
        )

        # Create Finding DB Records
        for f in findings:
            finding_record = FindingModel(
                id=str(uuid.uuid4()),
                assessment_id=assessment_id,
                device_id=device_id,
                rule_id=f.rule_id,
                title=f.title,
                category=f.category,
                severity=f.severity,
                evidence=f.evidence,  # Masked evidence
                explanation=f.explanation,
                recommendation=f.recommendation,
                remediation_script=f.remediation_script,
                cis_reference=f.cis_reference,
                nist_reference=f.nist_reference,
                iso27001_reference=f.iso27001_reference,
                confidence=f.confidence
            )
            dev_model.findings.append(finding_record)

        # Create Category Score Records for Device
        for cs in dev_cat_scores:
            cat_record = CategoryScoreModel(
                id=str(uuid.uuid4()),
                assessment_id=assessment_id,
                device_id=device_id,
                category=cs.category,
                score=cs.score,
                findings_count=cs.findings_count
            )
            dev_model.category_scores.append(cat_record)

        device_models.append(dev_model)

    # Step 4: Calculate Assessment Rollups
    overall_score, overall_cat_scores, overall_counts = ScoringEngine.calculate_assessment_rollup(
        device_scores_list, all_findings_list
    )

    assessment.overall_score = overall_score
    assessment.critical_count = overall_counts["CRITICAL"]
    assessment.high_count = overall_counts["HIGH"]
    assessment.medium_count = overall_counts["MEDIUM"]
    assessment.low_count = overall_counts["LOW"]
    assessment.info_count = overall_counts["INFO"]

    # Step 5: Run AI Threat Graph Correlation & Executive Summarizer
    ai_insights = AISummarizer.generate_executive_insights(
        overall_score=overall_score,
        total_devices=len(device_models),
        severity_counts=overall_counts,
        all_findings=all_findings_list,
        device_findings_map=device_findings_map,
        device_types=device_types_map
    )

    assessment.executive_summary = ai_insights.executive_summary
    assessment.ai_insights = ai_insights.model_dump()
    assessment.devices = device_models

    # Create Overall Assessment Category Scores
    for cs in overall_cat_scores:
        cat_rec = CategoryScoreModel(
            id=str(uuid.uuid4()),
            assessment_id=assessment_id,
            device_id=None,
            category=cs.category,
            score=cs.score,
            findings_count=cs.findings_count
        )
        assessment.category_scores.append(cat_rec)

    db.add(assessment)
    await db.commit()

    # Auto-anchor to the blockchain audit ledger (NIST AU-10 / ISO 27001 A.12.4).
    # We do this in a best-effort try/except so a ledger failure never blocks
    # the primary upload response — the assessment is already safely persisted.
    try:
        finding_count = (
            overall_counts.get("CRITICAL", 0) + overall_counts.get("HIGH", 0)
            + overall_counts.get("MEDIUM", 0) + overall_counts.get("LOW", 0)
            + overall_counts.get("INFO", 0)
        )
        await BlockchainLedger.anchor_assessment(
            db=db,
            assessment_id=assessment_id,
            overall_score=overall_score,
            finding_count=finding_count,
            created_at=str(assessment.created_at),
            findings=[finding.model_dump() for finding in all_findings_list],
        )
    except Exception:
        pass  # Ledger errors must never surface to the user

    # Query back populated assessment
    result = await db.execute(
        select(AssessmentModel)
        .options(
            selectinload(AssessmentModel.devices),
            selectinload(AssessmentModel.findings),
            selectinload(AssessmentModel.category_scores)
        )
        .where(AssessmentModel.id == assessment_id)
    )
    saved_assessment = result.scalar_one()
    return saved_assessment

@router.get("", response_model=List[AssessmentSummaryResponse])
async def list_assessments(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Returns summary list of the current user's historical audit jobs.
    Only assessments owned by the authenticated user are returned.
    """
    result = await db.execute(
        select(AssessmentModel)
        .where(AssessmentModel.user_id == current_user.id)
        .order_by(desc(AssessmentModel.created_at))
    )
    return result.scalars().all()

@router.get("/{assessment_id}", response_model=AssessmentDetailResponse)
async def get_assessment_details(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Fetches full assessment details including devices, findings, and AI threat insights.
    Scoped to the authenticated user — another user's assessment ID returns 404,
    not 403, so as not to reveal that the ID exists at all.
    """
    result = await db.execute(
        select(AssessmentModel)
        .options(
            selectinload(AssessmentModel.devices),
            selectinload(AssessmentModel.findings),
            selectinload(AssessmentModel.category_scores)
        )
        .where(AssessmentModel.id == assessment_id, AssessmentModel.user_id == current_user.id)
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    return assessment

@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Deletes an assessment and all associated device findings.
    Only the owning user may delete their own assessment.
    """
    result = await db.execute(
        select(AssessmentModel)
        .where(AssessmentModel.id == assessment_id, AssessmentModel.user_id == current_user.id)
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    await db.delete(assessment)
    await db.commit()
    return None
