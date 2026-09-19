from datetime import datetime, timezone
from typing import Any
import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.redis import publish_lesson_event
from app.core.logging import get_logger

logger = get_logger("core.events")


async def emit_persistent_event(
    session: AsyncSession,
    lesson_id: str | uuid.UUID,
    event_type: str,
    data: dict[str, Any],
    publish_to_redis_now: bool = True,
) -> dict[str, Any]:
    """
    Atomically allocates the next seq for the lesson, records the event in lesson_events,
    and publishes it to the Redis pub/sub channel.
    Follows Section 10.1 of TZ:
      UPDATE lessons SET last_seq = last_seq + 1 ... RETURNING last_seq
    """
    lesson_uuid = str(lesson_id)
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Allocate next sequence number
    query = text(
        "UPDATE lessons SET last_seq = last_seq + 1 WHERE id = :lesson_id RETURNING last_seq"
    )
    result = await session.execute(query, {"lesson_id": lesson_uuid})
    row = result.fetchone()
    if row is None:
        raise ValueError(f"Lesson not found: {lesson_uuid}")
    seq = row[0]

    event_record = {
        "seq": seq,
        "type": event_type,
        "lesson_id": lesson_uuid,
        "ts": now_iso,
        "data": data,
    }

    # 2. Insert into lesson_events table
    insert_query = text(
        """
        INSERT INTO lesson_events (lesson_id, seq, type, payload, created_at)
        VALUES (:lesson_id, :seq, :type, CAST(:payload AS JSONB), :created_at)
        """
    )
    import json
    await session.execute(
        insert_query,
        {
            "lesson_id": lesson_uuid,
            "seq": seq,
            "type": event_type,
            "payload": json.dumps(event_record),
            "created_at": datetime.now(timezone.utc),
        },
    )

    # 3. Publish to Redis pub/sub
    if publish_to_redis_now:
        try:
            await publish_lesson_event(lesson_uuid, event_record)
        except Exception as e:
            logger.error("redis_publish_event_failed", lesson_id=lesson_uuid, event_type=event_type, error=str(e))

    return event_record


async def emit_ephemeral_event(
    lesson_id: str | uuid.UUID,
    event_type: str,
    data: dict[str, Any],
) -> dict[str, Any]:
    """
    Emits an ephemeral event without a sequence number (not saved in database, pub/sub only).
    Used for transcript.partial per Section 10.1 of TZ.
    """
    lesson_uuid = str(lesson_id)
    now_iso = datetime.now(timezone.utc).isoformat()

    event_record = {
        "seq": None,
        "type": event_type,
        "lesson_id": lesson_uuid,
        "ts": now_iso,
        "data": data,
    }
    await publish_lesson_event(lesson_uuid, event_record)
    return event_record
