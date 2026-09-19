import asyncio
import json
from collections.abc import AsyncGenerator
import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse, ServerSentEvent
import redis.asyncio as aioredis
from app.api.deps import enforce_rate_limit, get_db, get_lesson_for_user, get_redis
from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.security import (
    CurrentUser,
    create_sse_token,
    decode_jwt,
    get_current_user,
)
from app.models.lesson import Lesson, LessonEvent

router = APIRouter(prefix="/lessons", tags=["events"])
logger = get_logger("routes.events")
settings = get_settings()


class SseTokenResponse(BaseModel):
    token: str
    expires_in: int


@router.post(
    "/{lesson_id}/sse-token",
    response_model=SseTokenResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def generate_sse_token(
    lesson: Lesson = Depends(get_lesson_for_user),
    user: CurrentUser = Depends(get_current_user),
) -> SseTokenResponse:
    """
    Issues a short-lived (5 min) JWT specifically scoped for SSE EventSource connection.
    Section 10.1 of TZ.
    """
    token = create_sse_token(
        lesson_id=lesson.id,
        user_id=user.user_id,
        role=user.role,
        org_id=user.org_id,
    )
    return SseTokenResponse(
        token=token,
        expires_in=settings.SSE_TOKEN_EXPIRE_SECONDS,
    )


def _authenticate_sse(
    token: str | None = Query(None),
    authorization: str | None = Header(None),
) -> CurrentUser:
    jwt_token = None
    if token:
        jwt_token = token
    elif authorization and authorization.startswith("Bearer "):
        jwt_token = authorization.split("Bearer ", 1)[1].strip()

    if not jwt_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "missing_token", "message": "SSE token or Bearer header required"},
        )

    payload = decode_jwt(jwt_token)
    sub = payload.get("sub")
    role = payload.get("role")
    org_id = payload.get("org_id")
    lesson_id = payload.get("lesson_id")

    if not sub or not role or not org_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_claims", "message": "Missing sub, role, or org_id in token"},
        )

    return CurrentUser(
        user_id=uuid.UUID(str(sub)),
        role=role,
        org_id=uuid.UUID(str(org_id)),
        permissions=payload.get("permissions", []),
        lesson_id=uuid.UUID(str(lesson_id)) if lesson_id else None,
    )


@router.get(
    "/{lesson_id}/events",
    response_class=EventSourceResponse,
)
async def stream_lesson_events(
    lesson_id: uuid.UUID,
    request: Request,
    after_seq: int | None = Query(None),
    last_event_id: str | None = Header(None, alias="Last-Event-ID"),
    db: AsyncSession = Depends(get_db),
    redis_client: aioredis.Redis = Depends(get_redis),
) -> EventSourceResponse:
    """
    Real-time SSE event stream for a lesson.
    - Seamlessly catches up from DB (seq > after_seq) and then bridges to Redis pub/sub.
    - Sends heartbeat comments (: ping) every 15 seconds.
    - Filters teacher-only events (report.ready, quiz.ready) for students.
    """
    token = request.query_params.get("token")
    auth_header = request.headers.get("Authorization")
    user = _authenticate_sse(token=token, authorization=auth_header)

    # Verify lesson exists and user has access
    stmt = select(Lesson).where(Lesson.id == lesson_id)
    result = await db.execute(stmt)
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "lesson_not_found", "message": "Lesson not found"},
        )

    if user.role != "admin" and lesson.org_id != user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "forbidden_org", "message": "Access denied to this organization"},
        )

    # Determine starting sequence number
    start_seq = 0
    if after_seq is not None:
        start_seq = after_seq
    elif last_event_id is not None:
        try:
            start_seq = int(last_event_id)
        except ValueError:
            start_seq = 0

    async def event_generator() -> AsyncGenerator[dict[str, Any], None]:
        channel_name = f"pub:lesson:{lesson_id}"
        pubsub = redis_client.pubsub()
        await pubsub.subscribe(channel_name)

        last_streamed_seq = start_seq

        try:
            # 1. Catch-up phase: read missed persistent events from DB
            events_stmt = (
                select(LessonEvent)
                .where(LessonEvent.lesson_id == lesson_id, LessonEvent.seq > start_seq)
                .order_by(LessonEvent.seq.asc())
            )
            events_res = await db.execute(events_stmt)
            for db_event in events_res.scalars().all():
                # Filter restricted events for students (Section 10.1 & 10.3)
                if user.role == "student":
                    if db_event.type in ("report.ready", "quiz.ready"):
                        continue
                    if db_event.type == "note.block.created" and db_event.payload.get("status") == "pending_review":
                        continue

                last_streamed_seq = max(last_streamed_seq, db_event.seq)
                yield {
                    "id": str(db_event.seq),
                    "event": db_event.type,
                    "data": json.dumps(db_event.payload, ensure_ascii=False),
                }

            # 2. Live streaming phase: listen to Redis pub/sub
            while True:
                if await request.is_disconnected():
                    break

                message = await pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=1.0,
                )

                if message and message["type"] == "message":
                    try:
                        raw_data = message["data"]
                        if isinstance(raw_data, bytes):
                            raw_data = raw_data.decode("utf-8")
                        event_payload = json.loads(raw_data)

                        event_type = event_payload.get("type", "message")
                        seq = event_payload.get("seq")

                        # Filter restricted events for students
                        if user.role == "student":
                            if event_type in ("report.ready", "quiz.ready"):
                                continue
                            payload_data = event_payload.get("data", event_payload)
                            if event_type == "note.block.created" and payload_data.get("status") == "pending_review":
                                continue

                        # Deduplicate against catch-up DB events
                        if seq is not None:
                            if seq <= last_streamed_seq:
                                continue
                            last_streamed_seq = seq

                        yield {
                            "id": str(seq) if seq is not None else None,
                            "event": event_type,
                            "data": json.dumps(event_payload, ensure_ascii=False),
                        }
                    except Exception as e:
                        logger.error("sse_decode_error", error=str(e))

                await asyncio.sleep(0.01)

        finally:
            await pubsub.unsubscribe(channel_name)
            await pubsub.close()

    return EventSourceResponse(
        event_generator(),
        ping=15,  # 15s heartbeat comment ': ping' per Section 10.1
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
