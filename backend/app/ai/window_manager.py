import uuid
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.redis import add_to_stream
from app.models.window import Window

logger = get_logger("ai.window_manager")
settings = get_settings()

STREAM_WINDOWS = "stream:windows"


class WindowManager:
    """
    Tracks elapsed window time and slide transitions to partition lessons into cohesive semantic windows.
    Section 8.2 of TZ.
    """

    def __init__(
        self,
        lesson_id: uuid.UUID | str,
        start_idx: int = 1,
        initial_start_ms: int = 0,
    ):
        self.lesson_id = uuid.UUID(str(lesson_id))
        self.current_idx = start_idx
        self.current_window_start_ms = initial_start_ms
        self.last_slide_title: str | None = None

        self.window_target_sec = settings.WINDOW_TARGET_SEC  # 240s
        self.window_min_sec = settings.WINDOW_MIN_SEC        # 120s
        self.window_max_sec = settings.WINDOW_MAX_SEC        # 360s

    def should_close_window(
        self,
        current_ms: int,
        is_sentence_boundary: bool = False,
        new_slide_title: str | None = None,
        is_lesson_ended: bool = False,
    ) -> bool:
        """
        Evaluates the 4 window closing conditions from Section 8.2 of TZ:
        1. Lesson ended (close immediately, even if < 30s)
        2. Elapsed >= 360s (force close)
        3. Elapsed >= 120s and slide topic changed
        4. Elapsed >= 240s aligned to sentence/pause boundary
        """
        if is_lesson_ended:
            return True

        elapsed_sec = (current_ms - self.current_window_start_ms) / 1000.0

        if elapsed_sec >= self.window_max_sec:
            return True

        if (
            elapsed_sec >= self.window_min_sec
            and new_slide_title
            and self.last_slide_title
            and new_slide_title.strip().lower() != self.last_slide_title.strip().lower()
        ):
            return True

        if elapsed_sec >= self.window_target_sec and is_sentence_boundary:
            return True

        return False

    def update_slide_title(self, title: str | None) -> None:
        if title:
            self.last_slide_title = title

    async def close_and_advance(
        self,
        end_ms: int,
        db: AsyncSession,
    ) -> Window:
        """
        Persists the closed window into DB and publishes task to stream:windows.
        """
        window_id = uuid.uuid4()
        window = Window(
            id=window_id,
            lesson_id=self.lesson_id,
            idx=self.current_idx,
            start_ms=self.current_window_start_ms,
            end_ms=end_ms,
            status="closed",
        )
        db.add(window)
        await db.flush()

        # Queue window processing for ai-workers
        payload = {
            "lesson_id": str(self.lesson_id),
            "window_id": str(window_id),
            "idx": self.current_idx,
            "start_ms": self.current_window_start_ms,
            "end_ms": end_ms,
        }
        await add_to_stream(STREAM_WINDOWS, payload)
        logger.info(
            "window_closed",
            lesson_id=str(self.lesson_id),
            idx=self.current_idx,
            start_ms=self.current_window_start_ms,
            end_ms=end_ms,
        )

        # Advance state
        self.current_idx += 1
        self.current_window_start_ms = end_ms
        return window
