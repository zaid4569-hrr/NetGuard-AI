# Product Requirements Document

## Product

**NetGuard AI** is a privacy-preserving, local-first network security compliance auditor for heterogeneous enterprise network configurations.

## Problem

Network and security teams audit router, switch, and firewall configurations manually across vendors and compliance baselines. This is slow, inconsistent, and risky when cloud tools require sensitive configurations to leave the organization.

## Users

- Security analysts who need prioritized findings and remediation commands.
- Network engineers who need vendor-specific evidence and fixes.
- Compliance and audit teams who need traceable controls, scores, and PDF reports.
- Security leaders who need an executive posture summary across devices.

## Product promise

A user can upload one or more supported configuration files and receive a privacy-safe assessment with vendor identification, normalized device data, deterministic compliance findings, severity counts, transparent scores, correlated attack paths, remediation guidance, and an exportable report.

## Core workflow

1. User signs in or creates an account.
2. User uploads one or more configuration files, optionally with an assessment name and vendor override.
3. The backend validates file names and size, reads files in memory, and sanitizes secrets.
4. The parser registry detects the vendor and converts the configuration to the normalized security model.
5. The compliance engine evaluates registered rules and produces masked evidence.
6. The scoring engine computes device and assessment scores.
7. AI correlation and summarization produce attack-chain insights, executive summary, and remediation priorities.
8. The backend persists the assessment in local SQLite and returns the complete result.
9. The dashboard exposes overview, devices, findings, comparison, remediation, copilot, compliance, trends, rules, and reports.

## Functional requirements

- Support the parser adapters registered in `backend/app/parsers/registry.py`.
- Detect a vendor with confidence and allow an explicit vendor override.
- Enforce file validation before parsing.
- Mask secrets before normalized data, findings, persistence, or reports are produced.
- Evaluate compliance findings with rule IDs, severity, category, evidence, explanation, recommendation, and references.
- Calculate a bounded 0-100 score with severity-based deductions and category rollups.
- Keep audit history scoped to the authenticated user.
- Offer device detail, finding detail, comparison, copilot explanations, and PDF export.
- Provide an offline/demo fallback in the frontend without presenting it as a real audit.

## Non-functional requirements

- Local-first processing with zero configuration egress from the analysis pipeline.
- No execution of configuration contents as code or shell commands.
- Explainable outputs: every score and recommendation must be traceable to findings and rules.
- Responsive dashboard suitable for repeated SOC and engineering workflows.
- Backend APIs must reject unauthenticated or unauthorized access.
- Changes should preserve vendor adapter extensibility and deterministic tests.

## Out of scope

- Automatic changes to live network devices.
- Treating generated remediation commands as verified safe for every environment.
- Cloud processing of raw configuration files.
- A topology map implementation; the current route is marked coming soon.

## Success criteria

- A supported sample configuration can be assessed end to end locally.
- No secret appears in persisted evidence or generated reports.
- A user can distinguish real backend data from demo fallback data.
- A finding can be traced from rule -> evidence -> score impact -> remediation.
- A report can be generated for a persisted assessment.
- The backend test suite and frontend production build pass.

## Primary acceptance scenarios

- Upload a vulnerable Cisco, Fortinet, or Juniper sample and receive findings.
- Upload a hardened sample and observe a higher score and fewer findings.
- Request another user's assessment and receive a non-disclosing 404.
- Run with the backend unavailable and see clearly labeled demo data rather than an uncaught UI failure.
- Export a real assessment as PDF without raw secrets.
