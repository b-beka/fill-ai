import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.ai.tasks.extractor import (
    DiagnosticOutput,
    LiveTaskExtractionOutput,
    LiveTaskOptionOutput,
    extract_live_task_from_speech,
    generate_teacher_diagnostic,
)
from app.api.routes.tasks import (
    close_live_task,
    get_active_live_task,
    submit_task_response,
)
from app.api.schemas.live_task import (
    LiveTaskStudentView,
    StudentTaskResponseRequest,
)
from app.core.security import CurrentUser
from app.models.lesson import Lesson
from app.models.live_task import LiveTask, LiveTaskResponse


@pytest.mark.asyncio
async def test_extract_live_task_from_speech_positive():
    mock_provider = AsyncMock()
    mock_provider.generate.return_value = LiveTaskExtractionOutput(
        is_task=True,
        confidence=0.95,
        question="Чему равна сила тока в проводнике при $U = 12$ В и $R = 4$ Ом?",
        kind="single_choice",
        options=[
            LiveTaskOptionOutput(
                id="A",
                text="3 А",
                is_correct=True,
                explanation="Верно! По закону Ома: I = U / R = 12 / 4 = 3 А.",
            ),
            LiveTaskOptionOutput(
                id="B",
                text="0.33 А",
                is_correct=False,
                explanation="Ошибка: ты разделил R на U, а нужно I = U / R.",
            ),
            LiveTaskOptionOutput(
                id="C",
                text="48 А",
                is_correct=False,
                explanation="Ошибка: ты перемножил U и R вместо деления.",
            ),
        ],
        correct_option_id="A",
        time_limit_seconds=25,
        teacher_intent_snippet="прикиньте, какой ток пойдет",
    )

    res = await extract_live_task_from_speech(
        transcript_window="Допустим, напряжение 12 вольт, сопротивление 4 ома. Ну-ка, быстро прикиньте, какой ток пойдет?",
        slide_text="Закон Ома для участка цепи: I = U / R",
        provider=mock_provider,
    )

    assert res is not None
    assert res.is_task is True
    assert res.confidence >= 0.80
    assert len(res.options) == 3
    assert res.correct_option_id == "A"
    assert res.options[0].is_correct is True
    assert "Верно" in res.options[0].explanation


@pytest.mark.asyncio
async def test_extract_live_task_from_speech_rhetorical_ignored():
    mock_provider = AsyncMock()
    mock_provider.generate.return_value = LiveTaskExtractionOutput(
        is_task=False,
        confidence=0.15,
        question="",
        kind="single_choice",
        options=[],
    )

    res = await extract_live_task_from_speech(
        transcript_window="И что же мы видим? Ничего удивительного, правда ведь ребят?",
        slide_text=None,
        provider=mock_provider,
    )

    assert res is None


@pytest.mark.asyncio
async def test_student_response_redis_counters_and_feedback():
    lesson_id = uuid.uuid4()
    task_id = uuid.uuid4()
    student_id = uuid.uuid4()

    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id

    mock_task = MagicMock(spec=LiveTask)
    mock_task.id = task_id
    mock_task.lesson_id = lesson_id
    mock_task.status = "active"
    mock_task.kind = "single_choice"
    mock_task.options = [
        {"id": "A", "text": "3 А", "is_correct": True, "explanation": "Верно: 12/4 = 3 А"},
        {"id": "B", "text": "0.33 А", "is_correct": False, "explanation": "Ошибка деления"},
    ]
    mock_task.correct_option_id = "A"

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_db.get.return_value = mock_task
    # No existing response in DB
    mock_db_res = MagicMock()
    mock_db_res.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_db_res

    mock_redis = AsyncMock()
    # First vote: no prev vote
    mock_redis.hget.return_value = None
    mock_redis.hgetall.return_value = {"A": "1"}

    student_user = CurrentUser(
        user_id=student_id,
        role="student",
        org_id=uuid.uuid4(),
    )

    req = StudentTaskResponseRequest(selected_option="A", response_ms=1200)

    with patch("app.api.routes.tasks.emit_ephemeral_event", new_callable=AsyncMock) as mock_emit:
        resp = await submit_task_response(
            task_id=task_id,
            req=req,
            lesson=mock_lesson,
            db=mock_db,
            redis=mock_redis,
            user=student_user,
        )

        assert resp.is_correct is True
        assert resp.selected_option == "A"
        assert "Верно" in resp.feedback

        # Check Redis commands
        mock_redis.hset.assert_called_with(f"task:{task_id}:voters", str(student_id), "A")
        mock_redis.hincrby.assert_called_with(f"task:{task_id}:counts", "A", 1)
        mock_emit.assert_called_once()


@pytest.mark.asyncio
async def test_close_live_task_and_diagnostic():
    lesson_id = uuid.uuid4()
    task_id = uuid.uuid4()

    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id

    mock_task = MagicMock(spec=LiveTask)
    mock_task.id = task_id
    mock_task.lesson_id = lesson_id
    mock_task.question = "Чему равен ток?"
    mock_task.options = [
        {"id": "A", "text": "3 А", "is_correct": True},
        {"id": "B", "text": "0.33 А", "is_correct": False},
    ]
    mock_task.correct_option_id = "A"

    mock_db = AsyncMock()
    mock_db.get.return_value = mock_task

    mock_redis = AsyncMock()
    mock_redis.hgetall.return_value = {"A": "18", "B": "2"}

    teacher_user = CurrentUser(
        user_id=uuid.uuid4(),
        role="teacher",
        org_id=uuid.uuid4(),
    )

    with patch("app.api.routes.tasks.generate_teacher_diagnostic", new_callable=AsyncMock) as mock_diag, \
         patch("app.api.routes.tasks.emit_persistent_event", new_callable=AsyncMock) as mock_emit:
        mock_diag.return_value = "90% класса ответили верно. 2 ученика перепутали формулу."

        closed_task = await close_live_task(
            task_id=task_id,
            lesson=mock_lesson,
            db=mock_db,
            redis=mock_redis,
            user=teacher_user,
        )

        assert closed_task.status == "revealed"
        assert closed_task.stats["total"] == 20
        assert closed_task.stats["accuracy"] == 0.9
        assert closed_task.ai_commentary == "90% класса ответили верно. 2 ученика перепутали формулу."
        mock_emit.assert_called_once()


@pytest.mark.asyncio
async def test_student_view_sanitizes_answers():
    lesson_id = uuid.uuid4()
    task_id = uuid.uuid4()

    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id

    mock_task = MagicMock(spec=LiveTask)
    mock_task.id = task_id
    mock_task.lesson_id = lesson_id
    mock_task.question = "Чему равен ток?"
    mock_task.kind = "single_choice"
    mock_task.time_limit_seconds = 30
    mock_task.started_at_ms = 1000
    mock_task.status = "active"
    mock_task.options = [
        {"id": "A", "text": "3 А", "is_correct": True, "explanation": "Секретный правильный ответ"},
        {"id": "B", "text": "0.33 А", "is_correct": False, "explanation": "Неправильно"},
    ]

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = mock_task
    mock_db.execute.return_value = mock_res

    student_user = CurrentUser(
        user_id=uuid.uuid4(),
        role="student",
        org_id=uuid.uuid4(),
    )

    view = await get_active_live_task(
        lesson=mock_lesson,
        db=mock_db,
        user=student_user,
    )

    assert isinstance(view, LiveTaskStudentView)
    assert len(view.options) == 2
    # Ensure is_correct and explanation are stripped from student view
    for opt in view.options:
        assert "is_correct" not in opt
        assert "explanation" not in opt
        assert "id" in opt
        assert "text" in opt
