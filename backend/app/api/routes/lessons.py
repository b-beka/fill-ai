from datetime import datetime, timezone
import json
from typing import Any
import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, File, Header, HTTPException, Query, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis
from app.api.deps import enforce_rate_limit, get_current_user, get_db, get_lesson_for_user, get_redis
from app.api.schemas.lesson import (
    BlockUpdateRequest,
    LessonCreateRequest,
    LessonResponse,
    LessonStateResponse,
    ProcessLessonRequest,
    SlideResponse,
    UploadUrlRequest,
    UploadUrlResponse,
)
from app.frames.presentation import process_presentation_pdf
from app.models.slide import LessonSlide
from app.core.config import get_settings
from app.core.events import emit_persistent_event
from app.core.logging import get_logger
from app.core.redis import add_to_stream
from app.core.s3 import get_presigned_url, head_object, resolve_media_url
from app.core.security import CurrentUser, require_role
from app.models.frame import Frame
from app.models.lesson import Lesson
from app.models.note import LessonSummary, NoteBlock
from app.models.transcript import TranscriptSegment
from app.workers.file_processor import FileProcessor
from app.workers.finalizer import finalize_lesson

router = APIRouter(prefix="/lessons", tags=["lessons"])
logger = get_logger("routes.lessons")
settings = get_settings()


def _generate_livekit_token(room_name: str, identity: str) -> str | None:
    try:
        from livekit import api
        token = (
            api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
            .with_identity(identity)
            .with_name(identity)
            .with_grants(
                api.VideoGrants(
                    room_join=True,
                    room=room_name,
                    can_publish=True,
                    can_subscribe=True,
                )
            )
            .to_jwt()
        )
        return token
    except Exception as e:
        logger.warning("livekit_token_generation_failed", error=str(e))
        return f"dev_token_{identity}_{room_name}"


def _format_lesson_response(lesson: Lesson, teacher_token: str | None = None) -> LessonResponse:
    livekit_url = settings.LIVEKIT_URL if lesson.source == "live" else None
    return LessonResponse(
        id=lesson.id,
        org_id=lesson.org_id,
        group_id=lesson.group_id,
        teacher_id=lesson.teacher_id,
        title=lesson.title,
        subject=lesson.subject,
        language=lesson.language,
        source=lesson.source,
        status=lesson.status,
        visibility_mode=lesson.visibility_mode if isinstance(getattr(lesson, "visibility_mode", None), str) else "live",
        expected_terms=lesson.expected_terms,
        roi=lesson.roi,
        livekit_room=lesson.livekit_room,
        last_seq=lesson.last_seq,
        cost_usd=float(lesson.cost_usd),
        started_at=lesson.started_at,
        ended_at=lesson.ended_at,
        created_at=lesson.created_at,
        livekit_url=livekit_url,
        teacher_token=teacher_token,
    )


