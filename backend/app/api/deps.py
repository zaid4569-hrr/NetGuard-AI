from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token, decode_firebase_token
from app.models.db_models import UserModel

# tokenUrl is just for OpenAPI docs — the actual login endpoint is /auth/login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials. Please log in again.",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> UserModel:
    if not token:
        raise CREDENTIALS_EXCEPTION

    # 1. Try our own backend-issued JWT first (the default, always-on path).
    user_id = decode_access_token(token)
    if user_id:
        result = await db.execute(select(UserModel).where(UserModel.id == user_id))
        user = result.scalar_one_or_none()
        if user and user.is_active:
            return user
        raise CREDENTIALS_EXCEPTION

    # 2. Fall back to a Firebase Authentication ID token, if Firebase Auth
    #    has been configured on the frontend. The Firebase user's UID
    #    becomes our user_id too, so assessments/reports keep working
    #    unchanged — we just auto-provision a shadow row in our own `users`
    #    table the first time we see that Firebase user (no password is
    #    ever stored for these accounts; they can only ever authenticate
    #    via Firebase — email/password, Google, or GitHub).
    firebase_claims = decode_firebase_token(token)
    if firebase_claims:
        firebase_uid = firebase_claims.get("sub") or firebase_claims.get("user_id")
        email = firebase_claims.get("email", "")
        if not firebase_uid:
            raise CREDENTIALS_EXCEPTION

        result = await db.execute(select(UserModel).where(UserModel.id == firebase_uid))
        user = result.scalar_one_or_none()
        if not user:
            user = UserModel(
                id=firebase_uid,
                email=email or f"{firebase_uid}@firebase.local",
                # Sentinel value — this account can never log in through our
                # own /auth/login, only via a valid Firebase ID token.
                hashed_password="!firebase-managed!",
                full_name=firebase_claims.get("name"),
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        if user.is_active:
            return user

    raise CREDENTIALS_EXCEPTION
