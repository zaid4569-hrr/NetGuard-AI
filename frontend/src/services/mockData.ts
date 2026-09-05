import { Assessment, ComplianceRule } from '../types';

export const MOCK_ASSESSMENT: Assessment = {
  id: "demo-assessment-8823f",
  name: "Smart India Hackathon — Multi-Vendor Demo Audit",
  created_at: new Date().toISOString(),
  total_devices: 4,
  overall_score: 67.4,
  critical_count: 3,
  high_count: 8,
  medium_count: 12,
  low_count: 5,
  info_count: 2,
  executive_summary: "NetGuard AI conducted a multi-vendor security audit across 4 network device(s), resulting in an overall security posture score of 67.4/100. The environment is under elevated risk due to multiple high-impact compliance violations across Cisco, Fortinet, and Juniper tiers. AI Threat Graph Correlation detected 2 multi-stage attack vector(s), notably: 'Cleartext Management Sniffing & Administrative Takeover'. Urgent remediation is recommended to eliminate cleartext management transports and default credentials.",
  ai_insights: {
    executive_summary: "NetGuard AI conducted a multi-vendor security audit across 4 network device(s), resulting in an overall security posture score of 67.4/100. The environment is under elevated risk due to multiple high-impact compliance violations.",
    top_critical_risks: [
      "Dangerous 'Permit Any Any' Ingress Policy Detected (CRITICAL) — Impact Score: 240",
      "Unrestricted Management Plane Access (CRITICAL) — Impact Score: 210",
      "Default SNMP Community String Detected (CRITICAL) — Impact Score: 180",
      "Telnet Remote Management Enabled (HIGH) — Impact Score: 160",
      "Cleartext Password Storage (CRITICAL) — Impact Score: 140"
    ],
    correlated_attack_chains: [
      {
        attack_chain_title: "Cleartext Management Sniffing & Administrative Takeover",
        severity: "CRITICAL",
        affected_devices: ["Cisco-Core-Router-01", "FortiGate-Perimeter-FW01"],
        description: "The device runs unencrypted Telnet management while simultaneously lacking an access-control list on administrative interfaces. Any network adversary on the segment can sniff credentials and execute commands.",
        remediation_priority: "P0 - Immediate Action Required",
        action_steps: [
          "Disable Telnet transport globally and enforce SSHv2.",
          "Apply an access-class/trusthost filter restricting management ports to the SOC bastion host subnet.",
          "Rotate all administrative passwords immediately."
        ]
      },
      {
        attack_chain_title: "Perimeter Firewall Bypass & Undetected Lateral Movement",
        severity: "CRITICAL",
        affected_devices: ["FortiGate-Perimeter-FW01", "JunOS-Edge-Router-01"],
        description: "An overly permissive 'permit any any' ingress policy is active, while system logging is disabled. Attackers can traverse the perimeter freely without leaving forensic audit trails.",
        remediation_priority: "P0 - Immediate Action Required",
        action_steps: [
          "Revoke broad permit any any firewall rules and replace with least-privilege port filters.",
          "Enable centralized remote syslog forwarding to the enterprise SIEM immediately.",
          "Review active connection tables for unauthorized ingress sessions."
        ]
      }
    ],
    remediation_roadmap: [
      "Phase 1 (Immediate / 24 Hours): Eliminate 'permit any any' ingress rules, rotate default SNMP communities ('public'/'private'), and apply management ACLs.",
      "Phase 2 (Short-Term / 7 Days): Disable Telnet in favor of SSHv2, enforce SHA-256 password hashing, and terminate DES/3DES VPN crypto proposals.",
      "Phase 3 (Medium-Term / 30 Days): Connect all devices to centralized remote Syslog/SIEM collectors, enable authenticated NTP, and disable CDP/LLDP on untrusted edge links."
    ]
  },
  category_scores: [
    { category: "Authentication", score: 62.5, findings_count: 5 },
    { category: "Remote Management", score: 54.0, findings_count: 6 },
    { category: "Logging & Auditing", score: 58.0, findings_count: 4 },
    { category: "Time Synchronization", score: 45.0, findings_count: 3 },
    { category: "SNMP Security", score: 40.0, findings_count: 4 },
    { category: "Access Control & Firewall", score: 50.0, findings_count: 3 },
    { category: "Cryptography", score: 65.0, findings_count: 3 },
    { category: "Network Services", score: 78.0, findings_count: 2 }
  ],
  devices: [
    {
      id: "dev-cisco-01",
      assessment_id: "demo-assessment-8823f",
      filename: "cisco_router_vulnerable.cfg",
      hostname: "Cisco-Core-Router-01",
      vendor: "Cisco",
      vendor_confidence: 0.98,
      os_version: "IOS 15.4",
      device_type: "Router",
      security_score: 48.0,
      critical_count: 2,
      high_count: 4,
      medium_count: 3,
      low_count: 2,
      info_count: 1
    },
    {
      id: "dev-fortinet-01",
      assessment_id: "demo-assessment-8823f",
      filename: "fortigate_fw_vulnerable.conf",
      hostname: "FortiGate-Perimeter-FW01",
      vendor: "Fortinet",
      vendor_confidence: 0.99,
      os_version: "FortiOS 6.4.2",
      device_type: "Firewall",
      security_score: 52.0,
      critical_count: 1,
      high_count: 3,
      medium_count: 4,
      low_count: 1,
      info_count: 0
    },
    {
      id: "dev-juniper-01",
      assessment_id: "demo-assessment-8823f",
      filename: "juniper_srx_vulnerable.conf",
      hostname: "JunOS-Edge-Router-01",
      vendor: "Juniper",
      vendor_confidence: 0.99,
      os_version: "Junos OS 18.4R1",
      device_type: "Firewall / Router",
      security_score: 56.0,
      critical_count: 0,
      high_count: 3,
      medium_count: 4,
      low_count: 1,
      info_count: 1
    },
    {
      id: "dev-cisco-02",
      assessment_id: "demo-assessment-8823f",
      filename: "cisco_switch_hardened.cfg",
      hostname: "Cisco-Dist-Switch-02",
      vendor: "Cisco",
      vendor_confidence: 0.98,
      os_version: "IOS-XE 16.9",
      device_type: "Switch",
      security_score: 96.0,
      critical_count: 0,
      high_count: 0,
      medium_count: 1,
      low_count: 1,
      info_count: 0
    }
  ],
  findings: [
    {
      id: "find-01",
      assessment_id: "demo-assessment-8823f",
      device_id: "dev-cisco-01",
      rule_id: "NET-MGMT-001",
      title: "Telnet Remote Management Enabled",
      category: "Remote Management",
      severity: "HIGH",
      evidence: "transport input telnet detected on line vty 0 4",
      explanation: "Unencrypted Telnet management allows adversary packet sniffing, credential harvesting, and man-in-the-middle attacks.",
      recommendation: "Disable Telnet daemon/transport and enforce encrypted SSHv2 for all administrative access.",
      remediation_script: "line vty 0 15\n no transport input telnet\n transport input ssh",
      cis_reference: "CIS Benchmark 1.1.1",
      nist_reference: "NIST SP 800-53 AC-17",
      iso27001_reference: "ISO/IEC 27001 A.13.1.1",
      confidence: 1.0
    },
    {
      id: "find-02",
      assessment_id: "demo-assessment-8823f",
      device_id: "dev-cisco-01",
      rule_id: "NET-ACL-001",
      title: "Dangerous 'Permit Any Any' Ingress Policy Detected",
      category: "Access Control & Firewall",
      severity: "CRITICAL",
      evidence: "ip access-list extended INGRESS_PERIMETER_FILTER permit ip any any",
      explanation: "Unrestricted permit rules nullify firewall protection and expose internal subnets to unauthorized external access.",
      recommendation: "Replace broad 'any any' permit rules with strict least-privilege source/destination IP prefixes.",
      remediation_script: "no ip access-list extended INGRESS_PERIMETER_FILTER\nip access-list extended INGRESS_FILTER\n permit tcp any host 203.0.113.1 eq 443",
      cis_reference: "CIS Benchmark 1.6.1",
      nist_reference: "NIST SP 800-53 AC-4",
      iso27001_reference: "ISO/IEC 27001 A.13.1.1",
      confidence: 1.0
    },
    {
      id: "find-03",
      assessment_id: "demo-assessment-8823f",
      device_id: "dev-cisco-01",
      rule_id: "NET-SNMP-002",
      title: "Default SNMP Community String Detected ('public' or 'private')",
      category: "SNMP Security",
      severity: "CRITICAL",
      evidence: "Default community string(s) identified: public, private",
      explanation: "Default community strings are scanned continuously by automated worms and attackers to perform network reconnaissance and device profiling.",
      recommendation: "Remove default community strings immediately and replace with complex non-dictionary strings or SNMPv3.",
      remediation_script: "no snmp-server community public\nno snmp-server community private\nsnmp-server group SECGROUP v3 priv",
      cis_reference: "CIS Benchmark 1.5.2",
      nist_reference: "NIST SP 800-53 IA-5",
      iso27001_reference: "ISO/IEC 27001 A.9.4.3",
      confidence: 1.0
    },
    {
      id: "find-04",
      assessment_id: "demo-assessment-8823f",
      device_id: "dev-fortinet-01",
      rule_id: "NET-ACL-002",
      title: "Unrestricted Management Plane Access (Missing Management ACL)",
      category: "Access Control & Firewall",
      severity: "CRITICAL",
      evidence: "No trusthost or restricted management interface filter applied on admin profile",
      explanation: "Exposing administrative login prompts to entire networks exposes the core infrastructure to brute-force and zero-day exploitation.",
      recommendation: "Bind an ingress access control list restricting administrative access to dedicated bastion host subnets.",
      remediation_script: "config system admin\n edit admin\n set trusthost1 10.10.100.0 255.255.255.0\n next\nend",
      cis_reference: "CIS Benchmark 1.6.2",
      nist_reference: "NIST SP 800-53 AC-17",
      iso27001_reference: "ISO/IEC 27001 A.13.1.1",
      confidence: 1.0
    }
  ]
};

