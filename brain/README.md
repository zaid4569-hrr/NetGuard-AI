# NetGuard AI Brain

This folder is the machine-readable project context for AI agents and new engineers. Read the files in this order:

1. [prd.md](prd.md) - product purpose, users, scope, and success criteria.
2. [architecture.md](architecture.md) - end-to-end runtime flow and ownership boundaries.
3. [domain-model.md](domain-model.md) - core entities, assessment semantics, and scoring vocabulary.
4. [api.md](api.md) - backend routes, authentication, request behavior, and frontend API usage.
5. [frontend.md](frontend.md) - route map, providers, state flow, and fallback behavior.
6. [security.md](security.md) - privacy guarantees, trust boundaries, and security constraints.
7. [development.md](development.md) - setup, commands, test strategy, and contribution rules.
8. [decisions.md](decisions.md) - verified architectural decisions and current inconsistencies.

## One-sentence summary

NetGuard AI is a local-first network configuration compliance auditor that sanitizes uploaded configurations, detects vendors, normalizes device data, evaluates deterministic security rules, calculates transparent scores, correlates risks, and presents remediation-oriented results in a React dashboard.

## Source of truth

- Runtime backend: `backend/app/`
- Runtime frontend: `frontend/src/`
- Existing product documentation: `README.md` and `docs/`
- Database schema used by the local backend: `backend/app/models/db_models.py` and `backend/app/core/database.py`
- Supabase schema and RLS design: `supabase/migrations/001_initial_schema.sql`
- Verification tests: `backend/tests/`

When documentation conflicts with executable code, treat executable code as the current source of truth and update this folder after confirming the intended behavior.

## AI operating rules

- Preserve the local-first and zero-egress security model.
- Never expose raw credentials, keys, PSKs, hashes, or SNMP communities in logs, evidence, API responses, fixtures, or documentation.
- Prefer existing parser, rule, schema, service, and context abstractions over introducing parallel ones.
- Keep scoring explainable and deterministic unless a change explicitly updates the scoring contract.
- Scope all authenticated data access to the current user; do not weaken ownership filters or return existence-revealing errors.
- Treat mock data as a clearly labeled offline/demo fallback, never as persisted audit data.
- Before changing a contract, update the relevant document here and the nearest tests.
