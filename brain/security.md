# Security and Privacy Contract

## Non-negotiable guarantees

- Raw configuration data is processed locally and in memory during analysis.
- Secrets are sanitized before normalization, rule evidence, persistence, or report output.
- The system must not execute configuration content with `eval`, `exec`, shell commands, or device connections.
- File names are reduced to safe basenames and uploads are size-limited.
- Every authenticated resource lookup is scoped to the current user or workspace boundary.
- Error responses must not reveal whether another user's resource exists.

## Secret classes

Sanitization covers vendor-specific passwords and hashes, enable secrets, VPN pre-shared keys, SNMP communities, and other high-entropy credential material. When adding a parser or rule, verify that new evidence cannot reconstruct or echo the original secret.

## Trust boundaries

1. Uploaded files are untrusted input.
2. Parser output is trusted only after validation and normalization.
3. Compliance findings are application data but still must contain masked evidence.
4. AI inputs must be derived from sanitized normalized data and findings.
5. Database and PDF output are persistence/export boundaries and must never become a secret bypass.
6. Browser storage contains bearer credentials and must be handled as sensitive client state.

## Review checklist

- Does a change read or log raw upload bytes after sanitization should have occurred?
- Does a new rule expose a raw line, token, hash, key, or community value?
- Does an endpoint query by resource ID without joining to the authenticated owner?
- Does a frontend fallback make synthetic data appear real?
- Does a report include any field not already filtered through the sanitized model?
- Does a new dependency add network egress to the analysis path?
- Are file type, size, encoding, and path traversal cases covered?

## Auth and data isolation

The local API uses password hashing and bearer JWTs. The Supabase migration additionally defines workspaces, membership roles, and RLS policies. Changes to the PostgreSQL schema, RLS, indexes, or database functions must follow the repository's Supabase/Postgres guidance and be tested against the intended deployment.

## Threat model limits

Local-first processing reduces configuration exfiltration risk but does not protect a compromised host, malicious browser extension, unsafe operator, or insecure deployment configuration. Remediation commands are recommendations and require operator review before production use.
