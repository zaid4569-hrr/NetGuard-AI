from typing import Optional
from app.compliance.engine import BaseSecurityRule, RuleFindingResult
from app.schemas.normalized import NormalizedDeviceConfig

class PlaintextPasswordRule(BaseSecurityRule):
    rule_id = "NET-AUTH-001"
    title = "Cleartext Password Storage or Missing Password Encryption Service"
    category = "Authentication"
    severity = "CRITICAL"
    description = "User accounts or enable passwords are stored in cleartext, or reversible Type 0 / Type 7 weak hashing is active."
    remediation = "Enable global service password encryption and replace legacy passwords with strong salted hashes (Type 8/9, SHA-512, bcrypt)."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.2.1"
    nist_reference = "NIST SP 800-53 IA-5"
    iso27001_reference = "ISO/IEC 27001 A.9.4.3"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.authentication.plaintext_passwords_detected or (
            norm.metadata.vendor == "Cisco" and not norm.authentication.password_encryption_service_enabled
        ):
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "service password-encryption\nenable secret <strong_password>\nno enable password",
                "Fortinet": "config system admin\n edit <admin_user>\n set password ********\n next\nend",
                "Juniper": "set system root-authentication plain-text-password\n# Enter strong password for automatic SHA-512 hashing"
            }.get(vendor, "Enforce strong password hashing.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="Plaintext passwords or missing 'service password-encryption' detected in device configuration",
                explanation="Cleartext or Type 7 passwords can be decrypted in seconds, allowing any person with configuration access to compromise root credentials.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class WeakHashingAlgorithmRule(BaseSecurityRule):
    rule_id = "NET-AUTH-002"
    title = "Weak Password Hashing Algorithm Detected (MD5 / Type 5)"
    category = "Authentication"
    severity = "HIGH"
    description = "Legacy MD5 (Type 5) password hashes are vulnerable to modern GPU-based offline dictionary and rainbow table cracking."
    remediation = "Upgrade to PBKDF2-SHA256 (Type 8) or scrypt (Type 9) password algorithms."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.2.2"
    nist_reference = "NIST SP 800-53 IA-5"
    iso27001_reference = "ISO/IEC 27001 A.9.4.3"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.authentication.weak_hashes_detected:
            vendor = norm.metadata.vendor
            evidence_summary = ", ".join(norm.authentication.weak_hashes_detected[:3])
            remed_script = {
                "Cisco": "enable algorithm-type sha256 secret <password>\nusername admin algorithm-type sha256 secret <password>",
                "Fortinet": "config system global\n set admin-password-hash pbkdf2\nend",
                "Juniper": "set system login password format sha-512"
            }.get(vendor, "Upgrade password hashing algorithm.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence=f"Weak password hashing detected: {evidence_summary}",
                explanation="Legacy MD5 and Type 7 algorithms can be reversed easily using free online lookup tables and GPU cracking rigs.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class DefaultAccountsPresentRule(BaseSecurityRule):
    rule_id = "NET-AUTH-003"
    title = "Default or Well-Known Administrative Accounts Configured"
    category = "Authentication"
    severity = "HIGH"
    description = "Default accounts such as 'cisco', 'admin', or 'root' with generic privileges are defined on the device."
    remediation = "Rename or disable default accounts, and create individualized named administrative accounts with RBAC."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.2.3"
    nist_reference = "NIST SP 800-53 IA-2"
    iso27001_reference = "ISO/IEC 27001 A.9.2.1"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.authentication.default_accounts_present:
            vendor = norm.metadata.vendor
            remed_script = {
                "Cisco": "no username cisco\nno username admin\nusername secadmin privilege 15 algorithm-type sha256 secret <password>",
                "Fortinet": "config system admin\n edit <new_admin_user>\n set password ********\n set accprofile super_admin\n next\n delete admin\nend",
                "Juniper": "set system login user netadmin class super-user authentication encrypted-password \"********\""
            }.get(vendor, "Remove default accounts.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="Default accounts (admin/cisco/root/guest) identified in user database",
                explanation="Default usernames are the primary target for automated brute-force and credential-stuffing attacks against network edge devices.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class MissingAaaNewModelRule(BaseSecurityRule):
    rule_id = "NET-AUTH-004"
    title = "Centralized AAA Authentication Model Disabled"
    category = "Authentication"
    severity = "MEDIUM"
    description = "AAA (Authentication, Authorization, Accounting) is not enabled, leaving authentication reliant solely on local static credentials."
    remediation = "Enable AAA model and integrate with enterprise RADIUS/TACACS+ identity providers."
    supported_vendors = ["Cisco"]
    cis_reference = "CIS Benchmark 1.2.4"
    nist_reference = "NIST SP 800-53 AC-2"
    iso27001_reference = "ISO/IEC 27001 A.9.2.2"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.metadata.vendor == "Cisco" and not norm.authentication.aaa_enabled:
            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="'aaa new-model' is not configured in Cisco IOS",
                explanation="Without AAA, individual administrator accounting and centralized access revocation cannot be enforced.",
                recommendation=self.remediation,
                remediation_script="aaa new-model\naaa authentication login default local\naaa authorization exec default local",
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class RootRemoteLoginAllowedRule(BaseSecurityRule):
    rule_id = "NET-AUTH-005"
    title = "Direct Superuser / Root Remote Login Permitted"
    category = "Authentication"
    severity = "HIGH"
    description = "Root or superuser accounts can log in directly over remote network SSH sessions without privilege step-up."
    remediation = "Deny direct root remote login and require operators to log in as named users and elevate via su/sudo."
    supported_vendors = ["Juniper"]
    cis_reference = "CIS Benchmark 1.2.5"
    nist_reference = "NIST SP 800-53 AC-6"
    iso27001_reference = "ISO/IEC 27001 A.9.4.2"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.authentication.root_remote_login_allowed:
            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence="set system services ssh root-login allow configured in Junos",
                explanation="Direct root login bypasses individual non-repudiation audit trails and facilitates automated root password attacks.",
                recommendation=self.remediation,
                remediation_script="set system services ssh root-login deny",
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None
