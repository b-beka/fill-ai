import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.api.routes.attendance import (
    export_attendance_report,
    generate_student_catchup,
    get_lesson_attendance,
    record_heartbeat,
)
from app.api.schemas.attendance import HeartbeatRequest
from app.core.security import CurrentUser
from app.models.attendance import StudentAttendance
from app.models.lesson import Lesson
from app.models.note import NoteBlock


@pytest.mark.asyncio
async def test_record_heartbeat_new_student_and_semantic_missed_blocks():
    lesson_id = uuid.uuid4()
    student_id = uuid.uuid4()

    lesson = Lesson(id=lesson_id, title="Асинхронный Python", subject="Программирование")

    # Lesson has two blocks: Block 1 (0 to 10 min), Block 2 (10 to 20 min)
    block1 = NoteBlock(
        id=uuid.uuid4(),
        lesson_id=lesson_id,
        title="Основы asyncio",
        body_md="Event loop управляет выполнением корутин.",
        t_start_ms=0,
        t_end_ms=600000,
    )
    block2 = NoteBlock(
        id=uuid.uuid4(),
        lesson_id=lesson_id,
        title="Асинхронные генераторы",
        body_md="async def gen(): yield x позволяет стримить данные без блокировки.",
        t_start_ms=600000,
        t_end_ms=1200000,
    )

    # Student joins late at minute 12 (720,000 ms)
    req = HeartbeatRequest(
        student_id=student_id,
        student_name="Алихан Ибрагимов",
        timestamp_ms=720000,
        is_tab_focused=True,
    )

    db = AsyncMock()
    # First query checks if StudentAttendance exists (returns None)
    # Second query fetches note blocks
    first_res = MagicMock()
    first_res.scalar_one_or_none.return_value = None

    second_res = MagicMock()
    second_res.scalars.return_value.all.return_value = [block1, block2]

    db.execute.side_effect = [first_res, second_res]

    resp = await record_heartbeat(req=req, lesson=lesson, db=db)

    assert resp.status == "active"
    assert resp.total_active_ms == 15000
    assert resp.focus_score == 1.0
    # Block 1 was missed! Block 2 is partially attended
    assert resp.has_missed_blocks is True
    assert resp.missed_blocks_count >= 1


@pytest.mark.asyncio
async def test_get_lesson_attendance_report():
    lesson_id = uuid.uuid4()
    student_id = uuid.uuid4()
    lesson = Lesson(id=lesson_id, title="Мембранные рецепторы", subject="Биология")

    block = NoteBlock(
        id=uuid.uuid4(),
        lesson_id=lesson_id,
        title="Строение рецептора",
        body_md="Рецепторы встроены в липидный бислой мембраны.",
        t_start_ms=0,
        t_end_ms=300000,
    )

    att = StudentAttendance(
        id=uuid.uuid4(),
        lesson_id=lesson_id,
        student_id=student_id,
        student_name="Аружан Сапарова",
        status="active",
        joined_at_ms=0,
        total_active_ms=2500000,
        focus_score=0.95,
        intervals=[{"start_ms": 0, "end_ms": 2500000, "is_focused": True}],
        missed_block_ids=[],
        tasks_answered=2,
        tasks_correct=2,
        catchup_sent=False,
    )

    db = AsyncMock()
    att_res = MagicMock()
    att_res.scalars.return_value.all.return_value = [att]

    block_res = MagicMock()
    block_res.scalars.return_value.all.return_value = [block]

    db.execute.side_effect = [att_res, block_res]

    user = CurrentUser(
        user_id=uuid.uuid4(),
        org_id=uuid.uuid4(),
        role="teacher",
        email="teacher@school.org",
    )

    report = await get_lesson_attendance(lesson=lesson, db=db, user=user)

    assert report.lesson_title == "Мембранные рецепторы"
    assert report.present_students_count == 1
    assert report.average_focus_score == 0.95
    assert len(report.students) == 1
    assert report.students[0].student_name == "Аружан Сапарова"
    assert report.students[0].tasks_correct == 2
    assert report.students[0].tasks_accuracy == 1.0
    assert len(report.pulse) > 0


@pytest.mark.asyncio
async def test_generate_student_catchup():
    lesson_id = uuid.uuid4()
    student_id = uuid.uuid4()
    block_id = uuid.uuid4()
    lesson = Lesson(id=lesson_id, title="IELTS Speaking Part 3", subject="English")

    block = NoteBlock(
        id=block_id,
        lesson_id=lesson_id,
        title="Cohesion and Linkers",
        body_md="Use discourse markers like Furthermore and In contrast. Do not repeat simple linkers.",
        t_start_ms=300000,
        t_end_ms=600000,
    )

    att = StudentAttendance(
        id=uuid.uuid4(),
        lesson_id=lesson_id,
        student_id=student_id,
        student_name="Данияр Сериков",
        status="active",
        joined_at_ms=600000,
        total_active_ms=1800000,
        focus_score=0.88,
        intervals=[],
        missed_block_ids=[str(block_id)],
    )

    db = AsyncMock()
    att_res = MagicMock()
    att_res.scalar_one_or_none.return_value = att

    block_res = MagicMock()
    block_res.scalars.return_value.all.return_value = [block]

    db.execute.side_effect = [att_res, block_res]

    user = CurrentUser(
        user_id=student_id,
        org_id=uuid.uuid4(),
        role="student",
        email="student@school.org",
    )

    catchup = await generate_student_catchup(
        student_id=student_id,
        lesson=lesson,
        db=db,
        user=user,
    )

    assert catchup.student_name == "Данияр Сериков"
    assert catchup.missed_topics_count == 1
    assert len(catchup.bullet_points) == 1
    assert "Cohesion and Linkers" in catchup.bullet_points[0]
    assert att.catchup_sent is True


@pytest.mark.asyncio
async def test_export_attendance_report():
    lesson_id = uuid.uuid4()
    student_id = uuid.uuid4()
    lesson = Lesson(id=lesson_id, title="Фейдинг и тушевка", subject="Парикмахерское дело")

    att = StudentAttendance(
        id=uuid.uuid4(),
        lesson_id=lesson_id,
        student_id=student_id,
        student_name="Максим Ковалев",
        status="active",
        joined_at_ms=0,
        total_active_ms=2700000,
        focus_score=0.92,
        intervals=[],
        missed_block_ids=[],
        tasks_answered=1,
        tasks_correct=1,
        catchup_sent=False,
    )

    db = AsyncMock()
    att_res = MagicMock()
    att_res.scalars.return_value.all.return_value = [att]
    block_res = MagicMock()
    block_res.scalars.return_value.all.return_value = []
    db.execute.side_effect = [att_res, block_res]

    user = CurrentUser(
        user_id=uuid.uuid4(),
        org_id=uuid.uuid4(),
        role="teacher",
        email="teacher@school.org",
    )

    # Test WhatsApp format
    resp_wa = await export_attendance_report(
        lesson=lesson,
        db=db,
        export_format="whatsapp",
        user=user,
    )
    assert resp_wa.format == "whatsapp"
    assert "ОТЧЕТ ПО УРОКУ" in resp_wa.content
    assert "Максим Ковалев" in resp_wa.content
    assert "FILL AI" in resp_wa.content

    # Test CSV format
    db.execute.side_effect = [att_res, block_res]
    resp_csv = await export_attendance_report(
        lesson=lesson,
        db=db,
        export_format="csv",
        user=user,
    )
    assert resp_csv.format == "csv"
    assert "Студент;Статус" in resp_csv.content
    assert "Максим Ковалев" in resp_csv.content
