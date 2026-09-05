from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class DeviceMetadata(BaseModel):
    hostname: str = "Unknown-Device"
    vendor: str = "Unknown"
    vendor_confidence: float = 1.0
    os_version: Optional[str] = None
    device_type: str = "Network Device"  # Router, Switch, Firewall, Security Gateway

class ManagementConfig(BaseModel):
    ssh_enabled: bool = False
    ssh_version: Optional[int] = None  # 1 or 2
    ssh_v1_enabled: bool = False
    telnet_enabled: bool = False
    http_server_enabled: bool = False
    https_server_enabled: bool = False
    session_timeout_mins: Optional[int] = None
    banner_motd_configured: bool = False
    unrestricted_management_access: bool = False
    mgmt_acls_applied: bool = False

class LocalUser(BaseModel):
    username: str
    privilege_level: Optional[int] = None
    has_encrypted_password: bool = True
    is_default_admin: bool = False

class AuthenticationConfig(BaseModel):
    aaa_enabled: bool = False
    password_encryption_service_enabled: bool = False
    plaintext_passwords_detected: bool = False
    weak_hashes_detected: List[str] = Field(default_factory=list)  # e.g., "type 0", "type 7", "md5"
    users: List[LocalUser] = Field(default_factory=list)
    default_accounts_present: bool = False
    root_remote_login_allowed: bool = False
    min_password_len: Optional[int] = None

class LoggingConfig(BaseModel):
    logging_enabled: bool = False
    remote_syslog_servers: List[str] = Field(default_factory=list)
    buffer_logging_enabled: bool = False
    console_logging_enabled: bool = False
    log_level: Optional[str] = None
    timestamps_with_milliseconds: bool = False

class NtpConfig(BaseModel):
    ntp_enabled: bool = False
    ntp_servers: List[str] = Field(default_factory=list)
    ntp_authentication_enabled: bool = False

class SnmpCommunity(BaseModel):
    name: str = "********"  # Masked always
    access_type: str = "RO"  # RO, RW
    is_default: bool = False  # e.g. public or private

class SnmpConfig(BaseModel):
    snmp_enabled: bool = False
    snmp_v1_v2c_enabled: bool = False
    snmp_v3_enabled: bool = False
    communities: List[SnmpCommunity] = Field(default_factory=list)
    default_communities_found: List[str] = Field(default_factory=list)
    snmp_rw_enabled: bool = False

class AclRule(BaseModel):
    name: str
    action: str  # permit, deny
    source: str
    destination: str
    protocol: Optional[str] = None
    is_any_any_permit: bool = False

class AccessControlConfig(BaseModel):
    acls_present: bool = False
    total_acls: int = 0
    any_any_permit_detected: bool = False
    unapplied_acls: List[str] = Field(default_factory=list)
    rules: List[AclRule] = Field(default_factory=list)
    anti_spoofing_configured: bool = False

class CryptographyConfig(BaseModel):
    weak_ciphers_used: List[str] = Field(default_factory=list)  # DES, 3DES, RC4, MD5
    weak_dh_groups_used: List[int] = Field(default_factory=list)  # 1, 2, 5
    ipsec_configured: bool = False
    ike_v1_only: bool = False

class ServicesConfig(BaseModel):
    cdp_enabled: bool = False
    lldp_enabled: bool = False
    ip_source_routing_enabled: bool = False
    proxy_arp_enabled: bool = False
    finger_service_enabled: bool = False
    bootp_server_enabled: bool = False
    tcp_small_servers_enabled: bool = False
    udp_small_servers_enabled: bool = False
    unused_interfaces_shutdown: bool = True

class NormalizedDeviceConfig(BaseModel):
    metadata: DeviceMetadata = Field(default_factory=DeviceMetadata)
    management: ManagementConfig = Field(default_factory=ManagementConfig)
    authentication: AuthenticationConfig = Field(default_factory=AuthenticationConfig)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    ntp: NtpConfig = Field(default_factory=NtpConfig)
    snmp: SnmpConfig = Field(default_factory=SnmpConfig)
    access_control: AccessControlConfig = Field(default_factory=AccessControlConfig)
    cryptography: CryptographyConfig = Field(default_factory=CryptographyConfig)
    services: ServicesConfig = Field(default_factory=ServicesConfig)
    
    # Sanitized lines for evidence lookup without secret exposure
    sanitized_raw_lines: List[str] = Field(default_factory=list)
