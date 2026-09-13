# Domain Model

## Assessment

A single audit job over one or more configuration files. It owns devices, findings, category scores, severity counts, an overall score, an executive summary, and AI insight payloads.

## Device

A parsed configuration identified by filename and normalized metadata such as hostname, vendor, confidence, device type, and OS version. A device owns its findings and category scores and has a 0-100 security score.

## Finding

A deterministic compliance result produced by one rule for one device. Important fields are:

- `rule_id`: stable identifier such as `NET-MGMT-001`.
- `title`: human-readable problem.
- `category`: security domain.
- `severity`: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, or `INFO`.
- `evidence`: sanitized proof from the configuration.
- `explanation`: why the condition matters.
- `recommendation`: desired remediation.
- `remediation_script`: vendor-specific command or change guidance.
- compliance references: CIS, NIST, and ISO/IEC 27001 where available.

## Normalized configuration

Vendor parsers convert syntax-specific input to a canonical Pydantic model in `backend/app/schemas/normalized.py`. Rules should inspect this model rather than raw vendor text whenever possible. This is the main extensibility boundary for adding vendors.

## Categories

The current rule catalog groups findings into domains such as Remote Management, Authentication, Logging, NTP, SNMP Security, Access Control, Cryptography, and Network Services. Use the registered rule metadata as the source of truth for exact membership.

## Severity and scoring

The documented deduction weights are:

| Severity | Deduction |
| --- | ---: |
| CRITICAL | 18.0 |
| HIGH | 10.0 |
| MEDIUM | 5.0 |
| LOW | 2.0 |
| INFO | 0.0 |

The score is bounded to 0-100:

`score = max(0, min(100, 100 - sum(finding deductions)))`

Assessment scores roll up device scores and all findings. Category scores are separately calculated for domain-level reporting.

## AI insight model

The AI layer is an analysis and explanation layer over deterministic findings. It includes correlation, prioritization, and summarization modules. The system should remain useful and auditable if an external or optional language model provider is unavailable; deterministic local outputs are the baseline.

## Identity and ownership

The local backend uses a `UserModel` and bearer token authentication. Assessments are filtered by `current_user.id`; device and finding queries join back to the owning assessment. The Supabase design adds workspace membership and RLS as a separate multi-tenant model.

## Lifecycle states

Findings in the Supabase design support `Open`, `Acknowledged`, `Resolved`, and `Ignored`. The local SQLAlchemy model and endpoint behavior must be checked before assuming status mutation is available in the running local API.
