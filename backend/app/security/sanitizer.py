import re
from typing import Tuple, List, Set

class SecuritySanitizer:
    """
    Local privacy-preserving sanitizer.
    Intercepts and masks passwords, secrets, pre-shared keys, SNMP communities,
    and private keys before configuration data is parsed, stored, or displayed.
    """
    
    MASK_STRING = "********"
    
    # Pre-compiled Regex patterns for sensitive credential parameters across Cisco, Fortinet, Juniper
    SECRET_PATTERNS = [
        # Multi-word key/secret/password patterns first (specific before general)
        (re.compile(r'(crypto\s+isakmp\s+key\s+)(\S+)', re.IGNORECASE), r'\1********'),
        (re.compile(r'(crypto\s+ikev2\s+key\s+)(\S+)', re.IGNORECASE), r'\1********'),
        (re.compile(r'(snmp-server\s+community\s+)(\S+)', re.IGNORECASE), r'\1********'),
        (re.compile(r'(snmp-server\s+host\s+\S+\s+(?:version\s+\S+\s+)?(?:community\s+)?|snmp-server\s+host\s+\S+\s+)(\S+)', re.IGNORECASE), r'\1********'),
        (re.compile(r'(tacacs-server\s+key(?:\s+\d+)?\s+)(\S+)', re.IGNORECASE), r'\1********'),
        (re.compile(r'(radius-server\s+key(?:\s+\d+)?\s+)(\S+)', re.IGNORECASE), r'\1********'),
        (re.compile(r'(enable\s+(?:secret|password)(?:\s+level\s+\d+)?(?:\s+\d+)?\s+)(\S+)', re.IGNORECASE), r'\1********'),
        (re.compile(r'(username\s+\S+\s+(?:privilege\s+\d+\s+)?(?:secret|password)(?:\s+\d+)?\s+)(\S+)', re.IGNORECASE), r'\1********'),
        (re.compile(r'(key-string(?:\s+\d+)?\s+)(\S+)', re.IGNORECASE), r'\1********'),
        (re.compile(r'(pre-shared-key(?:\s+local|\s+remote)?(?:\s+\d+)?\s+)(\S+)', re.IGNORECASE), r'\1********'),
        (re.compile(r'(server-key(?:\s+\d+)?\s+)(\S+)', re.IGNORECASE), r'\1********'),
        (re.compile(r'(neighbor\s+\S+\s+password\s+)(\S+)', re.IGNORECASE), r'\1********'),
        (re.compile(r'(ip\s+ospf\s+authentication-key\s+)(\S+)', re.IGNORECASE), r'\1********'),
        (re.compile(r'(ip\s+ospf\s+message-digest-key\s+\d+\s+md5\s+)(\S+)', re.IGNORECASE), r'\1********'),
        (re.compile(r'(standby(?:\s+\d+)?\s+authentication\s+)(\S+)', re.IGNORECASE), r'\1********'),
        
        # General password / secret patterns with word boundary
        (re.compile(r'(\bpassword(?:\s+\d+)?\s+)(\S+)', re.IGNORECASE), r'\1********'),
        (re.compile(r'(\bsecret(?:\s+\d+)?\s+)(\S+)', re.IGNORECASE), r'\1********'),
        
        # Fortinet FortiGate secret patterns
        (re.compile(r'(set\s+password\s+(?:ENC\s+)?)(["\']?[^\r\n"\']+["\']?)', re.IGNORECASE), r'set password ********'),
        (re.compile(r'(set\s+secret\s+(?:ENC\s+)?)(["\']?[^\r\n"\']+["\']?)', re.IGNORECASE), r'set secret ********'),
        (re.compile(r'(set\s+preshared-key\s+(?:ENC\s+)?)(["\']?[^\r\n"\']+["\']?)', re.IGNORECASE), r'set preshared-key ********'),
        (re.compile(r'(set\s+psksecret\s+(?:ENC\s+)?)(["\']?[^\r\n"\']+["\']?)', re.IGNORECASE), r'set psksecret ********'),
        (re.compile(r'(config\s+system\s+snmp\s+community[\s\S]*?set\s+name\s+)(["\']?[^\r\n"\']+["\']?)', re.IGNORECASE), r'\1"********"'),
        (re.compile(r'(set\s+community-name\s+)(["\']?[^\r\n"\']+["\']?)', re.IGNORECASE), r'set community-name ********'),
        (re.compile(r'(set\s+auth-password\s+(?:ENC\s+)?)(["\']?[^\r\n"\']+["\']?)', re.IGNORECASE), r'set auth-password ********'),
        (re.compile(r'(set\s+priv-password\s+(?:ENC\s+)?)(["\']?[^\r\n"\']+["\']?)', re.IGNORECASE), r'set priv-password ********'),
        (re.compile(r'(set\s+api-key\s+(?:ENC\s+)?)(["\']?[^\r\n"\']+["\']?)', re.IGNORECASE), r'set api-key ********'),
        (re.compile(r'(set\s+private-key\s+)([\s\S]*?)(?=end|next|\n\s*set|\n\s*edit|$)', re.IGNORECASE), r'set private-key ********\n'),
        
        # Juniper Junos secret patterns
        (re.compile(r'(encrypted-password\s+)(["\']?[^\s;]+["\']?)', re.IGNORECASE), r'\1"********"'),
        (re.compile(r'(plain-text-password\s+)(["\']?[^\s;]+["\']?)', re.IGNORECASE), r'\1"********"'),
        (re.compile(r'(authentication-key\s+)(["\']?[^\s;]+["\']?)', re.IGNORECASE), r'\1"********"'),
        (re.compile(r'(pre-shared-key\s+(?:ascii-text|hexadecimal)\s+)(["\']?[^\s;]+["\']?)', re.IGNORECASE), r'\1"********"'),
        (re.compile(r'(community\s+)(["\']?[^\s;{]+["\']?)', re.IGNORECASE), r'\1"********"'),
        (re.compile(r'(\bsecret\s+)(["\']?[^\s;]+["\']?)', re.IGNORECASE), r'\1"********"'),
        (re.compile(r'(md5\s+\d+\s+key\s+)(["\']?[^\s;]+["\']?)', re.IGNORECASE), r'\1"********"'),
        
        # Generic Private Key blocks (PEM)
        (re.compile(r'-----BEGIN\s+(?:RSA|DSA|EC|OPENSSH)?\s*PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA|DSA|EC|OPENSSH)?\s*PRIVATE\s+KEY-----', re.IGNORECASE), 
         '-----BEGIN PRIVATE KEY-----\n******** [REDACTED PRIVATE KEY] ********\n-----END PRIVATE KEY-----')
    ]

    @classmethod
    def sanitize_text(cls, raw_content: str) -> str:
        """
        Takes raw config file contents and returns a clean, fully redacted string.
        """
        if not raw_content:
            return ""
            
        sanitized = raw_content
        for pattern, replacement in cls.SECRET_PATTERNS:
            sanitized = pattern.sub(replacement, sanitized)
            
        return sanitized

    @classmethod
    def mask_evidence_string(cls, text: str) -> str:
        """
        Masks single-line or multi-line evidence output before returning in findings.
        """
        return cls.sanitize_text(text)

    @classmethod
    def extract_detected_snmp_communities(cls, raw_content: str) -> List[str]:
        """
        Helper to safely check if default community strings (like 'public' or 'private')
        are present in raw content without returning user's custom secrets.
        """
        defaults_found = []
        lower_content = raw_content.lower()
        
        # Check standard default community occurrences across Cisco, Juniper, and Fortinet
        has_public = (
            re.search(r'community\s+public\b', lower_content) or
            re.search(r'community-name\s+["\']?public["\']?', lower_content) or
            re.search(r'set\s+name\s+["\']?public["\']?', lower_content) or
            re.search(r'snmp-server\s+community\s+public\b', lower_content)
        )
        has_private = (
            re.search(r'community\s+private\b', lower_content) or
            re.search(r'community-name\s+["\']?private["\']?', lower_content) or
            re.search(r'set\s+name\s+["\']?private["\']?', lower_content) or
            re.search(r'snmp-server\s+community\s+private\b', lower_content)
        )
        
        if has_public:
            defaults_found.append("public")
        if has_private:
            defaults_found.append("private")
                
        return list(set(defaults_found))
