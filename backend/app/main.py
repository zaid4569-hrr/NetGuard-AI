from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.router import api_router
# Import rules to ensure all security rules are registered at startup
import app.compliance.rules


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite tables on startup
    await init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts_list)

# Enable CORS for the local-first frontend dashboard only.
# Using an explicit allow-list (not "*") since we send credentials
# (the Authorization bearer token) with requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()",
    )
    if request.url.scheme == "https":
        response.headers.setdefault(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains",
        )
    return response

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/api/healthz", tags=["System"])
def api_health_check():
    return {"status": "ok"}


@app.get("/api", tags=["System"])
def api_root():
    return {"message": "NetGuard-AI backend running"}


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "privacy-first-local"
    }
