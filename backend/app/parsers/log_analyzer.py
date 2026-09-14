import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

from app.compliance.engine import RuleFindingResult
from app.security.sanitizer import SecuritySanitizer


@dataclass(frozen=True)
class LogAnalysis:
    hostname: str
    findings: List[RuleFindingResult]
    event_count: int
    confidence: float


_IP_PATTERN = r"(?:\d{1,3}\.){3}\d{1,3}"
_FAILED_AUTH = re.compile(
    r"(?:failed|failure|invalid|unsuccessful).{0,40}(?:login|logon|auth|password|credential)|"
    r"(?:login|logon|auth|password|credential).{0,40}(?:failed|failure|invalid|unsuccessful)",
    re.IGNORECASE,
)
_SUCCESS_AUTH = re.compile(
    r"(?:accepted|successful|success|logged in|login).{0,40}(?:login|logon|auth|password|credential)|"
    r"(?:login|logon|auth).{0,40}(?:accepted|successful|success)",
    re.IGNORECASE,
)
_SCAN = re.compile(
    r"(?:port scan|scan detected|nmap|masscan|syn flood|horizontal scan|vertical scan|many ports)",
    re.IGNORECASE,
)
_DENY = re.compile(r"(?:deny|denied|drop|dropped|blocked|rejected|firewall).{0,25}(?:src|source|ip|connection|packet)?", re.IGNORECASE)
_PRIVILEGE = re.compile(
    r"(?:privilege|elevat|sudo|su\s|root|administrator|admin).{0,35}(?:granted|success|escalat|login|command)|"
    r"(?:granted|success|escalat).{0,35}(?:privilege|root|administrator|admin)",
    re.IGNORECASE,
)
_CONFIG_CHANGE = re.compile(
    r"(?:configuration|config|policy|rule|startup-config).{0,35}(?:changed|modified|updated|committed|written)|"
    r"(?:changed|modified|updated|committed|written).{0,35}(?:configuration|config|policy|rule)",
    re.IGNORECASE,
)


def _evidence(line: str) -> str:
    sanitized = SecuritySanitizer.mask_evidence_string(" ".join(line.split()))
    return sanitized[:240]


def _source(line: str) -> Optional[str]:
    match = re.search(rf"(?:from|src(?:=|:)|source(?:=|:)|client(?:=|:))\s*({_IP_PATTERN})", line, re.IGNORECASE)
    if match:
        return match.group(1)
    ips = re.findall(_IP_PATTERN, line)
    return ips[0] if ips else None


def _finding(
    rule_id: str,
    title: str,
    severity: str,
    evidence: str,
    explanation: str,
    recommendation: str,
    confidence: float = 0.8,
) -> RuleFindingResult:
    return RuleFindingResult(
        rule_id=rule_id,
        title=title,
        category="Logging & Auditing",
        severity=severity,
        evidence=_evidence(evidence),
        explanation=explanation,
        recommendation=recommendation,
        nist_reference="NIST SP 800-92",
        iso27001_reference="A.8.15 Logging",
        confidence=confidence,
    )


def looks_like_log(filename: str, raw_text: str) -> bool:
    """Classify explicit log formats and common syslog/auth text without stealing config .txt files."""
    suffix = Path(filename).suffix.lower()
    if suffix in {".log", ".syslog", ".jsonl"}:
        return True
    sample = "\n".join(raw_text.splitlines()[:20])
    return bool(re.search(r"(?:\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}|%\w+-\d-|sshd\[\d+\]|CEF:\d+)", sample))


def analyze_log(raw_text: str, filename: str = "security.log") -> LogAnalysis:
    """Run explainable, bounded anomaly heuristics over text logs; no commands or network calls are made."""
    lines = raw_text.splitlines()
    failed_by_source: Counter[str] = Counter()
    failed_lines: List[str] = []
    successful_after_failure: List[str] = []
    scan_lines: List[str] = []
    deny_lines: List[str] = []
    privilege_lines: List[str] = []
    config_lines: List[str] = []
    seen_failed_sources = set()

    for line in lines:
        if _FAILED_AUTH.search(line):
            failed_lines.append(line)
            source = _source(line) or "unknown-source"
            failed_by_source[source] += 1
            seen_failed_sources.add(source)
        elif _SUCCESS_AUTH.search(line):
            source = _source(line)
            if source in seen_failed_sources:
                successful_after_failure.append(line)
        if _SCAN.search(line):
            scan_lines.append(line)
        if _DENY.search(line):
            deny_lines.append(line)
        if _PRIVILEGE.search(line):
            privilege_lines.append(line)
        if _CONFIG_CHANGE.search(line):
            config_lines.append(line)

    findings: List[RuleFindingResult] = []
    repeated_sources = [(source, count) for source, count in failed_by_source.items() if count >= 5]
    if repeated_sources:
        source, count = max(repeated_sources, key=lambda item: item[1])
        severity = "CRITICAL" if count >= 10 else "HIGH"
        findings.append(_finding(
            "LOG-AUTH-BRUTEFORCE",
            "Repeated Failed Authentication Attempts",
            severity,
            failed_lines[0],
            f"The log contains {count} failed authentication attempts associated with {source}. This is an indicator of password spraying or brute-force activity, not proof of compromise.",
            "Investigate the source and account scope, enforce rate limiting or lockout, require MFA where available, and rotate affected credentials.",
        ))
    if successful_after_failure:
        findings.append(_finding(
            "LOG-AUTH-SUCCESS-AFTER-FAIL",
            "Successful Authentication After Failed Attempts",
            "HIGH",
            successful_after_failure[0],
            "A successful authentication follows failed attempts from the same source in the supplied log sequence.",
            "Validate the user, source, device, and time window; revoke suspicious sessions and review authentication telemetry in the SIEM.",
        ))
    if scan_lines:
        findings.append(_finding(
            "LOG-NETWORK-SCAN",
            "Network Scanning Indicator Observed",
            "HIGH",
            scan_lines[0],
            "The log contains a port or host scanning indicator that may represent reconnaissance.",
            "Correlate with firewall, flow, and endpoint telemetry; restrict exposed services and block confirmed malicious sources.",
        ))
    if len(deny_lines) >= 10:
        findings.append(_finding(
            "LOG-FIREWALL-DENY-BURST",
            "Burst of Denied Network Activity",
            "MEDIUM",
            deny_lines[0],
            f"The log contains {len(deny_lines)} denied, dropped, or blocked events, which may indicate probing or a misconfigured client.",
            "Group events by source and destination, confirm expected traffic, and tune controls only after validating the threat context.",
        ))
    if privilege_lines:
        findings.append(_finding(
            "LOG-PRIVILEGE-ESCALATION",
            "Privileged Access Activity Observed",
            "HIGH",
            privilege_lines[0],
            "The log records administrative, root, or privilege-elevation activity that requires verification against an approved change or access request.",
            "Confirm the actor and change ticket, review commands and session origin, and disable or rotate unauthorized privileged access.",
        ))
    if config_lines:
        findings.append(_finding(
            "LOG-CONFIG-CHANGE",
            "Network Configuration Change Observed",
            "MEDIUM",
            config_lines[0],
            "The log records a configuration, policy, or rule change. Unexpected changes can indicate drift or unauthorized activity.",
            "Validate the change against the approved baseline, preserve the original event record, and re-run the configuration audit after remediation.",
        ))

    hostname = Path(filename).stem[:255] or "security-log"
    return LogAnalysis(hostname=hostname, findings=findings, event_count=len(lines), confidence=0.85)
