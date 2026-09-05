import pytest
from app.security.sanitizer import SecuritySanitizer

def test_cisco_secret_masking():
    raw_cisco = """
    enable secret SuperSecretEnablePass123
    enable password LegacyPass999
    username admin privilege 15 password 0 CleartextPass456
    snmp-server community secret_community RO
    crypto isakmp key VpnPskSecret address 1.2.3.4
    tacacs-server key TacacsSharedKey
    """
    sanitized = SecuritySanitizer.sanitize_text(raw_cisco)
    
    assert "SuperSecretEnablePass123" not in sanitized
    assert "LegacyPass999" not in sanitized
    assert "CleartextPass456" not in sanitized
    assert "secret_community" not in sanitized
    assert "VpnPskSecret" not in sanitized
    assert "TacacsSharedKey" not in sanitized
    assert "********" in sanitized

def test_fortinet_secret_masking():
    raw_forti = """
    config system admin
        edit "admin"
            set password ClearAdminPass123
        next
    end
    config vpn ipsec phase1-interface
        edit "TUNNEL1"
            set psksecret FortiPskSecret456
        next
    end
    config system snmp community
        edit 1
            set name "my_secret_snmp"
        next
    end
    """
    sanitized = SecuritySanitizer.sanitize_text(raw_forti)
    
    assert "ClearAdminPass123" not in sanitized
    assert "FortiPskSecret456" not in sanitized
    assert "my_secret_snmp" not in sanitized
    assert "********" in sanitized

def test_juniper_secret_masking():
    raw_junos = """
    system {
        root-authentication {
            plain-text-password "JuniperPlainPass123";
        }
    }
    snmp {
        community junos_secret_comm {
            authorization read-only;
        }
    }
    """
    sanitized = SecuritySanitizer.sanitize_text(raw_junos)
    
    assert "JuniperPlainPass123" not in sanitized
    assert "junos_secret_comm" not in sanitized
    assert "********" in sanitized

def test_default_community_detection_without_secret_leak():
    raw_text = "snmp-server community public RO\nsnmp-server community private RW"
    defaults = SecuritySanitizer.extract_detected_snmp_communities(raw_text)
    
    assert "public" in defaults
    assert "private" in defaults

if __name__ == "__main__":
    test_cisco_secret_masking()
    test_fortinet_secret_masking()
    test_juniper_secret_masking()
    test_default_community_detection_without_secret_leak()
    print("ALL SANITIZER PRIVACY TESTS PASSED (100% SECRET CONFINEMENT).")
