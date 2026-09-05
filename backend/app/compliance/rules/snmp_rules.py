from typing import Optional
from app.compliance.engine import BaseSecurityRule, RuleFindingResult
from app.schemas.normalized import NormalizedDeviceConfig

class InsecureSnmpVersionRule(BaseSecurityRule):
    rule_id = "NET-SNMP-001"
    title = "Insecure SNMP Version (v1 / v2c) Enabled"
    category = "SNMP Security"
    severity = "HIGH"
    description = "SNMP v1/v2c transmits community strings and polled management metrics unencrypted across the network."
    remediation = "Disable SNMP v1 and v2c. Migrate exclusively to SNMPv3 with authPriv (SHA authentication and AES encryption)."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.5.1"
    nist_reference = "NIST SP 800-53 IA-5"
    iso27001_reference = "ISO/IEC 27001 A.13.1.1"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.snmp.snmp_enabled and norm.snmp.snmp_v1_v2c_enabled:
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "no snmp-server community ********\nsnmp-server group SECGROUP v3 priv\nsnmp-server user snmpadmin SECGROUP v3 auth sha ******** priv aes 128 ********",
                "Fortinet": "config system snmp community\n delete 1\nend\nconfig system snmp user\n edit \"snmpv3user\"\n set status enable\n set security-level auth-priv\n set auth-proto sha\n set priv-proto aes\n next\nend",
                "Juniper": "delete snmp community\nset snmp v3 usm local-user snmpv3user authentication-sha authentication-password \"********\" privacy-aes128 privacy-password \"********\""
            }.get(vendor, "Migrate to SNMPv3.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="SNMP v1 / v2c community string mechanism detected in active configuration",
                explanation="SNMP v1/v2c community strings are cleartext shared passwords. Anyone capturing network packets can read routing tables and interface statistics.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class DefaultSnmpCommunityRule(BaseSecurityRule):
    rule_id = "NET-SNMP-002"
    title = "Default SNMP Community String Detected ('public' or 'private')"
    category = "SNMP Security"
    severity = "CRITICAL"
    description = "The device is using standard factory default SNMP community strings ('public' or 'private')."
    remediation = "Remove default community strings immediately and replace with complex non-dictionary strings or SNMPv3."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.5.2"
    nist_reference = "NIST SP 800-53 IA-5"
    iso27001_reference = "ISO/IEC 27001 A.9.4.3"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.snmp.default_communities_found:
            defaults_str = ", ".join(norm.snmp.default_communities_found)
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "no snmp-server community public\nno snmp-server community private",
                "Fortinet": "config system snmp community\n delete 1 # where name is public/private\nend",
                "Juniper": "delete snmp community public\ndelete snmp community private"
            }.get(vendor, "Remove default community strings.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence=f"Default community string(s) identified: {defaults_str}",
                explanation="Default community strings are scanned continuously by automated worms and attackers to perform network reconnaissance and device profiling.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class SnmpWriteAccessEnabledRule(BaseSecurityRule):
    rule_id = "NET-SNMP-003"
    title = "SNMP Read-Write (RW) Access Enabled"
    category = "SNMP Security"
    severity = "HIGH"
    description = "SNMP is configured with Read-Write (RW) permissions, allowing remote modification of device configuration files and interfaces."
    remediation = "Restrict SNMP access to Read-Only (RO) or remove RW communities entirely."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.5.3"
    nist_reference = "NIST SP 800-53 AC-6"
    iso27001_reference = "ISO/IEC 27001 A.13.1.1"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.snmp.snmp_rw_enabled:
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "no snmp-server community <rw_community> RW\nsnmp-server community <new_ro_comm> RO",
                "Fortinet": "config system snmp community\n edit 1\n set query-v1-status disable\n set query-v2c-status disable\n next\nend",
                "Juniper": "delete snmp community <community> authorization read-write\nset snmp community <community> authorization read-only"
            }.get(vendor, "Restrict SNMP to Read-Only.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="SNMP community configured with RW (Read-Write) authorization",
                explanation="SNMP RW permits malicious attackers to reboot the router, download full running configs via TFTP, or inject rogue routes.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None
