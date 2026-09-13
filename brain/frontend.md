# Frontend Guide

## Route groups

`frontend/src/App.tsx` defines three route groups:

- Public: `/`, `/platform`, `/vendors`, `/docs`, `/about`.
- Authentication: `/login`, `/signup`, `/forgot-password`, `/reset-password`.
- Authenticated: `/dashboard`, `/security-center`, `/audit`, `/devices`, `/devices/:id`, `/findings`, `/compare`, `/remediation`, `/ai-copilot`, `/security-trends`, `/compliance`, `/rules`, `/reports`, and `/settings`.

`ProtectedRoute` guards the authenticated shell. `/onboarding` is authenticated but does not require onboarding to already be complete. Unknown paths redirect to `/`.

## Provider hierarchy

`ThemeProvider` -> `AuthProvider` -> `NotificationProvider` -> routed application. `AssessmentProvider` is the intended single source of truth for active audit data and history and should wrap authenticated screens where needed.

## Assessment state behavior

`AssessmentContext`:

1. Reads `?assessment=<id>` when present.
2. Otherwise loads the most recent real assessment.
3. Falls back to `MOCK_ASSESSMENT` only when no audit is available or loading fails.
4. Exposes `isDemoData` so screens can label synthetic data.
5. Exposes `reload` and `loadAssessment` for upload/report workflows.

Do not introduce page-local copies of assessment state unless the data is intentionally view-local.

## API behavior

`frontend/src/services/api.ts` owns the Axios instance and bearer token interceptor. It also handles 401 session expiry and provides endpoint wrappers. The service currently provides simulated fallback data for selected offline operations; preserve that behavior only when the UI clearly distinguishes demo data from real audit results.

## UI responsibilities

- Upload UI gathers files and optional audit metadata.
- Dashboard and security center summarize posture and trends.
- Device views expose per-device posture and findings.
- Finding drawer/detail surfaces evidence, rationale, references, and remediation.
- Rule catalog exposes the deterministic control inventory.
- Compare shows before/after configuration differences and score delta.
- Copilot explains findings and answers grounded audit questions.
- Reports requests a persisted assessment PDF.

## Frontend conventions

- Keep API calls in service modules, not scattered through presentational components.
- Reuse existing context and component patterns.
- Keep loading, empty, error, and demo states explicit.
- Preserve responsive layouts and keyboard-accessible controls.
- Use existing Lucide icon and Tailwind conventions before adding new UI primitives.
