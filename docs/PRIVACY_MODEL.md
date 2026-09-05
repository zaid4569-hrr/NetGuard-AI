# NetGuard AI — Privacy & Security Threat Model

## Core Privacy Principles
1. **Local-First Processing**: Configuration files never leave the machine. No cloud API calls are made for parser execution or rule auditing.
2. **Ephemeral In-Memory Handling**: Raw file streams are sanitized in memory.
3. **Deterministic Secret Redaction**: The `SecuritySanitizer` module intercepts:
   - Cisco `enable secret`, `password 0/7`, `crypto isakmp key`, `snmp-server community`
   - Fortinet `set password`, `set psksecret`, `set secret`, `set community-name`
   - Juniper `root-authentication plain-text-password`, `encrypted-password`, `community`
4. **Untrusted Input Protections**:
   - File size caps (20MB max)
   - Strict basename path-traversal sanitation
   - No `eval()` or subshell command execution from configuration contents.
