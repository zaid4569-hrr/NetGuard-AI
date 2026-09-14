from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NetGuard AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DESCRIPTION: str = "Privacy-Preserving Multi-Vendor Network Security Compliance Auditor"
    
    # Base directories
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    REPORTS_DIR: Path = BASE_DIR / "reports"
    SAMPLE_CONFIGS_DIR: Path = BASE_DIR.parent / "sample_configs"
    
    # Database URI (SQLite for local, PostgreSQL for Supabase / Cloud)
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DATA_DIR}/netguard.db"

    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url
    
    # Max upload limit (bytes): 20 MB
    MAX_FILE_SIZE_BYTES: int = 20 * 1024 * 1024
    
    # Security & AI settings
    MASK_SECRETS: bool = True
    ENABLE_LOCAL_LLM: bool = False
    LOCAL_LLM_URL: str = "http://localhost:11434/api/generate"

    # Auth / JWT settings.
    # JWT_SECRET_KEY should be set via the environment in any real deployment
    # (see .env.example). If it isn't set, we auto-generate one on first run
    # and persist it to a local, git-ignored file so sessions survive
    # restarts without ever hardcoding a secret in source control.
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_ISSUER: str = "netguard-ai"
    JWT_AUDIENCE: str = "netguard-api"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Host-header allow-list. Override this in production when using a custom
    # domain; never use "*" for an internet-facing deployment.
    ALLOWED_HOSTS: str = "localhost,127.0.0.1,netguard-ai-1qun.onrender.com"

    # Optional: if you enable Firebase Authentication on the frontend (see
    # README), set this to your Firebase project ID (Project Settings >
    # General > Project ID in the Firebase console — no secret needed,
    # verification uses Google's public certs). When set, the backend will
    # also accept Firebase ID tokens — not just its own — and auto-provision
    # a matching local user record so assessments still work normally.
    FIREBASE_PROJECT_ID: str = ""

    # Explicit allow-list instead of "*", since "*" combined with
    # allow_credentials=True is rejected by browsers anyway and is bad
    # practice even when it isn't. Add your deployed frontend origin here
    # (or override via CORS_ORIGINS env var, comma-separated).
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,https://netguard-ai-frontend.vercel.app,https://netguard-ai-frontend-o31tbgze4-zaid4569-hrr.vercel.app"

    @property
    def cors_origins_list(self) -> list:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def allowed_hosts_list(self) -> list:
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",") if host.strip()]

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, value: str) -> str:
        # An empty value is replaced by the generated local secret below.
        if value and len(value) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters.")
        return value

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Resolve/persist the JWT signing secret.
if not settings.JWT_SECRET_KEY:
    _secret_file = settings.DATA_DIR / ".jwt_secret"
    if _secret_file.exists():
        settings.JWT_SECRET_KEY = _secret_file.read_text().strip()
    else:
        import secrets
        generated = secrets.token_hex(32)
        _secret_file.write_text(generated)
        try:
            _secret_file.chmod(0o600)
        except OSError:
            pass  # best-effort on platforms without POSIX permissions
        settings.JWT_SECRET_KEY = generated
