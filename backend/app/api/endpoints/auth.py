import re
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.models.db_models import UserModel, SessionModel
from app.security.auth import hash_password, verify_password, encrypt_profile, decrypt_profile, create_session, require_user, token_hash, bearer

router = APIRouter(prefix="/auth", tags=["Local Authentication"])
class SignupRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=12, max_length=128)
class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=1, max_length=128)

def profile(user: UserModel) -> dict:
    payload = decrypt_profile(user.encrypted_profile)
    return {"id": user.id, "email": user.email, "fullName": payload["fullName"], "organizationName": payload.get("organizationName", "Personal Security Workspace"), "onboardingCompleted": payload.get("onboardingCompleted", False), "preferredVendors": payload.get("preferredVendors", []), "securityPriorities": payload.get("securityPriorities", [])}

def strong(password: str) -> bool:
    return len(password) >= 12 and all(re.search(pattern, password) for pattern in (r"[a-z]", r"[A-Z]", r"\d", r"[^A-Za-z0-9]"))

@router.post("/signup")
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    if "@" not in req.email or req.email.startswith("@") or req.email.endswith("@"):
        raise HTTPException(400, "Enter a valid email address.")
    if not strong(req.password): raise HTTPException(400, "Use 12+ characters with upper/lowercase, a number, and a symbol.")
    email = str(req.email).lower()
    if (await db.execute(select(UserModel).where(UserModel.email == email))).scalar_one_or_none(): raise HTTPException(409, "An account with this email already exists.")
    user = UserModel(id=str(uuid.uuid4()), email=email, password_hash=hash_password(req.password), encrypted_profile=encrypt_profile({"fullName": req.full_name.strip(), "organizationName": "Personal Security Workspace", "onboardingCompleted": True, "preferredVendors": [], "securityPriorities": []}))
    db.add(user); token, expires_at = await create_session(user.id, db); await db.commit()
    return {"user": profile(user), "token": token, "expiresAt": expires_at}

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = (await db.execute(select(UserModel).where(UserModel.email == str(req.email).lower()))).scalar_one_or_none()
    generic = "Invalid email or password."
    if not user: raise HTTPException(status.HTTP_401_UNAUTHORIZED, generic)
    now = datetime.utcnow()
    if user.locked_until and user.locked_until > now: raise HTTPException(429, "Too many attempts. Try again later.")
    if not verify_password(req.password, user.password_hash):
        user.failed_login_count += 1
        if user.failed_login_count >= settings.MAX_LOGIN_FAILURES:
            user.locked_until = now + timedelta(minutes=settings.LOGIN_LOCK_MINUTES); user.failed_login_count = 0
        await db.commit(); raise HTTPException(status.HTTP_401_UNAUTHORIZED, generic)
    user.failed_login_count = 0; user.locked_until = None
    token, expires_at = await create_session(user.id, db); await db.commit()
    return {"user": profile(user), "token": token, "expiresAt": expires_at}

@router.get("/me")
async def me(user: UserModel = Depends(require_user)): return {"user": profile(user)}

@router.post("/logout", status_code=204)
async def logout(credentials=Depends(bearer), db: AsyncSession = Depends(get_db)):
    if credentials: await db.execute(delete(SessionModel).where(SessionModel.token_hash == token_hash(credentials.credentials))); await db.commit()
