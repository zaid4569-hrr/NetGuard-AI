from app.core.scoring import ScoringEngine
from app.compliance.engine import RuleFindingResult

def test_scoring_deduction():
    sample_findings = [
        RuleFindingResult(
            rule_id="NET-ACL-001",
            title="Permit Any Any",
            category="Access Control & Firewall",
            severity="CRITICAL",
            evidence="permit ip any any",
            explanation="Dangerous ingress rule",
            recommendation="Restrict ACL"
        ),
        RuleFindingResult(
            rule_id="NET-MGMT-001",
            title="Telnet Enabled",
            category="Remote Management",
            severity="HIGH",
            evidence="transport input telnet",
            explanation="Unencrypted management",
            recommendation="Use SSH"
        )
    ]

    score, cat_scores, counts = ScoringEngine.calculate_device_score(sample_findings)

    # 100 - (18 + 10) = 72.0
    assert score == 72.0
    assert counts["CRITICAL"] == 1
    assert counts["HIGH"] == 1
    assert counts["MEDIUM"] == 0

    # Ensure category scores are populated and within [0, 100]
    for cs in cat_scores:
        assert 0.0 <= cs.score <= 100.0

def test_clean_device_score():
    score, cat_scores, counts = ScoringEngine.calculate_device_score([])
    assert score == 100.0
    assert counts["CRITICAL"] == 0

if __name__ == "__main__":
    test_scoring_deduction()
    test_clean_device_score()
    print("ALL SCORING MATHEMATICAL TESTS PASSED.")
