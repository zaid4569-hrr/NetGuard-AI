from app.parsers.juniper import JuniperParser

def test_juniper_vulnerable_normalization():
    parser = JuniperParser()
    raw_cfg = """
    system {
        host-name JunOS-SRX-01;
        root-authentication {
            plain-text-password "JuniperPlainPass";
        }
        services {
            ssh {
                root-login allow;
            }
            telnet;
            web-management {
                http;
            }
        }
    }
    snmp {
        community public {
            authorization read-only;
        }
    }
    """
    norm = parser.parse(raw_cfg, "JunOS-SRX-01.conf")

    assert norm.metadata.hostname == "JunOS-SRX-01"
    assert norm.metadata.vendor == "Juniper"
    assert norm.management.telnet_enabled is True
    assert norm.management.http_server_enabled is True
    assert norm.authentication.root_remote_login_allowed is True
    assert norm.authentication.plaintext_passwords_detected is True
    assert norm.snmp.default_communities_found == ["public"]

def test_juniper_hardened_normalization():
    parser = JuniperParser()
    raw_cfg = """
    system {
        host-name JunOS-Core-02;
        root-authentication {
            encrypted-password "$6$vLq8N9...StrongSha512";
        }
        services {
            ssh {
                protocol-version v2;
                root-login deny;
            }
            web-management {
                https;
            }
        }
        syslog {
            host 10.10.10.50 {
                any informational;
            }
        }
        ntp {
            server 10.10.10.1;
        }
    }
    interfaces {
        lo0 {
            unit 0 {
                family inet {
                    filter {
                        input PROTECT_RE;
                    }
                }
            }
        }
    }
    """
    norm = parser.parse(raw_cfg, "JunOS-Core-02.conf")

    assert norm.metadata.hostname == "JunOS-Core-02"
    assert norm.management.telnet_enabled is False
    assert norm.management.ssh_version == 2
    assert norm.management.mgmt_acls_applied is True
    assert norm.authentication.root_remote_login_allowed is False
    assert norm.logging.logging_enabled is True
    assert "10.10.10.50" in norm.logging.remote_syslog_servers
    assert norm.ntp.ntp_enabled is True

if __name__ == "__main__":
    test_juniper_vulnerable_normalization()
    test_juniper_hardened_normalization()
    print("ALL JUNIPER PARSER NORMALIZATION TESTS PASSED.")
