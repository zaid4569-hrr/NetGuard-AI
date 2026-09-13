"""
Authentication primitives: password hashing and JWT session tokens.

Passwords are never stored or transmitted in a reversible form. We use
bcrypt (via passlib) which is a one-way, salted hash — there is no
"decrypt" operation, by design. This is the correct approach even for a
local/offline app: if the database file is ever copied or leaked, an
attacker still cannot recover the original passwords.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt

from app.core.config import settings

# Bcrypt truncates at 72 bytes; reject anything longer up front with a
# clear error rather than silently truncating the password.
_MAX_PASSWORD_BYTES = 72

# Lazy-import google-auth so the backend starts cleanly even when the
# `requests` transport package is not installed AND Firebase is not
# configured. The import is only exercised at call-time inside
# decode_firebase_token(), which itself early-exits if FIREBASE_PROJECT_ID
# is empty.
_google_auth_available: Optional[bool] = None


def _check_google_auth() -> bool:
    """Returns True if google-auth + requests are both importable."""
    global _google_auth_available
    if _google_auth_available is None:
        try:
            import google.auth.transport.requests  # noqa: F401
            import google.oauth2.id_token  # noqa: F401
            _google_auth_available = True
        except (ImportError, Exception):
            _google_auth_available = False
    return _google_auth_available


def hash_password(plain_password: str) -> str:
    """One-way bcrypt hash. There is no corresponding decrypt function."""
    password_bytes = plain_password.encode("utf-8")
    if len(password_bytes) > _MAX_PASSWORD_BYTES:
        raise ValueError("Password is too long.")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode("utf-8")[:_MAX_PASSWORD_BYTES]
    try:
        return bcrypt.checkpw(password_bytes, hashed_password.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    """Create a signed JWT session token. `subject` is the user id."""
    expire_minutes = expires_minutes or settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    payload = {
        "sub": subject,
        "iat": datetime.now(timezone.utc),
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    """Returns the user id (subject) if the token is valid, else None."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


def decode_firebase_token(token: str) -> Optional[dict]:
    """
    Verifies a Firebase Authentication ID token (RS256, signed by Google
    and verifiable against Google's public certs — no shared secret
    needed). Returns the decoded claims (including 'sub' = the Firebase
    user UID, and 'email') if valid, else None.

    Only used when FIREBASE_PROJECT_ID is configured — i.e. the operator
    has opted into Firebase Auth on the frontend.
    """
    if not settings.FIREBASE_PROJECT_ID:
        return None
    if not _check_google_auth():
        # google-auth / requests not installed — Firebase verification unavailable.
        return None
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token
        from google.auth.exceptions import GoogleAuthError

        # A fresh Request() per call is deliberately cheap here — google-auth
        # caches certs internally based on HTTP cache-control headers, so
        # this doesn't refetch on every single request in practice.
        claims = google_id_token.verify_firebase_token(
            token,
            google_requests.Request(),
            audience=settings.FIREBASE_PROJECT_ID,
        )
        return claims
    except Exception:
        return None
