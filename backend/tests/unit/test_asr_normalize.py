import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from app.asr.base import AsrEvent, AsrSegment
from app.asr.normalize import TranscriptNormalizer


@pytest.mark.asyncio
async def test_normalize_partial_event():
    lesson_id = uuid.uuid4()
    normalizer = TranscriptNormalizer(lesson_id)
    mock_db = AsyncMock()

    partial_event = AsrEvent(
        type="partial",
        segment=AsrSegment(
            start_ms=1000,
            end_ms=1500,
            text="Сегодня мы изучаем",
            lang="ru",
        ),
    )

    with patch("app.asr.normalize.emit_ephemeral_event", new_callable=AsyncMock) as mock_emit:
        mock_emit.return_value = {"type": "transcript.partial"}
        res = await normalizer.process_event(partial_event, mock_db)

        assert res is not None
        assert res["type"] == "transcript.partial"
        mock_emit.assert_called_once()
        # DB should not be touched for partial events
        mock_db.add.assert_not_called()


@pytest.mark.asyncio
async def test_normalize_final_sentence_grouping_and_flush():
    lesson_id = uuid.uuid4()
    normalizer = TranscriptNormalizer(lesson_id)
    mock_db = MagicMock()
    mock_db.flush = AsyncMock()

    # Word 1
    event1 = AsrEvent(
        type="final",
        segment=AsrSegment(start_ms=0, end_ms=500, text="Первое", lang="ru"),
        is_endpoint=False,
    )
    # Word 2
    event2 = AsrEvent(
        type="final",
        segment=AsrSegment(start_ms=510, end_ms=900, text="слово.", lang="ru"),
        is_endpoint=True,
    )

    with patch("app.asr.normalize.emit_persistent_event", new_callable=AsyncMock) as mock_emit_pers:
        mock_emit_pers.return_value = {"type": "transcript.final", "seq": 1}

        # First word should be buffered
        res1 = await normalizer.process_event(event1, mock_db)
        assert res1 is None

        # Second word ends with punctuation -> triggers flush
        res2 = await normalizer.process_event(event2, mock_db)
        assert res2 is not None
        assert res2["type"] == "transcript.final"

        # Check that TranscriptSegment was added to DB
        mock_db.add.assert_called_once()
        added_segment = mock_db.add.call_args[0][0]
        assert added_segment.text == "Первое слово."
        assert added_segment.start_ms == 0
        assert added_segment.end_ms == 900
