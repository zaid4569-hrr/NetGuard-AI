import re
from typing import List, Dict, Any, Optional
from app.parsers.base import BaseVendorParser
from app.schemas.normalized import (
    NormalizedDeviceConfig, DeviceMetadata, ManagementConfig,
    AuthenticationConfig, LocalUser, LoggingConfig, NtpConfig,
    SnmpConfig, SnmpCommunity, AccessControlConfig, AclRule,
    CryptographyConfig, ServicesConfig
)
from app.security.sanitizer import SecuritySanitizer

class JuniperParser(BaseVendorParser):
    """
    Parser for Juniper Junos network operating system configurations.
    Supports both hierarchical JSON-like curly-bracket syntax and flat 'set' commands.
    """

    @classmethod
    def vendor_name(cls) -> str:
        return "Juniper"

    @classmethod
    def detect_confidence(cls, raw_text: str) -> float:
        from app.parsers.detector import VendorDetector
        vendor, conf = VendorDetector.detect(raw_text)
        return conf if vendor == "Juniper" else 0.0

    def parse(self, raw_text: str, filename: str = "config.conf") -> NormalizedDeviceConfig:
        sanitized = self.sanitize(raw_text)
        lines = [line.strip() for line in sanitized.splitlines()]
        
        norm = NormalizedDeviceConfig(
            sanitized_raw_lines=[line for line in lines if line and not line.startswith('#')]
        )

        # 1. Metadata
        hostname_match = (
            re.search(r'host-name\s+([^;\s]+);', sanitized, re.IGNORECASE) or
            re.search(r'set\s+system\s+host-name\s+(\S+)', sanitized, re.IGNORECASE)
        )
        norm.metadata.hostname = hostname_match.group(1) if hostname_match else filename.split('.')[0]
        norm.metadata.vendor = "Juniper"
        norm.metadata.vendor_confidence = 0.99
        norm.metadata.device_type = "Firewall / Router"

        ver_match = (
            re.search(r'version\s+([0-9\.\(\)R]+);', sanitized, re.IGNORECASE) or
            re.search(r'set\s+version\s+(\S+)', sanitized, re.IGNORECASE)
        )
        if ver_match:
            norm.metadata.os_version = f"Junos OS {ver_match.group(1)}"
        else:
            norm.metadata.os_version = "Junos OS"

        # 2. Remote Management
        # Check SSH
        ssh_present = (
            bool(re.search(r'services\s*\{[^}]*ssh', sanitized, re.DOTALL | re.IGNORECASE)) or
            bool(re.search(r'set\s+system\s+services\s+ssh', sanitized, re.IGNORECASE))
        )
        ssh_v2_explicit = (
            bool(re.search(r'protocol-version\s+v2;', sanitized, re.IGNORECASE)) or
            bool(re.search(r'set\s+system\s+services\s+ssh\s+protocol-version\s+v2', sanitized, re.IGNORECASE))
        )
        norm.management.ssh_enabled = ssh_present
        norm.management.ssh_version = 2 if ssh_v2_explicit or ssh_present else None

        # Check Telnet
        telnet_present = (
            bool(re.search(r'\btelnet\s*;', sanitized, re.IGNORECASE)) or
            bool(re.search(r'set\s+system\s+services\s+telnet\b', sanitized, re.IGNORECASE))
        )
        norm.management.telnet_enabled = telnet_present

        # Check Web Management (HTTP vs HTTPS)
        http_present = (
            bool(re.search(r'web-management\s*\{[\s\S]*?\bhttp\s*[\{;]', sanitized, re.IGNORECASE)) or
            bool(re.search(r'set\s+system\s+services\s+web-management\s+http\b', sanitized, re.IGNORECASE))
        )
        https_present = (
            bool(re.search(r'web-management\s*\{[\s\S]*?\bhttps\s*[\{;]', sanitized, re.IGNORECASE)) or
            bool(re.search(r'set\s+system\s+services\s+web-management\s+https\b', sanitized, re.IGNORECASE))
        )
        norm.management.http_server_enabled = http_present
        norm.management.https_server_enabled = https_present

        # Check Idle Timeout
        timeout_match = (
            re.search(r'idle-timeout\s+(\d+);', sanitized, re.IGNORECASE) or
            re.search(r'set\s+system\s+login\s+idle-timeout\s+(\d+)', sanitized, re.IGNORECASE)
        )
        if timeout_match:
            norm.management.session_timeout_mins = int(timeout_match.group(1))

        # Check Login Announcement / Message
        norm.management.banner_motd_configured = (
            bool(re.search(r'login\s*\{[^}]*message\s+', sanitized, re.DOTALL | re.IGNORECASE)) or
            bool(re.search(r'set\s+system\s+login\s+message\s+', sanitized, re.IGNORECASE))
        )

        # Management ACL (apply firewall filter to lo0)
        lo0_filter = (
            bool(re.search(r'lo0\s*\{[\s\S]*?filter\s*\{[\s\S]*?input\s+[^;]+;', sanitized, re.IGNORECASE)) or
            bool(re.search(r'interfaces\s*\{[\s\S]*?lo0[\s\S]*?filter\s*\{[\s\S]*?input', sanitized, re.IGNORECASE)) or
            bool(re.search(r'set\s+interfaces\s+lo0[\s\S]*?filter\s+input', sanitized, re.IGNORECASE)) or
            (bool(re.search(r'\blo0\b', sanitized, re.IGNORECASE)) and bool(re.search(r'filter\s*\{[\s\S]*?input\b', sanitized, re.IGNORECASE)))
        )
        norm.management.mgmt_acls_applied = lo0_filter
        norm.management.unrestricted_management_access = not lo0_filter

        # 3. Authentication
        # Check root authentication
        root_auth_present = (
            bool(re.search(r'root-authentication\s*\{', sanitized, re.IGNORECASE)) or
            bool(re.search(r'set\s+system\s+root-authentication', sanitized, re.IGNORECASE))
        )
        
        # Check plain-text password in raw config
        if "plain-text-password" in raw_text:
            norm.authentication.plaintext_passwords_detected = True
            norm.authentication.weak_hashes_detected.append("plain-text-password in Junos configuration")

        # Check users
        users = re.findall(r'login\s*\{[^}]*user\s+([^;\s{]+)', sanitized, re.DOTALL | re.IGNORECASE)
        users.extend(re.findall(r'set\s+system\s+login\s+user\s+(\S+)', sanitized, re.IGNORECASE))
        
        for u in set(users):
            is_def = u.lower() in ["admin", "root", "junos", "guest"]
            norm.authentication.users.append(LocalUser(username=u, has_encrypted_password=True, is_default_admin=is_def))
            if is_def:
                norm.authentication.default_accounts_present = True

        # Check root remote login
        root_ssh = (
            bool(re.search(r'root-login\s+allow;', sanitized, re.IGNORECASE)) or
            bool(re.search(r'set\s+system\s+services\s+ssh\s+root-login\s+allow', sanitized, re.IGNORECASE))
        )
        norm.authentication.root_remote_login_allowed = root_ssh

        # 4. Logging & Syslog
        syslog_servers = re.findall(r'syslog\s*\{[^}]*host\s+([0-9\.]+|[a-zA-Z0-9\.-]+)', sanitized, re.DOTALL | re.IGNORECASE)
        syslog_servers.extend(re.findall(r'set\s+system\s+syslog\s+host\s+([0-9\.]+|[a-zA-Z0-9\.-]+)', sanitized, re.IGNORECASE))
        norm.logging.logging_enabled = (
            bool(re.search(r'syslog\s*\{', sanitized, re.IGNORECASE)) or
            bool(re.search(r'set\s+system\s+syslog', sanitized, re.IGNORECASE))
        )
        norm.logging.remote_syslog_servers = list(set(syslog_servers))
        norm.logging.timestamps_with_milliseconds = True

        # 5. NTP
        ntp_servers = re.findall(r'ntp\s*\{[^}]*server\s+([0-9\.]+|[a-zA-Z0-9\.-]+)', sanitized, re.DOTALL | re.IGNORECASE)
        ntp_servers.extend(re.findall(r'set\s+system\s+ntp\s+server\s+([0-9\.]+|[a-zA-Z0-9\.-]+)', sanitized, re.IGNORECASE))
        norm.ntp.ntp_servers = list(set(ntp_servers))
        norm.ntp.ntp_enabled = len(norm.ntp.ntp_servers) > 0
        norm.ntp.ntp_authentication_enabled = (
            bool(re.search(r'authentication-key\s+', sanitized, re.IGNORECASE)) or
            bool(re.search(r'set\s+system\s+ntp\s+authentication-key', sanitized, re.IGNORECASE))
        )

        # 6. SNMP
        snmp_present = (
            bool(re.search(r'snmp\s*\{', sanitized, re.IGNORECASE)) or
            bool(re.search(r'set\s+snmp', sanitized, re.IGNORECASE))
        )
        norm.snmp.snmp_enabled = snmp_present
        defaults = SecuritySanitizer.extract_detected_snmp_communities(raw_text)
        norm.snmp.default_communities_found = defaults
        
        if snmp_present:
            v3_present = (
                bool(re.search(r'v3\s*\{', sanitized, re.IGNORECASE)) or
                bool(re.search(r'set\s+snmp\s+v3', sanitized, re.IGNORECASE))
            )
            norm.snmp.snmp_v1_v2c_enabled = bool(re.search(r'community\s+', sanitized, re.IGNORECASE))
            norm.snmp.snmp_v3_enabled = v3_present
            for d in defaults:
                norm.snmp.communities.append(SnmpCommunity(name="********", access_type="RO", is_default=True))

        # 7. Access Control & Firewall Filters
        filters_present = (
            bool(re.search(r'firewall\s*\{[^}]*filter', sanitized, re.DOTALL | re.IGNORECASE)) or
            bool(re.search(r'set\s+firewall\s+filter', sanitized, re.IGNORECASE)) or
            bool(re.search(r'security\s*\{[^}]*policies', sanitized, re.DOTALL | re.IGNORECASE))
        )
        norm.access_control.acls_present = filters_present
        norm.access_control.total_acls = 1 if filters_present else 0

        # Check for permit any any in security policy
        any_any = (
            bool(re.search(r'match\s*\{[^}]*source-address\s+any;[^}]*destination-address\s+any;[^}]*application\s+any;[^}]*\}\s*then\s*\{[^}]*permit;', sanitized, re.DOTALL | re.IGNORECASE)) or
            bool(re.search(r'set\s+security\s+policies\s+from-zone\s+\S+\s+to-zone\s+\S+\s+policy\s+\S+\s+then\s+permit', sanitized, re.IGNORECASE) and re.search(r'source-address\s+any', sanitized, re.IGNORECASE))
        )
        norm.access_control.any_any_permit_detected = any_any

        # 8. Cryptography (IKE / IPsec)
        if re.search(r'encryption-algorithm\s+(?:3des-cbc|des-cbc)', sanitized, re.IGNORECASE) or \
           re.search(r'set\s+security\s+ike\s+proposal\s+\S+\s+encryption-algorithm\s+(?:3des-cbc|des-cbc)', sanitized, re.IGNORECASE):
            norm.cryptography.weak_ciphers_used.append("3DES/DES in Junos IKE proposal")
        if re.search(r'dh-group\s+group[125]', sanitized, re.IGNORECASE):
            norm.cryptography.weak_dh_groups_used = [1, 2, 5]
        norm.cryptography.ipsec_configured = bool(re.search(r'security\s*\{[^}]*ipsec', sanitized, re.DOTALL | re.IGNORECASE))

        # 9. Services & Hygiene
        norm.services.lldp_enabled = (
            bool(re.search(r'protocols\s*\{[^}]*lldp', sanitized, re.DOTALL | re.IGNORECASE)) or
            bool(re.search(r'set\s+protocols\s+lldp', sanitized, re.IGNORECASE))
        )

        return norm
