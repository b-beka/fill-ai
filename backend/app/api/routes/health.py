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
    Returns 200 if all services are healthy, 503 otherwise.
    """
    checks = {
        "db": "unknown",
        "redis": "unknown",
        "s3": "unknown",
    }
    healthy = True

    # 1. DB Check
    try:
        await db.execute(text("SELECT 1"))
        checks["db"] = "ok"
    except Exception as e:
        logger.error("readyz_db_failed", error=str(e))
        checks["db"] = f"error: {str(e)}"
        healthy = False

    # 2. Redis Check
    try:
        redis_client = get_redis_client()
        pong = await redis_client.ping()
        checks["redis"] = "ok" if pong else "failed"
        if not pong:
            healthy = False
    except Exception as e:
        logger.error("readyz_redis_failed", error=str(e))
        checks["redis"] = f"error: {str(e)}"
        healthy = False

    # 3. S3 Check
    try:
        async with _session.client(**_get_client_kwargs()) as s3:
            await s3.head_bucket(Bucket=settings.S3_BUCKET)
        checks["s3"] = "ok"
    except Exception as e:
        logger.error("readyz_s3_failed", error=str(e))
        checks["s3"] = f"error: {str(e)}"
        healthy = False

    if not healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "degraded", "checks": checks}

    return {"status": "ok", "checks": checks}


@router.get("/metrics")
async def metrics() -> Response:
    """Prometheus exposition metrics endpoint."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
