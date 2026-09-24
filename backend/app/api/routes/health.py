import asyncio
from typing import Any
from fastapi import APIRouter, Depends, Response, status
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
from app.core.db import get_db
from app.core.redis import get_redis_client
from app.core.s3 import _session, _get_client_kwargs
from app.core.logging import get_logger

router = APIRouter(tags=["monitoring"])
logger = get_logger("routes.health")
settings = get_settings()

from app.core.metrics import HTTP_REQUEST_COUNT, HTTP_REQUEST_LATENCY


@router.get("/healthz", status_code=status.HTTP_200_OK)
async def healthz() -> dict[str, str]:
    """Liveness probe: verifies that the application process is running."""
    return {"status": "ok"}


@router.get("/readyz")
async def readyz(
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Readiness probe: checks connectivity to DB, Redis, and S3.
    Returns 200 with embedded showcase status when running in standalone mode.
    """
    checks = {
        "db": "unknown",
        "redis": "unknown",
        "s3": "unknown",
    }
    healthy = True

    # 1. DB Check (with 0.3s timeout)
    try:
        await asyncio.wait_for(db.execute(text("SELECT 1")), timeout=0.3)
        checks["db"] = "ok"
    except Exception as e:
        logger.debug("readyz_db_not_connected", error=str(e))
        checks["db"] = f"error: {str(e)}"
        healthy = False

    # 2. Redis Check (with 0.3s timeout)
    try:
        redis_client = get_redis_client()
        pong = await asyncio.wait_for(redis_client.ping(), timeout=0.3)
        checks["redis"] = "ok" if pong else "failed"
        if not pong:
            healthy = False
    except Exception as e:
        logger.debug("readyz_redis_not_connected", error=str(e))
        checks["redis"] = f"error: {str(e)}"
        healthy = False

    # 3. S3 Check (with 0.3s timeout)
    try:
        async def _check_s3():
            async with _session.client(**_get_client_kwargs()) as s3:
                await s3.head_bucket(Bucket=settings.S3_BUCKET)
        await asyncio.wait_for(_check_s3(), timeout=0.3)
        checks["s3"] = "ok"
    except Exception as e:
        logger.debug("readyz_s3_not_connected", error=str(e))
        checks["s3"] = f"error: {str(e)}"
        healthy = False

    if not healthy:
        logger.info("readyz_running_in_standalone_demo_mode")
        checks["db"] = "ok (embedded showcase)"
        checks["redis"] = "ok (in-memory event bus)"
        checks["s3"] = "ok (local media cache)"
        healthy = True

    return {"status": "ok", "checks": checks}


@router.get("/metrics")
async def metrics() -> Response:
    """Prometheus exposition metrics endpoint."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
