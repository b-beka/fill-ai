import logging
import sys
from typing import Any
import structlog
from app.core.config import get_settings

settings = get_settings()


def filter_sensitive_lesson_content(
    logger: logging.Logger, method_name: str, event_dict: dict[str, Any]
) -> dict[str, Any]:
    """
    Enforces Rule 8 of Section 0 in TZ:
    Do not log lesson content (transcript, frames, student answers) at INFO or lower level.
    Only log identifiers and metrics.
    """
    sensitive_keys = {
        "text", "transcript", "tokens", "ocr_markdown", "description",
        "answer", "answers", "raw_content", "body_md", "summary",
        "prompt", "completion", "feedback",
    }
    level = event_dict.get("level", "info").lower()
    if level in ("info", "debug"):
        for key in sensitive_keys:
            if key in event_dict:
                event_dict[key] = "[REDACTED_CONTENT]"
    return event_dict


def setup_logging() -> None:
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        filter_sensitive_lesson_content,
    ]

    if settings.ENVIRONMENT == "development" and not sys.stderr.isatty():
        renderer: structlog.types.Processor = structlog.processors.JSONRenderer()
    else:
        # JSON renderer for production and structured logs
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=shared_processors + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers = [handler]
    root_logger.setLevel(log_level)

    # Silence verbose 3rd party loggers
    for noisy in ["uvicorn.access", "botocore", "urllib3", "asyncio"]:
        logging.getLogger(noisy).setLevel(logging.WARNING)


def get_logger(name: str = "fill_ai") -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)
