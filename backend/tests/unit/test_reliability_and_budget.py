from datetime import datetime, timezone
import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.ai.budget import check_budget_and_get_model
from app.core.stream_dlq import StreamDlqManager
from app.media.watchdog import MediaBotWatchdog
from app.models.lesson import Lesson
from app.models.transcript import TranscriptSegment
from app.models.window import Window
from app.workers.retention import run_retention_cleanup


@pytest.mark.asyncio
async def test_budget_threshold_enforcement():
    lesson_id = uuid.uuid4()
    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id
    mock_lesson.cost_usd = 3.50  # Over $3.00 limit

    mock_db = AsyncMock()
    mock_db.get = AsyncMock(return_value=mock_lesson)

    with patch("app.ai.budget.emit_persistent_event", new_callable=AsyncMock) as mock_emit:
        model, is_degraded = await check_budget_and_get_model(
            lesson_id=lesson_id,
            default_model="gemini-3.6-flash",
            db=mock_db,
        )
        assert is_degraded is True
        assert model == "gemini-3.5-flash-lite"
        mock_emit.assert_called_once()
        assert mock_emit.call_args.kwargs["data"]["code"] == "budget_degraded"


@pytest.mark.asyncio
async def test_dlq_fallback_note_block():
    lesson_id = uuid.uuid4()
    window_id = uuid.uuid4()

    mock_window = MagicMock(spec=Window)
    mock_window.id = window_id
    mock_window.start_ms = 0
    mock_window.end_ms = 120000

    seg = MagicMock(spec=TranscriptSegment)
    seg.speaker = "Учитель"
    seg.text = "Сегодня мы изучаем основы механики и законы Ньютона."

    mock_db = AsyncMock()
    mock_db.get = AsyncMock(return_value=mock_window)

    mock_b_res = MagicMock()
    mock_b_res.scalar_one_or_none.return_value = None  # Block does not exist yet

    mock_t_res = MagicMock()
    mock_t_res.scalars.return_value.all.return_value = [seg]

    mock_db.execute = AsyncMock(side_effect=[mock_b_res, mock_t_res])
    mock_db.add = MagicMock()
    mock_db.flush = AsyncMock()
    mock_db.commit = AsyncMock()

    manager = StreamDlqManager()

    with patch("app.core.stream_dlq.emit_persistent_event", new_callable=AsyncMock) as mock_emit:
        block = await manager.create_fallback_note_block(
            lesson_id=lesson_id,
            window_id=window_id,
            position=1,
            db=mock_db,
        )
        assert block is not None
        assert "Учитель: Сегодня мы изучаем основы механики" in block.body_md
        assert block.callouts[0]["kind"] == "warning"
        mock_emit.assert_called_once()
        assert mock_emit.call_args.kwargs["event_type"] == "note.block.created"


@pytest.mark.asyncio
async def test_watchdog_restart_trigger():
    lesson_id = uuid.uuid4()
    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id
    mock_lesson.status = "live"
    mock_lesson.livekit_room = "room-test"
    mock_lesson.language = "ru"

    mock_db = AsyncMock()
    mock_live_res = MagicMock()
    mock_live_res.scalars.return_value.all.return_value = [mock_lesson]

    mock_db.execute = AsyncMock(side_effect=[
        mock_live_res,  # for check_live_lessons
        MagicMock(scalar_one_or_none=MagicMock(return_value=None)),  # transcript
        MagicMock(scalar_one_or_none=MagicMock(return_value=None)),  # window
        MagicMock(scalar_one_or_none=MagicMock(return_value=None)),  # frame
    ])
    mock_db.commit = AsyncMock()

    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value=None)  # Stale/missing heartbeat

    watchdog = MediaBotWatchdog()

    with patch("app.media.watchdog.get_redis_client", return_value=mock_redis), \
         patch("app.media.watchdog.add_to_stream", new_callable=AsyncMock) as mock_add_stream, \
         patch("app.media.watchdog.emit_persistent_event", new_callable=AsyncMock) as mock_emit:

        restarted = await watchdog.check_live_lessons(mock_db)
        assert lesson_id in restarted
        mock_add_stream.assert_called_once()
        assert mock_add_stream.call_args.args[1]["command"] == "restart"
        mock_emit.assert_called_once()
        assert mock_emit.call_args.kwargs["data"]["code"] == "bot_watchdog_restart"


@pytest.mark.asyncio
async def test_retention_cleanup_execution():
    frame1 = MagicMock()
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = [frame1]
    mock_db.execute = AsyncMock(return_value=mock_res)
    mock_db.delete = AsyncMock()
    mock_db.commit = AsyncMock()

    class MockContext:
        async def __aenter__(self):
            return mock_db
        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

    cleaned = await run_retention_cleanup(db_factory=lambda: MockContext())
    assert cleaned == 1
    mock_db.delete.assert_called_once_with(frame1)
