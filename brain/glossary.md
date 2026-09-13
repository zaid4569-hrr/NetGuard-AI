# Glossary

| Term | Meaning |
| --- | --- |
| Assessment | One audit job over one or more configuration files. |
| Device | One parsed configuration and its resulting posture data. |
| Finding | A rule-generated compliance issue for a device. |
| Normalized model | Canonical vendor-neutral Pydantic representation consumed by rules. |
| Rule | Deterministic security control evaluator with evidence and remediation metadata. |
| Evidence | Sanitized configuration-derived proof supporting a finding. |
| Correlation | Combining findings into a multi-stage attack path or risk narrative. |
| Score | Bounded 0-100 posture value derived from finding deductions. |
| Demo data | Synthetic frontend data used when no real audit exists or the backend is unavailable. |
| Local-first | Analysis and persistence occur on the user's configured local runtime rather than sending raw configs to a cloud service. |
| Vendor override | Optional upload field that bypasses or guides automatic vendor detection. |
| Workspace | Multi-tenant ownership boundary in the Supabase schema; not assumed to be active in the local runtime. |
