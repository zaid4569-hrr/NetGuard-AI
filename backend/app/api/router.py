from fastapi import APIRouter
from app.api.endpoints import assessment, devices, rules, report, copilot, compare

api_router = APIRouter()

api_router.include_router(assessment.router)
api_router.include_router(devices.router)
api_router.include_router(rules.router)
api_router.include_router(report.router)
api_router.include_router(copilot.router)
api_router.include_router(compare.router)

