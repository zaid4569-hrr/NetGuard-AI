import re
from typing import List, Optional
from app.parsers.base import BaseVendorParser
from app.schemas.normalized import (
    NormalizedDeviceConfig, LocalUser, SnmpCommunity, AclRule
)
from app.security.sanitizer import SecuritySanitizer

class PaloAltoParser(BaseVendorParser):
    """
    Parser for Palo Alto Networks (PAN-OS) XML and CLI 'set' configurations.
    """

    @classmethod
    def vendor_name(cls) -> str:
        return "Palo Alto"

    @classmethod
    def detect_confidence(cls, raw_text: str) -> float:
        from app.parsers.detector import VendorDetector
        vendor, conf = VendorDetector.detect(raw_text)
        return conf if vendor == "Palo Alto" else 0.0

    def parse(self, raw_text: str, filename: str = "paloalto.xml") -> NormalizedDeviceConfig:
        sanitized = self.sanitize(raw_text)
        lines = [l.strip() for l in sanitized.splitlines() if l.strip()]

        norm = NormalizedDeviceConfig(
            sanitized_raw_lines=[l for l in lines if not l.startswith('<!--') and not l.startswith('#')]
        )

        # 1. Metadata
        host_match = (
            re.search(r'<hostname>([^<]+)</hostname>', sanitized, re.IGNORECASE) or
            re.search(r'set\s+deviceconfig\s+system\s+hostname\s+(\S+)', sanitized, re.IGNORECASE)
        )
        norm.metadata.hostname = host_match.group(1) if host_match else filename.split('.')[0]
        norm.metadata.vendor = "Palo Alto"
        norm.metadata.vendor_confidence = 0.98
        norm.metadata.device_type = "Next-Gen Firewall"

        ver_match = re.search(r'version="([0-9\.]+)"', sanitized) or re.search(r'<sw-version>([^<]+)</sw-version>', sanitized)
        norm.metadata.os_version = f"PAN-OS {ver_match.group(1)}" if ver_match else "PAN-OS 10.2"

        # 2. Management
        telnet_found = (
            bool(re.search(r'<telnet>yes</telnet>', sanitized, re.IGNORECASE)) or
            bool(re.search(r'set\s+network\s+profiles\s+interface-management-profile\s+\S+\s+telnet\s+yes', sanitized, re.IGNORECASE))
        )
        http_found = (
            bool(re.search(r'<http>yes</http>', sanitized, re.IGNORECASE)) or
            bool(re.search(r'set\s+network\s+profiles\s+interface-management-profile\s+\S+\s+http\s+yes', sanitized, re.IGNORECASE))
        )
        ssh_found = (
            bool(re.search(r'<ssh>yes</ssh>', sanitized, re.IGNORECASE)) or
            bool(re.search(r'set\s+network\s+profiles\s+interface-management-profile\s+\S+\s+ssh\s+yes', sanitized, re.IGNORECASE)) or
            "<deviceconfig>" in sanitized
        )
        https_found = (
            bool(re.search(r'<https>yes</https>', sanitized, re.IGNORECASE)) or
            bool(re.search(r'set\s+network\s+profiles\s+interface-management-profile\s+\S+\s+https\s+yes', sanitized, re.IGNORECASE)) or
            not http_found
        )

        norm.management.telnet_enabled = telnet_found
        norm.management.http_server_enabled = http_found
        norm.management.ssh_enabled = ssh_found
        norm.management.ssh_version = 2
        norm.management.https_server_enabled = https_found

        banner_match = re.search(r'<login-banner>([^<]+)</login-banner>', sanitized, re.IGNORECASE) or \
                       re.search(r'set\s+deviceconfig\s+system\s+login-banner', sanitized, re.IGNORECASE)
        norm.management.banner_motd_configured = bool(banner_match)

        timeout_match = re.search(r'<idle-timeout>(\d+)</idle-timeout>', sanitized, re.IGNORECASE) or \
                        re.search(r'set\s+deviceconfig\s+setting\s+management\s+idle-timeout\s+(\d+)', sanitized, re.IGNORECASE)
        if timeout_match:
            norm.management.session_timeout_mins = int(timeout_match.group(1))

        # Permitted IP list / mgmt ACL
        permitted_ips = re.findall(r'<permitted-ip>([^<]+)</permitted-ip>', sanitized, re.IGNORECASE) or \
                        re.findall(r'set\s+deviceconfig\s+system\s+permitted-ip\s+(\S+)', sanitized, re.IGNORECASE)
        norm.management.mgmt_acls_applied = len(permitted_ips) > 0
        norm.management.unrestricted_management_access = len(permitted_ips) == 0

        # 3. Authentication & Users
        users = re.findall(r'<entry\s+name="([^"]+)">\s*<phash>', sanitized, re.IGNORECASE) or \
                re.findall(r'set\s+mgt-config\s+users\s+(\S+)', sanitized, re.IGNORECASE)
        for u in set(users):
            is_def = u.lower() in ["admin", "root", "paloalto"]
            norm.authentication.users.append(LocalUser(username=u, is_default_admin=is_def))
            if is_def:
                norm.authentication.default_accounts_present = True

        if "<phash>cleartext" in raw_text or "password cleartext" in raw_text.lower():
            norm.authentication.plaintext_passwords_detected = True

        # 4. Logging & Syslog
        syslog_servers = re.findall(r'<server>\s*<entry\s+name="([^"]+)">\s*<server>([^<]+)</server>', sanitized, re.IGNORECASE) or \
                         re.findall(r'set\s+shared\s+log-settings\s+syslog\s+\S+\s+server\s+\S+\s+server\s+(\S+)', sanitized, re.IGNORECASE)
        norm.logging.logging_enabled = bool(re.search(r'<syslog>|<log-settings>|log-settings\s+syslog', sanitized, re.IGNORECASE))
        norm.logging.remote_syslog_servers = [s[1] if isinstance(s, tuple) else s for s in syslog_servers]
        norm.logging.timestamps_with_milliseconds = True

        # 5. NTP
        ntp_servers = re.findall(r'<ntp-servers>\s*<primary-ntp-server>\s*<ntp-server-address>([^<]+)</ntp-server-address>', sanitized, re.IGNORECASE) or \
                      re.findall(r'set\s+deviceconfig\s+system\s+ntp-servers\s+primary-ntp-server\s+ntp-server-address\s+(\S+)', sanitized, re.IGNORECASE)
        norm.ntp.ntp_servers = ntp_servers
        norm.ntp.ntp_enabled = len(ntp_servers) > 0

        # 6. SNMP
        snmp_present = bool(re.search(r'<snmp-setting>|set\s+deviceconfig\s+system\s+snmp-setting', sanitized, re.IGNORECASE))
        norm.snmp.snmp_enabled = snmp_present
        defaults = SecuritySanitizer.extract_detected_snmp_communities(raw_text)
        norm.snmp.default_communities_found = defaults
        if snmp_present:
            norm.snmp.snmp_v1_v2c_enabled = bool(re.search(r'<version>\s*<v2c>', sanitized, re.IGNORECASE))
            norm.snmp.snmp_v3_enabled = bool(re.search(r'<version>\s*<v3>', sanitized, re.IGNORECASE))

        # 7. Access Control (Security Policy Rules)
        any_any = (
            bool(re.search(r'<action>allow</action>[\s\S]*?<source>\s*<member>any</member>[\s\S]*?<destination>\s*<member>any</member>[\s\S]*?<application>\s*<member>any</member>', sanitized, re.IGNORECASE)) or
            bool(re.search(r'set\s+rulebase\s+security\s+rules\s+\S+\s+from\s+any\s+to\s+any\s+source\s+any\s+destination\s+any\s+application\s+any\s+action\s+allow', sanitized, re.IGNORECASE))
        )
        norm.access_control.acls_present = bool(re.search(r'<security>\s*<rules>|set\s+rulebase\s+security', sanitized, re.IGNORECASE))
        norm.access_control.any_any_permit_detected = any_any

        # 8. Cryptography (IKE / IPsec)
        if re.search(r'3des|des|md5', sanitized, re.IGNORECASE) and re.search(r'crypto|ike|ipsec', sanitized, re.IGNORECASE):
            norm.cryptography.weak_ciphers_used.append("Legacy 3DES/MD5 in PAN-OS Crypto Profile")
        if re.search(r'group[125]\b', sanitized, re.IGNORECASE):
            norm.cryptography.weak_dh_groups_used = [1, 2, 5]

        return norm
