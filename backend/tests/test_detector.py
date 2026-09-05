import pytest
from app.parsers.detector import VendorDetector

def test_cisco_detection():
    cisco_sample = """
    ! version 15.4
    hostname Router-01
    enable secret ********
    line vty 0 4
     transport input ssh
    """
    vendor, conf = VendorDetector.detect(cisco_sample)
    assert vendor == "Cisco"
    assert conf >= 0.70

def test_fortinet_detection():
    fortinet_sample = """
    #config-version=FGT60E-6.4.2:opmode=0
    config system global
        set hostname "FW-01"
    end
    config system interface
        edit "port1"
            set allowaccess ping https ssh
        next
    end
    """
    vendor, conf = VendorDetector.detect(fortinet_sample)
    assert vendor == "Fortinet"
    assert conf >= 0.70

def test_juniper_detection():
    juniper_sample = """
    system {
        host-name SRX-01;
        services {
            ssh;
        }
    }
    interfaces {
        ge-0/0/0 {
            unit 0;
        }
    }
    """
    vendor, conf = VendorDetector.detect(juniper_sample)
    assert vendor == "Juniper"
    assert conf >= 0.70

def test_unknown_detection():
    random_text = "This is just a random text document without network syntax."
    vendor, conf = VendorDetector.detect(random_text)
    assert vendor == "Unknown"
    assert conf < 0.25

if __name__ == "__main__":
    test_cisco_detection()
    test_fortinet_detection()
    test_juniper_detection()
    test_unknown_detection()
    print("ALL VENDOR DETECTION TESTS PASSED.")
