from typing import List, Dict, Any
from app.compliance.engine import RuleFindingResult

class RiskPrioritizer:
    """
    Evaluates blast radius, asset device types, and composite vulnerability weights
    to calculate actionable risk priorities.
    """

    DEVICE_CRITICALITY = {
        "Firewall": 1.4,
        "Router": 1.2,
        "Switch": 1.0,
        "Security Gateway": 1.4,
        "Network Device": 1.0
    }

    SEVERITY_SCORES = {
        "CRITICAL": 100,
        "HIGH": 75,
        "MEDIUM": 45,
        "LOW": 20,
        "INFO": 5
    }

    @classmethod
    def rank_top_risks(cls, findings: List[RuleFindingResult], device_types: Dict[str, str]) -> List[str]:
        """
        Ranks top priority risks across the audited environment.
        """
        risk_map: Dict[str, float] = {}

        for f in findings:
            sev_score = cls.SEVERITY_SCORES.get(f.severity.upper(), 10)
            dev_mult = 1.0 # Default multiplier
            
            risk_key = f"{f.title} ({f.severity})"
            risk_map[risk_key] = risk_map.get(risk_key, 0.0) + (sev_score * dev_mult)

        # Sort by total composite risk score
        sorted_risks = sorted(risk_map.items(), key=lambda x: x[1], reverse=True)
        return [f"{risk} — Impact Score: {int(score)}" for risk, score in sorted_risks[:5]]
