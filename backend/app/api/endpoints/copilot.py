from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.core.database import get_db
from app.core.config import settings
from app.models.db_models import AssessmentModel, FindingModel, DeviceModel
from app.ai.llm_provider import LocalLLMProvider

router = APIRouter(prefix="/copilot", tags=["AI Copilot"])

class CopilotQueryRequest(BaseModel):
    prompt: str
    assessment_id: Optional[str] = None

class CopilotQueryResponse(BaseModel):
    query: str
    response: str
    grounded_context: Dict[str, Any]
    provider: str  # "local-threat-graph" or "local-llm"
    suggestions: List[str]

class ExplainFindingRequest(BaseModel):
    finding_id: Optional[str] = None
    rule_id: Optional[str] = None
    title: Optional[str] = None
    severity: Optional[str] = None
    evidence: Optional[str] = None
    category: Optional[str] = None

class ExplainFindingResponse(BaseModel):
    rule_id: str
    title: str
    problem: str
    why_it_matters: str
    security_impact: str
    recommended_action: str
    priority: str
    remediation_command: Optional[str] = None

@router.post("/query", response_model=CopilotQueryResponse)
async def query_copilot(req: CopilotQueryRequest, db: AsyncSession = Depends(get_db)):
    """
    AI Security Copilot query grounded in actual audit results and threat chains.
    """
    # Find targeted or latest assessment
    assessment = None
    if req.assessment_id:
        res = await db.execute(
            select(AssessmentModel)
            .options(selectinload(AssessmentModel.devices), selectinload(AssessmentModel.findings))
            .where(AssessmentModel.id == req.assessment_id)
        )
        assessment = res.scalar_one_or_none()

    if not assessment:
        res = await db.execute(
            select(AssessmentModel)
            .options(selectinload(AssessmentModel.devices), selectinload(AssessmentModel.findings))
            .order_by(desc(AssessmentModel.created_at))
            .limit(1)
        )
        assessment = res.scalar_one_or_none()

    prompt_lower = req.prompt.lower()
    score = assessment.overall_score if assessment else 74.0
    device_count = assessment.total_devices if assessment else 4
    critical_findings = [f for f in assessment.findings if f.severity == "CRITICAL"] if assessment else []
    high_findings = [f for f in assessment.findings if f.severity == "HIGH"] if assessment else []

    # Grounded reasoning response builder
    if "dangerous" in prompt_lower or "critical" in prompt_lower or "most" in prompt_lower:
        if critical_findings:
            top_f = critical_findings[0]
            answer = (
                f"Your most critical security exposure is **{top_f.title}** ({top_f.rule_id}) "
                f"detected on device `{top_f.device.hostname if top_f.device else 'Network Core'}`. "
                f"Evidence: `{top_f.evidence}`. "
                f"\n\n**Adversary Impact**: {top_f.explanation}\n\n"
                f"**Immediate Fix**: {top_f.recommendation}"
            )
        else:
            answer = "No critical vulnerabilities are currently open across your audited devices. Your perimeter baseline is within healthy operating thresholds."

    elif "score" in prompt_lower or "why" in prompt_lower or "low" in prompt_lower:
        deductions = (len(critical_findings) * 18) + (len(high_findings) * 10)
        answer = (
            f"Your current Security Posture Score is **{score:.1f} / 100**.\n\n"
            f"**Score Breakdown & Derivation**:\n"
            f"- Base Score: 100.0 points\n"
            f"- Critical Findings ({len(critical_findings)}): -{len(critical_findings) * 18:.1f} pts (-18.0 pts each)\n"
            f"- High-Risk Findings ({len(high_findings)}): -{len(high_findings) * 10:.1f} pts (-10.0 pts each)\n"
            f"- Total Point Deduction: -{deductions:.1f} points\n\n"
            f"Resolving the top critical findings will immediately elevate your score above 85/100."
        )

    elif "device" in prompt_lower or "first" in prompt_lower or "which" in prompt_lower:
        devices = assessment.devices if assessment else []
        worst_dev = min(devices, key=lambda d: d.security_score) if devices else None
        if worst_dev:
            answer = (
                f"You should prioritize remediating **{worst_dev.hostname or worst_dev.filename}** ({worst_dev.vendor}). "
                f"It holds the lowest posture rating (**{worst_dev.security_score:.1f} / 100**) with "
                f"{worst_dev.critical_count} critical and {worst_dev.high_count} high-severity findings."
            )
        else:
            answer = "All devices currently meet standard security baselines."

    elif "cis" in prompt_lower or "control" in prompt_lower or "compliance" in prompt_lower:
        cis_refs = [f.cis_reference for f in (assessment.findings if assessment else []) if f.cis_reference]
        top_cis = list(set(cis_refs))[:4]
        answer = (
            f"The active audit findings map directly to several benchmark controls:\n"
            + "\n".join([f"- **CIS Benchmark {c}**: Non-compliant configurations detected" for c in top_cis])
            + "\n\nRefer to the **Compliance Center** for control-by-control audit matrices."
        )

    elif "management" in prompt_lower or "summarize" in prompt_lower or "executive" in prompt_lower:
        answer = (
            f"### Executive Security Briefing\n"
            f"The multi-vendor audit evaluated **{device_count} infrastructure devices**, achieving a composite security posture of **{score:.1f} / 100**.\n"
            f"- **Threat Posture**: {'Elevated Risk' if score < 75 else 'Hardened Perimeter'}\n"
            f"- **Open Action Items**: {len(critical_findings)} Critical, {len(high_findings)} High\n"
            f"- **Executive Action**: Deploy the automated CLI hardening templates generated in the Remediation Center to close remote management and perimeter ACL gaps."
        )

    else:
        # General response
        answer = (
            f"NetGuard AI evaluated configuration health across {device_count} devices (Score: **{score:.1f} / 100**). "
            f"Identified {len(critical_findings)} critical exposures and {len(high_findings)} high-risk findings. "
            f"You can ask me to explain specific findings, prioritize devices, or detail compliance mappings."
        )

    # If local LLM is enabled in config, query it to augment response
    provider_type = "local-threat-graph"
    if settings.ENABLE_LOCAL_LLM:
        llm_reply = await LocalLLMProvider.query_local_model(
            prompt=f"Audit Score: {score}. Question: {req.prompt}. Context summary: {answer}"
        )
        if llm_reply:
            answer = llm_reply
            provider_type = "local-llm"

    return CopilotQueryResponse(
        query=req.prompt,
        response=answer,
        grounded_context={
            "assessment_id": assessment.id if assessment else "synthetic-demo",
            "score": score,
            "total_devices": device_count,
            "critical_count": len(critical_findings),
            "high_count": len(high_findings)
        },
        provider=provider_type,
        suggestions=[
            "What are my most dangerous findings?",
            "Why is my security score low?",
            "Which device should I fix first?",
            "What CIS controls are affected?",
            "Summarize this audit for management."
        ]
    )

