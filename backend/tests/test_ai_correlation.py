from app.ai.correlation import AIThreatCorrelator
from app.ai.summarizer import AISummarizer
from app.compliance.engine import RuleFindingResult

def test_ai_attack_chain_correlation():
    findings = [
        RuleFindingResult(
            rule_id="NET-MGMT-001",
            title="Telnet Enabled",
            category="Remote Management",
            severity="HIGH",
            evidence="transport input telnet",
            explanation="Unencrypted management",
            recommendation="Use SSH"
        ),
        RuleFindingResult(
            rule_id="NET-ACL-002",
            title="Unrestricted Management Access",
            category="Access Control & Firewall",
            severity="CRITICAL",
            evidence="No access-class on VTY",
            explanation="Management plane exposed",
            recommendation="Apply ACL"
        ),
    ]

    dev_findings_map = {"Router-01": findings}
    chains = AIThreatCorrelator.correlate_findings(dev_findings_map)

    assert len(chains) > 0
    assert chains[0].attack_chain_title == "Cleartext Management Sniffing & Administrative Takeover"
    assert "Router-01" in chains[0].affected_devices

def test_ai_executive_summarizer():
    findings = [
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
    dev_map = {"Router-01": findings}
    insights = AISummarizer.generate_executive_insights(
        overall_score=72.0,
        total_devices=1,
        severity_counts={"CRITICAL": 0, "HIGH": 1, "MEDIUM": 0, "LOW": 0},
        all_findings=findings,
        device_findings_map=dev_map,
        device_types={"Router-01": "Router"}
    )

    assert insights.executive_summary is not None
    assert "72.0/100" in insights.executive_summary
    assert len(insights.remediation_roadmap) > 0

if __name__ == "__main__":
    test_ai_attack_chain_correlation()
    test_ai_executive_summarizer()
    print("ALL AI THREAT CORRELATION & NLP TESTS PASSED.")
