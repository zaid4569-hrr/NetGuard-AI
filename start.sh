#!/bin/bash
echo "======================================================================"
echo "   NETGUARD AI -- Privacy-Preserving Network Compliance Auditor"
echo "======================================================================"

echo "[1/3] Running Comprehensive Verification Test Suite..."
python3 backend/tests/run_all_tests.py

echo ""
echo "[2/3] Starting FastAPI Backend on http://127.0.0.1:8000 ..."
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend &
BACKEND_PID=$!

echo ""
echo "[3/3] Starting Frontend Dashboard on http://localhost:5173 ..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo "NetGuard AI is running!"
echo "- Dashboard: http://localhost:5173"
echo "- API Docs:  http://127.0.0.1:8000/docs"

wait $BACKEND_PID $FRONTEND_PID
