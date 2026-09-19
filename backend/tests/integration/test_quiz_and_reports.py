from datetime import datetime, timezone
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import AsyncClient
from app.api.deps import get_db, get_lesson_for_user
from app.main import app
from app.models.lesson import Lesson
from app.models.quiz import Answer, Attempt, Quiz, QuizQuestion
from app.models.report import Report


@pytest.mark.asyncio
async def test_quiz_teacher_view_and_publish(
    async_client: AsyncClient, teacher_token: str, test_org_id: uuid.UUID
):
    lesson_id = uuid.uuid4()
    quiz_id = uuid.uuid4()

    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id
    mock_lesson.org_id = test_org_id
    mock_lesson.title = "Тестовый урок"
    mock_lesson.subject = "Алгебра"
    mock_lesson.language = "ru"

    mock_quiz = MagicMock(spec=Quiz)
    mock_quiz.id = quiz_id
    mock_quiz.lesson_id = lesson_id
    mock_quiz.version = 1
    mock_quiz.status = "draft"
    mock_quiz.created_at = datetime.now(timezone.utc)
    mock_quiz.published_at = None

    q1 = QuizQuestion(
        id=uuid.uuid4(),
        quiz_id=quiz_id,
        position=1,
        type="single",
        text="Чему равен корень из 16?",
        options=["2", "3", "4", "5"],
        correct=[2],
        rubric=None,
        explanation="4 * 4 = 16",
        difficulty="easy",
        topic="Арифметика",
        points=1.0,
    )

    mock_db = AsyncMock()
    # 1. Execute for get_quiz_teacher
    mock_res_quiz = MagicMock()
    mock_res_quiz.scalars.return_value.first.return_value = mock_quiz

    mock_res_q = MagicMock()
    mock_res_q.scalars.return_value.all.return_value = [q1]

    mock_db.execute = AsyncMock(side_effect=[mock_res_quiz, mock_res_q, mock_res_quiz, mock_res_q])
    mock_db.flush = AsyncMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    app.dependency_overrides[get_lesson_for_user] = lambda: mock_lesson
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        # GET quiz (Teacher view)
        resp = await async_client.get(
            f"/v1/lessons/{lesson_id}/quiz",
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == str(quiz_id)
        assert len(data["questions"]) == 1
        assert data["questions"][0]["correct"] == [2]
        assert data["questions"][0]["explanation"] == "4 * 4 = 16"

        # POST publish quiz
        with patch("app.api.routes.quiz.emit_persistent_event", new_callable=AsyncMock):
            resp_pub = await async_client.post(
                f"/v1/lessons/{lesson_id}/quiz/publish",
                headers={"Authorization": f"Bearer {teacher_token}"},
            )
            assert resp_pub.status_code == 200
            assert resp_pub.json()["status"] == "published"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_quiz_student_view_sanitized(
    async_client: AsyncClient, student_token: str, test_org_id: uuid.UUID
):
    lesson_id = uuid.uuid4()
    quiz_id = uuid.uuid4()

    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id
    mock_lesson.org_id = test_org_id

    mock_quiz = MagicMock(spec=Quiz)
    mock_quiz.id = quiz_id
    mock_quiz.lesson_id = lesson_id
    mock_quiz.version = 1
    mock_quiz.status = "published"

    q1 = QuizQuestion(
        id=uuid.uuid4(),
        quiz_id=quiz_id,
        position=1,
        type="single",
        text="Секретный вопрос",
        options=["А", "Б", "В", "Г"],
        correct=[0],  # Must be stripped
        explanation="Секретное объяснение",  # Must be stripped
        points=1.0,
    )

    mock_db = AsyncMock()
    mock_res_quiz = MagicMock()
    mock_res_quiz.scalars.return_value.first.return_value = mock_quiz

    mock_res_q = MagicMock()
    mock_res_q.scalars.return_value.all.return_value = [q1]

    mock_db.execute = AsyncMock(side_effect=[mock_res_quiz, mock_res_q])

    app.dependency_overrides[get_lesson_for_user] = lambda: mock_lesson
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        resp = await async_client.get(
            f"/v1/lessons/{lesson_id}/quiz/student",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["questions"]) == 1
        q_data = data["questions"][0]
        assert "correct" not in q_data
        assert "explanation" not in q_data
        assert "rubric" not in q_data
        assert q_data["text"] == "Секретный вопрос"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_attempt_submission_and_report_flow(
    async_client: AsyncClient, teacher_token: str, test_org_id: uuid.UUID
):
    lesson_id = uuid.uuid4()
    quiz_id = uuid.uuid4()
    report_id = uuid.uuid4()

    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id
    mock_lesson.org_id = test_org_id
    mock_lesson.title = "Урок с отчётом"

    mock_quiz = MagicMock(spec=Quiz)
    mock_quiz.id = quiz_id
    mock_quiz.lesson_id = lesson_id
    mock_quiz.version = 1

    mock_report = MagicMock(spec=Report)
    mock_report.id = report_id
    mock_report.lesson_id = lesson_id
    mock_report.quiz_id = quiz_id
    mock_report.stats = {
        "total_students": 5,
        "completed_count": 5,
        "avg_score": 85.0,
        "median_score": 90.0,
        "quartiles": {"q1": 70, "q2": 90, "q3": 95, "q4": 100},
        "questions": [],
        "topics": {},
        "at_risk_students": [],
    }
    mock_report.narrative = {
        "overview": "Хорошая успеваемость группы.",
        "weak_topics": [],
        "strong_topics": [],
        "common_misconceptions": [],
        "recommendations": ["Продолжить практику."],
    }
    mock_report.created_at = datetime.now(timezone.utc)

    mock_db = AsyncMock()
    mock_res_q = MagicMock()
    mock_res_q.scalars.return_value.first.return_value = mock_quiz

    mock_res_r = MagicMock()
    mock_res_r.scalar_one_or_none.return_value = mock_report

    mock_db.execute = AsyncMock(side_effect=[mock_res_q, mock_res_r])

    app.dependency_overrides[get_lesson_for_user] = lambda: mock_lesson
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        resp = await async_client.get(
            f"/v1/lessons/{lesson_id}/report",
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == str(report_id)
        assert data["stats"]["avg_score"] == 85.0
        assert data["narrative"]["overview"] == "Хорошая успеваемость группы."
    finally:
        app.dependency_overrides.clear()
