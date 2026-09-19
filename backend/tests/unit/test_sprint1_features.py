import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.asr.base import AsrEvent, AsrSegment
from app.asr.normalize import TranscriptNormalizer
from app.models.lesson import Lesson
from app.models.note import LessonSummary, NoteBlock
from app.models.transcript import TranscriptSegment


@pytest.mark.asyncio
async def test_transcript_normalizer_word_level_timestamps():
    lesson_id = uuid.uuid4()
    normalizer = TranscriptNormalizer(lesson_id)
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    # Feed tokens with word timings
    seg1 = AsrSegment(
        start_ms=1000,
        end_ms=1400,
        text="Здравствуйте",
        words=[{"word": "Здравствуйте", "start_ms": 1000, "end_ms": 1400}],
    )
    seg2 = AsrSegment(
        start_ms=1500,
        end_ms=2000,
        text="ученики.",
        words=[{"word": "ученики.", "start_ms": 1500, "end_ms": 2000}],
    )

    with patch("app.asr.normalize.emit_persistent_event", new_callable=AsyncMock) as mock_emit:
        mock_emit.return_value = {"seq": 1, "type": "transcript.final"}

        await normalizer.process_event(AsrEvent(type="final", segment=seg1), mock_db)
        res = await normalizer.process_event(AsrEvent(type="final", segment=seg2, is_endpoint=True), mock_db)

        assert res is not None
        assert mock_emit.called
        call_args = mock_emit.call_args[1]
        data = call_args["data"]

        assert data["text"] == "Здравствуйте ученики."
        assert "words" in data
        assert len(data["words"]) == 2
        assert data["words"][0]["word"] == "Здравствуйте"
        assert data["words"][1]["word"] == "ученики."


@pytest.mark.asyncio
async def test_anki_export_format():
    from app.api.routes.lessons import export_lesson

    lesson_id = uuid.uuid4()
    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id
    mock_lesson.title = "Основы квантовой физики"
    mock_lesson.subject = "Физика"

    mock_summary = MagicMock(spec=LessonSummary)
    mock_summary.glossary = [
        {"term": "Фотон", "definition": "Элементарная частица, квант света."},
        {"term": "Волновая функция", "definition": "Функция, описывающая состояние квантовой системы."},
    ]
    mock_summary.tldr = "TL;DR"
    mock_summary.takeaways = []
    mock_summary.homework = ""

    mock_block = MagicMock(spec=NoteBlock)
    mock_block.title = "Фотоэффект"
    mock_block.key_terms = [
        {"term": "Красная граница", "definition": "Минимальная частота света, вызывающая фотоэффект."}
    ]

    mock_db = AsyncMock()
    mock_res_b = MagicMock()
    mock_res_b.scalars.return_value.all.return_value = [mock_block]

    mock_res_s = MagicMock()
    mock_res_s.scalar_one_or_none.return_value = mock_summary

    mock_db.execute = AsyncMock(side_effect=[mock_res_b, mock_res_s])

    resp = await export_lesson(
        lesson=mock_lesson,
        format="anki",
        db=mock_db,
    )

    assert resp.status_code == 200
    assert resp.media_type == "text/tab-separated-values; charset=utf-8"
    content = resp.body.decode("utf-8")

    assert "#separator:tab" in content
    assert "Front\tBack" in content
    assert "Фотон\tЭлементарная частица, квант света." in content
    assert "Красная граница\tМинимальная частота света, вызывающая фотоэффект.<br><small><i>(Тема: Фотоэффект)</i></small>" in content


@pytest.mark.asyncio
async def test_moderated_visibility_mode_block_approval():
    from app.api.routes.lessons import approve_note_block, get_lesson_state
    from app.core.security import CurrentUser

    lesson_id = uuid.uuid4()
    block_id = uuid.uuid4()

    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id
    mock_lesson.visibility_mode = "moderated"
    mock_lesson.last_seq = 10
    mock_lesson.org_id = uuid.uuid4()

    mock_block_pending = MagicMock(spec=NoteBlock)
    mock_block_pending.id = block_id
    mock_block_pending.lesson_id = lesson_id
    mock_block_pending.position = 1
    mock_block_pending.title = "Введение"
    mock_block_pending.summary = "Кратко"
    mock_block_pending.body_md = "Контент"
    mock_block_pending.status = "pending_review"
    mock_block_pending.key_terms = []
    mock_block_pending.callouts = []
    mock_block_pending.frame_refs = []
    mock_block_pending.uncertain = []
    mock_block_pending.version = 1
    mock_block_pending.edited_by_teacher = False
    mock_block_pending.t_start_ms = 0
    mock_block_pending.t_end_ms = 120000

    mock_db = AsyncMock()
    mock_db.get = AsyncMock(return_value=mock_block_pending)
    mock_db.flush = AsyncMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    teacher_user = CurrentUser(
        user_id=uuid.uuid4(),
        role="teacher",
        org_id=mock_lesson.org_id,
        permissions=["edit_lesson"],
    )

    with patch("app.api.routes.lessons.emit_persistent_event", new_callable=AsyncMock) as mock_emit:
        approved_payload = await approve_note_block(
            block_id=block_id,
            lesson=mock_lesson,
            db=mock_db,
            user=teacher_user,
        )

        assert approved_payload["status"] == "approved"
        assert mock_block_pending.status == "approved"
        assert mock_emit.called
        call_args = mock_emit.call_args[1]
        assert call_args["event_type"] == "note.block.approved"
        assert call_args["data"]["status"] == "approved"
