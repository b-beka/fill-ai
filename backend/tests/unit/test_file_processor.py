import os
import tempfile
import uuid
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.asr.base import AsrEvent, AsrSegment
from app.asr.soniox_async import SonioxAsyncClient
from app.workers.file_processor import FileProcessor


@pytest.mark.asyncio
async def test_soniox_async_client_fallback():
    client = SonioxAsyncClient(api_key="dummy-key")
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(b"RIFF" + b"\x00" * 40 + b"\x00" * 16000)
        temp_path = f.name

    try:
        # With dummy key and no live Groq, should fall back safely without unhandled exception
        events = await client.transcribe_audio_file(temp_path, language="ru")
        assert isinstance(events, list)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@pytest.mark.asyncio
async def test_file_processor_duration_check():
    from app.models.lesson import Lesson

    lesson_id = uuid.uuid4()
    mock_lesson = MagicMock(spec=Lesson)
    mock_lesson.id = lesson_id
    mock_lesson.title = "Oversized Lesson"
    mock_lesson.status = "uploaded"

    mock_db = AsyncMock()
    mock_db.get = AsyncMock(return_value=mock_lesson)
    mock_db.commit = AsyncMock()

    processor = FileProcessor()

    # Mock download and probe to report duration > 4 hours (e.g. 15000s)
    with patch("app.workers.file_processor.download_file", new=AsyncMock()), \
         patch("app.workers.file_processor.emit_persistent_event", new_callable=AsyncMock) as mock_emit, \
         patch.object(processor, "_probe_media", return_value=(15000.0, True, True)):

        class MockSessionContext:
            async def __aenter__(self):
                return mock_db
            async def __aexit__(self, exc_type, exc_val, exc_tb):
                pass

        await processor.process_lesson_recording(
            lesson_id=lesson_id,
            s3_key="lessons/test/input.mp4",
            db_factory=lambda: MockSessionContext(),
        )

    assert mock_lesson.status == "failed"
    mock_emit.assert_called_once()
    assert mock_emit.call_args.kwargs["event_type"] == "error.notice"
