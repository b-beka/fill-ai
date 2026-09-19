import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_healthz(async_client: AsyncClient):
    response = await async_client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_metrics_endpoint(async_client: AsyncClient):
    response = await async_client.get("/metrics")
    assert response.status_code == 200
    assert "http_requests_total" in response.text


@pytest.mark.asyncio
async def test_create_lesson_unauthorized(async_client: AsyncClient):
    response = await async_client.post(
        "/v1/lessons",
        json={
            "title": "Урок физики",
            "language": "ru",
            "source": "upload",
            "consent_confirmed": True,
        },
    )
    # Should return RFC 7807 problem+json
    assert response.status_code == 401
    assert response.headers.get("content-type") == "application/problem+json"
    data = response.json()
    assert data["code"] == "missing_token"


@pytest.mark.asyncio
async def test_create_lesson_forbidden_for_student(
    async_client: AsyncClient, student_token: str
):
    response = await async_client.post(
        "/v1/lessons",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "title": "Урок физики",
            "language": "ru",
            "source": "upload",
            "consent_confirmed": True,
        },
    )
    assert response.status_code == 403
    assert response.headers.get("content-type") == "application/problem+json"
    data = response.json()
    assert data["code"] == "forbidden_role"


@pytest.mark.asyncio
async def test_create_lesson_live_requires_consent(
    async_client: AsyncClient, teacher_token: str
):
    # Missing consent_confirmed=True for source='live'
    response = await async_client.post(
        "/v1/lessons",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "title": "Прямой эфир: Математика",
            "language": "ru",
            "source": "live",
            "consent_confirmed": False,
        },
    )
    assert response.status_code == 400
    assert response.headers.get("content-type") == "application/problem+json"
    data = response.json()
    assert data["code"] == "consent_required"
