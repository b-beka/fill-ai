from datetime import timedelta
import uuid
import pytest
from fastapi import HTTPException
from app.core.security import create_access_token, create_sse_token, decode_jwt


def test_jwt_encode_decode():
    user_id = uuid.uuid4()
    org_id = uuid.uuid4()

    token = create_access_token(user_id=user_id, role="teacher", org_id=org_id)
    payload = decode_jwt(token)

    assert payload["sub"] == str(user_id)
    assert payload["role"] == "teacher"
    assert payload["org_id"] == str(org_id)


def test_jwt_expired():
    user_id = uuid.uuid4()
    org_id = uuid.uuid4()

    # Expired token in the past
    token = create_access_token(
        user_id=user_id,
        role="student",
        org_id=org_id,
        expires_delta=timedelta(seconds=-10),
    )

    with pytest.raises(HTTPException) as exc_info:
        decode_jwt(token)
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail["code"] == "token_expired"


def test_sse_token_payload():
    lesson_id = uuid.uuid4()
    user_id = uuid.uuid4()
    org_id = uuid.uuid4()

    token = create_sse_token(
        lesson_id=lesson_id,
        user_id=user_id,
        role="student",
        org_id=org_id,
    )
    payload = decode_jwt(token)

    assert payload["scope"] == "sse"
    assert payload["lesson_id"] == str(lesson_id)
    assert payload["role"] == "student"
