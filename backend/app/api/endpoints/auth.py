from collections import defaultdict, deque
from time import monotonic

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.db_models import UserModel
from app.schemas.api_schemas import SignupRequest, LoginRequest, TokenResponse, UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

_RATE_WINDOW_SECONDS = 15 * 60
_MAX_ATTEMPTS_PER_WINDOW = 10
_attempts: dict[str, deque[float]] = defaultdict(deque)


def _check_rate_limit(request: Request, email: str) -> None:
    """Limit credential abuse per client and account without storing passwords."""
    client_ip = request.client.host if request.client else "unknown"
    now = monotonic()
    keys = (f"ip:{client_ip}", f"email:{email}")

    for key in keys:
        timestamps = _attempts[key]
        while timestamps and now - timestamps[0] >= _RATE_WINDOW_SECONDS:
            timestamps.popleft()
        if len(timestamps) >= _MAX_ATTEMPTS_PER_WINDOW:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many authentication attempts. Please try again later.",
                headers={"Retry-After": str(_RATE_WINDOW_SECONDS)},
            )

    for key in keys:
        _attempts[key].append(now)

# Generic error message on purpose: never reveal whether the email exists.
INVALID_CREDENTIALS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid email or password.",
)


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, request: Request, db: AsyncSession = Depends(get_db)):
    normalized_email = payload.email.lower().strip()
    _check_rate_limit(request, normalized_email)

    existing = await db.execute(select(UserModel).where(UserModel.email == normalized_email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = UserModel(
        email=normalized_email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(subject=user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    normalized_email = payload.email.lower().strip()
    _check_rate_limit(request, normalized_email)

    result = await db.execute(select(UserModel).where(UserModel.email == normalized_email))
    user = result.scalar_one_or_none()

    # Always run verify_password even on a missing user (against a dummy hash)
    # so that response timing doesn't leak whether the email is registered.
    dummy_hash = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7t9pmzeb1w6RCP5r/nZUv06e3f8Q5FS"
    password_ok = verify_password(payload.password, user.hashed_password if user else dummy_hash)

    if not user or not password_ok or not user.is_active:
        raise INVALID_CREDENTIALS

    token = create_access_token(subject=user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserModel = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
