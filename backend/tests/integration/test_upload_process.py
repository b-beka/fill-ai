from datetime import datetime, timezone
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import AsyncClient
from app.api.deps import get_db, get_lesson_for_user
from app.main import app
from app.models.lesson import Lesson


@pytest.mark.asyncio
async def test_upload_url_invalid_source(
    async_client: AsyncClient, teacher_token: str, test_org_id: uuid.UUID
):
    lesson_id = uuid.uuid4()
    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id
    mock_lesson.org_id = test_org_id
    mock_lesson.source = "live"
    mock_lesson.status = "created"

    mock_db = AsyncMock()
    app.dependency_overrides[get_lesson_for_user] = lambda: mock_lesson
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        resp = await async_client.post(
            f"/v1/lessons/{lesson_id}/upload-url",
            headers={"Authorization": f"Bearer {teacher_token}"},
            json={"filename": "lecture.mp4"},
        )
        assert resp.status_code == 400
        data = resp.json()
        assert data["code"] == "invalid_source"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_upload_url_unsupported_extension(
    async_client: AsyncClient, teacher_token: str, test_org_id: uuid.UUID
):
    lesson_id = uuid.uuid4()
    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id
    mock_lesson.org_id = test_org_id
    mock_lesson.source = "upload"
    mock_lesson.status = "created"

    mock_db = AsyncMock()
    app.dependency_overrides[get_lesson_for_user] = lambda: mock_lesson
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        resp = await async_client.post(
            f"/v1/lessons/{lesson_id}/upload-url",
            headers={"Authorization": f"Bearer {teacher_token}"},
            json={"filename": "script.sh"},
        )
        assert resp.status_code == 400
        data = resp.json()
        assert data["code"] == "unsupported_file_extension"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_upload_url_success(
    async_client: AsyncClient, teacher_token: str, test_org_id: uuid.UUID
):
    lesson_id = uuid.uuid4()
    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id
    mock_lesson.org_id = test_org_id
    mock_lesson.source = "upload"
    mock_lesson.status = "created"

    mock_db = AsyncMock()
    mock_db.flush = AsyncMock()
    mock_db.commit = AsyncMock()

    app.dependency_overrides[get_lesson_for_user] = lambda: mock_lesson
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        with patch("app.api.routes.lessons.get_presigned_url", return_value="https://s3.example.com/put-upload"), \
             patch("app.api.routes.lessons.emit_persistent_event", new_callable=AsyncMock):

            resp = await async_client.post(
                f"/v1/lessons/{lesson_id}/upload-url",
                headers={"Authorization": f"Bearer {teacher_token}"},
                json={"filename": "physics_lesson.mp4"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["upload_url"] == "https://s3.example.com/put-upload"
            assert data["s3_key"] == f"lessons/{lesson_id}/input.mp4"
            assert data["expires_in"] == 3600
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_process_uploaded_lesson_file_not_found(
    async_client: AsyncClient, teacher_token: str, test_org_id: uuid.UUID
):
    lesson_id = uuid.uuid4()
    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id
    mock_lesson.org_id = test_org_id
    mock_lesson.source = "upload"
    mock_lesson.status = "uploaded"

    mock_db = AsyncMock()
    app.dependency_overrides[get_lesson_for_user] = lambda: mock_lesson
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        with patch("app.api.routes.lessons.head_object", side_effect=Exception("NoSuchKey")):
            resp = await async_client.post(
                f"/v1/lessons/{lesson_id}/process",
                headers={"Authorization": f"Bearer {teacher_token}"},
                json={"s3_key": f"lessons/{lesson_id}/input.mp4"},
            )
            assert resp.status_code == 404
            data = resp.json()
            assert data["code"] == "file_not_found"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_process_uploaded_lesson_success(
    async_client: AsyncClient, teacher_token: str, test_org_id: uuid.UUID
):
    lesson_id = uuid.uuid4()
    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id
    mock_lesson.org_id = test_org_id
    mock_lesson.group_id = None
    mock_lesson.teacher_id = uuid.uuid4()
    mock_lesson.title = "Uploaded Lesson"
    mock_lesson.subject = "Math"
    mock_lesson.language = "ru"
    mock_lesson.source = "upload"
    mock_lesson.status = "uploaded"
    mock_lesson.expected_terms = []
    mock_lesson.roi = None
    mock_lesson.livekit_room = None
    mock_lesson.last_seq = 2
    mock_lesson.cost_usd = 0.0
    mock_lesson.started_at = None
    mock_lesson.ended_at = None
    mock_lesson.created_at = datetime.now(timezone.utc)

    mock_db = AsyncMock()
    mock_db.flush = AsyncMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    app.dependency_overrides[get_lesson_for_user] = lambda: mock_lesson
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        with patch("app.api.routes.lessons.head_object", return_value={"ContentLength": 50000000}), \
             patch("app.api.routes.lessons.emit_persistent_event", new_callable=AsyncMock), \
             patch("app.workers.file_processor.FileProcessor.process_lesson_recording", new_callable=AsyncMock):

            resp = await async_client.post(
                f"/v1/lessons/{lesson_id}/process",
                headers={"Authorization": f"Bearer {teacher_token}"},
                json={"s3_key": f"lessons/{lesson_id}/input.mp4"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "processing"
    finally:
        app.dependency_overrides.clear()
