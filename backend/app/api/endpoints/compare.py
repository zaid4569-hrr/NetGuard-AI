import difflib
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.parsers.registry import ParserRegistry
from app.compliance.engine import ComplianceEngine
from app.core.scoring import ScoringEngine

router = APIRouter(prefix="/compare", tags=["Configuration Comparison"])

class CompareRequest(BaseModel):
    before_config: str
    after_config: str
    before_filename: Optional[str] = "config_before.cfg"
    after_filename: Optional[str] = "config_after.cfg"
    vendor_override: Optional[str] = None

class DiffLine(BaseModel):
    type: str  # "added", "removed", "unchanged"
    text: str

class CompareResponse(BaseModel):
    score_before: float
    score_after: float
    score_delta: float
    vendor_before: str
    vendor_after: str
    total_findings_before: int
    total_findings_after: int
    resolved_findings: List[Dict[str, Any]]
    new_findings: List[Dict[str, Any]]
    diff_lines: List[DiffLine]

@router.post("", response_model=CompareResponse)
async def compare_configurations(req: CompareRequest):
    """
    Compares two network configuration baselines (e.g. before and after remediation).
    Calculates unified diff, before & after security scores, and resolved findings.
    """
    if not req.before_config.strip() or not req.after_config.strip():
        raise HTTPException(status_code=400, detail="Both before and after configurations must be provided.")

    # 1. Parse Before Config
    norm_before, vendor_before, _ = ParserRegistry.auto_detect_and_parse(
        raw_text=req.before_config,
        filename=req.before_filename or "before.cfg",
        manual_vendor_override=req.vendor_override
    )
    findings_before = ComplianceEngine.run_audit(norm_before)
    score_before, _, _ = ScoringEngine.calculate_device_score(findings_before)

    # 2. Parse After Config
    norm_after, vendor_after, _ = ParserRegistry.auto_detect_and_parse(
        raw_text=req.after_config,
        filename=req.after_filename or "after.cfg",
        manual_vendor_override=req.vendor_override
    )
    findings_after = ComplianceEngine.run_audit(norm_after)
    score_after, _, _ = ScoringEngine.calculate_device_score(findings_after)

    # 3. Find Resolved and New Findings
    before_rule_map = {f.rule_id: f for f in findings_before}
    after_rule_map = {f.rule_id: f for f in findings_after}

    resolved = [
        {
            "rule_id": f.rule_id,
            "title": f.title,
            "severity": f.severity,
            "category": f.category
        }
        for r_id, f in before_rule_map.items()
        if r_id not in after_rule_map
    ]

    new_issues = [
        {
            "rule_id": f.rule_id,
            "title": f.title,
            "severity": f.severity,
            "category": f.category
        }
        for r_id, f in after_rule_map.items()
        if r_id not in before_rule_map
    ]

    # 4. Compute Unified Diff
    before_lines = req.before_config.splitlines()
    after_lines = req.after_config.splitlines()
    diff = difflib.ndiff(before_lines, after_lines)

    diff_lines: List[DiffLine] = []
    for line in diff:
        if line.startswith('+ '):
            diff_lines.append(DiffLine(type="added", text=line[2:]))
        elif line.startswith('- '):
            diff_lines.append(DiffLine(type="removed", text=line[2:]))
        elif line.startswith('  '):
            diff_lines.append(DiffLine(type="unchanged", text=line[2:]))

    return CompareResponse(
        score_before=score_before,
        score_after=score_after,
        score_delta=round(score_after - score_before, 1),
        vendor_before=vendor_before,
        vendor_after=vendor_after,
        total_findings_before=len(findings_before),
        total_findings_after=len(findings_after),
        resolved_findings=resolved,
        new_findings=new_issues,
        diff_lines=diff_lines[:500]  # Cap for responsive rendering
    )
