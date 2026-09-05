from typing import List, Dict, Tuple, Any
from app.compliance.engine import RuleFindingResult
from app.schemas.api_schemas import CategoryScoreResponse

class ScoringEngine:
    """
    Deterministic, transparent mathematical scoring engine.
    Calculates overall security scores (0-100) and category-level compliance scores
    based on weighted severity deductions.
    """

    SEVERITY_WEIGHTS = {
        "CRITICAL": 18.0,
        "HIGH": 10.0,
        "MEDIUM": 5.0,
        "LOW": 2.0,
        "INFO": 0.0
    }

    CATEGORIES = [
        "Authentication",
        "Remote Management",
        "Logging & Auditing",
        "Time Synchronization",
        "SNMP Security",
        "Access Control & Firewall",
        "Cryptography",
        "Network Services"
    ]

    @classmethod
    def calculate_device_score(cls, findings: List[RuleFindingResult]) -> Tuple[float, List[CategoryScoreResponse], Dict[str, int]]:
        """
        Calculates the security score for an individual device.
        Returns (overall_score, category_scores, severity_counts).
        """
        counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
        total_deduction = 0.0
        
        cat_deductions: Dict[str, float] = {c: 0.0 for c in cls.CATEGORIES}
        cat_counts: Dict[str, int] = {c: 0 for c in cls.CATEGORIES}

        for f in findings:
            sev = f.severity.upper()
            if sev in counts:
                counts[sev] += 1
            
            weight = cls.SEVERITY_WEIGHTS.get(sev, 0.0)
            total_deduction += weight
            
            cat = f.category
            if cat in cat_deductions:
                cat_deductions[cat] += weight
                cat_counts[cat] += 1
            else:
                cat_deductions[cat] = weight
                cat_counts[cat] = 1

        overall_score = max(0.0, min(100.0, round(100.0 - total_deduction, 1)))

        category_scores: List[CategoryScoreResponse] = []
        for cat in cls.CATEGORIES:
            ded = cat_deductions.get(cat, 0.0)
            score = max(0.0, min(100.0, round(100.0 - (ded * 1.5), 1)))  # Normalize category scale
            category_scores.append(CategoryScoreResponse(
                category=cat,
                score=score,
                findings_count=cat_counts.get(cat, 0)
            ))

        return overall_score, category_scores, counts

    @classmethod
    def calculate_assessment_rollup(
        cls, 
        device_scores: List[float], 
        all_findings: List[RuleFindingResult]
    ) -> Tuple[float, List[CategoryScoreResponse], Dict[str, int]]:
        """
        Calculates aggregate security metrics across multiple devices.
        """
        if not device_scores:
            return 100.0, [], {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}

        avg_score = round(sum(device_scores) / len(device_scores), 1)

        counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
        cat_counts: Dict[str, int] = {c: 0 for c in cls.CATEGORIES}
        cat_deductions: Dict[str, float] = {c: 0.0 for c in cls.CATEGORIES}

        for f in all_findings:
            sev = f.severity.upper()
            if sev in counts:
                counts[sev] += 1
            cat = f.category
            if cat in cat_counts:
                cat_counts[cat] += 1
                cat_deductions[cat] += cls.SEVERITY_WEIGHTS.get(sev, 0.0)

        # Average category scores across the fleet
        category_scores: List[CategoryScoreResponse] = []
        num_devs = max(1, len(device_scores))
        for cat in cls.CATEGORIES:
            avg_cat_deduction = cat_deductions.get(cat, 0.0) / num_devs
            cat_score = max(0.0, min(100.0, round(100.0 - (avg_cat_deduction * 1.5), 1)))
            category_scores.append(CategoryScoreResponse(
                category=cat,
                score=cat_score,
                findings_count=cat_counts.get(cat, 0)
            ))

        return avg_score, category_scores, counts

    @classmethod
    def get_risk_label(cls, score: float) -> str:
        if score >= 85.0:
            return "LOW RISK (HARDENED)"
        elif score >= 70.0:
            return "MODERATE RISK"
        elif score >= 50.0:
            return "HIGH RISK"
        else:
            return "CRITICAL RISK"
