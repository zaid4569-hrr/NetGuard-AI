from typing import Optional
from app.compliance.engine import BaseSecurityRule, RuleFindingResult
from app.schemas.normalized import NormalizedDeviceConfig

class NtpNotConfiguredRule(BaseSecurityRule):
    rule_id = "NET-NTP-001"
    title = "Network Time Protocol (NTP) Service Not Configured"
    category = "Time Synchronization"
    severity = "HIGH"
    description = "The device is not synchronized to an authoritative NTP time source, causing clock drift and inaccurate security timestamps."
    remediation = "Configure redundant authoritative internal NTP servers (Stratum 1 or 2)."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.4.1"
    nist_reference = "NIST SP 800-53 AU-8"
    iso27001_reference = "ISO/IEC 27001 A.12.4.4"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if not norm.ntp.ntp_enabled or not norm.ntp.ntp_servers:
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "ntp server 10.10.10.10 prefer\nntp server 10.10.10.11",
                "Fortinet": "config system ntp\n set ntpsync enable\n set type custom\n config ntpserver\n edit 1\n set server \"10.10.10.10\"\n next\n end\nend",
                "Juniper": "set system ntp server 10.10.10.10 prefer\nset system ntp server 10.10.10.11"
            }.get(vendor, "Configure NTP servers.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="No NTP servers configured in time synchronization configuration",
                explanation="Inconsistent system clocks invalidate digital certificates, break Kerberos/TLS handshakes, and render forensic event ordering impossible.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class NtpAuthenticationMissingRule(BaseSecurityRule):
    rule_id = "NET-NTP-002"
    title = "NTP Cryptographic Peer Authentication Missing"
    category = "Time Synchronization"
    severity = "MEDIUM"
    description = "NTP queries and time updates are accepted without cryptographic authentication, exposing the device to NTP spoofing attacks."
    remediation = "Configure SHA-1 or MD5 NTP authentication keys between the client and time servers."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.4.2"
    nist_reference = "NIST SP 800-53 SC-23"
    iso27001_reference = "ISO/IEC 27001 A.12.4.4"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.ntp.ntp_enabled and not norm.ntp.ntp_authentication_enabled:
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "ntp authenticate\nntp authentication-key 1 md5 ********\nntp trusted-key 1",
                "Fortinet": "config system ntp\n set authentication enable\n set key-type sha1\n set key-id 1\n set key ********\nend",
                "Juniper": "set system ntp authentication-key 1 type md5 value \"********\"\nset system ntp trusted-key 1"
            }.get(vendor, "Enable NTP authentication.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="NTP is enabled without 'ntp authenticate' / cryptographic key verification",
                explanation="Unauthenticated NTP can be manipulated by an attacker to alter device time, causing premature certificate expiration or bypassing time-of-day policies.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None
