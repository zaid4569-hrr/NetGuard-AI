# NetGuard AI — Compliance Rules & Standards Mapping

| Rule ID | Title | Category | Severity | CIS Benchmark | NIST SP 800-53 | ISO/IEC 27001 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `NET-MGMT-001` | Telnet Remote Management Enabled | Remote Mgmt | **HIGH** | CIS 1.1.1 | AC-17 | A.13.1.1 |
| `NET-MGMT-002` | SSH Disabled or Insecure SSHv1 | Remote Mgmt | **HIGH** | CIS 1.1.2 | IA-2 | A.9.4.2 |
| `NET-MGMT-003` | Cleartext HTTP Web Management | Remote Mgmt | **MEDIUM** | CIS 1.1.3 | AC-17 | A.13.1.1 |
| `NET-MGMT-004` | Missing Inactivity Session Timeout | Remote Mgmt | **LOW** | CIS 1.1.4 | AC-12 | A.11.2.8 |
| `NET-MGMT-005` | Missing Legal Warning Banner (MOTD) | Remote Mgmt | **INFO** | CIS 1.1.5 | AC-8 | A.9.4.2 |
| `NET-AUTH-001` | Cleartext Password Storage | Authentication | **CRITICAL** | CIS 1.2.1 | IA-5 | A.9.4.3 |
| `NET-AUTH-002` | Weak Password Hashing (Type 0/7/MD5) | Authentication | **HIGH** | CIS 1.2.2 | IA-5 | A.9.4.3 |
| `NET-AUTH-003` | Default / Generic Admin Accounts | Authentication | **HIGH** | CIS 1.2.3 | IA-2 | A.9.2.1 |
| `NET-AUTH-004` | Centralized AAA Model Disabled | Authentication | **MEDIUM** | CIS 1.2.4 | AC-2 | A.9.2.2 |
| `NET-AUTH-005` | Direct Root Remote Login Allowed | Authentication | **HIGH** | CIS 1.2.5 | AC-6 | A.9.4.2 |
| `NET-LOG-001` | System Logging Disabled | Logging | **CRITICAL** | CIS 1.3.1 | AU-2 | A.12.4.1 |
| `NET-LOG-002` | Centralized Remote Syslog Missing | Logging | **HIGH** | CIS 1.3.2 | AU-6 | A.12.4.2 |
| `NET-LOG-003` | Log Timestamps Missing Milliseconds | Logging | **LOW** | CIS 1.3.3 | AU-8 | A.12.4.4 |
| `NET-NTP-001` | NTP Service Not Configured | Time Sync | **HIGH** | CIS 1.4.1 | AU-8 | A.12.4.4 |
| `NET-NTP-002` | NTP Cryptographic Auth Missing | Time Sync | **MEDIUM** | CIS 1.4.2 | SC-23 | A.12.4.4 |
| `NET-SNMP-001` | Insecure SNMP Version (v1/v2c) | SNMP | **HIGH** | CIS 1.5.1 | IA-5 | A.13.1.1 |
| `NET-SNMP-002` | Default Community String ('public'/'private') | SNMP | **CRITICAL** | CIS 1.5.2 | IA-5 | A.9.4.3 |
| `NET-SNMP-003` | SNMP Read-Write (RW) Enabled | SNMP | **HIGH** | CIS 1.5.3 | AC-6 | A.13.1.1 |
| `NET-ACL-001` | Dangerous 'Permit Any Any' Policy | Access Control | **CRITICAL** | CIS 1.6.1 | AC-4 | A.13.1.1 |
| `NET-ACL-002` | Unrestricted Management Plane Access | Access Control | **CRITICAL** | CIS 1.6.2 | AC-17 | A.13.1.1 |
| `NET-ACL-003` | IP Anti-Spoofing Filters Missing (uRPF)| Access Control | **MEDIUM** | CIS 1.6.3 | SC-7 | A.13.1.2 |
| `NET-CRYPTO-001`| Deprecated Cipher in VPN (DES/3DES) | Cryptography | **HIGH** | CIS 1.7.1 | SC-13 | A.10.1.1 |
| `NET-CRYPTO-002`| Insecure DH Key Exchange (DH 1/2/5) | Cryptography | **HIGH** | CIS 1.7.2 | SC-13 | A.10.1.1 |
| `NET-SVC-001` | Discovery Protocols Enabled (CDP/LLDP)| Services | **LOW** | CIS 1.8.1 | CM-7 | A.12.5.1 |
| `NET-SVC-002` | Insecure Auxiliary Services (Finger/PAD)| Services | **MEDIUM** | CIS 1.8.2 | CM-7 | A.12.5.1 |