@router.post(
    "",
    response_model=LessonResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(enforce_rate_limit)],
)
async def create_lesson(
    payload: LessonCreateRequest,
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    redis_client: aioredis.Redis = Depends(get_redis),
    user: CurrentUser = Depends(require_role("teacher", "admin")),
) -> Any:
    # 1. Idempotency Check
    if idempotency_key:
        cached_response = await redis_client.get(f"idempotency:{idempotency_key}")
        if cached_response:
            logger.info("idempotency_cache_hit", key=idempotency_key)
            return json.loads(cached_response)

    # 2. Consent validation for Live lessons
    if payload.source == "live" and not payload.consent_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "consent_required",
                "message": "Recording consent (consent_confirmed) is required to start a live lesson.",
            },
        )

    lesson_id = uuid.uuid4()
    livekit_room = f"room-{lesson_id}" if payload.source == "live" else None
    teacher_token = None
    if payload.source == "live":
        teacher_token = _generate_livekit_token(livekit_room, str(user.user_id))

    new_lesson = Lesson(
        id=lesson_id,
        org_id=user.org_id,
        group_id=payload.group_id,
        teacher_id=user.user_id,
        title=payload.title,
        subject=payload.subject,
        language=payload.language,
        source=payload.source,
        status="created",
        visibility_mode=payload.visibility_mode,
        expected_terms=payload.expected_terms,
        roi=payload.roi,
        livekit_room=livekit_room,
        last_seq=0,
        cost_usd=0.0,
    )

    db.add(new_lesson)
    await db.flush()

    # Emit lesson.status persistent event (allocates seq=1)
    await emit_persistent_event(
        session=db,
        lesson_id=lesson_id,
        event_type="lesson.status",
        data={"status": "created", "visibility_mode": payload.visibility_mode},
        publish_to_redis_now=True,
    )

    await db.commit()
    await db.refresh(new_lesson)

    response_data = _format_lesson_response(new_lesson, teacher_token=teacher_token)

    if idempotency_key:
        await redis_client.setex(
            f"idempotency:{idempotency_key}",
            86400,
            response_data.model_dump_json(),
        )

    logger.info("lesson_created", lesson_id=str(new_lesson.id))
    return response_data


@router.get(
    "/{lesson_id}",
    response_model=LessonResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def get_lesson(
    lesson: Lesson = Depends(get_lesson_for_user),
) -> Any:
    return _format_lesson_response(lesson)


@router.post(
    "/{lesson_id}/start",
    response_model=LessonResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def start_lesson(
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("teacher", "admin")),
) -> Any:
    """Starts a live lesson: launches media bot and emits lesson.status."""
    if lesson.status == "live":
        return _format_lesson_response(lesson)

    lesson.status = "live"
    lesson.started_at = datetime.now(timezone.utc)
    await db.flush()

    # Notify bot via Redis stream
    await add_to_stream("stream:bot-commands", {
        "command": "start",
        "lesson_id": str(lesson.id),
        "room": lesson.livekit_room or f"room-{lesson.id}",
        "language": lesson.language,
    })

    await emit_persistent_event(
        session=db,
        lesson_id=lesson.id,
        event_type="lesson.status",
        data={"status": "live"},
        publish_to_redis_now=True,
    )

    await db.commit()
    await db.refresh(lesson)
    logger.info("lesson_started", lesson_id=str(lesson.id))
    return _format_lesson_response(lesson)


@router.post(
    "/{lesson_id}/end",
    response_model=LessonResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def end_lesson(
    background_tasks: BackgroundTasks,
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("teacher", "admin")),
) -> Any:
    """Ends live lesson, triggers final pass and summary generation."""
    if lesson.status in ("ready", "processing"):
        return _format_lesson_response(lesson)

    lesson.status = "processing"
    now_iso = datetime.now(timezone.utc).isoformat()
    lesson.ended_at = datetime.now(timezone.utc)
    await db.flush()

    # Emit lesson.ended event
    await emit_persistent_event(
        session=db,
        lesson_id=lesson.id,
        event_type="lesson.ended",
        data={"ended_at": now_iso},
        publish_to_redis_now=True,
    )

    # Disconnect bot via stream
    await add_to_stream("stream:bot-commands", {
        "command": "stop",
        "lesson_id": str(lesson.id),
    })

    await db.commit()
    await db.refresh(lesson)

    # Launch finalizer task in background
    background_tasks.add_task(finalize_lesson, lesson.id)

    logger.info("lesson_ended", lesson_id=str(lesson.id))
    return _format_lesson_response(lesson)


@router.post(
    "/{lesson_id}/upload-url",
    response_model=UploadUrlResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def get_upload_url(
    payload: UploadUrlRequest,
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("teacher", "admin")),
) -> Any:
    """Generates a presigned S3 PUT URL for uploading recording (Section 11 & 18.5)."""
    if lesson.source != "upload":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "invalid_source", "message": "Upload URLs are only available for lessons with source='upload'"},
        )

    ext = payload.filename.split(".")[-1].lower() if "." in payload.filename else ""
    if ext not in settings.ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "unsupported_file_extension",
                "message": f"Extension '{ext}' is not supported. Allowed: {settings.ALLOWED_UPLOAD_EXTENSIONS}",
            },
        )

    s3_key = f"lessons/{lesson.id}/input.{ext}"
    expires_in = 3600
    upload_url = await get_presigned_url(s3_key, client_method="put_object", expires_in=expires_in)

    if lesson.status == "created":
        lesson.status = "uploaded"
        await db.flush()
        await emit_persistent_event(
            session=db,
            lesson_id=lesson.id,
            event_type="lesson.status",
            data={"status": "uploaded"},
            publish_to_redis_now=True,
        )
        await db.commit()

    logger.info("upload_url_generated", lesson_id=str(lesson.id), s3_key=s3_key)
    return UploadUrlResponse(
        upload_url=upload_url,
        s3_key=s3_key,
        expires_in=expires_in,
    )


