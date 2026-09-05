from typing import List
from fastapi import APIRouter
from app.compliance.engine import ComplianceEngine
from app.parsers.registry import ParserRegistry
from app.schemas.api_schemas import RuleResponse

router = APIRouter(tags=["Rules & Vendors"])

@router.get("/rules", response_model=List[RuleResponse])
async def list_rules():
    """
    Returns the comprehensive catalog of compliance and security audit rules.
    """
    rules = ComplianceEngine.get_all_rules()
    return [
        RuleResponse(
            rule_id=r.rule_id,
            title=r.title,
            category=r.category,
            severity=r.severity,
            description=r.description,
            remediation=r.remediation,
            supported_vendors=r.supported_vendors,
            cis_benchmark_ref=r.cis_reference,
            nist_ref=r.nist_reference,
            iso27001_ref=r.iso27001_reference
        )
        for r in rules
    ]

@router.get("/vendors", response_model=List[str])
async def list_vendors():
    """
    Returns list of supported network hardware vendors.
    """
    return ParserRegistry.list_supported_vendors()