export const MOCK_RULES: ComplianceRule[] = [
  {
    rule_id: "NET-MGMT-001",
    title: "Telnet Remote Management Enabled",
    category: "Remote Management",
    severity: "HIGH",
    description: "Telnet transmits all management credentials, commands, and session data in cleartext over the network.",
    remediation: "Disable Telnet daemon/transport and enforce encrypted SSHv2 for all administrative access.",
    supported_vendors: ["Cisco", "Fortinet", "Juniper"],
    cis_benchmark_ref: "CIS Benchmark 1.1.1",
    nist_ref: "NIST SP 800-53 AC-17",
    iso27001_ref: "ISO/IEC 27001 A.13.1.1"
  },
  {
    rule_id: "NET-AUTH-001",
    title: "Cleartext Password Storage or Missing Password Encryption Service",
    category: "Authentication",
    severity: "CRITICAL",
    description: "User accounts or enable passwords are stored in cleartext, or reversible Type 0 / Type 7 weak hashing is active.",
    remediation: "Enable global service password encryption and replace legacy passwords with strong salted hashes.",
    supported_vendors: ["Cisco", "Fortinet", "Juniper"],
    cis_benchmark_ref: "CIS Benchmark 1.2.1",
    nist_ref: "NIST SP 800-53 IA-5",
    iso27001_ref: "ISO/IEC 27001 A.9.4.3"
  },
  {
    rule_id: "NET-ACL-001",
    title: "Dangerous 'Permit Any Any' Ingress Policy Detected",
    category: "Access Control & Firewall",
    severity: "CRITICAL",
    description: "Firewall filter or access control list contains an unrestricted permit rule allowing all traffic from any source to any destination.",
    remediation: "Replace broad 'any any' permit rules with strict least-privilege source/destination IP prefixes.",
    supported_vendors: ["Cisco", "Fortinet", "Juniper"],
    cis_benchmark_ref: "CIS Benchmark 1.6.1",
    nist_ref: "NIST SP 800-53 AC-4",
    iso27001_ref: "ISO/IEC 27001 A.13.1.1"
  },
  {
    rule_id: "NET-SNMP-002",
    title: "Default SNMP Community String Detected ('public' or 'private')",
    category: "SNMP Security",
    severity: "CRITICAL",
    description: "The device is using standard factory default SNMP community strings ('public' or 'private').",
    remediation: "Remove default community strings immediately and replace with complex non-dictionary strings or SNMPv3.",
    supported_vendors: ["Cisco", "Fortinet", "Juniper"],
    cis_benchmark_ref: "CIS Benchmark 1.5.2",
    nist_ref: "NIST SP 800-53 IA-5",
    iso27001_ref: "ISO/IEC 27001 A.9.4.3"
  }
];
