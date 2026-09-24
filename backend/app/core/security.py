from datetime import datetime, timedelta, timezone
from typing import Any, Literal
import uuid
import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger("core.security")

security_scheme = HTTPBearer(auto_error=False)

RoleType = Literal["teacher", "student", "admin"]


class CurrentUser(BaseModel):
    user_id: uuid.UUID
    role: RoleType
    org_id: uuid.UUID
    permissions: list[str] = []
    lesson_id: uuid.UUID | None = None  # Populated for SSE scoped tokens


def decode_jwt(token: str) -> dict[str, Any]:
    """
    Decodes and validates a JWT token using HS256 secret or RS256 JWKS URL.
    """
    try:
        if settings.JWKS_URL and settings.JWT_ALGORITHM.startswith("RS"):
            jwks_client = jwt.PyJWKClient(settings.JWKS_URL)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[settings.JWT_ALGORITHM],
                issuer=settings.JWT_ISSUER if settings.JWT_ISSUER else None,
                options={"verify_exp": True},
            )
        else:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_exp": True},
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "token_expired", "message": "Token has expired"},
        )
    except jwt.PyJWTError as e:
        logger.warning("jwt_decode_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_token", "message": "Could not validate credentials"},
        )


def create_access_token(
    user_id: uuid.UUID | str,
    role: RoleType,
    org_id: uuid.UUID | str,
    expires_delta: timedelta | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """Generates a JWT access token (primarily for dev/testing or internal use)."""
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(hours=8))
    claims = {
        "sub": str(user_id),
        "role": role,
        "org_id": str(org_id),
        "iss": settings.JWT_ISSUER,
        "iat": now,
        "exp": expire,
    }
    if extra_claims:
        claims.update(extra_claims)
    return jwt.encode(claims, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_sse_token(
    lesson_id: uuid.UUID | str,
    user_id: uuid.UUID | str,
    role: RoleType,
    org_id: uuid.UUID | str,
) -> str:
    """
    Generates a short-lived (5 min) SSE scoped token according to Section 10.1 of TZ:
    JWT with sse scope and lesson_id.
    """
    return create_access_token(
        user_id=user_id,
        role=role,
        org_id=org_id,
        expires_delta=timedelta(seconds=settings.SSE_TOKEN_EXPIRE_SECONDS),
        extra_claims={"scope": "sse", "lesson_id": str(lesson_id)},
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(security_scheme),
) -> CurrentUser:
    if credentials is None:
        if settings.ENVIRONMENT == "development":
            return CurrentUser(
                user_id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
                role="teacher",
                org_id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
                permissions=["*"],
                lesson_id=None,
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "missing_token", "message": "Authorization header missing"},
        )
    payload = decode_jwt(credentials.credentials)

    sub = payload.get("sub")
    role = payload.get("role")
    org_id = payload.get("org_id")

    if not sub or not role or not org_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_claims", "message": "Token claims missing sub, role, or org_id"},
        )

    lesson_id = payload.get("lesson_id")
    return CurrentUser(
        user_id=uuid.UUID(str(sub)),
        role=role,
        org_id=uuid.UUID(str(org_id)),
        permissions=payload.get("permissions", []),
        lesson_id=uuid.UUID(str(lesson_id)) if lesson_id else None,
    )


def require_role(*allowed_roles: RoleType):
    """Dependency that enforces user role check."""
    async def role_checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in allowed_roles and user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "forbidden_role",
                    "message": f"Action requires one of roles: {list(allowed_roles)}",
                },
            )
        return user
    return role_checker
