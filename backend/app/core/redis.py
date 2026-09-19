import json
from typing import Any
import redis.asyncio as aioredis
from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger("core.redis")

_redis_client: aioredis.Redis | None = None


def get_redis_client() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            health_check_interval=30,
        )
    return _redis_client


async def close_redis() -> None:
    global _redis_client
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None


async def publish_lesson_event(lesson_id: str, event_data: dict[str, Any]) -> int:
    """
    Publishes an event to the Redis pub/sub channel for the given lesson.
    Channel format: pub:lesson:{lesson_id}
    """
    client = get_redis_client()
    channel = f"pub:lesson:{lesson_id}"
    message = json.dumps(event_data, ensure_ascii=False)
    return await client.publish(channel, message)


async def add_to_stream(stream_name: str, payload: dict[str, Any]) -> str:
    """
    Adds a message to a Redis stream.
    Values are JSON encoded strings.
    """
    client = get_redis_client()
    entry = {k: (json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list, bool)) else str(v))
             for k, v in payload.items()}
    return await client.xadd(stream_name, entry)


async def create_consumer_group_if_not_exists(stream_name: str, group_name: str) -> None:
    client = get_redis_client()
    try:
        await client.xgroup_create(stream_name, group_name, id="0", mkstream=True)
    except aioredis.ResponseError as e:
        if "BUSYGROUP" not in str(e):
            raise


async def check_rate_limit(user_id: str, limit: int = 60, window_sec: int = 60) -> bool:
    """
    Sliding/fixed window rate limiter via Redis.
    Fails open (returns True) if Redis is unavailable to avoid blocking legitimate traffic.
    """
    try:
        client = get_redis_client()
        key = f"ratelimit:{user_id}"
        current = await client.incr(key)
        if current == 1:
            await client.expire(key, window_sec)
        return current <= limit
    except Exception as e:
        logger.warning("rate_limit_redis_unavailable_fail_open", error=str(e))
        return True
