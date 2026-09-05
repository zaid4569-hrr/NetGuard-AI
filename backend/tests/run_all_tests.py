import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

def run_all():
    print("=" * 70)
    print("NETGUARD AI — COMPREHENSIVE AUTOMATED VERIFICATION SUITE")
    print("=" * 70)

    from tests.test_sanitizer import (
        test_cisco_secret_masking, test_fortinet_secret_masking,
        test_juniper_secret_masking, test_default_community_detection_without_secret_leak
    )
    from tests.test_detector import (
        test_cisco_detection, test_fortinet_detection,
        test_juniper_detection, test_unknown_detection
    )
    from tests.test_cisco_parser import (
        test_cisco_vulnerable_normalization, test_cisco_hardened_normalization
    )
    from tests.test_fortinet_parser import (
        test_fortinet_vulnerable_normalization, test_fortinet_hardened_normalization
    )
    from tests.test_juniper_parser import (
        test_juniper_vulnerable_normalization, test_juniper_hardened_normalization
    )
    from tests.test_compliance_rules import (
        test_cisco_rules_audit, test_fortinet_rules_audit, test_juniper_rules_audit
    )
    from tests.test_scoring import (
        test_scoring_deduction, test_clean_device_score
    )
    from tests.test_ai_correlation import (
        test_ai_attack_chain_correlation, test_ai_executive_summarizer
    )

    tests = [
        ("Secret Sanitizer & Zero-Leakage (Cisco)", test_cisco_secret_masking),
        ("Secret Sanitizer & Zero-Leakage (Fortinet)", test_fortinet_secret_masking),
        ("Secret Sanitizer & Zero-Leakage (Juniper)", test_juniper_secret_masking),
        ("Safe SNMP Community Discovery", test_default_community_detection_without_secret_leak),
        ("Vendor Detection (Cisco)", test_cisco_detection),
        ("Vendor Detection (Fortinet)", test_fortinet_detection),
        ("Vendor Detection (Juniper)", test_juniper_detection),
        ("Vendor Detection (Unknown)", test_unknown_detection),
        ("Cisco Parser Normalization (Vulnerable)", test_cisco_vulnerable_normalization),
        ("Cisco Parser Normalization (Hardened)", test_cisco_hardened_normalization),
        ("Fortinet Parser Normalization (Vulnerable)", test_fortinet_vulnerable_normalization),
        ("Fortinet Parser Normalization (Hardened)", test_fortinet_hardened_normalization),
        ("Juniper Parser Normalization (Vulnerable)", test_juniper_vulnerable_normalization),
        ("Juniper Parser Normalization (Hardened)", test_juniper_hardened_normalization),
        ("Compliance Rule Engine (Cisco Audit)", test_cisco_rules_audit),
        ("Compliance Rule Engine (Fortinet Audit)", test_fortinet_rules_audit),
        ("Compliance Rule Engine (Juniper Audit)", test_juniper_rules_audit),
        ("Mathematical Scoring Deduction Bounds", test_scoring_deduction),
        ("Clean Baseline 100% Score Test", test_clean_device_score),
        ("AI Attack Graph Threat Correlation", test_ai_attack_chain_correlation),
        ("AI NLP Executive Summarizer", test_ai_executive_summarizer),
    ]

    passed = 0
    failed = 0

    for name, test_func in tests:
        try:
            test_func()
            print(f" [PASS] {name}")
            passed += 1
        except Exception as e:
            print(f" [FAIL] {name}: {str(e)}")
            failed += 1

    print("-" * 70)
    print(f"TOTAL: {len(tests)} | PASSED: {passed} | FAILED: {failed}")
    if failed == 0:
        print("ALL VERIFICATION SUITE CHECKS COMPLETED SUCCESSFULLY (100% PASS).")
    print("=" * 70)

if __name__ == "__main__":
    run_all()
