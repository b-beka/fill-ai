import uuid
from unittest.mock import AsyncMock, patch
import pytest
from app.core.events import emit_ephemeral_event


@pytest.mark.asyncio
async def test_emit_ephemeral_event():
    lesson_id = uuid.uuid4()
    event_type = "transcript.partial"
    data = {"start_ms": 1000, "text": "Здравствуйте, студенты!"}

    with patch("app.core.events.publish_lesson_event", new_callable=AsyncMock) as mock_pub:
        event = await emit_ephemeral_event(lesson_id, event_type, data)

        assert event["seq"] is None
        assert event["type"] == event_type
        assert event["lesson_id"] == str(lesson_id)
        assert event["data"] == data
        assert "ts" in event
        mock_pub.assert_called_once_with(str(lesson_id), event)
