@echo off
echo ======================================================================
echo    NETGUARD AI -- Privacy-Preserving Network Compliance Auditor
echo ======================================================================
echo.

echo [1/3] Running Comprehensive Verification Test Suite...
python backend\tests\run_all_tests.py
if %ERRORLEVEL% NEQ 0 (
    echo [!] Warning: Some tests encountered issues. Starting services...
)

echo.
echo [2/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "NetGuard Backend" cmd /k "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend"

echo.
echo [3/3] Starting Frontend Dashboard on http://localhost:5173 ...
cd frontend
start "NetGuard Frontend" cmd /k "npm run dev"

echo.
echo ======================================================================
echo    NetGuard AI is now running!
echo    - Dashboard: http://localhost:5173
echo    - API Docs:  http://127.0.0.1:8000/docs
echo ======================================================================
