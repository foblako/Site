"""Password hashing and JWT token helpers."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import bcrypt
import jwt

from .config import settings

TokenType = Literal["access", "refresh"]


def hash_password(plain: str) -> str:
    """Hash a plaintext password with bcrypt."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, password_hash: str) -> bool:
    """Constant-time check of a plaintext password against a stored hash."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def _create_token(*, subject: str, token_type: TokenType, ttl: timedelta) -> str:
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + ttl).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: str) -> str:
    return _create_token(
        subject=user_id,
        token_type="access",
        ttl=timedelta(minutes=settings.access_token_ttl_minutes),
    )


def create_refresh_token(user_id: str) -> str:
    return _create_token(
        subject=user_id,
        token_type="refresh",
        ttl=timedelta(days=settings.refresh_token_ttl_days),
    )


class TokenError(Exception):
    """Raised when a JWT cannot be decoded or has the wrong shape/type."""


def decode_token(token: str, *, expected_type: TokenType) -> str:
    """Decode a JWT and return its `sub` claim, or raise `TokenError`.

    `expected_type` is the value the `type` claim must equal, so an access
    token cannot be used where a refresh token is required and vice versa.
    """
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise TokenError(str(exc)) from exc

    sub = payload.get("sub")
    token_type = payload.get("type")
    if not isinstance(sub, str) or token_type != expected_type:
        raise TokenError("invalid token payload")
    return sub
