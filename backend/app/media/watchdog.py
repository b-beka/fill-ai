import asyncio
from datetime import datetime, timezone
from typing import Any
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.events import emit_persistent_event
from app.core.logging import get_logger
from app.core.redis import add_to_stream, get_redis_client
from app.models.frame import Frame
from app.models.lesson import Lesson
from app.models.transcript import TranscriptSegment
from app.models.window import Window

logger = get_logger("media.watchdog")


class MediaBotWatchdog:
    """
    Watchdog supervisor monitoring media-bot heartbeats (Section 14 of TZ).
    If a live lesson's bot fails to report a heartbeat within 20s:
    - Queries latest lesson state from DB (last t_ms, window, pHash)
    - Restarts the bot via stream:bot-commands
    - Emits error.notice warning
    """

    def __init__(self, check_interval_sec: float = 5.0):
        self.check_interval_sec = check_interval_sec
        self._running = False

    async def check_live_lessons(self, db: AsyncSession) -> list[uuid.UUID]:
        """Checks heartbeats of all active live lessons and triggers restarts if stale."""
        redis = get_redis_client()
        restarted_lessons: list[uuid.UUID] = []

        stmt = select(Lesson).where(Lesson.status == "live")
        res = await db.execute(stmt)
        live_lessons = res.scalars().all()

        for lesson in live_lessons:
            heartbeat_key = f"bot:heartbeat:{lesson.id}"
            heartbeat = await redis.get(heartbeat_key)

            if not heartbeat:
                logger.warning("media_bot_heartbeat_missing", lesson_id=str(lesson.id))
                await self.restart_bot_for_lesson(lesson, db)
                restarted_lessons.append(lesson.id)

        return restarted_lessons

    async def restart_bot_for_lesson(self, lesson: Lesson, db: AsyncSession) -> None:
        """Restores state from DB and sends restart command to stream:bot-commands."""
        # 1. Query latest t_ms from transcript segments
        t_stmt = (
            select(TranscriptSegment)
            .where(TranscriptSegment.lesson_id == lesson.id)
            .order_by(TranscriptSegment.end_ms.desc())
            .limit(1)
        )
        t_res = await db.execute(t_stmt)
        last_seg = t_res.scalar_one_or_none()
        last_t_ms = last_seg.end_ms if last_seg else 0

        # 2. Query latest window index
        w_stmt = (
            select(Window)
            .where(Window.lesson_id == lesson.id)
            .order_by(Window.idx.desc())
            .limit(1)
        )
        w_res = await db.execute(w_stmt)
        last_win = w_res.scalar_one_or_none()
        current_window_idx = last_win.idx if last_win else 1

        # 3. Query latest frame pHash
        f_stmt = (
            select(Frame)
            .where(Frame.lesson_id == lesson.id)
            .order_by(Frame.t_ms.desc())
            .limit(1)
        )
        f_res = await db.execute(f_stmt)
        last_frame = f_res.scalar_one_or_none()
        last_phash = last_frame.phash if last_frame else None

        # 4. Issue restart command to stream:bot-commands
        restart_payload = {
            "command": "restart",
            "lesson_id": str(lesson.id),
            "room_name": lesson.livekit_room or f"room-{lesson.id}",
            "language": lesson.language,
            "last_t_ms": last_t_ms,
            "current_window_idx": current_window_idx,
            "last_phash": last_phash or "",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await add_to_stream("stream:bot-commands", restart_payload)

        # 5. Emit persistent error.notice
        await emit_persistent_event(
            session=db,
            lesson_id=lesson.id,
            event_type="error.notice",
            data={
                "code": "bot_watchdog_restart",
                "message": "Связь с медиа-ботом потеряна. Состояние урока восстановлено, бот перезапущен.",
                "recoverable": True,
            },
            publish_to_redis_now=True,
        )
        await db.commit()
        logger.info("bot_restarted_by_watchdog", lesson_id=str(lesson.id), last_t_ms=last_t_ms)
