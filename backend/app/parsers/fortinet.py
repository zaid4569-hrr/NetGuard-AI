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

class FortinetParser(BaseVendorParser):
    """
    Parser for Fortinet FortiGate firewall and security gateway configurations.
    Handles 'config ... edit ... set ... next ... end' block structures.
    """

    @classmethod
    def vendor_name(cls) -> str:
        return "Fortinet"

    @classmethod
    def detect_confidence(cls, raw_text: str) -> float:
        from app.parsers.detector import VendorDetector
        vendor, conf = VendorDetector.detect(raw_text)
        return conf if vendor == "Fortinet" else 0.0

    def parse(self, raw_text: str, filename: str = "config.conf") -> NormalizedDeviceConfig:
        sanitized = self.sanitize(raw_text)
        lines = [line.strip() for line in sanitized.splitlines()]
        
        norm = NormalizedDeviceConfig(
            sanitized_raw_lines=[line for line in lines if line and not line.startswith('#')]
        )

        # 1. Metadata
        hostname_match = re.search(r'^\s*set\s+hostname\s+["\']?([^"\']+)["\']?', sanitized, re.MULTILINE | re.IGNORECASE)
        norm.metadata.hostname = hostname_match.group(1) if hostname_match else filename.split('.')[0]
        norm.metadata.vendor = "Fortinet"
        norm.metadata.vendor_confidence = 0.99
        norm.metadata.device_type = "Firewall"

        ver_match = re.search(r'#config-version=([A-Z0-9_\.-]+)', sanitized, re.IGNORECASE)
        if ver_match:
            norm.metadata.os_version = f"FortiOS {ver_match.group(1)}"
        else:
            norm.metadata.os_version = "FortiOS"

        # 2. Remote Management & Allowed Access
        # FortiGate interface allowaccess lines: e.g. set allowaccess ping https ssh http telnet
        allowaccess_matches = re.findall(r'set\s+allowaccess\s+([^\r\n]+)', sanitized, re.IGNORECASE)
        all_access_tokens = " ".join(allowaccess_matches).lower()
        access_token_set = set(all_access_tokens.split())
        
        norm.management.ssh_enabled = "ssh" in access_token_set or bool(re.search(r'config\s+system\s+admin', sanitized, re.IGNORECASE))
        norm.management.ssh_version = 2
        norm.management.telnet_enabled = "telnet" in access_token_set
        norm.management.http_server_enabled = "http" in access_token_set
        norm.management.https_server_enabled = "https" in access_token_set or not norm.management.http_server_enabled
        
        # Check admin timeout (default in FortiOS is 5 mins if configured, or check set admintimeout)
        timeout_match = re.search(r'set\s+admintimeout\s+(\d+)', sanitized, re.IGNORECASE)
        if timeout_match:
            norm.management.session_timeout_mins = int(timeout_match.group(1))

        # Check pre-login banner
        norm.management.banner_motd_configured = bool(re.search(r'set\s+pre_login_banner\s+enable', sanitized, re.IGNORECASE))

        # Management restriction (trusted hosts on admin accounts)
        trusthost_found = bool(re.search(r'set\s+trusthost\d+\s+', sanitized, re.IGNORECASE))
        norm.management.mgmt_acls_applied = trusthost_found
        norm.management.unrestricted_management_access = not trusthost_found

        # 3. Authentication
        # Scan admin users
        admin_blocks = re.findall(r'config\s+system\s+admin\s+(?:.*?)end', sanitized, re.DOTALL | re.IGNORECASE)
        admin_users = []
        if admin_blocks:
            for block in admin_blocks:
                admins = re.findall(r'edit\s+["\']?([^"\']+)["\']?', block, re.IGNORECASE)
                admin_users.extend(admins)

        for u in admin_users:
            is_default = u.lower() in ["admin", "root", "guest"]
            norm.authentication.users.append(
                LocalUser(username=u, has_encrypted_password=True, is_default_admin=is_default)
            )
            if is_default:
                norm.authentication.default_accounts_present = True

        # Check weak / plaintext passwords in raw
        if "set password ENC" not in raw_text and re.search(r'set\s+password\s+[a-zA-Z0-9]', raw_text, re.IGNORECASE):
            norm.authentication.plaintext_passwords_detected = True
            norm.authentication.weak_hashes_detected.append("Unencrypted administrator password in CLI")

        # 4. Logging
        syslog_status = bool(re.search(r'config\s+log\s+syslogd\s+(?:.*?)set\s+status\s+enable', sanitized, re.DOTALL | re.IGNORECASE))
        syslog_servers = re.findall(r'config\s+log\s+syslogd\s+(?:.*?)set\s+server\s+["\']?([^"\']+)["\']?', sanitized, re.DOTALL | re.IGNORECASE)
        
        fortianalyzer_status = bool(re.search(r'config\s+log\s+fortianalyzer\s+(?:.*?)set\s+status\s+enable', sanitized, re.DOTALL | re.IGNORECASE))
        
        norm.logging.logging_enabled = syslog_status or fortianalyzer_status or bool(re.search(r'config\s+log\s+disk\s+(?:.*?)set\s+status\s+enable', sanitized, re.DOTALL | re.IGNORECASE))
        norm.logging.remote_syslog_servers = syslog_servers
        norm.logging.timestamps_with_milliseconds = True

        # 5. NTP
        ntp_enabled = bool(re.search(r'config\s+system\s+ntp\s+(?:.*?)set\s+ntpsync\s+enable', sanitized, re.DOTALL | re.IGNORECASE))
        ntp_servers = re.findall(r'config\s+system\s+ntp\s+(?:.*?)set\s+server\s+["\']?([^"\']+)["\']?', sanitized, re.DOTALL | re.IGNORECASE)
        norm.ntp.ntp_enabled = ntp_enabled or len(ntp_servers) > 0
        norm.ntp.ntp_servers = ntp_servers
        norm.ntp.ntp_authentication_enabled = bool(re.search(r'set\s+authentication\s+enable', sanitized, re.IGNORECASE))

        # 6. SNMP
        snmp_block = re.search(r'config\s+system\s+snmp\s+(?:sysinfo|community)\s+(?:.*?)end', sanitized, re.DOTALL | re.IGNORECASE)
        norm.snmp.snmp_enabled = bool(snmp_block)
        defaults = SecuritySanitizer.extract_detected_snmp_communities(raw_text)
        norm.snmp.default_communities_found = defaults
        
        if norm.snmp.snmp_enabled:
            norm.snmp.snmp_v1_v2c_enabled = bool(re.search(r'config\s+system\s+snmp\s+community', sanitized, re.IGNORECASE))
            norm.snmp.snmp_v3_enabled = bool(re.search(r'config\s+system\s+snmp\s+user', sanitized, re.IGNORECASE))
            for d in defaults:
                norm.snmp.communities.append(SnmpCommunity(name="********", access_type="RO", is_default=True))

        # 7. Access Control & Firewall Policies
        policy_blocks = re.findall(r'config\s+firewall\s+policy\s+(?:.*?)end', sanitized, re.DOTALL | re.IGNORECASE)
        norm.access_control.total_acls = len(re.findall(r'edit\s+\d+', sanitized, re.IGNORECASE))
        norm.access_control.acls_present = norm.access_control.total_acls > 0

        # Check for permit any any (srcaddr "all", dstaddr "all", action accept, service "ALL")
        for p in policy_blocks:
            rules = re.findall(r'edit\s+\d+.*?(?=next|end)', p, re.DOTALL | re.IGNORECASE)
            for r in rules:
                if re.search(r'set\s+srcaddr\s+["\']?all["\']?', r, re.IGNORECASE) and \
                   re.search(r'set\s+dstaddr\s+["\']?all["\']?', r, re.IGNORECASE) and \
                   re.search(r'set\s+action\s+accept', r, re.IGNORECASE) and \
                   re.search(r'set\s+service\s+["\']?ALL["\']?', r, re.IGNORECASE):
                    norm.access_control.any_any_permit_detected = True

        # 8. Cryptography (IPsec proposals)
        if re.search(r'set\s+proposal\s+(?:.*?)des|3des', sanitized, re.IGNORECASE):
            norm.cryptography.weak_ciphers_used.append("DES/3DES Phase 1 Proposal in FortiGate IPsec")
        if re.search(r'set\s+dhgrp\s+["\']?[125]["\']?', sanitized, re.IGNORECASE):
            norm.cryptography.weak_dh_groups_used = [1, 2, 5]
        norm.cryptography.ipsec_configured = bool(re.search(r'config\s+vpn\s+ipsec', sanitized, re.IGNORECASE))

        # 9. Services & Hygiene
        norm.services.lldp_enabled = bool(re.search(r'set\s+lldp-transmission\s+enable', sanitized, re.IGNORECASE))
        norm.services.unused_interfaces_shutdown = not bool(re.search(r'set\s+status\s+down', sanitized, re.IGNORECASE))

        return norm
