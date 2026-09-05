from typing import List, Dict, Any
from app.compliance.engine import RuleFindingResult
from app.schemas.api_schemas import AICorrelationItem

class AIThreatCorrelator:
    """
    AI-driven Threat Graph Correlation Engine.
    Identifies compound multi-finding vulnerabilities and maps them into
    realistic adversary attack chains and exploitation vectors.
    """

    CORRELATION_PATTERNS = [
        {
            "id": "CHAIN-01",
            "title": "Cleartext Management Sniffing & Administrative Takeover",
            "required_rule_ids": {"NET-MGMT-001", "NET-ACL-002"},
            "optional_rule_ids": {"NET-AUTH-001", "NET-AUTH-003"},
            "severity": "CRITICAL",
            "description": "The device runs unencrypted Telnet management while simultaneously lacking an access-control list on administrative interfaces. Any network adversary on the segment can sniff credentials and execute commands.",
            "remediation_priority": "P0 - Immediate Action Required",
            "action_steps": [
                "Disable Telnet transport globally and enforce SSHv2.",
                "Apply an access-class/trusthost filter restricting management ports to the SOC bastion host subnet.",
                "Rotate all administrative passwords immediately."
            ]
        },
        {
            "id": "CHAIN-02",
            "title": "Perimeter Firewall Bypass & Undetected Lateral Movement",
            "required_rule_ids": {"NET-ACL-001", "NET-LOG-001"},
            "optional_rule_ids": {"NET-LOG-002", "NET-AUTH-003"},
            "severity": "CRITICAL",
            "description": "An overly permissive 'permit any any' ingress policy is active, while system logging is disabled. Attackers can traverse the perimeter freely without leaving forensic audit trails.",
            "remediation_priority": "P0 - Immediate Action Required",
            "action_steps": [
                "Revoke broad permit any any firewall rules and replace with least-privilege port filters.",
                "Enable centralized remote syslog forwarding to the enterprise SIEM immediately.",
                "Review active connection tables for unauthorized ingress sessions."
            ]
        },
        {
            "id": "CHAIN-03",
            "title": "SNMP-Based Device Reconnaissance & Configuration Tampering",
            "required_rule_ids": {"NET-SNMP-002"},
            "optional_rule_ids": {"NET-SNMP-001", "NET-SNMP-003", "NET-ACL-002"},
            "severity": "HIGH",
            "description": "Default SNMP community strings ('public'/'private') are enabled. When combined with SNMPv1/v2c or RW access, attackers can enumerate full routing tables, download startup configurations, or re-route traffic.",
            "remediation_priority": "P1 - High Priority Remediation",
            "action_steps": [
                "Delete default 'public' and 'private' community strings.",
                "Migrate SNMP polling to SNMPv3 with authPriv (SHA-256 + AES-128).",
                "Restrict SNMP UDP port 161 access to authorized network monitoring systems (NMS)."
            ]
        },
        {
            "id": "CHAIN-04",
            "title": "VPN Cryptographic Interception & Man-in-the-Middle Risk",
            "required_rule_ids": {"NET-CRYPTO-001", "NET-CRYPTO-002"},
            "optional_rule_ids": set(),
            "severity": "HIGH",
            "description": "IPsec tunnels utilize legacy DES/3DES ciphers alongside weak Diffie-Hellman groups (DH 1/2/5). Traffic passing through site-to-site tunnels is susceptible to key compromise and Sweet32 plaintext recovery.",
            "remediation_priority": "P1 - High Priority Remediation",
            "action_steps": [
                "Upgrade Phase 1 and Phase 2 proposals to AES-256-GCM.",
                "Configure Diffie-Hellman Group 14 (2048-bit) or Group 19 (ECP-256) on both VPN peers.",
                "Enable Perfect Forward Secrecy (PFS)."
            ]
        },
        {
            "id": "CHAIN-05",
            "title": "Forensic Blind Spot & Certificate Validation Failure",
            "required_rule_ids": {"NET-NTP-001", "NET-LOG-002"},
            "optional_rule_ids": {"NET-LOG-003", "NET-NTP-002"},
            "severity": "MEDIUM",
            "description": "The device lacks both synchronized NTP time sources and remote syslog collection. Security timestamps are drifting and logs cannot be corroborated during an incident investigation.",
            "remediation_priority": "P2 - Planned Security Maintenance",
            "action_steps": [
                "Configure redundant authoritative NTP servers with cryptographic authentication.",
                "Direct syslog telemetry to the central SIEM collector.",
                "Enable sub-second millisecond timestamps on all log buffers."
            ]
        }
    ]

    @classmethod
    def correlate_findings(
        cls, 
        device_findings_map: Dict[str, List[RuleFindingResult]]
    ) -> List[AICorrelationItem]:
        """
        Analyzes findings across all devices and returns detected attack chains.
        """
        correlated_chains: List[AICorrelationItem] = []

        for pattern in cls.CORRELATION_PATTERNS:
            affected_devices = []
            
            for device_id_or_name, findings in device_findings_map.items():
                found_rule_ids = {f.rule_id for f in findings}
                if pattern["required_rule_ids"].issubset(found_rule_ids):
                    affected_devices.append(device_id_or_name)

            if affected_devices:
                correlated_chains.append(AICorrelationItem(
                    attack_chain_title=pattern["title"],
                    severity=pattern["severity"],
                    affected_devices=affected_devices,
                    description=pattern["description"],
                    remediation_priority=pattern["remediation_priority"],
                    action_steps=pattern["action_steps"]
                ))

        return correlated_chains
