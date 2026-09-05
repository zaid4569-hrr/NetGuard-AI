from app.compliance.engine import ComplianceEngine

# Import all rules from category modules
from app.compliance.rules.mgmt_rules import (
    TelnetEnabledRule, SshDisabledOrV1Rule, InsecureHttpServerRule,
    MissingSessionTimeoutRule, MissingMotdBannerRule
)
from app.compliance.rules.auth_rules import (
    PlaintextPasswordRule, WeakHashingAlgorithmRule, DefaultAccountsPresentRule,
    MissingAaaNewModelRule, RootRemoteLoginAllowedRule
)
from app.compliance.rules.logging_rules import (
    LoggingDisabledRule, MissingRemoteSyslogRule, MissingMillisecondTimestampsRule
)
from app.compliance.rules.ntp_rules import (
    NtpNotConfiguredRule, NtpAuthenticationMissingRule
)
from app.compliance.rules.snmp_rules import (
    InsecureSnmpVersionRule, DefaultSnmpCommunityRule, SnmpWriteAccessEnabledRule
)
from app.compliance.rules.acl_rules import (
    PermitAnyAnyRule, UnrestrictedManagementAccessRule, MissingAntiSpoofingRule
)
from app.compliance.rules.crypto_rules import (
    DeprecatedCryptoCipherRule, InsecureDhGroupRule
)
from app.compliance.rules.service_rules import (
    DiscoveryProtocolsEnabledRule, InsecureAuxiliaryServicesRule
)

# Register all 20+ rules into ComplianceEngine
ALL_RULES = [
    # Remote Management
    TelnetEnabledRule(),
    SshDisabledOrV1Rule(),
    InsecureHttpServerRule(),
    MissingSessionTimeoutRule(),
    MissingMotdBannerRule(),
    
    # Authentication
    PlaintextPasswordRule(),
    WeakHashingAlgorithmRule(),
    DefaultAccountsPresentRule(),
    MissingAaaNewModelRule(),
    RootRemoteLoginAllowedRule(),
    
    # Logging
    LoggingDisabledRule(),
    MissingRemoteSyslogRule(),
    MissingMillisecondTimestampsRule(),
    
    # NTP
    NtpNotConfiguredRule(),
    NtpAuthenticationMissingRule(),
    
    # SNMP
    InsecureSnmpVersionRule(),
    DefaultSnmpCommunityRule(),
    SnmpWriteAccessEnabledRule(),
    
    # Access Control
    PermitAnyAnyRule(),
    UnrestrictedManagementAccessRule(),
    MissingAntiSpoofingRule(),
    
    # Cryptography
    DeprecatedCryptoCipherRule(),
    InsecureDhGroupRule(),
    
    # Services
    DiscoveryProtocolsEnabledRule(),
    InsecureAuxiliaryServicesRule(),
]

for rule in ALL_RULES:
    ComplianceEngine.register_rule(rule)
