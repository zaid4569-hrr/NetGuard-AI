# NetGuard AI — Privacy-Preserving Multi-Vendor Network Security Compliance Auditor

[![Smart India Hackathon](https://img.shields.io/badge/Smart%20India%20Hackathon-Cybersecurity-blue.svg)](https://sih.gov.in)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4%2B-38B2AC.svg)](https://tailwindcss.com/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local%20Execution-emerald.svg)](#privacy-model)

> **NetGuard AI** is a privacy-preserving, local-first, AI-driven multi-vendor network security compliance auditor that transforms heterogeneous network configurations into a unified security assessment, identifies vulnerabilities and policy violations, prioritizes risks, and provides actionable remediation without exposing sensitive network configuration data.

---

## 📌 Problem Statement & Context
Modern enterprise network infrastructures are heterogeneous, consisting of routers, switches, and firewalls from multiple vendors (**Cisco**, **Fortinet**, **Juniper**, etc.). Auditing these configurations manually against security benchmarks (**CIS Benchmarks**, **NIST CSF**, **ISO/IEC 27001**) is error-prone and time-consuming. Furthermore, existing cloud-based compliance tools require uploading sensitive configuration files containing plaintext passwords, pre-shared keys, and internal topology maps to remote servers—violating enterprise data confidentiality.

### Our Solution
**NetGuard AI** implements a **100% local-first, zero-egress architecture**. All configuration parsing, vendor autodetection, credential sanitization, deterministic rule auditing, AI threat graph correlation, and PDF report generation occur strictly on the user's local machine.

---

## 🚀 Key Features

- **Multi-Vendor Support**: Native AST and block-syntax parsing for **Cisco IOS/IOS-XE**, **Fortinet FortiGate**, and **Juniper Junos** using an extensible adapter pattern.
- **Privacy-First Zero-Egress Engine**: Built-in deterministic regex & high-entropy secret masking that redacts passwords, hashes, enable secrets, VPN pre-shared keys, and SNMP communities in memory.
- **Canonical Normalized Security Model**: Unifies disparate vendor configuration syntaxes into a strongly-typed, standardized Pydantic data model.
- **25+ Deterministic Compliance Rules**: Evaluates hardening baselines across 8 security domains mapped to **CIS Benchmarks**, **NIST SP 800-53**, and **ISO/IEC 27001**.
- **Transparent Mathematical Scoring**: Clear deduction-based scoring algorithm ($0-100$) with category breakdown and transparent point derivation.
- **AI Threat Graph Correlation**: Deterministic multi-stage attack chain detection (e.g. *Telnet Enabled + Weak Auth + Unrestricted Management = Remote Takeover Vector*).
- **Offline AI Executive Briefings**: Natural Language executive summaries and actionable 3-phase remediation roadmaps operating completely offline.
- **Actionable CLI Fix Generator**: Direct, copy-and-paste vendor-specific remediation commands for every detected issue.
- **Enterprise PDF Audit Reports**: High-resolution audit report export using ReportLab with executive metrics, compliance badges, and zero secret leakage.
- **Modern SOC Cybersecurity Dashboard**: React 18, Tailwind CSS, Lucide icons, and Recharts interactive visualizations.

---

## 🏗️ System Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │            Web Dashboard (React / Vite / TS)           │
                    │  - Drag & Drop Upload      - Device Detail Views       │
                    │  - Real-time Progress Bar  - PDF Report Downloader     │
                    │  - Interactive SOC Charts  - Remediation Action Center │
                    └───────────────────────────┬────────────────────────────┘
                                                │ REST API
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │               Local FastAPI Backend Layer              │
                    │  - /api/assessment        - /api/rules                 │
                    │  - /api/devices           - /api/report/pdf            │
                    └───────────────┬─────────────────────────┬──────────────┘
                                    │                         │
            ┌───────────────────────┴──────────┐   ┌──────────┴───────────────┐
            │   Configuration Sanitization     │   │      SQLite Local DB     │
            │   - Regex credential masker      │   │  - Assessment metadata   │
            │   - Entropy secret detector      │   │  - Device scores         │
            │   - In-memory ephemeral buffer   │   │  - Findings & metrics    │
            └───────────────────────┬──────────┘   └──────────────────────────┘
                                    │ (Sanitized Text Only)
                                    ▼
                    ┌───────────────────────────────────┐
                    │      Vendor Detection Engine      │
                    │ - Syntax pattern & token analyzer │
                    │ - Vendor + Confidence score (0-1) │
                    └───────────────────┬───────────────┘
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
  ┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
  │    Cisco Parser    │     │  Fortinet Parser   │     │   Juniper Parser   │
  │ (IOS / IOS-XE AST) │     │ (FortiGate Blocks) │     │ (Junos Curly/Set)  │
  └──────────┬─────────┘     └──────────┬─────────┘     └──────────┬─────────┘
             └──────────────────────────┼──────────────────────────┘
                                        │
                                        ▼
                    ┌───────────────────────────────────┐
                    │     Normalized Security Model     │
                    │ (Canonical Pydantic Data Schema)  │
                    └───────────────────┬───────────────┘
                                        │
                                        ▼
                    ┌───────────────────────────────────┐
                    │     Compliance & Audit Engine     │
                    │ - 25+ CIS / NIST / ISO-27001 Rules│
                    │ - Vendor-aware detection routines │
                    │ - Zero-secret evidence generation │
                    └───────────────────┬───────────────┘
                                        │
                      ┌─────────────────┴─────────────────┐
                      ▼                                   ▼
          ┌───────────────────────┐           ┌───────────────────────┐
          │ Transparent Scoring   │           │ AI Correlation Engine │
          │ - 0-100 overall score │           │ - Multi-finding graph │
          │ - Weighted deductions │           │ - Blast radius rating │
          │ - Category breakdowns │           │ - Context remediation │
          └───────────┬───────────┘           └───────────┬───────────┘
                      └─────────────────┬─────────────────┘
                                        ▼
                    ┌───────────────────────────────────┐
                    │       Assessment Aggregator       │
                    │ - Findings, Evidence & AI Insights│
                    │ - Device & Batch Level Rollups    │
                    └───────────────────────────────────┘
```

---

## 🔒 Privacy & Threat Model

| Security Requirement | Implementation in NetGuard AI |
| :--- | :--- |
| **No External Cloud Transmission** | All AST normalization, rule evaluations, scoring, and PDF rendering run in the local Python runtime. |
| **Secret Redaction** | High-entropy regex filter intercepts passwords, enable secrets, VPN PSKs, SNMP communities, and RSA private keys in memory. |
| **Evidence Confinement** | Generated evidence strings in API responses, SQLite DB, and PDF reports only expose sanitized tokens. |
| **Untrusted File Protections** | Strict filename path-traversal sanitization (`os.path.basename`) and file size caps (20MB max). |
| **Code Execution Prevention** | Zero `eval()`, `exec()`, or subshell commands are executed based on configuration text. |

---

## 📋 Compliance Standards & Rule Catalog

NetGuard AI ships with 25+ built-in security rules across 8 hardening categories:

1. **Remote Management**:
   - `NET-MGMT-001`: Telnet Remote Management Enabled (CIS 1.1.1, NIST AC-17)
   - `NET-MGMT-002`: SSH Disabled or Insecure SSHv1 Configured (CIS 1.1.2, NIST IA-2)
   - `NET-MGMT-003`: Cleartext HTTP Web Management Service Enabled (CIS 1.1.3, NIST AC-17)
   - `NET-MGMT-004`: Missing or Excessive Inactivity Session Timeout (CIS 1.1.4, NIST AC-12)
   - `NET-MGMT-005`: Missing Legal Warning Banner / MOTD (CIS 1.1.5, NIST AC-8)
2. **Authentication & AAA**:
   - `NET-AUTH-001`: Cleartext Password Storage or Missing Password Encryption (CIS 1.2.1, NIST IA-5)
   - `NET-AUTH-002`: Weak Password Hashing Algorithm Detected (MD5/Type 7) (CIS 1.2.2, NIST IA-5)
   - `NET-AUTH-003`: Default or Well-Known Administrative Accounts (CIS 1.2.3, NIST IA-2)
   - `NET-AUTH-004`: Centralized AAA Authentication Model Disabled (CIS 1.2.4, NIST AC-2)
   - `NET-AUTH-005`: Direct Root / Superuser Remote Login Permitted (CIS 1.2.5, NIST AC-6)
3. **Logging & Auditing**:
   - `NET-LOG-001`: System Logging Completely Disabled (CIS 1.3.1, NIST AU-2)
   - `NET-LOG-002`: Centralized Remote Syslog / SIEM Missing (CIS 1.3.2, NIST AU-6)
   - `NET-LOG-003`: Log Timestamps Missing Millisecond Precision (CIS 1.3.3, NIST AU-8)
4. **Time Synchronization (NTP)**:
   - `NET-NTP-001`: Network Time Protocol (NTP) Not Configured (CIS 1.4.1, NIST AU-8)
   - `NET-NTP-002`: NTP Cryptographic Peer Authentication Missing (CIS 1.4.2, NIST SC-23)
5. **SNMP Security**:
   - `NET-SNMP-001`: Insecure SNMP Version (v1/v2c) Enabled (CIS 1.5.1, NIST IA-5)
   - `NET-SNMP-002`: Default SNMP Community String ('public'/'private') (CIS 1.5.2, NIST IA-5)
   - `NET-SNMP-003`: SNMP Read-Write (RW) Access Enabled (CIS 1.5.3, NIST AC-6)
6. **Access Control & Firewall**:
   - `NET-ACL-001`: Dangerous 'Permit Any Any' Ingress Policy Detected (CIS 1.6.1, NIST AC-4)
   - `NET-ACL-002`: Unrestricted Management Plane Access (Missing Mgmt ACL) (CIS 1.6.2, NIST AC-17)
   - `NET-ACL-003`: IP Anti-Spoofing Filters Missing on Edge (uRPF) (CIS 1.6.3, NIST SC-7)
7. **Cryptography & VPN**:
   - `NET-CRYPTO-001`: Deprecated Ciphers in VPN (DES/3DES/MD5) (CIS 1.7.1, NIST SC-13)
   - `NET-CRYPTO-002`: Insecure Diffie-Hellman Key Exchange Group (DH 1/2/5) (CIS 1.7.2, NIST SC-13)
8. **Network Services & Hygiene**:
   - `NET-SVC-001`: Dangerous Layer-2 Discovery Protocols (CDP/LLDP) (CIS 1.8.1, NIST CM-7)
   - `NET-SVC-002`: Legacy Insecure Auxiliary Services (Finger/Small-Servers) (CIS 1.8.2, NIST CM-7)

---

## ⚙️ Quick Installation & Running Locally

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm**

### 1. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 3. Run the Comprehensive Verification Test Suite
```bash
cd ..
python backend/tests/run_all_tests.py
```

### 4. Start the Application
- **Windows**: Double-click `start.bat`
- **Linux / macOS**: Run `./start.sh`

Or launch manually:
```bash
# Terminal 1: Backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend

# Terminal 2: Frontend
cd frontend && npm run dev
```

- **Interactive Dashboard**: `http://localhost:5173`
- **FastAPI Interactive API Docs**: `http://127.0.0.1:8000/docs`

---

## 🎯 Smart India Hackathon Demo Walkthrough

1. **Launch NetGuard AI**: Open `http://localhost:5173` in your browser.
2. **Import Configuration Files**: Click **"Import Configs"** on the navbar.
3. **Select Sample Files**:
   - Select files from the `sample_configs/` folder (`cisco_router_vulnerable.cfg`, `cisco_switch_hardened.cfg`, `fortigate_fw_vulnerable.conf`, `juniper_srx_vulnerable.conf`).
   - Or click **"Load Hackathon Demo (4 Devices)"** for instant one-click demonstration.
4. **Observe Real-Time Analysis**:
   - In-memory credential sanitization
   - Automatic vendor detection (**Cisco**, **Fortinet**, **Juniper**)
   - Deterministic rule evaluation
   - AI Threat Graph attack-chain correlation
5. **Inspect SOC Dashboard**:
   - Overall Security Score (e.g., **67.4 / 100 — Elevated Risk**)
   - Severity breakdown and category benchmarks
   - Correlated multi-stage attack vectors (e.g. *Cleartext Management Sniffing & Administrative Takeover*)
6. **Inspect Individual Devices**:
   - Click on `Cisco-Core-Router-01` to view device-specific findings.
   - Click on finding `NET-MGMT-001` (Telnet Enabled) to view masked evidence, risk rationale, and copyable vendor CLI hardening commands.
7. **Generate PDF Report**:
   - Click **"Export PDF"** to download the official, confidential compliance report.

---

## 📊 Transparent Scoring Methodology

The overall security score ($S$) is calculated using a transparent mathematical deduction formula bounded in $[0, 100]$:

$$S = \max\left(0, \min\left(100, 100 - \sum_{i=1}^{N} W(\text{finding}_i)\right)\right)$$

Where severity weights $W$ are defined as:
- **CRITICAL**: $18.0$ points
- **HIGH**: $10.0$ points
- **MEDIUM**: $5.0$ points
- **LOW**: $2.0$ points
- **INFO**: $0.0$ points

Category-level scores are similarly computed and normalized to reflect domain-specific compliance health.

---

## 🔮 Future Roadmap (v2.0+)
- **Extended Vendor Adapters**: Palo Alto PAN-OS, Check Point Gaia, Arista EOS, and Huawei VRP.
- **Automated Remediation Push**: Ansible playbook export and Netmiko push automation with change-management approvals.
- **On-Device Quantized SLM**: Integration with quantized on-device small language models (Phi-3 / Qwen 2.5 1.5B via ONNX Runtime).
- **Custom Rule Studio**: Visual drag-and-drop YAML compliance rule builder for enterprise-specific network policies.

---

## 👥 Hackathon Team Contribution
Developed with ❤️ for the **Smart India Hackathon** — *AI-Driven Multi-Vendor Network Security Compliance Auditor*.
