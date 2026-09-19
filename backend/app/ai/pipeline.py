import json
from pathlib import Path
from typing import Any
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.ai.providers.base import PromptBundle
from app.ai.providers.gemini import GeminiProvider
from app.ai.schemas import NoteBlockOutput
from app.core.events import emit_persistent_event
from app.core.logging import get_logger
from app.core.s3 import resolve_media_url
from app.ai.faithfulness import verify_block_faithfulness
from app.models.frame import Frame
from app.models.lesson import Lesson
from app.models.note import NoteBlock
from app.models.transcript import TranscriptSegment

logger = get_logger("ai.pipeline")

PROMPTS_DIR = Path(__file__).parent / "prompts"


def load_prompt_template(name: str) -> str:
    path = PROMPTS_DIR / f"{name}.md"
    if path.exists():
        return path.read_text(encoding="utf-8")
    return "Ты — ассистент составления конспектов."


async def generate_note_block_for_window(
    lesson_id: uuid.UUID | str,
    window_id: uuid.UUID | str,
    position: int,
    start_ms: int,
    end_ms: int,
    db: AsyncSession,
    llm_provider: GeminiProvider | None = None,
) -> NoteBlock:
    """
    Assembles window data (transcript, keyframes, context) and executes the LLM pipeline
    to produce a structured NoteBlock per Section 8.2 of TZ.
    """
    lesson_uuid = uuid.UUID(str(lesson_id))
    window_uuid = uuid.UUID(str(window_id))
    provider = llm_provider or GeminiProvider()

    lesson = await db.get(Lesson, lesson_uuid)
    if not lesson:
        raise ValueError(f"Lesson not found: {lesson_id}")

    # 1. Gather transcript segments for window
    t_stmt = (
        select(TranscriptSegment)
        .where(
            TranscriptSegment.lesson_id == lesson_uuid,
            TranscriptSegment.start_ms >= start_ms,
            TranscriptSegment.end_ms <= end_ms + 1000,
        )
        .order_by(TranscriptSegment.start_ms.asc())
    )
    t_res = await db.execute(t_stmt)
    segments = t_res.scalars().all()
    transcript_text = "\n".join([f"[{s.speaker or 'Спикер'}]: {s.text}" for s in segments])

    # 2. Gather selected frames in this window
    f_stmt = (
        select(Frame)
        .where(
            Frame.lesson_id == lesson_uuid,
            Frame.status == "selected",
            Frame.t_ms >= start_ms,
            Frame.t_ms <= end_ms,
        )
        .order_by(Frame.t_ms.asc())
    )
    f_res = await db.execute(f_stmt)
    frames = f_res.scalars().all()

    valid_frame_ids = {str(f.id) for f in frames}

    frames_summary_parts = []
    for f in frames:
        frames_summary_parts.append(
            f"- Кадр ID: {f.id} (время {f.t_ms // 1000}с, тип: {f.kind}, заголовок: '{f.title}')\n"
            f"  OCR текст: {f.ocr_markdown}\n"
            f"  Описание: {f.description}\n"
            f"  Аннотации: {json.dumps(f.annotations, ensure_ascii=False)}"
        )
    frames_context = "\n".join(frames_summary_parts) if frames_summary_parts else "Кадров в этом окне нет."

    # 3. Gather summary of previous blocks for continuity
    prev_stmt = (
        select(NoteBlock)
        .where(NoteBlock.lesson_id == lesson_uuid)
        .order_by(NoteBlock.position.desc())
        .limit(2)
    )
    prev_res = await db.execute(prev_stmt)
    prev_blocks = prev_res.scalars().all()
    prev_context = "\n".join([f"- Блок {b.position}: {b.title} — {b.summary}" for b in reversed(prev_blocks)])
    if not prev_context:
        prev_context = "Это первый блок урока."

    # 4. Construct prompts
    system_prompt = load_prompt_template("note_block")
    user_prompt = (
        f"Тема урока: {lesson.title}\n"
        f"Предмет: {lesson.subject or 'Не указан'}\n"
        f"Язык урока: {lesson.language}\n"
        f"Ключевые термины урока: {', '.join(lesson.expected_terms or [])}\n\n"
        f"Контекст предыдущих блоков:\n{prev_context}\n\n"
        f"Кадры в текущем окне:\n{frames_context}\n\n"
        f"Транскрипт речи в текущем окне (тайминг {start_ms // 1000}с - {end_ms // 1000}с):\n"
        f"{transcript_text}\n\n"
        f"Сгенерируй блок конспекта по строгой схеме. В frame_refs ссылайся только на реальные ID кадров из списка."
    )

    bundle = PromptBundle(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        lesson_id=lesson_uuid,
        prompt_version="1.0.0",
        thinking_level="low",  # Section 4.2: low for note blocks
    )

    # 5. Call LLM
    output: NoteBlockOutput = await provider.generate(
        task="note_block",
        prompt=bundle,
        schema=NoteBlockOutput,
    )

    # 6. Postprocess: filter hallucinatory frame_refs
    cleaned_frame_refs = []
    for ref in output.frame_refs:
        if str(ref.frame_id) in valid_frame_ids:
            cleaned_frame_refs.append(ref.model_dump())
        else:
            logger.warning("filtered_invalid_frame_id", invalid_id=str(ref.frame_id))

    # 6.5. Second-pass Faithfulness Verification (Grounding Check)
    slide_text = "\n".join([f.ocr_markdown for f in frames if f.ocr_markdown])
    output = await verify_block_faithfulness(
        output=output,
        transcript_text=transcript_text,
        slide_text=slide_text if slide_text else None,
        provider=provider,
        lesson_id=lesson_uuid,
    )

    # 7. Persist NoteBlock to DB
    block_id = uuid.uuid4()
    initial_status = "pending_review" if getattr(lesson, "visibility_mode", "live") == "moderated" else "approved"
    note_block = NoteBlock(
        id=block_id,
        lesson_id=lesson_uuid,
        window_id=window_uuid,
        position=position,
        t_start_ms=start_ms,
        t_end_ms=end_ms,
        title=output.title,
        summary=output.summary,
        body_md=output.body_md,
        status=initial_status,
        key_terms=[t.model_dump() for t in output.key_terms],
        callouts=[c.model_dump() for c in output.callouts],
        frame_refs=cleaned_frame_refs,
        uncertain=output.uncertain,
        version=1,
        edited_by_teacher=False,
    )
    db.add(note_block)
    await db.flush()

    # Frame details for event
    frames_for_event = [
        {
            "frame_id": str(f.id),
            "original_url": resolve_media_url(f.s3_key),
            "annotated_url": resolve_media_url(f.s3_key_annotated),
        }
        for f in frames
    ]

    event_payload = {
        "block_id": str(note_block.id),
        "position": note_block.position,
        "t_start_ms": note_block.t_start_ms,
        "t_end_ms": note_block.t_end_ms,
        "title": note_block.title,
        "summary": note_block.summary,
        "body_md": note_block.body_md,
        "status": initial_status,
        "key_terms": note_block.key_terms,
        "callouts": note_block.callouts,
        "frame_refs": note_block.frame_refs,
        "uncertain": note_block.uncertain,
        "version": note_block.version,
        "frames": frames_for_event,
    }

    # 8. Emit persistent note.block.created event with allocated seq
    await emit_persistent_event(
        session=db,
        lesson_id=lesson_uuid,
        event_type="note.block.created",
        data=event_payload,
        publish_to_redis_now=True,
    )

    logger.info("note_block_created", lesson_id=str(lesson_uuid), position=position, title=note_block.title)
    return note_block
