# Code Map

## Start here

- [README.md](../README.md): public product overview, feature list, setup, and demo walkthrough.
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md): existing pipeline summary.
- [docs/PRIVACY_MODEL.md](../docs/PRIVACY_MODEL.md): existing privacy and threat model.

## Backend

- [backend/app/main.py](../backend/app/main.py): FastAPI app lifecycle, CORS, route registration, health checks.
- [backend/app/api/router.py](../backend/app/api/router.py): endpoint group registration.
- [backend/app/api/endpoints/assessment.py](../backend/app/api/endpoints/assessment.py): primary audit orchestration.
- [backend/app/parsers/registry.py](../backend/app/parsers/registry.py): parser selection.
- [backend/app/schemas/normalized.py](../backend/app/schemas/normalized.py): canonical parsed model.
- [backend/app/compliance/engine.py](../backend/app/compliance/engine.py): rule evaluation.
- [backend/app/core/scoring.py](../backend/app/core/scoring.py): scoring and rollups.
- [backend/app/ai/](../backend/app/ai/): correlation, prioritization, summarization, and provider code.
- [backend/app/models/db_models.py](../backend/app/models/db_models.py): local ORM persistence model.
- [backend/app/schemas/api_schemas.py](../backend/app/schemas/api_schemas.py): API response and request schemas.

## Frontend

- [frontend/src/App.tsx](../frontend/src/App.tsx): routes and providers.
- [frontend/src/services/api.ts](../frontend/src/services/api.ts): HTTP contract and fallback behavior.
- [frontend/src/context/AuthContext.tsx](../frontend/src/context/AuthContext.tsx): auth state.
- [frontend/src/context/AssessmentContext.tsx](../frontend/src/context/AssessmentContext.tsx): active assessment state.
- [frontend/src/pages/](../frontend/src/pages/): product screens.
- [frontend/src/components/](../frontend/src/components/): reusable UI.

## Data and tests

- [supabase/migrations/001_initial_schema.sql](../supabase/migrations/001_initial_schema.sql): PostgreSQL workspace/RLS design.
- [backend/tests/](../backend/tests/): focused backend verification.
- [sample_configs/](../sample_configs/): vendor fixtures for manual demos and parser tests.
