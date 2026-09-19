import asyncio
import io
import json
import uuid
from typing import Any
import numpy as np
from PIL import Image
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.ai.providers.base import FrameRequest
from app.ai.providers.gemini import GeminiProvider
from app.core.config import get_settings
from app.core.db import AsyncSessionLocal
from app.core.events import emit_persistent_event
from app.core.logging import get_logger
from app.core.redis import (
    create_consumer_group_if_not_exists,
    get_redis_client,
)
from app.core.s3 import download_bytes, resolve_media_url, upload_bytes
from app.frames.render import encode_image_to_webp, render_annotations_on_image
from app.models.frame import Frame
from app.models.lesson import Lesson
from app.models.transcript import TranscriptSegment

logger = get_logger("workers.ai_worker")
settings = get_settings()

STREAM_FRAMES = "stream:frames"
GROUP_AI_WORKERS = "ai-workers"


def filter_annotation_areas(annotations: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Filters annotations per Section 8.1 of TZ:
    Discards annotations with area < 0.2% or > 90% of frame.
    Normalized coordinates 0-1000: total area = 1,000,000.
    min_area = 2,000 (0.2%), max_area = 900,000 (90%).
    """
    valid_annotations = []
    for ann in annotations:
        box = ann.get("box_2d")
        if box and len(box) == 4:
            ymin, xmin, ymax, xmax = box
            area = (ymax - ymin) * (xmax - xmin)
            if 2000 <= area <= 900000:
                valid_annotations.append(ann)
        else:
            valid_annotations.append(ann)
    return valid_annotations


async def process_candidate_frame(
    frame_id: uuid.UUID,
    lesson_id: uuid.UUID,
    s3_key: str,
    t_ms: int,
    db: AsyncSession,
    vlm_provider: GeminiProvider | None = None,
) -> Frame | None:
    """
    Downloads frame from S3, fetches context, runs VLM analysis,
    filters annotations, renders Pillow overlay if accepted,
    updates Frame in DB and emits persistent frame.selected event.
    """
    vlm = vlm_provider or GeminiProvider()
    frame_id_str = str(frame_id)

    # 1. Download image from S3
    image_bytes = await download_bytes(s3_key)
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_rgb = np.array(pil_img)
    w, h = pil_img.size

    # 2. Fetch lesson metadata
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        return None

    # Fetch recent 60s transcript context
    window_start_ms = max(0, t_ms - 60000)
    window_end_ms = t_ms + 10000
    t_stmt = (
        select(TranscriptSegment)
        .where(
            TranscriptSegment.lesson_id == lesson_id,
            TranscriptSegment.start_ms >= window_start_ms,
            TranscriptSegment.start_ms <= window_end_ms,
        )
        .order_by(TranscriptSegment.start_ms.asc())
    )
    t_res = await db.execute(t_stmt)
    segments = t_res.scalars().all()
    transcript_context = " ".join([s.text for s in segments])

    # 3. Call VLM
    req = FrameRequest(
        lesson_id=lesson_id,
        image_bytes=image_bytes,
        transcript_context=transcript_context,
        topic=lesson.title,
        expected_terms=lesson.expected_terms or [],
        language=lesson.language,
    )

    analysis = await vlm.analyze_frame(req)

    # 4. Filter annotations
    raw_annotations = [a.model_dump() for a in analysis.annotations]
    valid_annotations = filter_annotation_areas(raw_annotations)

    frame = await db.get(Frame, frame_id)
    if not frame:
        return None

    # Check acceptance criteria (Section 8.1)
    is_kept = analysis.keep and (analysis.informativeness >= settings.KEEP_THRESHOLD)

    if not is_kept:
        frame.status = "rejected"
        frame.informativeness = analysis.informativeness
        frame.kind = analysis.kind
        await db.commit()
        logger.info("frame_rejected", frame_id=frame_id_str, score=analysis.informativeness)
        return frame

    # 5. Render annotations with Pillow
    annotated_img = render_annotations_on_image(image_rgb, valid_annotations)
    annotated_webp_bytes = encode_image_to_webp(annotated_img, quality=90)

    annotated_s3_key = f"lessons/{lesson_id}/frames/{t_ms}_annotated.webp"
    await upload_bytes(annotated_s3_key, annotated_webp_bytes, content_type="image/webp")

    # Update Frame record
    frame.status = "selected"
    frame.s3_key_annotated = annotated_s3_key
    frame.width = w
    frame.height = h
    frame.kind = analysis.kind
    frame.title = analysis.title
    frame.ocr_markdown = analysis.ocr_markdown
    frame.description = analysis.description
    frame.informativeness = analysis.informativeness
    frame.annotations = valid_annotations

    # Emit persistent frame.selected event with allocated seq
    event_data = {
        "frame_id": str(frame.id),
        "t_ms": frame.t_ms,
        "kind": frame.kind,
        "title": frame.title,
        "original_url": resolve_media_url(frame.s3_key),
        "annotated_url": resolve_media_url(annotated_s3_key),
        "width": frame.width,
        "height": frame.height,
        "annotations": valid_annotations,
        "ocr_markdown": frame.ocr_markdown,
        "description": frame.description,
    }
    await emit_persistent_event(
        session=db,
        lesson_id=lesson_id,
        event_type="frame.selected",
        data=event_data,
        publish_to_redis_now=True,
    )

    await db.commit()
    logger.info("frame_selected", frame_id=frame_id_str, title=frame.title)
    return frame


class AiFrameWorker:
    """
    Worker consuming messages from stream:frames to analyze candidate frames
    via VLM and render annotated images.
    """

    def __init__(self, consumer_name: str | None = None):
        self.consumer_name = consumer_name or f"worker-{uuid.uuid4().hex[:8]}"
        self.vlm_provider = GeminiProvider()
        self._running = True

    async def start(self) -> None:
        logger.info("ai_frame_worker_starting", consumer=self.consumer_name)
        await create_consumer_group_if_not_exists(STREAM_FRAMES, GROUP_AI_WORKERS)

        redis = get_redis_client()

        while self._running:
            try:
                # Read from stream:frames
                entries = await redis.xreadgroup(
                    groupname=GROUP_AI_WORKERS,
                    consumername=self.consumer_name,
                    streams={STREAM_FRAMES: ">"},
                    count=1,
                    block=2000,
                )

                if not entries:
                    continue

                for stream_name, messages in entries:
                    for msg_id, payload in messages:
                        await self._process_frame_message(msg_id, payload)
                        await redis.xack(STREAM_FRAMES, GROUP_AI_WORKERS, msg_id)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("ai_frame_worker_loop_error", error=str(e))
                await asyncio.sleep(1)

    async def _process_frame_message(self, msg_id: str, payload: dict[str, Any]) -> None:
        lesson_id_str = payload.get("lesson_id")
        frame_id_str = payload.get("frame_id")
        s3_key = payload.get("s3_key")
        t_ms = int(payload.get("t_ms", 0))

        if not lesson_id_str or not frame_id_str or not s3_key:
            return

        lesson_id = uuid.UUID(lesson_id_str)
        frame_id = uuid.UUID(frame_id_str)

        logger.info("analyzing_frame", frame_id=frame_id_str, t_ms=t_ms)

        async with AsyncSessionLocal() as db:
            await process_candidate_frame(
                frame_id=frame_id,
                lesson_id=lesson_id,
                s3_key=s3_key,
                t_ms=t_ms,
                db=db,
                vlm_provider=self.vlm_provider,
            )

    async def stop(self) -> None:
        self._running = False
