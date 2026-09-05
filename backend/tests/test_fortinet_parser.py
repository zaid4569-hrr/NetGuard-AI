from app.parsers.fortinet import FortinetParser

def test_fortinet_vulnerable_normalization():
    parser = FortinetParser()
    raw_cfg = """
    #config-version=FGT60E-6.4.2:opmode=0
    config system global
        set hostname "FW-Edge-01"
        set admintimeout 480
    end
    config system interface
        edit "port1"
            set allowaccess ping https ssh http telnet
        next
    end
    config system admin
        edit "admin"
            set password ClearPass123
        next
    end
    config system snmp community
        edit 1
            set name "public"
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
    norm = parser.parse(raw_cfg, "FW-Edge-01.conf")

    assert norm.metadata.hostname == "FW-Edge-01"
    assert norm.metadata.vendor == "Fortinet"
    assert norm.management.telnet_enabled is True
    assert norm.management.http_server_enabled is True
    assert norm.management.unrestricted_management_access is True
    assert norm.snmp.default_communities_found == ["public"]
    assert norm.access_control.any_any_permit_detected is True

def test_fortinet_hardened_normalization():
    parser = FortinetParser()
    raw_cfg = """
    #config-version=FGT100F-7.2.4:opmode=0
    config system global
        set hostname "FW-Core-02"
        set admintimeout 10
        set pre_login_banner enable
    end
    config system interface
        edit "port1"
            set allowaccess ping
        next
        edit "mgmt"
            set allowaccess https ssh
        next
    end
    config system admin
        edit "secops"
            set trusthost1 10.10.100.0 255.255.255.0
            set password ENC HardenedEncryptedPass
        next
    end
    config log syslogd setting
        set status enable
        set server "10.10.10.50"
    end
    config system ntp
        set ntpsync enable
        config ntpserver
            edit 1
                set server "10.10.10.10"
            next
        end
    end
    """
    norm = parser.parse(raw_cfg, "FW-Core-02.conf")

    assert norm.metadata.hostname == "FW-Core-02"
    assert norm.management.telnet_enabled is False
    assert norm.management.http_server_enabled is False
    assert norm.management.mgmt_acls_applied is True
    assert norm.logging.logging_enabled is True
    assert "10.10.10.50" in norm.logging.remote_syslog_servers
    assert norm.ntp.ntp_enabled is True

if __name__ == "__main__":
    test_fortinet_vulnerable_normalization()
    test_fortinet_hardened_normalization()
    print("ALL FORTINET PARSER NORMALIZATION TESTS PASSED.")
