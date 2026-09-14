from pathlib import Path
import sys

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.parsers.log_analyzer import analyze_log, looks_like_log


def test_log_analyzer_detects_unusual_activity_without_secret_leakage():
    failed = "\n".join(
        f"Sep 14 10:0{i} sshd[1]: Failed password SuperSecret for admin from 192.0.2.44 port 22"
        for i in range(5)
    )
    denied = "\n".join(f"Sep 14 11:{i:02d} firewall: denied src=198.51.100.8" for i in range(10))
    raw = (
        failed
        + "\nSep 14 10:05 sshd[1]: Accepted password for admin from 192.0.2.44 port 22"
        + "\nSep 14 10:06 firewall: port scan detected from 198.51.100.8"
        + "\nSep 14 10:07 admin changed configuration"
        + "\n"
        + denied
    )

    result = analyze_log(raw, "edge-security.log")
    rule_ids = {finding.rule_id for finding in result.findings}

    assert looks_like_log("edge-security.log", raw)
    assert result.hostname == "edge-security"
    assert {
        "LOG-AUTH-BRUTEFORCE",
        "LOG-AUTH-SUCCESS-AFTER-FAIL",
        "LOG-NETWORK-SCAN",
        "LOG-FIREWALL-DENY-BURST",
        "LOG-CONFIG-CHANGE",
    } <= rule_ids
    assert all("SuperSecret" not in finding.evidence for finding in result.findings)


def test_benign_log_has_no_anomaly_findings():
    raw = "Sep 14 12:00 ntpd[1]: synchronized to time server 192.0.2.1"
    result = analyze_log(raw, "ntp.log")

    assert result.event_count == 1
    assert result.findings == []
