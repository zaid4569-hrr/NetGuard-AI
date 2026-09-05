from app.parsers.cisco import CiscoParser

def test_cisco_vulnerable_normalization():
    parser = CiscoParser()
    raw_cfg = """
    hostname Core-R1
    version 15.4
    enable password ClearPass123
    username admin privilege 15 password 0 AdminPass123
    snmp-server community public RO
    crypto isakmp policy 10
     encr 3des
     hash md5
     group 2
    ip access-list extended INGRESS
     permit ip any any
    line vty 0 4
     transport input telnet
    """
    norm = parser.parse(raw_cfg, "Core-R1.cfg")

    assert norm.metadata.hostname == "Core-R1"
    assert norm.metadata.vendor == "Cisco"
    assert norm.management.telnet_enabled is True
    assert norm.management.ssh_enabled is False
    assert norm.management.unrestricted_management_access is True
    assert norm.authentication.plaintext_passwords_detected is True
    assert norm.snmp.default_communities_found == ["public"]
    assert norm.access_control.any_any_permit_detected is True
    assert "3DES/DES in ISAKMP/IPsec" in norm.cryptography.weak_ciphers_used
    assert 2 in norm.cryptography.weak_dh_groups_used

def test_cisco_hardened_normalization():
    parser = CiscoParser()
    raw_cfg = """
    hostname Dist-Sw1
    version 16.9
    service password-encryption
    enable algorithm-type sha256 secret 8 $8$SecPass
    aaa new-model
    ip ssh version 2
    ntp server 10.10.10.1
    ntp authenticate
    logging host 10.10.10.50
    snmp-server group SEC v3 priv
    ip access-list standard MGMT_ACL
     permit 10.0.0.0 0.255.255.255
    line vty 0 15
     transport input ssh
     access-class MGMT_ACL in
     exec-timeout 10 0
    """
    norm = parser.parse(raw_cfg, "Dist-Sw1.cfg")

    assert norm.metadata.hostname == "Dist-Sw1"
    assert norm.management.ssh_enabled is True
    assert norm.management.ssh_version == 2
    assert norm.management.telnet_enabled is False
    assert norm.management.mgmt_acls_applied is True
    assert norm.management.session_timeout_mins == 10
    assert norm.authentication.aaa_enabled is True
    assert norm.ntp.ntp_enabled is True
    assert "10.10.10.50" in norm.logging.remote_syslog_servers

if __name__ == "__main__":
    test_cisco_vulnerable_normalization()
    test_cisco_hardened_normalization()
    print("ALL CISCO PARSER NORMALIZATION TESTS PASSED.")
