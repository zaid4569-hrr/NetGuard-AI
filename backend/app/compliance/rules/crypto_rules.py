from typing import Optional
from app.compliance.engine import BaseSecurityRule, RuleFindingResult
from app.schemas.normalized import NormalizedDeviceConfig

class DeprecatedCryptoCipherRule(BaseSecurityRule):
    rule_id = "NET-CRYPTO-001"
    title = "Deprecated Encryption / Hashing Algorithm in VPN (DES / 3DES / MD5)"
    category = "Cryptography"
    severity = "HIGH"
    description = "IPsec or IKE proposals utilize weak legacy encryption algorithms (DES, 3DES) or broken hash functions (MD5)."
    remediation = "Upgrade all IPsec and TLS crypto proposals to AES-256-GCM or AES-128-GCM with SHA-256/SHA-384 integrity."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.7.1"
    nist_reference = "NIST SP 800-53 SC-13"
    iso27001_reference = "ISO/IEC 27001 A.10.1.1"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.cryptography.weak_ciphers_used:
            vendor = norm.metadata.vendor
            ciphers_str = ", ".join(norm.cryptography.weak_ciphers_used)
            remed_script = {
                "Cisco": "crypto isakmp policy 10\n encr aes 256\n hash sha256\n group 14\n lifetime 86400",
                "Fortinet": "config vpn ipsec phase1-interface\n edit \"VPN_TUNNEL\"\n set proposal aes256-sha256\n set dhgrp 14\n next\nend",
                "Juniper": "set security ike proposal IKE_PROP encryption-algorithm aes-256-cbc authentication-algorithm sha-256 dh-group group14"
            }.get(vendor, "Upgrade to AES-256 cipher suite.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence=f"Deprecated algorithms detected in VPN configuration: {ciphers_str}",
                explanation="DES and 3DES have short block sizes vulnerable to Sweet32 collision attacks and brute force.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None

class InsecureDhGroupRule(BaseSecurityRule):
    rule_id = "NET-CRYPTO-002"
    title = "Insecure Diffie-Hellman Key Exchange Group (DH Group 1, 2, or 5)"
    category = "Cryptography"
    severity = "HIGH"
    description = "Diffie-Hellman groups with modulus sizes smaller than 2048 bits (DH 1=768-bit, DH 2=1024-bit, DH 5=1536-bit) are configured."
    remediation = "Enforce Diffie-Hellman Group 14 (2048-bit MODP), Group 19 (256-bit ECP), or Group 20 (384-bit ECP)."
    supported_vendors = ["Cisco", "Fortinet", "Juniper"]
    cis_reference = "CIS Benchmark 1.7.2"
    nist_reference = "NIST SP 800-53 SC-13"
    iso27001_reference = "ISO/IEC 27001 A.10.1.1"

    def evaluate(self, norm: NormalizedDeviceConfig) -> Optional[RuleFindingResult]:
        if norm.cryptography.weak_dh_groups_used:
            vendor = norm.metadata.vendor
            groups_str = ", ".join(f"Group {g}" for g in norm.cryptography.weak_dh_groups_used)
            remed_script = {
                "Cisco": "crypto isakmp policy 10\n group 14",
                "Fortinet": "config vpn ipsec phase1-interface\n edit \"VPN_TUNNEL\"\n set dhgrp 14 19\n next\nend",
                "Juniper": "set security ike proposal IKE_PROP dh-group group14"
            }.get(vendor, "Enforce DH Group 14 or higher.")

            return RuleFindingResult(
                rule_id=self.rule_id,
                title=self.title,
                category=self.category,
                severity=self.severity,
                evidence=f"Weak Diffie-Hellman groups configured: {groups_str}",
                explanation="Logjam attack demonstrated that 1024-bit Diffie-Hellman key exchanges can be broken by nation-state actors and large compute clusters.",
                recommendation=self.remediation,
                remediation_script=remed_script,
                cis_reference=self.cis_reference,
                nist_reference=self.nist_reference,
                iso27001_reference=self.iso27001_reference
            )
        return None
