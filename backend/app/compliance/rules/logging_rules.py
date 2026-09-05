from typing import Optional
from app.compliance.engine import BaseSecurityRule, RuleFindingResult
from app.schemas.normalized import NormalizedDeviceConfig

class LoggingDisabledRule(BaseSecurityRule):
    rule_id = "NET-LOG-001"
    title = "System Logging Completely Disabled"
    category = "Logging & Auditing"
    severity = "CRITICAL"
    description = "Audit logging is disabled on the device, preventing incident detection, forensic analysis, and compliance reporting."
    remediation = "Enable system logging and log security events at informational (level 6) or debugging severity."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.3.1"
    nist_reference = "NIST SP 800-53 AU-2"
    iso27001_reference = "ISO/IEC 27001 A.12.4.1"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if not norm.logging.logging_enabled:
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "logging on\nlogging buffered 64000 informational",
                "Fortinet": "config log memory setting\n set status enable\nend",
                "Juniper": "set system syslog file messages any notice\nset system syslog file messages authorization info"
            }.get(vendor, "Enable system logging.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="System logging is not enabled in configuration",
                explanation="Without logging, intrusion attempts, administrative privilege escalations, and system failures occur completely undetected.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class MissingRemoteSyslogRule(BaseSecurityRule):
    rule_id = "NET-LOG-002"
    title = "Centralized Remote Syslog Server Missing"
    category = "Logging & Auditing"
    severity = "HIGH"
    description = "Logs are stored only locally in volatile memory buffers and are not forwarded to a dedicated SIEM/Syslog server."
    remediation = "Configure at least one redundant remote syslog collector or SIEM ingestion point (e.g. Splunk, ELK, QRadar)."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.3.2"
    nist_reference = "NIST SP 800-53 AU-6"
    iso27001_reference = "ISO/IEC 27001 A.12.4.2"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if not norm.logging.remote_syslog_servers:
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "logging host 10.10.10.50\nlogging trap informational\nlogging source-interface Loopback0",
                "Fortinet": "config log syslogd setting\n set status enable\n set server \"10.10.10.50\"\n set mode udp\n set port 514\nend",
                "Juniper": "set system syslog host 10.10.10.50 any informational"
            }.get(vendor, "Configure remote syslog server.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="No remote syslog / SIEM hosts configured in logging subsystem",
                explanation="Local in-memory buffers are wiped on device reboot and can be deliberately purged by attackers to cover their tracks.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class MissingMillisecondTimestampsRule(BaseSecurityRule):
    rule_id = "NET-LOG-003"
    title = "Log Timestamps Missing Millisecond Precision"
    category = "Logging & Auditing"
    severity = "LOW"
    description = "Log timestamps do not include sub-second (millisecond) precision, hindering cross-device log correlation."
    remediation = "Configure logging timestamp directives to include date, time, and milliseconds with local timezone."
    supported_vendors = ["Cisco"]
    cis_reference = "CIS Benchmark 1.3.3"
    nist_reference = "NIST SP 800-53 AU-8"
    iso27001_reference = "ISO/IEC 27001 A.12.4.4"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.metadata.vendor == "Cisco" and not norm.logging.timestamps_with_milliseconds:
            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="'service timestamps log datetime msec' not found in Cisco IOS",
                explanation="High-speed network attacks involve thousands of packets per second. Millisecond accuracy is essential for SIEM reconstruction.",
                recommendation=self.remediation,
                remediation_script="service timestamps log datetime msec localtime show-timezone\nservice timestamps debug datetime msec localtime show-timezone",
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None
