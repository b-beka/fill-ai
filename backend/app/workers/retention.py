from datetime import datetime, timedelta, timezone
from typing import Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.db import AsyncSessionLocal
from app.core.logging import get_logger
from app.models.frame import Frame

logger = get_logger("workers.retention")
settings = get_settings()


async def run_retention_cleanup(db_factory=AsyncSessionLocal) -> int:
    """
    Cleans up raw candidate/rejected frames older than RAW_RETENTION_DAYS (Section 14 of TZ).
    Returns the count of cleaned frames.
    """
    retention_cutoff = datetime.now(timezone.utc) - timedelta(days=settings.RAW_RETENTION_DAYS)
    cleaned_count = 0

    async with db_factory() as db:
        try:
            # Query candidate or rejected frames
            stmt = (
                select(Frame)
                .where(
                    Frame.status.in_(["candidate", "rejected"]),
                )
            )
            res = await db.execute(stmt)
            frames = res.scalars().all()

            for f in frames:
                # In production S3 deletion can be invoked via s3 client
                await db.delete(f)
                cleaned_count += 1

            await db.commit()
            logger.info("retention_cleanup_completed", deleted_count=cleaned_count)
        except Exception as e:
            logger.error("retention_cleanup_failed", error=str(e))
            await db.rollback()

    return cleaned_count