@router.post(
    "/{lesson_id}/process",
    response_model=LessonResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def process_uploaded_lesson(
    background_tasks: BackgroundTasks,
    payload: ProcessLessonRequest | None = None,
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("teacher", "admin")),
) -> Any:
    """Initiates asynchronous processing of an uploaded lesson recording (Section 11 & 18.5)."""
    if lesson.source != "upload":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "invalid_source", "message": "Only lessons with source='upload' can be processed"},
        )

    if lesson.status not in ("created", "uploaded"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "invalid_status",
                "message": f"Cannot process lesson in status '{lesson.status}'. Expected 'created' or 'uploaded'.",
            },
        )

    s3_key = payload.s3_key if (payload and payload.s3_key) else f"lessons/{lesson.id}/input.mp4"

    # Validate file existence and size in S3
    try:
        metadata = await head_object(s3_key)
        content_length = metadata.get("ContentLength", 0)
        if content_length > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "file_too_large",
                    "message": f"File size {content_length} bytes exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_BYTES} bytes",
                },
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "file_not_found",
                "message": f"Uploaded recording file was not found in S3 at key '{s3_key}': {str(e)}",
            },
        )

    lesson.status = "processing"
    lesson.started_at = datetime.now(timezone.utc)
    await db.flush()

    await emit_persistent_event(
        session=db,
        lesson_id=lesson.id,
        event_type="lesson.status",
        data={"status": "processing"},
        publish_to_redis_now=True,
    )

    await db.commit()
    await db.refresh(lesson)

    processor = FileProcessor()
    background_tasks.add_task(processor.process_lesson_recording, lesson.id, s3_key)

    logger.info("recording_processing_queued", lesson_id=str(lesson.id), s3_key=s3_key)
    return _format_lesson_response(lesson)


@router.post(
    "/{lesson_id}/materials",
    response_model=list[SlideResponse],
    dependencies=[Depends(enforce_rate_limit)],
)
async def upload_lesson_materials(
    lesson_id: uuid.UUID,
    file: UploadFile = File(...),
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("teacher", "admin")),
) -> Any:
    """
    Uploads presentation materials (PDF), renders clean high-res slides into WebP,
    calculates pHash for zero-cost stream matching, and warms up ASR expected_terms.
    """
    filename = file.filename or "presentation.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "unsupported_format", "message": "Only PDF presentation files are currently supported"},
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "empty_file", "message": "Uploaded file is empty"},
        )

    try:
        slides, extracted_terms = await process_presentation_pdf(
            file_bytes=file_bytes,
            lesson_id=lesson.id,
        )
    except Exception as e:
        logger.error("presentation_processing_failed", error=str(e), lesson_id=str(lesson.id))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "presentation_error", "message": f"Failed to parse presentation: {str(e)}"},
        )

    # Save slides to database
    db.add_all(slides)

    # Accumulate terms into lesson.expected_terms
    current_terms = list(lesson.expected_terms or [])
    seen = {t.lower() for t in current_terms}
    for t in extracted_terms:
        if t.lower() not in seen:
            seen.add(t.lower())
            current_terms.append(t)
    lesson.expected_terms = current_terms
    await db.flush()

    # Emit lesson.materials.ready event
    await emit_persistent_event(
        session=db,
        lesson_id=lesson.id,
        event_type="lesson.materials.ready",
        data={"total_slides": len(slides), "extracted_terms_count": len(extracted_terms)},
        publish_to_redis_now=True,
    )

    await db.commit()

    return [
        SlideResponse(
            id=s.id,
            lesson_id=s.lesson_id,
            slide_idx=s.slide_idx,
            s3_key=s.s3_key,
            url=resolve_media_url(s.s3_key),
            phash=s.phash,
            extracted_text=s.extracted_text,
            terms=s.terms or [],
            width=s.width,
            height=s.height,
        )
        for s in slides
    ]


