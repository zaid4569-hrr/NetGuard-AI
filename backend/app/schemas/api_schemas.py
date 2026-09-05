from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class FindingResponse(BaseModel):
    id: str
    assessment_id: str
    device_id: str
    rule_id: str
    title: str
    category: str
    severity: str
    evidence: str
    explanation: str
    recommendation: str
    remediation_script: Optional[str] = None
    cis_reference: Optional[str] = None
    nist_reference: Optional[str] = None
    iso27001_reference: Optional[str] = None
    confidence: float = 1.0
    correlated_group: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CategoryScoreResponse(BaseModel):
    category: str
    score: float
    findings_count: int

    class Config:
        from_attributes = True

class DeviceSummaryResponse(BaseModel):
    id: str
    assessment_id: str
    filename: str
    hostname: Optional[str] = None
    vendor: str
    vendor_confidence: float
    os_version: Optional[str] = None
    device_type: Optional[str] = None
    security_score: float
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DeviceDetailResponse(DeviceSummaryResponse):
    findings: List[FindingResponse] = []
    category_scores: List[CategoryScoreResponse] = []

class AICorrelationItem(BaseModel):
    attack_chain_title: str
    severity: str
    affected_devices: List[str]
    description: str
    remediation_priority: str
    action_steps: List[str]

class AIInsightsResponse(BaseModel):
    executive_summary: str
    top_critical_risks: List[str]
    correlated_attack_chains: List[AICorrelationItem]
    remediation_roadmap: List[str]

class AssessmentDetailResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    total_devices: int
    overall_score: float
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int
    executive_summary: Optional[str] = None
    ai_insights: Optional[Dict[str, Any]] = None
    category_scores: List[CategoryScoreResponse] = []
    devices: List[DeviceSummaryResponse] = []
    findings: List[FindingResponse] = []

    class Config:
        from_attributes = True

class AssessmentSummaryResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    total_devices: int
    overall_score: float
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int

    class Config:
        from_attributes = True

class RuleResponse(BaseModel):
    rule_id: str
    title: str
    category: str
    severity: str
    description: str
    remediation: str
    supported_vendors: List[str]
    cis_benchmark_ref: Optional[str] = None
    nist_ref: Optional[str] = None
    iso27001_ref: Optional[str] = None

    class Config:
        from_attributes = True
