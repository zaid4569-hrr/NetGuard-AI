# NetGuard AI — System Architecture Deep Dive

## High-Level Pipeline
NetGuard AI implements a zero-egress, local-first compliance audit pipeline:

```
[Raw Config Files (.cfg/.conf)]
           │
           ▼
[SecuritySanitizer] (In-memory Regex & High-Entropy Redaction of Passwords, Keys, PSKs, SNMP communities)
           │
           ▼
[VendorDetector] (Grammar & Token Analysis: Cisco, Fortinet, Juniper with confidence score)
           │
           ▼
[Vendor Parser Layer] (CiscoParser / FortinetParser / JuniperParser AST Generation)
           │
           ▼
[Normalized Security Model] (Canonical NormalizedDeviceConfig Pydantic Schema)
           │
           ▼
[ComplianceEngine] (25+ Deterministic Rules mapped to CIS / NIST / ISO-27001)
           │
           ├──────────────────────────────┐
           ▼                              ▼
[ScoringEngine]               [AIThreatCorrelator]
(0-100 Score & Category)     (Multi-stage Attack Chains)
           │                              │
           └──────────────┬───────────────┘
                          ▼
              [AISummarizer & Prioritizer]
              (Plain-English Briefing & Roadmap)
                          │
           ┌──────────────┴──────────────┐
           ▼                             ▼
   [FastAPI REST API]            [ReportLab PDF Engine]
   - /api/assessment             - Streamlined Compliance PDF
   - /api/devices
           │
           ▼
[React 18 / Tailwind Dashboard]
(Interactive SOC Gauge, Donut Charts, Device Inspector)
```

## Privacy First Guarantee
1. All analysis is completed within the local host memory.
2. Sensitive strings (Type 7 / 0 / 5 passwords, enable secrets, VPN pre-shared keys, SNMP community strings) are masked to `********` before normalization.
3. Evidence strings stored in SQLite and exported in PDFs are strictly sanitization-filtered.