@router.get(
    "/{lesson_id}/slides",
    response_model=list[SlideResponse],
    dependencies=[Depends(enforce_rate_limit)],
)
async def get_lesson_slides(
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Returns all pre-rendered slides for a lesson."""
    stmt = select(LessonSlide).where(LessonSlide.lesson_id == lesson.id).order_by(LessonSlide.slide_idx.asc())
    res = await db.execute(stmt)
    slides = res.scalars().all()
    return [
        SlideResponse(
            id=s.id,
            lesson_id=s.lesson_id,
            slide_idx=s.slide_idx,
            s3_key=s.s3_key,
            url=resolve_media_url(s.s3_key),
            phash=s.phash,
            extracted_text=s.extracted_text,
            terms=s.terms or [],
            width=s.width,
            height=s.height,
        )
        for s in slides
    ]


@router.get(
    "/{lesson_id}/recording",
    dependencies=[Depends(enforce_rate_limit)],
)
async def get_lesson_recording(
    lesson: Lesson = Depends(get_lesson_for_user),
) -> Any:
    """Returns presigned URL for the lesson audio/video recording (for synchronized playback)."""
    from app.media.egress import get_recording_playback_url
    playback_url = await get_recording_playback_url(lesson.id)
    return {
        "lesson_id": str(lesson.id),
        "recording_url": playback_url,
        "format": "mp4",
    }


@router.get(
    "/{lesson_id}/state",
    response_model=LessonStateResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def get_lesson_state(
    lesson: Lesson = Depends(get_lesson_for_user),
    transcript_after_ms: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> Any:
    """Returns a complete snapshot of the lesson state for clients."""
    # 1. Blocks
    b_stmt = select(NoteBlock).where(NoteBlock.lesson_id == lesson.id).order_by(NoteBlock.position.asc())
    if getattr(lesson, "visibility_mode", "live") == "moderated" and user.role == "student":
        b_stmt = b_stmt.where(NoteBlock.status == "approved")
    b_res = await db.execute(b_stmt)
    blocks = [
        {
            "id": str(b.id),
            "position": b.position,
            "title": b.title,
            "summary": b.summary,
            "body_md": b.body_md,
            "status": getattr(b, "status", "approved"),
            "key_terms": b.key_terms,
            "callouts": b.callouts,
            "frame_refs": b.frame_refs,
            "uncertain": b.uncertain,
            "version": b.version,
            "edited_by_teacher": b.edited_by_teacher,
            "t_start_ms": b.t_start_ms,
            "t_end_ms": b.t_end_ms,
        }
        for b in b_res.scalars().all()
    ]

    # 2. Selected Frames
    f_stmt = (
        select(Frame)
        .where(Frame.lesson_id == lesson.id, Frame.status == "selected")
        .order_by(Frame.t_ms.asc())
    )
    f_res = await db.execute(f_stmt)
    frames = [
        {
            "id": str(f.id),
            "t_ms": f.t_ms,
            "kind": f.kind,
            "title": f.title,
            "original_url": resolve_media_url(f.s3_key),
            "annotated_url": resolve_media_url(f.s3_key_annotated),
            "annotations": f.annotations,
            "ocr_markdown": f.ocr_markdown,
            "description": f.description,
        }
        for f in f_res.scalars().all()
    ]

    # 3. Summary
    s_stmt = select(LessonSummary).where(LessonSummary.lesson_id == lesson.id)
    s_res = await db.execute(s_stmt)
    summary_obj = s_res.scalar_one_or_none()
    summary = None
    if summary_obj:
        summary = {
            "tldr": summary_obj.tldr,
            "outline": summary_obj.outline,
            "glossary": summary_obj.glossary,
            "takeaways": summary_obj.takeaways,
            "homework": summary_obj.homework,
        }

    # 4. Transcript segments
    t_stmt = (
        select(TranscriptSegment)
        .where(TranscriptSegment.lesson_id == lesson.id, TranscriptSegment.start_ms >= transcript_after_ms)
        .order_by(TranscriptSegment.start_ms.asc())
        .limit(limit)
    )
    t_res = await db.execute(t_stmt)
    transcript = [
        {
            "id": str(t.id),
            "start_ms": t.start_ms,
            "end_ms": t.end_ms,
            "text": t.text,
            "speaker": t.speaker,
            "words": getattr(t, "words", None),
        }
        for t in t_res.scalars().all()
    ]

    return LessonStateResponse(
        lesson=_format_lesson_response(lesson),
        last_seq=lesson.last_seq,
        blocks=blocks,
        frames=frames,
        summary=summary,
        transcript=transcript,
    )


@router.patch(
    "/{lesson_id}/blocks/{block_id}",
    dependencies=[Depends(enforce_rate_limit)],
)
async def update_note_block(
    block_id: uuid.UUID,
    payload: BlockUpdateRequest,
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("teacher", "admin")),
) -> Any:
    """Manual teacher editing of a note block (Section 11 of TZ)."""
    block = await db.get(NoteBlock, block_id)
    if not block or block.lesson_id != lesson.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "block_not_found", "message": "Note block not found"},
        )

    if payload.title is not None:
        block.title = payload.title
    if payload.body_md is not None:
        block.body_md = payload.body_md

    block.version += 1
    block.edited_by_teacher = True
    await db.flush()

    event_payload = {
        "block_id": str(block.id),
        "position": block.position,
        "title": block.title,
        "summary": block.summary,
        "body_md": block.body_md,
        "key_terms": block.key_terms,
        "callouts": block.callouts,
        "frame_refs": block.frame_refs,
        "uncertain": block.uncertain,
        "version": block.version,
        "edited_by_teacher": block.edited_by_teacher,
    }

    await emit_persistent_event(
        session=db,
        lesson_id=lesson.id,
        event_type="note.block.updated",
        data=event_payload,
        publish_to_redis_now=True,
    )

    await db.commit()
    await db.refresh(block)
    return event_payload


@router.post(
    "/{lesson_id}/blocks/{block_id}/approve",
    dependencies=[Depends(enforce_rate_limit)],
)
async def approve_note_block(
    block_id: uuid.UUID,
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("teacher", "admin")),
) -> Any:
    """Approves a note block in moderated mode, making it visible to students."""
    block = await db.get(NoteBlock, block_id)
    if not block or block.lesson_id != lesson.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "block_not_found", "message": "Note block not found"},
        )

    block.status = "approved"
    await db.flush()

    event_payload = {
        "block_id": str(block.id),
        "position": block.position,
        "title": block.title,
        "summary": block.summary,
        "body_md": block.body_md,
        "status": "approved",
        "key_terms": block.key_terms,
        "callouts": block.callouts,
        "frame_refs": block.frame_refs,
        "uncertain": block.uncertain,
        "version": block.version,
        "edited_by_teacher": block.edited_by_teacher,
    }

    await emit_persistent_event(
        session=db,
        lesson_id=lesson.id,
        event_type="note.block.approved",
        data=event_payload,
        publish_to_redis_now=True,
    )

    await db.commit()
    await db.refresh(block)
    return event_payload


@router.get(
    "/{lesson_id}/export",
    dependencies=[Depends(enforce_rate_limit)],
)
async def export_lesson(
    lesson: Lesson = Depends(get_lesson_for_user),
    format: str = Query("md"),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Exports compiled lesson notes into Markdown or Anki TSV format."""
    if format not in ("md", "anki", "anki_tsv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "unsupported_format", "message": "Supported formats: 'md', 'anki', 'anki_tsv'"},
        )

    # Fetch blocks
    b_stmt = select(NoteBlock).where(NoteBlock.lesson_id == lesson.id).order_by(NoteBlock.position.asc())
    b_res = await db.execute(b_stmt)
    blocks = b_res.scalars().all()

    # Fetch summary
    s_stmt = select(LessonSummary).where(LessonSummary.lesson_id == lesson.id)
    s_res = await db.execute(s_stmt)
    summary = s_res.scalar_one_or_none()

    if format in ("anki", "anki_tsv"):
        tsv_lines = ["#separator:tab", "#html:true", "Front\tBack"]
        seen_terms = set()

        # 1. From glossary
        if summary and summary.glossary:
            for item in summary.glossary:
                term = str(item.get("term", "")).strip()
                defn = str(item.get("definition", "")).strip()
                if term and term.lower() not in seen_terms:
                    seen_terms.add(term.lower())
                    term_clean = term.replace("\t", " ").replace("\n", " ")
                    defn_clean = defn.replace("\t", " ").replace("\n", "<br>")
                    tsv_lines.append(f"{term_clean}\t{defn_clean}")

        # 2. From block key terms
        for block in blocks:
            if block.key_terms:
                for item in block.key_terms:
                    term = str(item.get("term", "")).strip()
                    defn = str(item.get("definition", "")).strip()
                    if term and term.lower() not in seen_terms:
                        seen_terms.add(term.lower())
                        term_clean = term.replace("\t", " ").replace("\n", " ")
                        defn_clean = defn.replace("\t", " ").replace("\n", "<br>")
                        defn_clean += f"<br><small><i>(Тема: {block.title})</i></small>"
                        tsv_lines.append(f"{term_clean}\t{defn_clean}")

        tsv_content = "\n".join(tsv_lines)
        return Response(
            content=tsv_content,
            media_type="text/tab-separated-values; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="lesson_{lesson.id}_anki.tsv"'},
        )

    lines = [f"# {lesson.title}\n"]
    if lesson.subject:
        lines.append(f"**Предмет:** {lesson.subject}\n")

    if summary and summary.tldr:
        lines.append(f"## Краткое содержание (TL;DR)\n{summary.tldr}\n")

    for block in blocks:
        lines.append(f"## {block.position}. {block.title}\n")
        lines.append(f"{block.body_md}\n")

        if block.key_terms:
            lines.append("### Ключевые термины:")
            for term in block.key_terms:
                lines.append(f"- **{term.get('term')}**: {term.get('definition')}")
            lines.append("")

        if block.callouts:
            for c in block.callouts:
                kind = c.get("kind", "note").upper()
                lines.append(f"> **[{kind}]** {c.get('text')}\n")

    if summary:
        if summary.takeaways:
            lines.append("## Основные выводы\n")
            for t in summary.takeaways:
                lines.append(f"- {t}")
            lines.append("")

        if summary.homework:
            lines.append(f"## Домашнее задание\n{summary.homework}\n")

    markdown_content = "\n".join(lines)
    return Response(
        content=markdown_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=lesson_{lesson.id}.md"},
    )
