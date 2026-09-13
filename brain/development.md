# Development Guide

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm

## Install

```bash
cd backend
pip install -r requirements.txt
cd ../frontend
npm install
```

## Run locally

From the repository root:

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend
```

In another terminal:

```bash
cd frontend
npm run dev
```

Or use `start.bat` on Windows or `start.sh` on Linux/macOS.

## Verification

Backend comprehensive tests:

```bash
python backend/tests/run_all_tests.py
```

Frontend production build:

```bash
cd frontend
npm run build
```

The root `package.json` currently has no meaningful test script; use the backend test runner and frontend build directly.

## Test ownership

- Parser and detector behavior: `backend/tests/test_*parser.py`, `test_detector.py`.
- Sanitization: `backend/tests/test_sanitizer.py`.
- Scoring: `backend/tests/test_scoring.py`.
- Compliance: `backend/tests/test_compliance_rules.py`.
- Correlation: `backend/tests/test_ai_correlation.py`.

For a new vendor or rule, add focused tests using sanitized evidence and both vulnerable and hardened fixtures where practical.

## Change workflow

1. Identify the owning abstraction and nearest existing test.
2. Make the smallest compatible change.
3. Run the narrowest relevant test first.
4. Run the full backend test runner and frontend build for cross-layer changes.
5. Update `brain/` when behavior, contracts, setup, or architecture changes.
6. Never commit secrets, raw customer configurations, generated reports, local databases, or tokens.

## Configuration

Read `backend/app/core/config.py` before changing ports, database URLs, CORS, auth, or provider behavior. Read the frontend Vite configuration before changing proxy or deployment API behavior.
