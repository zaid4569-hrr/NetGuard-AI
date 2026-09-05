from typing import Optional
from app.compliance.engine import BaseSecurityRule, RuleFindingResult
from app.schemas.normalized import NormalizedDeviceConfig

class TelnetEnabledRule(BaseSecurityRule):
    rule_id = "NET-MGMT-001"
    title = "Telnet Remote Management Enabled"
    category = "Remote Management"
    severity = "HIGH"
    description = "Telnet transmits all management credentials, commands, and session data in cleartext over the network."
    remediation = "Disable Telnet daemon/transport and enforce encrypted SSHv2 for all administrative access."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.1.1"
    nist_reference = "NIST SP 800-53 AC-17"
    iso27001_reference = "ISO/IEC 27001 A.13.1.1"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.management.telnet_enabled:
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "line vty 0 15\n no transport input telnet\n transport input ssh",
                "Fortinet": "config system interface\n edit <port>\n unselect allowaccess telnet\n next\nend",
                "Juniper": "delete system services telnet\nset system services ssh"
            }.get(vendor, "Disable telnet service in device configuration.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="transport input telnet / allowaccess telnet / services telnet detected",
                explanation="Unencrypted Telnet management allows adversary packet sniffing, credential harvesting, and man-in-the-middle attacks.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class SshDisabledOrV1Rule(BaseSecurityRule):
    rule_id = "NET-MGMT-002"
    title = "SSH Disabled or Insecure SSHv1 Configured"
    category = "Remote Management"
    severity = "HIGH"
    description = "SSH is either not enabled or configured with obsolete SSH Version 1, which has known cryptographic vulnerabilities."
    remediation = "Enable SSH and restrict protocol version strictly to SSHv2 with strong key exchange algorithms."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.1.2"
    nist_reference = "NIST SP 800-53 IA-2"
    iso27001_reference = "ISO/IEC 27001 A.9.4.2"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if not norm.management.ssh_enabled or norm.management.ssh_v1_enabled or norm.management.ssh_version == 1:
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "ip ssh version 2\nip ssh time-out 60\nip ssh authentication-retries 3",
                "Fortinet": "config system admin setting\n set ssh-enc-algo high\nend",
                "Juniper": "set system services ssh protocol-version v2"
            }.get(vendor, "Enforce SSHv2.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="SSH is disabled or configured with SSHv1 legacy protocol",
                explanation="SSHv1 is vulnerable to CRC-32 compensation attacks and session hijacking. SSHv2 is mandatory for secure remote control.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class InsecureHttpServerRule(BaseSecurityRule):
    rule_id = "NET-MGMT-003"
    title = "Cleartext HTTP Web Management Service Enabled"
    category = "Remote Management"
    severity = "MEDIUM"
    description = "The device web management interface is running over unencrypted HTTP (TCP port 80)."
    remediation = "Disable the HTTP web server and enforce HTTPS with valid SSL/TLS certificates."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.1.3"
    nist_reference = "NIST SP 800-53 AC-17"
    iso27001_reference = "ISO/IEC 27001 A.13.1.1"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.management.http_server_enabled:
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "no ip http server\nip http secure-server",
                "Fortinet": "config system interface\n edit <port>\n unselect allowaccess http\n next\nend",
                "Juniper": "delete system services web-management http\nset system services web-management https"
            }.get(vendor, "Disable HTTP server and use HTTPS.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="ip http server / set allowaccess http / web-management http enabled",
                explanation="Web management sessions over HTTP expose session tokens and passwords to local eavesdroppers on the network segment.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class MissingSessionTimeoutRule(BaseSecurityRule):
    rule_id = "NET-MGMT-004"
    title = "Missing or Excessive Inactivity Session Timeout"
    category = "Remote Management"
    severity = "LOW"
    description = "Administrative management sessions have no inactivity timeout or exceed recommended threshold (> 15 minutes)."
    remediation = "Configure an inactivity timeout between 5 and 15 minutes for all administrative interfaces."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.1.4"
    nist_reference = "NIST SP 800-53 AC-12"
    iso27001_reference = "ISO/IEC 27001 A.11.2.8"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        timeout = norm.management.session_timeout_mins
        if timeout is None or timeout == 0 or timeout > 15:
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "line con 0\n exec-timeout 10 0\nline vty 0 15\n exec-timeout 10 0",
                "Fortinet": "config system global\n set admintimeout 10\nend",
                "Juniper": "set system login idle-timeout 10"
            }.get(vendor, "Configure 10-minute session idle timeout.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence=f"Configured session timeout: {timeout if timeout is not None else 'None (unbounded)'} minutes",
                explanation="Unattended administrative sessions left open on workstations can be hijacked by unauthorized internal actors.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class MissingMotdBannerRule(BaseSecurityRule):
    rule_id = "NET-MGMT-005"
    title = "Missing Legal Warning Banner (MOTD)"
    category = "Remote Management"
    severity = "INFO"
    description = "The device lacks a configured login/MOTD banner warning unauthorized users of legal prosecution and monitoring."
    remediation = "Configure an explicit legal authorization and monitoring advisory banner."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.1.5"
    nist_reference = "NIST SP 800-53 AC-8"
    iso27001_reference = "ISO/IEC 27001 A.9.4.2"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if not norm.management.banner_motd_configured:
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "banner motd ^C\nAUTHORIZED ACCESS ONLY. ALL ACTIVITIES ARE MONITORED AND LOGGED.\n^C",
                "Fortinet": "config system global\n set pre_login_banner enable\nend",
                "Juniper": "set system login message \"AUTHORIZED ACCESS ONLY. ALL ACTIVITIES ARE MONITORED.\""
            }.get(vendor, "Configure MOTD warning banner.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="No banner motd / pre_login_banner / login message configured",
                explanation="Banners establish legal notice in court proceedings that unauthorized access is strictly prohibited and monitored.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None
