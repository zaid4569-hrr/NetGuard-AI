import re
from typing import List, Optional
from app.parsers.base import BaseVendorParser
from app.schemas.normalized import (
    NormalizedDeviceConfig, LocalUser, SnmpCommunity
)
from app.security.sanitizer import SecuritySanitizer

class ArubaParser(BaseVendorParser):
    """
    Parser for ArubaOS (AOS-S / AOS-CX) switch and mobility controller configurations.
    """

    @classmethod
    def vendor_name(cls) -> str:
        return "Aruba"

    @classmethod
    def detect_confidence(cls, raw_text: str) -> float:
        from app.parsers.detector import VendorDetector
        vendor, conf = VendorDetector.detect(raw_text)
        return conf if vendor == "Aruba" else 0.0

    def parse(self, raw_text: str, filename: str = "aruba.cfg") -> NormalizedDeviceConfig:
        sanitized = self.sanitize(raw_text)
        lines = [l.strip() for l in sanitized.splitlines() if l.strip()]

        norm = NormalizedDeviceConfig(
            sanitized_raw_lines=[l for l in lines if not l.startswith(';')]
        )

        # 1. Metadata
        host_match = re.search(r'^\s*hostname\s+["\']?([^"\'\r\n\s]+)["\']?', sanitized, re.IGNORECASE | re.MULTILINE)
        norm.metadata.hostname = host_match.group(1) if host_match else filename.split('.')[0]
        norm.metadata.vendor = "Aruba"
        norm.metadata.vendor_confidence = 0.95
        norm.metadata.device_type = "Switch / Controller"

        ver_match = re.search(r';\s*([A-Z0-9\._]+)\s+Configuration\s+Editor', sanitized, re.IGNORECASE)
        norm.metadata.os_version = f"ArubaOS {ver_match.group(1)}" if ver_match else "ArubaOS-CX"

        # 2. Remote Management
        norm.management.telnet_enabled = bool(re.search(r'^\s*telnet-server\b', sanitized, re.IGNORECASE | re.MULTILINE)) and not bool(re.search(r'^\s*no\s+telnet-server\b', sanitized, re.IGNORECASE | re.MULTILINE))
        norm.management.http_server_enabled = bool(re.search(r'^\s*web-management\s+plaintext', sanitized, re.IGNORECASE | re.MULTILINE))
        norm.management.ssh_enabled = bool(re.search(r'^\s*crypto\s+key\s+generate\s+ssh|^\s*ssh\b', sanitized, re.IGNORECASE | re.MULTILINE))
        norm.management.ssh_version = 2
        norm.management.https_server_enabled = bool(re.search(r'^\s*web-management\s+ssl', sanitized, re.IGNORECASE | re.MULTILINE))

        banner_match = re.search(r'^\s*banner\s+motd', sanitized, re.IGNORECASE | re.MULTILINE)
        norm.management.banner_motd_configured = bool(banner_match)

        # 3. Authentication
        users = re.findall(r'^\s*password\s+manager\s+user-name\s+(\S+)', sanitized, re.IGNORECASE | re.MULTILINE)
        for u in set(users):
            is_def = u.lower() in ["admin", "manager"]
            norm.authentication.users.append(LocalUser(username=u, is_default_admin=is_def))
            if is_def:
                norm.authentication.default_accounts_present = True

        if "password manager plaintext" in raw_text.lower():
            norm.authentication.plaintext_passwords_detected = True

        # 4. Logging & Syslog
        syslog_servers = re.findall(r'^\s*logging\s+([0-9\.]+)', sanitized, re.IGNORECASE | re.MULTILINE)
        norm.logging.logging_enabled = len(syslog_servers) > 0
        norm.logging.remote_syslog_servers = syslog_servers

        # 5. NTP
        ntp_servers = re.findall(r'^\s*(?:sntp|ntp)\s+server\s+([0-9\.]+)', sanitized, re.IGNORECASE | re.MULTILINE)
        norm.ntp.ntp_enabled = len(ntp_servers) > 0
        norm.ntp.ntp_servers = ntp_servers

        # 6. SNMP
        snmp_present = bool(re.search(r'snmp-server\b', sanitized, re.IGNORECASE))
        norm.snmp.snmp_enabled = snmp_present
        defaults = SecuritySanitizer.extract_detected_snmp_communities(raw_text)
        norm.snmp.default_communities_found = defaults
        if snmp_present:
            norm.snmp.snmp_v1_v2c_enabled = bool(re.search(r'snmp-server\s+community', sanitized, re.IGNORECASE))
            norm.snmp.snmp_v3_enabled = bool(re.search(r'snmp-server\s+user', sanitized, re.IGNORECASE))

        # 7. Access Control
        norm.access_control.acls_present = bool(re.search(r'ip\s+access-list', sanitized, re.IGNORECASE))
        norm.access_control.any_any_permit_detected = bool(re.search(r'permit\s+any\s+any', sanitized, re.IGNORECASE))

        return norm
