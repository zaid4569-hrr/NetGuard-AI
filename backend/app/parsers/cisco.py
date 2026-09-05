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

class CiscoParser(BaseVendorParser):
    """
    Parser for Cisco IOS, IOS-XE, and NX-OS configurations.
    Processes hierarchical block structures into NormalizedDeviceConfig.
    """

    @classmethod
    def vendor_name(cls) -> str:
        return "Cisco"

    @classmethod
    def detect_confidence(cls, raw_text: str) -> float:
        from app.parsers.detector import VendorDetector
        vendor, conf = VendorDetector.detect(raw_text)
        return conf if vendor == "Cisco" else 0.0

    def parse(self, raw_text: str, filename: str = "config.cfg") -> NormalizedDeviceConfig:
        # Pre-sanitize raw text so that no secrets leak into AST or memory lines
        sanitized = self.sanitize(raw_text)
        lines = [line.strip() for line in sanitized.splitlines()]
        
        norm = NormalizedDeviceConfig(
            sanitized_raw_lines=[line for line in lines if line and not line.startswith('!')]
        )
        
        # 1. Device Metadata
        hostname_match = re.search(r'^\s*hostname\s+(\S+)', sanitized, re.MULTILINE | re.IGNORECASE)
        norm.metadata.hostname = hostname_match.group(1) if hostname_match else filename.split('.')[0]
        norm.metadata.vendor = "Cisco"
        norm.metadata.vendor_confidence = 0.98
        
        ver_match = re.search(r'!\s*version\s+([0-9\.\(\)A-Za-z]+)|\bversion\s+([0-9\.\(\)A-Za-z]+)', sanitized, re.IGNORECASE)
        if ver_match:
            norm.metadata.os_version = ver_match.group(1) or ver_match.group(2)
        else:
            norm.metadata.os_version = "IOS / IOS-XE"

        if "switch" in filename.lower() or re.search(r'spanning-tree|vlan\s+\d+|switchport', sanitized, re.IGNORECASE):
            norm.metadata.device_type = "Switch"
        elif re.search(r'crypto\s+isakmp|crypto\s+ipsec|router\s+(?:bgp|ospf|eigrp)', sanitized, re.IGNORECASE):
            norm.metadata.device_type = "Router"
        else:
            norm.metadata.device_type = "Network Device"

        # 2. Remote Management
        # Scan VTY lines for transport input
        vty_blocks = re.findall(r'line\s+vty\s+\d+.*?(?=\nline|\ninterface|\nrouter|\n!\s*end|\Z)', sanitized, re.DOTALL | re.IGNORECASE)
        
        telnet_found = False
        ssh_found = False
        mgmt_acl_found = False
        timeout_val: Optional[int] = None

        if vty_blocks:
            for block in vty_blocks:
                if re.search(r'transport\s+input\s+(?:all|telnet)', block, re.IGNORECASE):
                    telnet_found = True
                if re.search(r'transport\s+input\s+(?:all|ssh)', block, re.IGNORECASE):
                    ssh_found = True
                if re.search(r'access-class\s+\S+\s+in', block, re.IGNORECASE):
                    mgmt_acl_found = True
                to_match = re.search(r'exec-timeout\s+(\d+)', block, re.IGNORECASE)
                if to_match:
                    timeout_val = int(to_match.group(1))
        else:
            # Default IOS behavior if no VTY block specified is telnet enabled
            telnet_found = True

        # Check global SSH version
        if re.search(r'ip\s+ssh\s+version\s+2', sanitized, re.IGNORECASE):
            norm.management.ssh_version = 2
            norm.management.ssh_enabled = True
        elif re.search(r'ip\s+ssh\s+version\s+1', sanitized, re.IGNORECASE):
            norm.management.ssh_version = 1
            norm.management.ssh_v1_enabled = True
            norm.management.ssh_enabled = True
        elif ssh_found:
            norm.management.ssh_enabled = True

        norm.management.telnet_enabled = telnet_found
        norm.management.http_server_enabled = bool(re.search(r'^\s*ip\s+http\s+server\b', sanitized, re.MULTILINE | re.IGNORECASE))
        norm.management.https_server_enabled = bool(re.search(r'^\s*ip\s+http\s+secure-server\b', sanitized, re.MULTILINE | re.IGNORECASE))
        norm.management.session_timeout_mins = timeout_val
        norm.management.banner_motd_configured = bool(re.search(r'^\s*banner\s+(?:motd|login)', sanitized, re.MULTILINE | re.IGNORECASE))
        norm.management.mgmt_acls_applied = mgmt_acl_found
        norm.management.unrestricted_management_access = not mgmt_acl_found

        # 3. Authentication
        norm.authentication.aaa_enabled = bool(re.search(r'^\s*aaa\s+new-model\b', sanitized, re.MULTILINE | re.IGNORECASE))
        norm.authentication.password_encryption_service_enabled = bool(re.search(r'^\s*service\s+password-encryption\b', sanitized, re.MULTILINE | re.IGNORECASE))

        # Check plaintext passwords and weak hashes
        has_enable_password = bool(re.search(r'^\s*enable\s+password\b', sanitized, re.MULTILINE | re.IGNORECASE))
        has_enable_secret = bool(re.search(r'^\s*enable\s+secret\b', sanitized, re.MULTILINE | re.IGNORECASE))
        
        user_matches = re.findall(r'username\s+(\S+)(?:\s+privilege\s+(\d+))?\s+(password|secret)(?:\s+(\d+))?', sanitized, re.IGNORECASE)
        for u, priv, ptype, htype in user_matches:
            priv_int = int(priv) if priv else None
            is_enc = (ptype.lower() == 'secret') or (htype and htype in ('5', '8', '9'))
            is_default = u.lower() in ["admin", "cisco", "root", "user", "guest"]
            norm.authentication.users.append(
                LocalUser(username=u, privilege_level=priv_int, has_encrypted_password=is_enc, is_default_admin=is_default)
            )
            if is_default:
                norm.authentication.default_accounts_present = True
            if ptype.lower() == 'password' and (not htype or htype in ('0', '7')):
                norm.authentication.weak_hashes_detected.append(f"Type {htype or '0'} on user {u}")

        if has_enable_password and not has_enable_secret:
            norm.authentication.plaintext_passwords_detected = True
            norm.authentication.weak_hashes_detected.append("enable password (legacy/plaintext/type 7)")

        if not norm.authentication.password_encryption_service_enabled and any(u.has_encrypted_password is False for u in norm.authentication.users):
            norm.authentication.plaintext_passwords_detected = True

        # 4. Logging
        norm.logging.logging_enabled = bool(re.search(r'^\s*logging\s+(?:on|buffered|host|\d+)', sanitized, re.MULTILINE | re.IGNORECASE))
        syslog_matches = re.findall(r'^\s*logging\s+(?:host\s+)?([0-9\.]+|[a-zA-Z0-9\.-]+)', sanitized, re.MULTILINE | re.IGNORECASE)
        # Filter out keywords that match logging host regex
        clean_syslog = [s for s in syslog_matches if s.lower() not in ['on', 'buffered', 'console', 'monitor', 'trap', 'source-interface']]
        norm.logging.remote_syslog_servers = clean_syslog
        norm.logging.buffer_logging_enabled = bool(re.search(r'^\s*logging\s+buffered', sanitized, re.MULTILINE | re.IGNORECASE))
        norm.logging.timestamps_with_milliseconds = bool(re.search(r'service\s+timestamps\s+log\s+datetime\s+msec', sanitized, re.IGNORECASE))

        # 5. NTP
        ntp_servers = re.findall(r'^\s*ntp\s+server\s+([0-9\.]+|[a-zA-Z0-9\.-]+)', sanitized, re.MULTILINE | re.IGNORECASE)
        norm.ntp.ntp_servers = ntp_servers
        norm.ntp.ntp_enabled = len(ntp_servers) > 0
        norm.ntp.ntp_authentication_enabled = bool(re.search(r'^\s*ntp\s+authenticate', sanitized, re.MULTILINE | re.IGNORECASE))

        # 6. SNMP
        snmp_matches = re.findall(r'snmp-server\s+community\s+(\S+)(?:\s+(RO|RW))?', sanitized, re.IGNORECASE)
        norm.snmp.snmp_enabled = bool(re.search(r'snmp-server\b', sanitized, re.IGNORECASE))
        
        # Safe default community detection
        defaults = SecuritySanitizer.extract_detected_snmp_communities(raw_text)
        norm.snmp.default_communities_found = defaults
        
        for comm, access in snmp_matches:
            acc_type = access.upper() if access else "RO"
            if acc_type == "RW":
                norm.snmp.snmp_rw_enabled = True
            norm.snmp.communities.append(
                SnmpCommunity(name="********", access_type=acc_type, is_default=("public" in defaults or "private" in defaults))
            )
        if norm.snmp.snmp_enabled:
            norm.snmp.snmp_v1_v2c_enabled = bool(re.search(r'snmp-server\s+community', sanitized, re.IGNORECASE))
            norm.snmp.snmp_v3_enabled = bool(re.search(r'snmp-server\s+group\s+\S+\s+v3|snmp-server\s+user\s+\S+\s+\S+\s+v3', sanitized, re.IGNORECASE))

        # 7. Access Control & Firewall
        acl_any_any = bool(re.search(r'permit\s+(?:ip|tcp|udp)\s+any\s+any\b', sanitized, re.IGNORECASE))
        acls_found = len(re.findall(r'^\s*access-list\s+\d+|^\s*ip\s+access-list\s+(?:standard|extended)\s+\S+', sanitized, re.MULTILINE | re.IGNORECASE))
        norm.access_control.acls_present = acls_found > 0
        norm.access_control.total_acls = acls_found
        norm.access_control.any_any_permit_detected = acl_any_any
        norm.access_control.anti_spoofing_configured = bool(re.search(r'ip\s+verify\s+unicast\s+source\s+reachable-via', sanitized, re.IGNORECASE))

        # 8. Cryptography
        if re.search(r'encr(?:yption)?\s+(?:des|3des)\b', sanitized, re.IGNORECASE):
            norm.cryptography.weak_ciphers_used.append("3DES/DES in ISAKMP/IPsec")
        if re.search(r'hash\s+md5\b', sanitized, re.IGNORECASE):
            norm.cryptography.weak_ciphers_used.append("MD5 Integrity in IPsec/ISAKMP")
        if re.search(r'group\s+(?:1|2|5)\b', sanitized, re.IGNORECASE):
            norm.cryptography.weak_dh_groups_used = [1, 2, 5]
        norm.cryptography.ipsec_configured = bool(re.search(r'crypto\s+(?:isakmp|ipsec|ikev2)', sanitized, re.IGNORECASE))

        # 9. Services & Hygiene
        norm.services.cdp_enabled = not bool(re.search(r'^\s*no\s+cdp\s+run\b', sanitized, re.MULTILINE | re.IGNORECASE))
        norm.services.ip_source_routing_enabled = not bool(re.search(r'^\s*no\s+ip\s+source-route\b', sanitized, re.MULTILINE | re.IGNORECASE))
        norm.services.proxy_arp_enabled = not bool(re.search(r'^\s*no\s+ip\s+proxy-arp\b', sanitized, re.MULTILINE | re.IGNORECASE))
        norm.services.finger_service_enabled = bool(re.search(r'^\s*ip\s+finger\b', sanitized, re.MULTILINE | re.IGNORECASE)) and not bool(re.search(r'^\s*no\s+ip\s+finger\b', sanitized, re.MULTILINE | re.IGNORECASE))
        norm.services.tcp_small_servers_enabled = bool(re.search(r'^\s*service\s+tcp-small-servers\b', sanitized, re.MULTILINE | re.IGNORECASE))

        return norm
