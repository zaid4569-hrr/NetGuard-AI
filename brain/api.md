# API Contract

## Base URL

- Local backend: `http://127.0.0.1:8000`
- API prefix: `/api`
- OpenAPI UI: `http://127.0.0.1:8000/docs`
- Frontend default base: `/api`, proxied by Vite in development.
- Production frontend may use `VITE_API_BASE_URL`.

## Authentication

The frontend sends `Authorization: Bearer <token>` on every request when a token exists. The token is either a backend JWT stored under `netguard_auth_token` or a refreshed Firebase ID token when Firebase is configured.

Backend auth routes:

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create a local account and return a token. |
| POST | `/api/auth/login` | Verify credentials and return a token. |
| GET | `/api/auth/me` | Return the authenticated user. |

## Assessment routes

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/assessment/upload` | Upload one or more configs and run a complete audit. Multipart fields: `files`, optional `assessment_name`, optional `manual_vendor`. |
| GET | `/api/assessment` | List assessment summaries for the authenticated user. |
| GET | `/api/assessment/{assessment_id}` | Return full assessment, devices, findings, scores, and AI insights. |
| DELETE | `/api/assessment/{assessment_id}` | Delete an owned assessment and related records. |

## Device routes

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/devices/{device_id}` | Return an owned device with findings and category scores. |
| GET | `/api/devices/{device_id}/findings` | Return findings for an owned device. |

## Other route groups

The router also registers `rules`, `report`, `copilot`, and `compare` endpoint modules. Consult their endpoint files or generated OpenAPI schema before changing request or response shapes:

- `backend/app/api/endpoints/rules.py`
- `backend/app/api/endpoints/report.py`
- `backend/app/api/endpoints/copilot.py`
- `backend/app/api/endpoints/compare.py`

The frontend wrappers for these contracts live in `frontend/src/services/api.ts`.

## Response principles

- Use Pydantic response schemas in `backend/app/schemas/api_schemas.py`.
- Return masked evidence only.
- Preserve stable IDs and enum spellings used by the frontend types.
- Ownership failures should not reveal another user's resource existence.
- Keep error details useful but generic where disclosure could aid account or resource enumeration.

## Compatibility note

The frontend intentionally has offline fallbacks for several read and analysis calls. When changing an endpoint, update the real response type and the fallback payload together, then run the frontend build and backend tests.
