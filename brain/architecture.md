# System Architecture

## Runtime topology

```text
React/Vite dashboard
    -> Axios API client with bearer token
FastAPI application
    -> authentication and user-scoped query dependencies
    -> file validation and in-memory sanitization
    -> parser registry and vendor adapter
    -> normalized Pydantic security model
    -> compliance rule engine
    -> scoring engine
    -> AI correlation / prioritization / summarization
    -> SQLAlchemy async persistence in local SQLite
    -> report and copilot endpoints
```

## Assessment pipeline

The authoritative implementation is `backend/app/api/endpoints/assessment.py`.

1. `POST /api/assessment/upload` receives multipart files.
2. `FileSecurityValidator` sanitizes the basename and validates content and size.
3. `ParserRegistry.auto_detect_and_parse` sanitizes and parses the text, returning normalized config, vendor, and confidence.
4. `ComplianceEngine.run_audit` evaluates all registered rules.
5. `ScoringEngine.calculate_device_score` computes device score, category scores, and severity counts.
6. Device and finding ORM records are assembled in memory.
7. `ScoringEngine.calculate_assessment_rollup` calculates overall score and category rollups.
8. `AISummarizer.generate_executive_insights` combines findings into summary, threat correlations, priorities, and roadmap data.
9. The assessment graph is committed to SQLite.
10. The saved assessment is queried with related devices, findings, and category scores and returned to the client.

## Backend ownership map

| Concern | Owner |
| --- | --- |
| Application startup and routes | `backend/app/main.py` |
| Configuration and environment | `backend/app/core/config.py` |
| Async database session and initialization | `backend/app/core/database.py` |
| Auth hashing, JWT, and security primitives | `backend/app/core/security.py`, `backend/app/security/auth.py` |
| Upload validation | `backend/app/security/validator.py` |
| Secret masking | `backend/app/security/sanitizer.py` |
| Vendor detection and parser selection | `backend/app/parsers/detector.py`, `registry.py` |
| Vendor parsing | `backend/app/parsers/*.py` |
| Canonical model | `backend/app/schemas/normalized.py` |
| Compliance rules and execution | `backend/app/compliance/` |
| Scores | `backend/app/core/scoring.py` |
| AI insights | `backend/app/ai/` |
| HTTP contracts | `backend/app/api/endpoints/`, `backend/app/schemas/api_schemas.py` |
| Persistence entities | `backend/app/models/db_models.py` |
| PDF output | `backend/app/reports/pdf_generator.py` |

## Frontend ownership map

- `frontend/src/App.tsx`: route tree and provider composition.
- `frontend/src/context/AuthContext.tsx`: authentication state and session behavior.
- `frontend/src/context/AssessmentContext.tsx`: active assessment and history source of truth.
- `frontend/src/services/api.ts`: Axios instance, auth token injection, endpoint wrappers, and fallback behavior.
- `frontend/src/pages/`: public, auth, onboarding, and authenticated application screens.
- `frontend/src/components/`: reusable dashboard, upload, finding, chart, and layout components.

## Persistence model

The running backend creates SQLAlchemy tables from `Base.metadata.create_all` against `settings.DATABASE_URL`, normally local SQLite. The checked-in Supabase migration is a separate PostgreSQL schema for workspaces, membership, audits, devices, findings, reports, and RLS. Do not assume the Supabase migration is the schema used by the local FastAPI process without verifying configuration and deployment wiring.

## Error and fallback behavior

- Backend auth and ownership failures are real API errors.
- The Axios interceptor clears the local token and dispatches `netguard:auth-expired` on HTTP 401.
- Several frontend service methods fall back to `MOCK_ASSESSMENT` or synthetic results when the backend is unavailable. `AssessmentContext.isDemoData` identifies the synthetic dataset.
- PDF download intentionally surfaces backend errors instead of silently downloading an invalid file.
