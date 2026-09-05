from typing import Optional
from app.compliance.engine import BaseSecurityRule, RuleFindingResult
from app.schemas.normalized import NormalizedDeviceConfig

class PermitAnyAnyRule(BaseSecurityRule):
    rule_id = "NET-ACL-001"
    title = "Dangerous 'Permit Any Any' Ingress Policy Detected"
    category = "Access Control & Firewall"
    severity = "CRITICAL"
    description = "Firewall filter or access control list contains an unrestricted permit rule allowing all traffic from any source to any destination."
    remediation = "Replace broad 'any any' permit rules with strict least-privilege source/destination IP prefixes and specific protocol ports."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.6.1"
    nist_reference = "NIST SP 800-53 AC-4"
    iso27001_reference = "ISO/IEC 27001 A.13.1.1"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.access_control.any_any_permit_detected:
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "no access-list <id> permit ip any any\naccess-list <id> permit ip 10.0.0.0 0.255.255.255 192.168.1.0 0.0.0.255",
                "Fortinet": "config firewall policy\n edit <policy_id>\n set srcaddr \"CORP_NETWORKS\"\n set dstaddr \"DMZ_SERVERS\"\n set service \"HTTPS\"\n next\nend",
                "Juniper": "set security policies from-zone untrust to-zone trust policy <name> match source-address CORP_RANGE destination-address SERVERS application HTTPS"
            }.get(vendor, "Apply specific least-privilege ACL rules.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="permit any any / set srcaddr all dstaddr all action accept detected",
                explanation="Unrestricted permit rules nullify firewall protection and expose internal subnets to unauthorized external access.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class UnrestrictedManagementAccessRule(BaseSecurityRule):
    rule_id = "NET-ACL-002"
    title = "Unrestricted Management Plane Access (Missing Management ACL)"
    category = "Access Control & Firewall"
    severity = "CRITICAL"
    description = "Management interfaces (SSH, VTY lines, web consoles) are accessible from any IP address without an access-class or trusted host filter."
    remediation = "Bind an ingress access control list to VTY/admin interfaces restricting administrative access to dedicated bastion host subnets."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.6.2"
    nist_reference = "NIST SP 800-53 AC-17"
    iso27001_reference = "ISO/IEC 27001 A.13.1.1"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.management.unrestricted_management_access:
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "ip access-list standard MGMT_HOSTS\n permit 10.10.100.0 0.0.0.255\nline vty 0 15\n access-class MGMT_HOSTS in",
                "Fortinet": "config system admin\n edit admin\n set trusthost1 10.10.100.0 255.255.255.0\n next\nend",
                "Juniper": "set interfaces lo0 unit 0 family inet filter input PROTECT_MGMT"
            }.get(vendor, "Apply management access restriction ACL.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="No 'access-class', 'trusthost', or lo0 firewall filter applied to management plane",
                explanation="Exposing administrative login prompts to entire networks exposes the core infrastructure to brute-force and zero-day exploitation.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class MissingAntiSpoofingRule(BaseSecurityRule):
    rule_id = "NET-ACL-003"
    title = "IP Anti-Spoofing Filters Missing on Edge Interfaces (uRPF)"
    category = "Access Control & Firewall"
    severity = "MEDIUM"
    description = "Unicast Reverse Path Forwarding (uRPF) or ingress bogon filters are not configured on perimeter interfaces."
    remediation = "Enable Unicast Reverse Path Forwarding (uRPF strict/loose) on all external-facing routing interfaces."
    supported_vendors = ["Cisco"]
    cis_reference = "CIS Benchmark 1.6.3"
    nist_reference = "NIST SP 800-53 SC-7"
    iso27001_reference = "ISO/IEC 27001 A.13.1.2"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.metadata.vendor == "Cisco" and norm.metadata.device_type == "Router" and not norm.access_control.anti_spoofing_configured:
            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="'ip verify unicast source reachable-via' not configured on perimeter interfaces",
                explanation="Without anti-spoofing filters, attackers can forge source IP addresses to launch amplification DDoS and bypass unidirectional ACLs.",
                recommendation=self.remediation,
                remediation_script="interface GigabitEthernet0/0\n ip verify unicast source reachable-via rx",
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None
