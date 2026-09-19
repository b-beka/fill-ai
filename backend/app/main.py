import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import structlog
from app.api.errors import register_error_handlers
from app.api.router import api_router
from app.api.routes import health
from app.core.config import get_settings
from app.core.db import close_db
from app.core.logging import get_logger, setup_logging
from app.core.redis import close_redis
from app.core.s3 import ensure_bucket_exists

setup_logging()
logger = get_logger("main")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("app_starting", env=settings.ENVIRONMENT)
    # Ensure S3 bucket is ready
    try:
        await ensure_bucket_exists()
    except Exception as e:
        logger.warning("s3_init_warning", error=str(e))

    yield

    logger.info("app_shutting_down")
    await close_redis()
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/docs/openapi.json",
    lifespan=lifespan,
)

# Register RFC 7807 problem+json error handlers
register_error_handlers(app)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def structlog_request_middleware(request: Request, call_next) -> Response:
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        method=request.method,
        path=request.url.path,
    )

    start_time = time.perf_counter()
    try:
        response = await call_next(request)
        process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        logger.info(
            "http_request_finished",
            status_code=response.status_code,
            duration_ms=process_time_ms,
        )
        return response
    except Exception as e:
        process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.error(
            "http_request_failed",
            error=str(e),
            duration_ms=process_time_ms,
        )
        raise


# Register routes
app.include_router(health.router)
app.include_router(api_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"name": settings.APP_NAME, "version": "0.1.0", "status": "running"}
