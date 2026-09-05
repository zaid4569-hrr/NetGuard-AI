from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.db_models import AssessmentModel, UserModel
from app.security.auth import require_user
from app.reports.pdf_generator import AuditReportGenerator

router = APIRouter(prefix="/report", tags=["Reports"])

@router.get("/{assessment_id}/pdf")
async def export_pdf_report(assessment_id: str, db: AsyncSession = Depends(get_db), user: UserModel = Depends(require_user)):
    """
    Generates and streams a professional PDF compliance audit report for the given assessment.
    """
    result = await db.execute(
        select(AssessmentModel)
        .options(
            selectinload(AssessmentModel.devices),
            selectinload(AssessmentModel.findings),
            selectinload(AssessmentModel.category_scores)
        )
        .where(AssessmentModel.id == assessment_id, AssessmentModel.owner_id == user.id)
    )
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    assessment_dict = {
        "id": assessment.id,
        "name": assessment.name,
        "created_at": assessment.created_at,
        "overall_score": assessment.overall_score,
        "total_devices": assessment.total_devices,
        "critical_count": assessment.critical_count,
        "high_count": assessment.high_count,
        "medium_count": assessment.medium_count,
        "low_count": assessment.low_count,
        "info_count": assessment.info_count,
        "executive_summary": assessment.executive_summary,
        "ai_insights": assessment.ai_insights
    }

    devices_list = [
        {
            "id": d.id,
            "filename": d.filename,
            "hostname": d.hostname,
            "vendor": d.vendor,
            "security_score": d.security_score,
            "critical_count": d.critical_count,
            "high_count": d.high_count,
            "medium_count": d.medium_count,
            "low_count": d.low_count,
        }
        for d in assessment.devices
    ]

    findings_list = [
        {
            "id": f.id,
            "rule_id": f.rule_id,
            "title": f.title,
            "category": f.category,
            "severity": f.severity,
            "evidence": f.evidence,
            "explanation": f.explanation,
            "recommendation": f.recommendation,
            "remediation_script": f.remediation_script,
            "cis_reference": f.cis_reference
        }
        for f in assessment.findings
    ]

    cat_scores_list = [
        {
            "category": cs.category,
            "score": cs.score,
            "findings_count": cs.findings_count
        }
        for cs in assessment.category_scores
        if cs.device_id is None  # Assessment rollup scores
    ]

    pdf_bytes = AuditReportGenerator.generate_pdf(
        assessment_data=assessment_dict,
        devices=devices_list,
        findings=findings_list,
        category_scores=cat_scores_list
    )

    filename = f"NetGuard_Audit_Report_{assessment.id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
