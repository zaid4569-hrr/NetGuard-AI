from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.schemas.normalized import NormalizedDeviceConfig

class RuleFindingResult(BaseModel):
    rule_id: str
    title: str
    category: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    evidence: str  # Masked text proof
    explanation: str
    recommendation: str
    remediation_script: Optional[str] = None
    cis_reference: Optional[str] = None
    nist_reference: Optional[str] = None
    iso27001_reference: Optional[str] = None
    confidence: float = 1.0

class BaseSecurityRule(ABC):
    """
    Abstract Base Class for all Compliance & Security Audit Rules.
    """
    rule_id: str
    title: str
    category: str
    severity: str
    description: str
    remediation: str
    supported_vendors: List[str] = ["Cisco", "Fortinet", "Juniper", "Palo Alto", "MikroTik", "Aruba"]
    cis_reference: Optional[str] = None
    nist_reference: Optional[str] = None
    iso27001_reference: Optional[str] = None

    @abstractmethod
    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        """
        Evaluates the normalized device configuration.
        Returns a RuleFindingResult if a security violation is detected, or None if compliant.
        """
        pass

    def is_applicable_to(self, vendor: str) -> bool:
        if "All" in self.supported_vendors:
            return True
        return any(v.lower() == vendor.lower() for v in self.supported_vendors)

class ComplianceEngine:
    """
    Modular Rule Engine that executes security rules against normalized device configurations.
    """
    _rules: Dict[str, BaseSecurityRule] = {}

    @classmethod
    def register_rule(cls, rule: BaseSecurityRule) -> None:
        cls._rules[rule.rule_id] = rule

    @classmethod
    def get_all_rules(cls) -> List[BaseSecurityRule]:
        return list(cls._rules.values())

    @classmethod
    def run_audit(cls, norm: NormalizedDeviceConfig) -> List[RuleFindingResult]:
        findings: List[RuleFindingResult] = []
        vendor = norm.metadata.vendor

        for rule in cls._rules.values():
            if not rule.is_applicable_to(vendor):
                continue
            try:
                result = rule.evaluate(norm)
                if result:
                    findings.append(result)
            except Exception as e:
                # Fallback to prevent one rule from crashing the entire assessment
                continue

        # Sort findings by severity priority: CRITICAL > HIGH > MEDIUM > LOW > INFO
        severity_weight = {"CRITICAL": 5, "HIGH": 4, "MEDIUM": 3, "LOW": 2, "INFO": 1}
        findings.sort(key=lambda f: severity_weight.get(f.severity, 0), reverse=True)
        return findings
