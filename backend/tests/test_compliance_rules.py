from app.compliance.engine import ComplianceEngine
from app.parsers.cisco import CiscoParser
from app.parsers.fortinet import FortinetParser
from app.parsers.juniper import JuniperParser
import app.compliance.rules

def test_cisco_rules_audit():
    cisco_vuln = """
    hostname R1
    enable password PlainPass
    snmp-server community public RO
    crypto isakmp policy 10
     encr 3des
    line vty 0 4
     transport input telnet
    """
    parser = CiscoParser()
    norm = parser.parse(cisco_vuln)
    findings = ComplianceEngine.run_audit(norm)
    
    rule_ids = {f.rule_id for f in findings}
    assert "NET-MGMT-001" in rule_ids  # Telnet enabled
    assert "NET-AUTH-001" in rule_ids  # Plaintext password
    assert "NET-SNMP-002" in rule_ids  # Default public community
    assert "NET-CRYPTO-001" in rule_ids # Weak 3DES cipher
    assert "NET-NTP-001" in rule_ids   # NTP missing

def test_fortinet_rules_audit():
    forti_vuln = """
    config system global
        set hostname "FW-01"
    end
    config system interface
        edit "port1"
            set allowaccess telnet http
        next
    end
    config firewall policy
        edit 1
            set srcaddr "all"
            set dstaddr "all"
            set action accept
            set service "ALL"
        next
    end
    """
    parser = FortinetParser()
    norm = parser.parse(forti_vuln)
    findings = ComplianceEngine.run_audit(norm)
    
    rule_ids = {f.rule_id for f in findings}
    assert "NET-MGMT-001" in rule_ids  # Telnet enabled
    assert "NET-MGMT-003" in rule_ids  # HTTP enabled
    assert "NET-ACL-001" in rule_ids   # Permit any any policy

def test_juniper_rules_audit():
    juniper_vuln = """
    system {
        host-name SRX-01;
        services {
            ssh {
                root-login allow;
            }
            telnet;
        }
    }
    snmp {
        community public {
            authorization read-only;
        }
    }
    """
    parser = JuniperParser()
    norm = parser.parse(juniper_vuln)
    findings = ComplianceEngine.run_audit(norm)

    rule_ids = {f.rule_id for f in findings}
    assert "NET-MGMT-001" in rule_ids  # Telnet enabled
    assert "NET-AUTH-005" in rule_ids  # Root remote login allowed
    assert "NET-SNMP-002" in rule_ids  # Default community public

if __name__ == "__main__":
    test_cisco_rules_audit()
    test_fortinet_rules_audit()
    test_juniper_rules_audit()
    print("ALL COMPLIANCE RULES AUDIT TESTS PASSED.")
