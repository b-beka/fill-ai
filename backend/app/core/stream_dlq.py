import asyncio
from datetime import datetime, timezone
import json
from typing import Any
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.events import emit_persistent_event
from app.core.logging import get_logger
from app.core.redis import add_to_stream, get_redis_client
from app.models.lesson import Lesson
from app.models.note import NoteBlock
from app.models.transcript import TranscriptSegment
from app.models.window import Window

logger = get_logger("core.stream_dlq")

STREAM_DLQ = "stream:dlq"
MAX_DELIVERY_ATTEMPTS = 3
PENDING_TIMEOUT_MS = 90000  # 90 seconds per Section 14 of TZ


class StreamDlqManager:
    """
    Manages pending messages in Redis Streams, executes XAUTOCLAIM for stale messages (>90s),
    routes messages exceeding MAX_DELIVERY_ATTEMPTS to stream:dlq, and triggers fallback handlers.
    """

    def __init__(self, consumer_name: str | None = None):
        self.consumer_name = consumer_name or f"dlq-claimer-{uuid.uuid4().hex[:6]}"

    async def autoclaim_and_process_stale(
        self,
        stream_name: str,
        group_name: str,
        db: AsyncSession,
    ) -> list[dict[str, Any]]:
        """
        Executes XAUTOCLAIM on the given stream and group.
        Routes messages with >3 deliveries to DLQ and executes fallback if needed.
        """
        redis = get_redis_client()
        claimed_messages = []

        try:
            # XAUTOCLAIM stream group consumer min-idle-time start [COUNT count]
            # In redis-py async: xautoclaim(name, groupname, consumername, min_idle_time, start_id='0-0', count=10)
            res = await redis.xautoclaim(
                name=stream_name,
                groupname=group_name,
                consumername=self.consumer_name,
                min_idle_time=PENDING_TIMEOUT_MS,
                start_id="0-0",
                count=10,
            )

            # Returns: [next_start_id, messages, deleted_ids]
            if not res or len(res) < 2:
                return []

            messages = res[1]
            for msg_id, payload in messages:
                # Check pending delivery count via XPENDING
                pending_info = await redis.xpending_range(
                    name=stream_name,
                    groupname=group_name,
                    min=msg_id,
                    max=msg_id,
                    count=1,
                )

                delivery_count = 1
                if pending_info and len(pending_info) > 0:
                    delivery_count = pending_info[0].get("times_delivered", 1)

                if delivery_count > MAX_DELIVERY_ATTEMPTS:
                    logger.warning(
                        "message_exceeded_max_retries_moving_to_dlq",
                        stream=stream_name,
                        msg_id=msg_id,
                        delivery_count=delivery_count,
                    )
                    await self.move_to_dlq(
                        stream_name=stream_name,
                        group_name=group_name,
                        msg_id=msg_id,
                        payload=payload,
                        reason=f"Exceeded {MAX_DELIVERY_ATTEMPTS} delivery attempts",
                        db=db,
                    )
                else:
                    claimed_messages.append({"id": msg_id, "payload": payload, "deliveries": delivery_count})

        except Exception as e:
            logger.error("autoclaim_failed", stream=stream_name, group=group_name, error=str(e))

        return claimed_messages

    async def move_to_dlq(
        self,
        stream_name: str,
        group_name: str,
        msg_id: str,
        payload: dict[str, Any],
        reason: str,
        db: AsyncSession,
    ) -> None:
        """
        Sends message to stream:dlq, emits error.notice event, executes fallback, and acks original message.
        """
        redis = get_redis_client()
        lesson_id_str = payload.get("lesson_id")

        dlq_entry = {
            "original_stream": stream_name,
            "original_group": group_name,
            "original_id": msg_id,
            "reason": reason,
            "payload": json.dumps(payload, ensure_ascii=False) if isinstance(payload, dict) else str(payload),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await add_to_stream(STREAM_DLQ, dlq_entry)

        # Emit error.notice if lesson_id is present
        if lesson_id_str:
            try:
                lesson_uid = uuid.UUID(lesson_id_str)
                await emit_persistent_event(
                    session=db,
                    lesson_id=lesson_uid,
                    event_type="error.notice",
                    data={
                        "code": "worker_timeout_dlq",
                        "message": f"Task in {stream_name} failed after retries and moved to DLQ: {reason}",
                        "recoverable": True,
                    },
                    publish_to_redis_now=True,
                )
            except Exception as e:
                logger.warning("failed_to_emit_dlq_error_notice", error=str(e))

        # Fallback for note blocks: if stream:windows, create simplified block so no gap in notes
        if stream_name == "stream:windows" and lesson_id_str:
            window_id_str = payload.get("window_id")
            position = int(payload.get("idx", 1))
            if window_id_str:
                await self.create_fallback_note_block(
                    lesson_id=uuid.UUID(lesson_id_str),
                    window_id=uuid.UUID(window_id_str),
                    position=position,
                    db=db,
                )

        # ACK from original stream to remove from pending
        await redis.xack(stream_name, group_name, msg_id)

    async def create_fallback_note_block(
        self,
        lesson_id: uuid.UUID,
        window_id: uuid.UUID,
        position: int,
        db: AsyncSession,
    ) -> NoteBlock | None:
        """
        Creates a simplified fallback NoteBlock from transcript when AI worker fails (Section 14).
        Guarantees that students' lesson notes never have empty gaps ("дыры").
        """
        try:
            # Check if block already exists
            b_stmt = select(NoteBlock).where(NoteBlock.lesson_id == lesson_id, NoteBlock.position == position)
            b_res = await db.execute(b_stmt)
            existing = b_res.scalar_one_or_none()
            if existing:
                return existing

            window = await db.get(Window, window_id)
            start_ms = window.start_ms if window else 0
            end_ms = window.end_ms if window else 0

            # Gather transcript segments
            t_stmt = (
                select(TranscriptSegment)
                .where(
                    TranscriptSegment.lesson_id == lesson_id,
                    TranscriptSegment.start_ms >= start_ms,
                    TranscriptSegment.end_ms <= end_ms + 1000,
                )
                .order_by(TranscriptSegment.start_ms.asc())
            )
            t_res = await db.execute(t_stmt)
            segments = t_res.scalars().all()

            if segments:
                fallback_body = "\n\n".join([f"{s.speaker or 'Преподаватель'}: {s.text}" for s in segments])
                fallback_title = f"Раздел {position} (Транскрипт)"
                fallback_summary = segments[0].text[:120]
            else:
                fallback_body = "Содержимое данного раздела восстанавливается."
                fallback_title = f"Раздел {position}"
                fallback_summary = "Материалы раздела"

            block_id = uuid.uuid4()
            fallback_block = NoteBlock(
                id=block_id,
                lesson_id=lesson_id,
                window_id=window_id,
                position=position,
                t_start_ms=start_ms,
                t_end_ms=end_ms,
                title=fallback_title,
                summary=fallback_summary,
                body_md=fallback_body,
                key_terms=[],
                callouts=[{"kind": "warning", "text": "Блок создан автоматически по транскрипту (резервный режим)."}],
                frame_refs=[],
                uncertain=[],
                version=1,
                edited_by_teacher=False,
            )
            db.add(fallback_block)
            await db.flush()

            # Emit note.block.created persistent event
            await emit_persistent_event(
                session=db,
                lesson_id=lesson_id,
                event_type="note.block.created",
                data={
                    "block_id": str(block_id),
                    "position": position,
                    "title": fallback_title,
                    "summary": fallback_summary,
                    "body_md": fallback_body,
                    "version": 1,
                    "frames": [],
                },
                publish_to_redis_now=True,
            )
            await db.commit()
            logger.info("fallback_note_block_created", lesson_id=str(lesson_id), position=position)
            return fallback_block

        except Exception as e:
            logger.error("failed_to_create_fallback_note_block", lesson_id=str(lesson_id), error=str(e))
            return None
