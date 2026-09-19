import uuid
from typing import AsyncGenerator
from unittest.mock import AsyncMock, patch
import pytest
from httpx import ASGITransport, AsyncClient
from app.core.security import create_access_token
from app.main import app


@pytest.fixture
def test_org_id() -> uuid.UUID:
    return uuid.UUID("11111111-1111-1111-1111-111111111111")


@pytest.fixture
def other_org_id() -> uuid.UUID:
    return uuid.UUID("22222222-2222-2222-2222-222222222222")


@pytest.fixture
def test_teacher_id() -> uuid.UUID:
    return uuid.UUID("33333333-3333-3333-3333-333333333333")


@pytest.fixture
def test_student_id() -> uuid.UUID:
    return uuid.UUID("44444444-4444-4444-4444-444444444444")


@pytest.fixture
def teacher_token(test_teacher_id: uuid.UUID, test_org_id: uuid.UUID) -> str:
    return create_access_token(
        user_id=test_teacher_id,
        role="teacher",
        org_id=test_org_id,
    )


@pytest.fixture
def student_token(test_student_id: uuid.UUID, test_org_id: uuid.UUID) -> str:
    return create_access_token(
        user_id=test_student_id,
        role="student",
        org_id=test_org_id,
    )


@pytest.fixture
def admin_token(test_org_id: uuid.UUID) -> str:
    return create_access_token(
        user_id=uuid.uuid4(),
        role="admin",
        org_id=test_org_id,
    )


@pytest.fixture
def other_org_teacher_token(other_org_id: uuid.UUID) -> str:
    return create_access_token(
        user_id=uuid.uuid4(),
        role="teacher",
        org_id=other_org_id,
    )


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