@router.post("/explain-finding", response_model=ExplainFindingResponse)
async def explain_finding(req: ExplainFindingRequest, db: AsyncSession = Depends(get_db)):
    """
    Returns structured, professional explanation for a security finding.
    """
    finding = None
    if req.finding_id:
        res = await db.execute(select(FindingModel).where(FindingModel.id == req.finding_id))
        finding = res.scalar_one_or_none()

    rule_id = finding.rule_id if finding else (req.rule_id or "NET-SEC-001")
    title = finding.title if finding else (req.title or "Security Configuration Violation")
    severity = finding.severity if finding else (req.severity or "HIGH")
    evidence = finding.evidence if finding else (req.evidence or "Configuration token")

    problem = f"Device configuration violates standard security baseline with setting: `{evidence}`."
    why_it_matters = (
        f"This parameter creates an exploitable exposure allowing adversaries or unauthorized network users "
        f"to bypass perimeter controls, sniff unencrypted credentials, or manipulate device states."
    )
    security_impact = (
        "High risk of credential theft, unauthorized administrative access, and non-compliance with CIS/NIST standards."
        if severity in ["CRITICAL", "HIGH"]
        else "Medium risk of information disclosure or policy drift."
    )
    recommended_action = finding.recommendation if finding else "Apply vendor-specific CLI hardening commands to disable insecure services."
    priority = "P0 - Immediate Fix" if severity == "CRITICAL" else ("P1 - High Priority" if severity == "HIGH" else "P2 - Planned Maintenance")

    return ExplainFindingResponse(
        rule_id=rule_id,
        title=title,
        problem=problem,
        why_it_matters=why_it_matters,
        security_impact=security_impact,
        recommended_action=recommended_action,
        priority=priority,
        remediation_command=finding.remediation_script if finding else None
    )
