from typing import Optional
from app.compliance.engine import BaseSecurityRule, RuleFindingResult
from app.schemas.normalized import NormalizedDeviceConfig

class DiscoveryProtocolsEnabledRule(BaseSecurityRule):
    rule_id = "NET-SVC-001"
    title = "Dangerous Layer-2 Discovery Protocols Enabled Globally (CDP / LLDP)"
    category = "Network Services"
    severity = "LOW"
    description = "Cisco Discovery Protocol (CDP) or Link Layer Discovery Protocol (LLDP) broadcasts internal device models, software versions, and IP maps."
    remediation = "Disable CDP/LLDP globally or restrict it exclusively to point-to-point trunk links connecting trusted switches."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.8.1"
    nist_reference = "NIST SP 800-53 CM-7"
    iso27001_reference = "ISO/IEC 27001 A.12.5.1"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.services.cdp_enabled or norm.services.lldp_enabled:
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "no cdp run\nno lldp run",
                "Fortinet": "config system interface\n edit <port>\n set lldp-transmission disable\n next\nend",
                "Juniper": "delete protocols lldp"
            }.get(vendor, "Disable discovery protocols.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="CDP / LLDP discovery protocol active in running configuration",
                explanation="Discovery protocols broadcast hardware model, firmware revision, and management IPs in cleartext frames to all local network ports.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class InsecureAuxiliaryServicesRule(BaseSecurityRule):
    rule_id = "NET-SVC-002"
    title = "Legacy Insecure Auxiliary Services Enabled (Finger / Source Routing / Small Servers)"
    category = "Network Services"
    severity = "MEDIUM"
    description = "Legacy TCP/UDP services such as Finger, IP Source Routing, or TCP Small Servers are active."
    remediation = "Disable all legacy diagnostic services and IP Source Routing."
    supported_vendors = ["Cisco"]
    cis_reference = "CIS Benchmark 1.8.2"
    nist_reference = "NIST SP 800-53 CM-7"
    iso27001_reference = "ISO/IEC 27001 A.12.5.1"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.metadata.vendor == "Cisco":
            violations = []
            if norm.services.finger_service_enabled:
                violations.append("ip finger service")
            if norm.services.ip_source_routing_enabled:
                violations.append("ip source-routing enabled")
            if norm.services.tcp_small_servers_enabled:
                violations.append("service tcp-small-servers")

            if violations:
                return RuleFindingResult(
                    rule_id=self.rule_id,
                    title=self.title,
                    category=self.category,
                    severity=self.severity,
                    evidence=f"Legacy services detected: {', '.join(violations)}",
                    explanation="IP source routing allows packets to bypass firewall topology. Finger and echo services facilitate automated reconnaissance and DoS.",
                    recommendation=self.remediation,
                    remediation_script="no ip source-route\nno ip finger\nno service tcp-small-servers\nno service udp-small-servers",
                    cis_reference=self.cis_reference,
                    nist_reference=self.nist_reference,
                    iso27001_reference=self.iso27001_reference
                )
        return None
