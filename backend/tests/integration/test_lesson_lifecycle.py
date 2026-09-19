from datetime import datetime, timezone
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import AsyncClient
from app.api.deps import get_db, get_lesson_for_user
from app.main import app
from app.models.lesson import Lesson
from app.models.note import LessonSummary, NoteBlock


@pytest.mark.asyncio
async def test_lesson_lifecycle_start_and_end(
    async_client: AsyncClient, teacher_token: str, test_org_id: uuid.UUID
):
    lesson_id = uuid.uuid4()
    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id
    mock_lesson.org_id = test_org_id
    mock_lesson.group_id = None
    mock_lesson.teacher_id = uuid.uuid4()
    mock_lesson.title = "Тестовый урок"
    mock_lesson.subject = "Физика"
    mock_lesson.language = "ru"
    mock_lesson.source = "live"
    mock_lesson.status = "created"
    mock_lesson.expected_terms = []
    mock_lesson.roi = None
    mock_lesson.livekit_room = f"room-{lesson_id}"
    mock_lesson.last_seq = 1
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
        with patch("app.api.routes.lessons.emit_persistent_event", new_callable=AsyncMock), \
             patch("app.api.routes.lessons.add_to_stream", new_callable=AsyncMock), \
             patch("app.api.routes.lessons.finalize_lesson", new_callable=AsyncMock):

            # 1. Start lesson
            resp_start = await async_client.post(
                f"/v1/lessons/{lesson_id}/start",
                headers={"Authorization": f"Bearer {teacher_token}"},
            )
            assert resp_start.status_code == 200
            assert resp_start.json()["status"] == "live"

            # 2. End lesson
            resp_end = await async_client.post(
                f"/v1/lessons/{lesson_id}/end",
                headers={"Authorization": f"Bearer {teacher_token}"},
            )
            assert resp_end.status_code == 200
            assert resp_end.json()["status"] == "processing"
    finally:
        app.dependency_overrides.pop(get_lesson_for_user, None)
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_lesson_export_markdown(
    async_client: AsyncClient, teacher_token: str, test_org_id: uuid.UUID
):
    lesson_id = uuid.uuid4()
    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id
    mock_lesson.org_id = test_org_id
    mock_lesson.title = "Основы квантовой физики"
    mock_lesson.subject = "Физика"

    mock_block = MagicMock(spec=NoteBlock)
    mock_block.position = 1
    mock_block.title = "Волновой дуализм"
    mock_block.body_md = "Свет проявляет свойства как волны, так и частицы."
    mock_block.key_terms = [{"term": "Фотон", "definition": "Квант света"}]
    mock_block.callouts = [{"kind": "tip", "text": "Запомните формулу де Бройля"}]

    mock_summary = MagicMock(spec=LessonSummary)
    mock_summary.tldr = "Урок о дуализме света."
    mock_summary.takeaways = ["Фотон неделим", "Длина волны связана с импульсом"]
    mock_summary.homework = "Параграф 4, задачи 1-5"

    mock_db_res = MagicMock()
    mock_db_res.scalars.return_value.all.return_value = [mock_block]
    mock_db_res.scalar_one_or_none.return_value = mock_summary

    mock_session = AsyncMock()
    mock_session.execute.return_value = mock_db_res

    app.dependency_overrides[get_lesson_for_user] = lambda: mock_lesson
    app.dependency_overrides[get_db] = lambda: mock_session

    try:
        response = await async_client.get(
            f"/v1/lessons/{lesson_id}/export?format=md",
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        assert response.status_code == 200
        assert "text/markdown" in response.headers["content-type"]
        md_text = response.text
        assert "# Основы квантовой физики" in md_text
        assert "Волновой дуализм" in md_text
        assert "Фотон" in md_text
        assert "Параграф 4" in md_text
    finally:
        app.dependency_overrides.pop(get_lesson_for_user, None)
        app.dependency_overrides.pop(get_db, None)
