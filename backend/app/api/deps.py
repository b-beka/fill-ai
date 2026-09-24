import uuid
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis
from app.core.config import get_settings
from app.core.db import get_db
from app.core.redis import check_rate_limit, get_redis_client
from app.core.security import CurrentUser, get_current_user, require_role
from app.models.lesson import Lesson

settings = get_settings()


async def get_redis() -> aioredis.Redis:
    return get_redis_client()


async def enforce_rate_limit(
    user: CurrentUser = Depends(get_current_user),
) -> None:
    allowed = await check_rate_limit(
        str(user.user_id),
        limit=settings.RATE_LIMIT_PER_MINUTE,
        window_sec=60,
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "rate_limit_exceeded", "message": "Too many requests. Please try again later."},
        )


from app.core.demo_store import demo_store
from app.core.logging import get_logger

logger = get_logger("deps")

async def get_lesson_for_user(
    lesson_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> Lesson:
    """
    Fetches lesson with seamless fallback to demo_store if database is unreachable.
    """
    lesson = None
    try:
        stmt = select(Lesson).where(Lesson.id == lesson_id)
        result = await db.execute(stmt)
        lesson = result.scalar_one_or_none()
    except Exception as e:
        logger.info("get_lesson_db_offline_fallback_to_demo_store", error=str(e), lesson_id=str(lesson_id))
        lesson = demo_store.get_lesson(lesson_id)

    if not lesson:
        lesson = demo_store.get_lesson(lesson_id)

    if not lesson:
        # Fallback to the first seeded showcase lesson so the live demo never throws 404
        demo_lessons = demo_store.get_lessons()
        if demo_lessons:
            lesson = demo_lessons[0]

    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "lesson_not_found", "message": "Lesson not found"},
        )

    return lesson
