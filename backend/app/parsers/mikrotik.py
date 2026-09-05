import re
from typing import List, Optional
from app.parsers.base import BaseVendorParser
from app.schemas.normalized import (
    NormalizedDeviceConfig, LocalUser, SnmpCommunity
)
from app.security.sanitizer import SecuritySanitizer

class MikroTikParser(BaseVendorParser):
    """
    Parser for MikroTik RouterOS /export configurations.
    """

    @classmethod
    def vendor_name(cls) -> str:
        return "MikroTik"

    @classmethod
    def detect_confidence(cls, raw_text: str) -> float:
        from app.parsers.detector import VendorDetector
        vendor, conf = VendorDetector.detect(raw_text)
        return conf if vendor == "MikroTik" else 0.0

    def parse(self, raw_text: str, filename: str = "mikrotik.rsc") -> NormalizedDeviceConfig:
        sanitized = self.sanitize(raw_text)
        lines = [l.strip() for l in sanitized.splitlines() if l.strip()]

        norm = NormalizedDeviceConfig(
            sanitized_raw_lines=[l for l in lines if not l.startswith('#')]
        )

        # 1. Metadata
        id_match = re.search(r'/system\s+identity\s+set\s+name=["\']?([^"\'\r\n\s]+)["\']?', sanitized, re.IGNORECASE)
        norm.metadata.hostname = id_match.group(1) if id_match else filename.split('.')[0]
        norm.metadata.vendor = "MikroTik"
        norm.metadata.vendor_confidence = 0.95
        norm.metadata.device_type = "Router / Gateway"

        ver_match = re.search(r'#.*by RouterOS\s+([0-9\.]+)', sanitized, re.IGNORECASE)
        norm.metadata.os_version = f"RouterOS {ver_match.group(1)}" if ver_match else "RouterOS v7"

        # 2. Management Services (/ip service)
        # In RouterOS, services are enabled unless explicitly 'disabled=yes'
        telnet_disabled = bool(re.search(r'/ip\s+service\s+set\s+telnet\s+disabled=yes', sanitized, re.IGNORECASE))
        telnet_set = bool(re.search(r'/ip\s+service[\s\S]*?telnet', sanitized, re.IGNORECASE))
        # If telnet is not explicitly disabled and /ip service is mentioned or telnet enabled
        norm.management.telnet_enabled = not telnet_disabled if telnet_set else False

        http_disabled = bool(re.search(r'/ip\s+service\s+set\s+www\s+disabled=yes', sanitized, re.IGNORECASE))
        norm.management.http_server_enabled = not http_disabled

        norm.management.ssh_enabled = not bool(re.search(r'/ip\s+service\s+set\s+ssh\s+disabled=yes', sanitized, re.IGNORECASE))
        norm.management.ssh_version = 2
        norm.management.https_server_enabled = bool(re.search(r'/ip\s+service\s+set\s+www-ssl\s+disabled=no', sanitized, re.IGNORECASE))

        # Check banner / note
        note_found = bool(re.search(r'/system\s+note\s+set\s+show-at-login=yes', sanitized, re.IGNORECASE))
        norm.management.banner_motd_configured = note_found

        # Management address restrictions
        service_address_filter = bool(re.search(r'/ip\s+service\s+set\s+\S+\s+address=', sanitized, re.IGNORECASE))
        mgmt_input_firewall = bool(re.search(r'/ip\s+firewall\s+filter\s+add\s+chain=input', sanitized, re.IGNORECASE))
        norm.management.mgmt_acls_applied = service_address_filter or mgmt_input_firewall
        norm.management.unrestricted_management_access = not norm.management.mgmt_acls_applied

        # 3. Authentication & Users
        users = re.findall(r'/user\s+add\s+name=["\']?([^"\'\s]+)["\']?', sanitized, re.IGNORECASE)
        for u in set(users):
            is_def = u.lower() in ["admin", "root"]
            norm.authentication.users.append(LocalUser(username=u, is_default_admin=is_def))
            if is_def:
                norm.authentication.default_accounts_present = True

        if "password=\"\"" in raw_text or "password=" not in raw_text:
            norm.authentication.plaintext_passwords_detected = True

        # 4. Logging
        syslog_action = bool(re.search(r'/system\s+logging\s+action\s+add\s+target=remote', sanitized, re.IGNORECASE))
        syslog_ip = re.search(r'remote=([0-9\.]+)', sanitized, re.IGNORECASE)
        norm.logging.logging_enabled = True
        if syslog_action and syslog_ip:
            norm.logging.remote_syslog_servers.append(syslog_ip.group(1))

        # 5. NTP
        ntp_server = re.search(r'/system\s+ntp\s+client\s+set\s+enabled=yes.*?servers=([0-9\.,]+)', sanitized, re.IGNORECASE)
        norm.ntp.ntp_enabled = bool(ntp_server)
        if ntp_server:
            norm.ntp.ntp_servers = ntp_server.group(1).split(',')

        # 6. SNMP
        snmp_enabled = bool(re.search(r'/snmp\s+set\s+enabled=yes', sanitized, re.IGNORECASE))
        norm.snmp.snmp_enabled = snmp_enabled
        defaults = SecuritySanitizer.extract_detected_snmp_communities(raw_text)
        norm.snmp.default_communities_found = defaults
        if snmp_enabled:
            norm.snmp.snmp_v1_v2c_enabled = True
            for d in defaults:
                norm.snmp.communities.append(SnmpCommunity(name="********", access_type="RO", is_default=True))

        # 7. Access Control & Firewall
        fw_rules = re.findall(r'/ip\s+firewall\s+filter\s+add\s+chain=([^\r\n]+)', sanitized, re.IGNORECASE)
        norm.access_control.total_acls = len(fw_rules)
        norm.access_control.acls_present = len(fw_rules) > 0

        # Any-any permit on forward chain without src/dst address restriction
        any_any = bool(re.search(r'/ip\s+firewall\s+filter\s+add\s+chain=forward\s+action=accept(?!\s+connection-state)', sanitized, re.IGNORECASE))
        norm.access_control.any_any_permit_detected = any_any

        # 8. Cryptography
        if re.search(r'enc-algorithms=(?:3des|des)', sanitized, re.IGNORECASE):
            norm.cryptography.weak_ciphers_used.append("3DES/DES in RouterOS IPsec Profile")
        if re.search(r'dh-group=modp768|modp1024', sanitized, re.IGNORECASE):
            norm.cryptography.weak_dh_groups_used = [1, 2]

        return norm
