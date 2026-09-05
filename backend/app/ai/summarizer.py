from typing import List, Dict, Any
from app.compliance.engine import RuleFindingResult
from app.schemas.api_schemas import AICorrelationItem, AIInsightsResponse
from app.ai.correlation import AIThreatCorrelator
from app.ai.prioritizer import RiskPrioritizer

class AISummarizer:
    """
    Offline Natural Language Executive Summarizer and Remediation Planner.
    Synthesizes audit statistics, threat correlation graphs, and security rules
    into plain-English executive briefings without requiring external cloud APIs.
    """

    @classmethod
    def generate_executive_insights(
        cls,
        overall_score: float,
        total_devices: int,
        severity_counts: Dict[str, int],
        all_findings: List[RuleFindingResult],
        device_findings_map: Dict[str, List[RuleFindingResult]],
        device_types: Dict[str, str]
    ) -> AIInsightsResponse:
        
        crit = severity_counts.get("CRITICAL", 0)
        high = severity_counts.get("HIGH", 0)
        med = severity_counts.get("MEDIUM", 0)
        low = severity_counts.get("LOW", 0)

        # 1. Correlate attack chains
        correlated_chains = AIThreatCorrelator.correlate_findings(device_findings_map)

        # 2. Rank top risks
        top_risks = RiskPrioritizer.rank_top_risks(all_findings, device_types)

        # 3. Formulate Natural Language Executive Summary
        if overall_score >= 85:
            health_status = "robust and largely compliant with industry hardening standards (CIS/NIST)"
            action_tone = "Maintain continuous posture with periodic re-assessments and automated configuration tracking."
        elif overall_score >= 70:
            health_status = "moderately secure but exhibits notable non-compliance items in administrative controls"
            action_tone = "Priority should be placed on addressing the identified High severity management and encryption weaknesses."
        elif overall_score >= 50:
            health_status = "under elevated risk due to multiple high-impact compliance violations"
            action_tone = "Urgent remediation is recommended to eliminate cleartext management transports and default credentials."
        else:
            health_status = "in a critical risk state with severe systemic vulnerabilities across multiple device tiers"
            action_tone = "Immediate tactical intervention is required to prevent imminent unauthorized administrative takeover."

        summary_lines = [
            f"NetGuard AI conducted a multi-vendor security audit across {total_devices} network device(s), resulting in an overall security posture score of {overall_score}/100.",
            f"The environment is currently {health_status}.",
            f"A total of {len(all_findings)} compliance finding(s) were identified: {crit} Critical, {high} High, {med} Medium, and {low} Low.",
        ]

        if correlated_chains:
            summary_lines.append(
                f"AI Threat Graph Correlation detected {len(correlated_chains)} multi-stage attack vector(s), most notably: '{correlated_chains[0].attack_chain_title}' affecting {len(correlated_chains[0].affected_devices)} device(s)."
            )

        summary_lines.append(action_tone)
        executive_summary = " ".join(summary_lines)

        # 4. Generate Remediation Roadmap
        roadmap = []
        if crit > 0 or any(c.severity == "CRITICAL" for c in correlated_chains):
            roadmap.append("Phase 1 (Immediate / 24 Hours): Eliminate 'permit any any' ingress rules, rotate default SNMP communities ('public'/'private'), and apply management ACLs.")
        if high > 0:
            roadmap.append("Phase 2 (Short-Term / 7 Days): Disable Telnet in favor of SSHv2, enforce SHA-256 password hashing, and terminate DES/3DES VPN crypto proposals.")
        if med > 0 or low > 0:
            roadmap.append("Phase 3 (Medium-Term / 30 Days): Connect all devices to centralized remote Syslog/SIEM collectors, enable authenticated NTP, and disable CDP/LLDP on untrusted edge links.")

        if not roadmap:
            roadmap.append("Environment meets primary hardening baseline. Continue continuous monitoring and periodic drift audits.")

        return AIInsightsResponse(
            executive_summary=executive_summary,
            top_critical_risks=top_risks,
            correlated_attack_chains=correlated_chains,
            remediation_roadmap=roadmap
        )
