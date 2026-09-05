import re
from typing import Dict, Any, Tuple

class VendorDetector:
    """
    Analyzes configuration syntax, headers, and keyword frequencies
    to determine the vendor and model with a confidence score.
    """

    CISCO_INDICATORS = [
        (re.compile(r'!\s*version\s+\d+\.\d+', re.IGNORECASE), 0.35),
        (re.compile(r'^\s*hostname\s+\S+', re.IGNORECASE | re.MULTILINE), 0.20),
        (re.compile(r'^\s*enable\s+(?:secret|password)', re.IGNORECASE | re.MULTILINE), 0.25),
        (re.compile(r'^\s*interface\s+(?:GigabitEthernet|FastEthernet|TenGigabitEthernet|Serial|Vlan|Loopback)', re.IGNORECASE | re.MULTILINE), 0.25),
        (re.compile(r'^\s*line\s+(?:vty|con|aux)\s+\d+', re.IGNORECASE | re.MULTILINE), 0.25),
        (re.compile(r'^\s*service\s+password-encryption', re.IGNORECASE | re.MULTILINE), 0.20),
        (re.compile(r'^\s*ip\s+access-list\s+(?:standard|extended)', re.IGNORECASE | re.MULTILINE), 0.25),
        (re.compile(r'^\s*crypto\s+(?:isakmp|ikev2|ipsec)', re.IGNORECASE | re.MULTILINE), 0.20),
        (re.compile(r'^\s*spanning-tree\s+', re.IGNORECASE | re.MULTILINE), 0.15),
        (re.compile(r'boot-start-marker|boot-end-marker', re.IGNORECASE), 0.25),
    ]

    FORTINET_INDICATORS = [
        (re.compile(r'#config-version=[A-Z0-9_-]+', re.IGNORECASE), 0.40),
        (re.compile(r'^\s*config\s+system\s+(?:global|interface|admin|dns|ntp)', re.IGNORECASE | re.MULTILINE), 0.35),
        (re.compile(r'^\s*config\s+firewall\s+(?:policy|address|service)', re.IGNORECASE | re.MULTILINE), 0.35),
        (re.compile(r'^\s*config\s+router\s+static', re.IGNORECASE | re.MULTILINE), 0.25),
        (re.compile(r'^\s*set\s+allowaccess\s+', re.IGNORECASE | re.MULTILINE), 0.25),
        (re.compile(r'^\s*edit\s+\d+\s*\n\s*set\s+', re.IGNORECASE | re.MULTILINE), 0.25),
        (re.compile(r'^\s*set\s+hostname\s+', re.IGNORECASE | re.MULTILINE), 0.20),
        (re.compile(r'^\s*set\s+vdom\s+', re.IGNORECASE | re.MULTILINE), 0.20),
        (re.compile(r'\bnext\s*\n\s*end\b', re.IGNORECASE), 0.25),
    ]

    JUNIPER_INDICATORS = [
        (re.compile(r'^\s*system\s*\{', re.IGNORECASE | re.MULTILINE), 0.30),
        (re.compile(r'^\s*interfaces\s*\{', re.IGNORECASE | re.MULTILINE), 0.25),
        (re.compile(r'^\s*security\s*\{', re.IGNORECASE | re.MULTILINE), 0.30),
        (re.compile(r'^\s*firewall\s*\{', re.IGNORECASE | re.MULTILINE), 0.25),
        (re.compile(r'^\s*root-authentication\s*\{', re.IGNORECASE | re.MULTILINE), 0.35),
        (re.compile(r'^\s*set\s+system\s+host-name\s+', re.IGNORECASE | re.MULTILINE), 0.35),
        (re.compile(r'^\s*set\s+system\s+services\s+', re.IGNORECASE | re.MULTILINE), 0.30),
        (re.compile(r'^\s*set\s+interfaces\s+ge-\d+/\d+/\d+', re.IGNORECASE | re.MULTILINE), 0.30),
        (re.compile(r'^\s*apply-groups\s+\[', re.IGNORECASE | re.MULTILINE), 0.25),
        (re.compile(r'## Last changed:', re.IGNORECASE), 0.25),
        (re.compile(r'host-name\s+[^;\s]+;', re.IGNORECASE), 0.25),
        (re.compile(r'^\s*services\s*\{', re.IGNORECASE | re.MULTILINE), 0.25),
        (re.compile(r'ge-\d+/\d+/\d+', re.IGNORECASE), 0.20),
    ]

    PALOALTO_INDICATORS = [
        (re.compile(r'<config\b', re.IGNORECASE), 0.40),
        (re.compile(r'<devices\b', re.IGNORECASE), 0.35),
        (re.compile(r'<security>\s*<rules>', re.IGNORECASE), 0.35),
        (re.compile(r'set\s+rulebase\s+security', re.IGNORECASE), 0.35),
        (re.compile(r'set\s+deviceconfig\s+system', re.IGNORECASE), 0.30),
        (re.compile(r'set\s+network\s+interface', re.IGNORECASE), 0.25),
        (re.compile(r'paloalto|pan-os', re.IGNORECASE), 0.30),
    ]

    MIKROTIK_INDICATORS = [
        (re.compile(r'^\s*/ip\s+(?:address|service|firewall|route)', re.IGNORECASE | re.MULTILINE), 0.40),
        (re.compile(r'^\s*/interface\s+(?:ethernet|bridge|wireless)', re.IGNORECASE | re.MULTILINE), 0.35),
        (re.compile(r'^\s*/system\s+(?:identity|routerboard|clock)', re.IGNORECASE | re.MULTILINE), 0.35),
        (re.compile(r'#.*by RouterOS', re.IGNORECASE), 0.45),
        (re.compile(r'^\s*/user\s+add', re.IGNORECASE | re.MULTILINE), 0.30),
    ]

    ARUBA_INDICATORS = [
        (re.compile(r'^\s*aruba\s+group', re.IGNORECASE | re.MULTILINE), 0.40),
        (re.compile(r'^\s*wlan\s+virtual-ap', re.IGNORECASE | re.MULTILINE), 0.35),
        (re.compile(r'^\s*crypto-profile', re.IGNORECASE | re.MULTILINE), 0.30),
        (re.compile(r'ArubaOS|HPE Aruba', re.IGNORECASE), 0.40),
        (re.compile(r'^\s*vlan\s+\d+\s+name\s+', re.IGNORECASE | re.MULTILINE), 0.25),
    ]

    @classmethod
    def detect(cls, raw_content: str) -> Tuple[str, float]:
        """
        Detects vendor and returns (vendor_name, confidence).
        Supported vendors: 'Cisco', 'Fortinet', 'Juniper', 'Palo Alto', 'MikroTik', 'Aruba', 'Unknown'
        """
        if not raw_content or not raw_content.strip():
            return "Unknown", 0.0

        cisco_score = min(1.0, sum(weight for pattern, weight in cls.CISCO_INDICATORS if pattern.search(raw_content)))
        fortinet_score = min(1.0, sum(weight for pattern, weight in cls.FORTINET_INDICATORS if pattern.search(raw_content)))
        juniper_score = min(1.0, sum(weight for pattern, weight in cls.JUNIPER_INDICATORS if pattern.search(raw_content)))
        paloalto_score = min(1.0, sum(weight for pattern, weight in cls.PALOALTO_INDICATORS if pattern.search(raw_content)))
        mikrotik_score = min(1.0, sum(weight for pattern, weight in cls.MIKROTIK_INDICATORS if pattern.search(raw_content)))
        aruba_score = min(1.0, sum(weight for pattern, weight in cls.ARUBA_INDICATORS if pattern.search(raw_content)))

        scores = {
            "Cisco": cisco_score,
            "Fortinet": fortinet_score,
            "Juniper": juniper_score,
            "Palo Alto": paloalto_score,
            "MikroTik": mikrotik_score,
            "Aruba": aruba_score
        }

        best_vendor, best_score = max(scores.items(), key=lambda x: x[1])

        if best_score < 0.25:
            return "Unknown", float(round(best_score, 2))

        return best_vendor, float(round(best_score, 2))
