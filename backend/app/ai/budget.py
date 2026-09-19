from datetime import datetime, timezone
from typing import Any
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.events import emit_persistent_event
from app.core.logging import get_logger
from app.models.ai import AiCall
from app.models.lesson import Lesson

logger = get_logger("ai.budget")
settings = get_settings()


async def check_budget_and_get_model(
    lesson_id: uuid.UUID | str,
    default_model: str,
    db: AsyncSession,
) -> tuple[str, bool]:
    """
    Checks if lesson has reached its cost budget (Section 14 of TZ).
    If budget exceeded ($3.00 by default):
    - Emits error.notice with code budget_degraded
    - Forces degradation to cheaper light model (gemini-3.5-flash-lite)
    Returns: (selected_model, is_degraded)
    """
    lesson_uid = uuid.UUID(str(lesson_id))
    lesson = await db.get(Lesson, lesson_uid)
    if not lesson:
        return default_model, False

    current_cost = float(lesson.cost_usd or 0.0)
    if current_cost >= settings.MAX_COST_USD_PER_LESSON:
        logger.warning(
            "lesson_budget_exceeded",
            lesson_id=str(lesson_uid),
            cost_usd=current_cost,
            limit_usd=settings.MAX_COST_USD_PER_LESSON,
        )
        await emit_persistent_event(
            session=db,
            lesson_id=lesson_uid,
            event_type="error.notice",
            data={
                "code": "budget_degraded",
                "message": f"Бюджет урока превышен (${current_cost:.2f} >= ${settings.MAX_COST_USD_PER_LESSON:.2f}). Включен экономный режим.",
                "recoverable": True,
            },
            publish_to_redis_now=True,
        )
        return settings.LLM_LIGHT_MODEL, True

    return default_model, False


async def record_call_cost(
    lesson_id: uuid.UUID | str | None,
    task: str,
    provider: str,
    model: str,
    cost_usd: float,
    latency_ms: int,
    tokens_in: int = 0,
    tokens_out: int = 0,
    status: str = "success",
    error: str | None = None,
    db: AsyncSession | None = None,
) -> None:
    """
    Records an AI API call into ai_calls table and increments lesson.cost_usd.
    """
    if db is None or lesson_id is None:
        return

    lesson_uid = uuid.UUID(str(lesson_id))
    ai_call = AiCall(
        lesson_id=lesson_uid,
        task=task,
        provider=provider,
        model=model,
        prompt_version="1.0.0",
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        latency_ms=latency_ms,
        cost_usd=cost_usd,
        status=status,
        error=error,
    )
    db.add(ai_call)

    lesson = await db.get(Lesson, lesson_uid)
    if lesson:
        lesson.cost_usd = float(lesson.cost_usd or 0.0) + cost_usd

    await db.commit()
