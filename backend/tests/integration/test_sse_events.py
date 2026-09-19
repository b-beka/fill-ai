import uuid
from unittest.mock import AsyncMock, patch
import pytest
from httpx import AsyncClient
from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_sse_token_unauthorized(async_client: AsyncClient):
    lesson_id = uuid.uuid4()
    response = await async_client.post(f"/v1/lessons/{lesson_id}/sse-token")
    assert response.status_code == 401
    assert response.headers.get("content-type") == "application/problem+json"


@pytest.mark.asyncio
async def test_sse_token_generation_success(
    async_client: AsyncClient, student_token: str, test_org_id: uuid.UUID
):
    from app.api.deps import get_lesson_for_user
    from app.main import app

    lesson_id = uuid.uuid4()

    mock_lesson = AsyncMock()
    mock_lesson.id = lesson_id
    mock_lesson.org_id = test_org_id

    app.dependency_overrides[get_lesson_for_user] = lambda: mock_lesson
    try:
        response = await async_client.post(
            f"/v1/lessons/{lesson_id}/sse-token",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["expires_in"] == 300
    finally:
        app.dependency_overrides.pop(get_lesson_for_user, None)


@pytest.mark.asyncio
async def test_stream_events_missing_token(async_client: AsyncClient):
    lesson_id = uuid.uuid4()
    response = await async_client.get(f"/v1/lessons/{lesson_id}/events")
    assert response.status_code == 401
    assert response.headers.get("content-type") == "application/problem+json"
