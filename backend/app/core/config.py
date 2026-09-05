from pathlib import Path
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
    
    # SQLite Database URI
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DATA_DIR}/netguard.db"
    
    # Max upload limit (bytes): 20 MB
    MAX_FILE_SIZE_BYTES: int = 20 * 1024 * 1024
    SESSION_TTL_HOURS: int = 12
    MAX_LOGIN_FAILURES: int = 5
    LOGIN_LOCK_MINUTES: int = 15
    
    # Security & AI settings
    MASK_SECRETS: bool = True
    ENABLE_LOCAL_LLM: bool = False
    LOCAL_LLM_URL: str = "http://localhost:11434/api/generate"
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
