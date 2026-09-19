import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from app.ai.pipeline import generate_note_block_for_window
from app.ai.schemas import CalloutItem, FrameRefItem, KeyTermItem, NoteBlockOutput
from app.models.lesson import Lesson


@pytest.mark.asyncio
async def test_generate_note_block_frame_filtering():
    lesson_id = uuid.uuid4()
    window_id = uuid.uuid4()
    valid_frame_id = uuid.uuid4()
    fake_frame_id = uuid.uuid4()

    mock_db = MagicMock()
    mock_db.flush = AsyncMock()
    mock_db.get = AsyncMock()
    mock_db.execute = AsyncMock()

    # Mock lesson
    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id
    mock_lesson.title = "Алгебра"
    mock_lesson.subject = "Математика"
    mock_lesson.language = "ru"
    mock_lesson.expected_terms = ["интеграл"]
    mock_db.get.return_value = mock_lesson

    # Mock empty segments and 1 valid frame
    mock_frame = MagicMock()
    mock_frame.id = valid_frame_id
    mock_frame.kind = "slide"
    mock_frame.title = "Слайд 1"
    mock_frame.ocr_markdown = "Текст"
    mock_frame.description = "Описание"
    mock_frame.annotations = []
    mock_frame.s3_key = "key.webp"
    mock_frame.s3_key_annotated = "key_ann.webp"

    mock_db_res = MagicMock()
    mock_db_res.scalars.return_value.all.side_effect = [
        [],                 # transcript segments
        [mock_frame],       # frames
        [],                 # prev blocks
    ]
    mock_db.execute.return_value = mock_db_res

    # Mock LLM provider response
    mock_llm = AsyncMock()
    mock_llm.generate.return_value = NoteBlockOutput(
        title="Интегралы Римана",
        summary="Определение интеграла через интегральные суммы.",
        body_md="Подробный текст с формулой $\\int_a^b f(x)dx$.",
        key_terms=[KeyTermItem(term="Интеграл", definition="Предел интегральных сумм")],
        callouts=[CalloutItem(kind="definition", text="Точное определение")],
        frame_refs=[
            FrameRefItem(frame_id=str(valid_frame_id), caption="Слайд с формулой"),
            FrameRefItem(frame_id=str(fake_frame_id), caption="Галлюцинация модели"),
        ],
        uncertain=[],
    )

    with patch("app.ai.pipeline.emit_persistent_event", new_callable=AsyncMock) as mock_emit:
        block = await generate_note_block_for_window(
            lesson_id=lesson_id,
            window_id=window_id,
            position=1,
            start_ms=0,
            end_ms=240000,
            db=mock_db,
            llm_provider=mock_llm,
        )

        assert block.title == "Интегралы Римана"
        assert block.position == 1
        # Check that fake_frame_id was filtered out
        assert len(block.frame_refs) == 1
        assert block.frame_refs[0]["frame_id"] == str(valid_frame_id)
        mock_emit.assert_called_once()
