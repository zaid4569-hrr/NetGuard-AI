# Architectural Decisions and Known Gaps

This file records facts that an AI agent should not silently infer around.

## Verified decisions

- The compliance engine is deterministic and rule-based; AI modules enrich correlation, explanation, prioritization, and summaries.
- The normalized Pydantic model is the parser-to-rule contract.
- Local backend persistence is asynchronous SQLAlchemy over the configured database URL and initializes tables at application startup.
- Authenticated API access is required for user-owned assessment data.
- The frontend intentionally supports an offline/demo experience.
- PDF generation is a backend operation for persisted assessments, not a browser-only export.

## Current inconsistencies to verify before major changes

- `backend/app/main.py` contains multiple preliminary `FastAPI()` declarations before the final configured application object. The final object is the one intended to run, but this should be cleaned up carefully because startup and route behavior can be easy to misread.
- The root README describes some vendor support more broadly than the parser directory and registry may currently implement. Confirm `ParserRegistry` before claiming support for a vendor.
- The Supabase migration models workspaces and RLS, while the local FastAPI assessment endpoints currently use `UserModel` ownership and local database models. Treat these as separate integration layers until deployment wiring proves otherwise.
- Frontend Firebase support and backend local JWT support coexist. Confirm the deployed auth verification path before changing token issuance or claims.
- Some frontend API methods return synthetic data on backend failure. Any new screen must preserve the distinction between a real persisted assessment and `MOCK_ASSESSMENT`.
- The top-level npm test script is a placeholder; backend and frontend commands are the real verification paths.

## How to resolve a gap

Prefer executable evidence in this order: route implementation, schema/model, focused test, frontend service contract, deployment configuration, then prose documentation. After resolving a gap, update this file and the affected source documentation.
