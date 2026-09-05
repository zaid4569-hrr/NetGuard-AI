"""Local authentication primitives; no password or configuration is sent off-device."""
import base64
import hashlib
import hmac
import json
import os
import secrets
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from cryptography.fernet import Fernet
from app.core.config import settings
from app.core.database import get_db
from app.models.db_models import SessionModel, UserModel

bearer = HTTPBearer(auto_error=False)
KEY_PATH = settings.DATA_DIR / "netguard-profile.key"

def _fernet() -> Fernet:
    if not KEY_PATH.exists():
        KEY_PATH.write_bytes(Fernet.generate_key())
        try: os.chmod(KEY_PATH, 0o600)
        except OSError: pass
    return Fernet(KEY_PATH.read_bytes())

def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 600_000)
    return f"pbkdf2_sha256$600000${base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"

def verify_password(password: str, stored: str) -> bool:
    try:
        _, rounds, encoded_salt, encoded_digest = stored.split("$")
        salt = base64.b64decode(encoded_salt)
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, int(rounds))
        return hmac.compare_digest(candidate, base64.b64decode(encoded_digest))
    except (ValueError, TypeError): return False

def encrypt_profile(profile: dict) -> str:
    return _fernet().encrypt(json.dumps(profile).encode()).decode()

def decrypt_profile(value: str) -> dict:
    return json.loads(_fernet().decrypt(value.encode()).decode())

def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

async def require_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: AsyncSession = Depends(get_db)
) -> UserModel:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="A valid session is required.")
    result = await db.execute(select(SessionModel).where(SessionModel.token_hash == token_hash(credentials.credentials)))
    session = result.scalar_one_or_none()
    if not session or session.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired. Please sign in again.")
    user = await db.get(UserModel, session.user_id)
    if not user: raise HTTPException(status_code=401, detail="Account unavailable.")
    return user

async def create_session(user_id: str, db: AsyncSession) -> tuple[str, datetime]:
    token = secrets.token_urlsafe(48)
    expires_at = datetime.utcnow() + timedelta(hours=settings.SESSION_TTL_HOURS)
    db.add(SessionModel(user_id=user_id, token_hash=token_hash(token), expires_at=expires_at))
    return token, expires_at
