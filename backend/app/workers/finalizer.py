import asyncio
from datetime import datetime, timezone
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.ai.pipeline import load_prompt_template
from app.ai.providers.base import PromptBundle
from app.ai.providers.gemini import GeminiProvider
from app.ai.schemas import FinalSummaryOutput
from app.core.db import AsyncSessionLocal
from app.core.events import emit_persistent_event
from app.core.logging import get_logger
from app.models.lesson import Lesson
from app.models.note import LessonSummary, NoteBlock

logger = get_logger("workers.finalizer")


async def finalize_lesson(
    lesson_id: uuid.UUID | str,
    llm_provider: GeminiProvider | None = None,
) -> LessonSummary:
    """
    Executes the final pass of the lesson (Section 8.3 of TZ):
    - Summarizes all note blocks into tldr, outline, unified glossary, takeaways, homework.
    - Persists LessonSummary.
    - Emits summary.ready persistent event with seq.
    - Updates Lesson status to 'ready'.
    """
    lesson_uuid = uuid.UUID(str(lesson_id))
    provider = llm_provider or GeminiProvider()

    async with AsyncSessionLocal() as db:
        lesson = await db.get(Lesson, lesson_uuid)
        if not lesson:
            raise ValueError(f"Lesson not found: {lesson_id}")

        # Gather all note blocks ordered by position
        stmt = (
            select(NoteBlock)
            .where(NoteBlock.lesson_id == lesson_uuid)
            .order_by(NoteBlock.position.asc())
        )
        res = await db.execute(stmt)
        blocks = res.scalars().all()

        blocks_text_parts = []
        for b in blocks:
            terms_text = ", ".join([f"{t.get('term')}: {t.get('definition')}" for t in b.key_terms])
            blocks_text_parts.append(
                f"### Блок {b.position}: {b.title}\n"
                f"Кратко: {b.summary}\n"
                f"Текст:\n{b.body_md}\n"
                f"Термины: {terms_text}\n"
            )

        full_blocks_text = "\n\n".join(blocks_text_parts) if blocks_text_parts else "Блоки конспекта отсутствуют."

        system_prompt = load_prompt_template("final_pass")
        user_prompt = (
            f"Тема урока: {lesson.title}\n"
            f"Предмет: {lesson.subject or 'Не указан'}\n"
            f"Язык урока: {lesson.language}\n\n"
            f"Все разделы конспекта урока:\n{full_blocks_text}\n\n"
            f"Сформируй итоговое резюме урока, оглавление, глоссарий, выводы и домашнее задание."
        )

        bundle = PromptBundle(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            lesson_id=lesson_uuid,
            prompt_version="1.0.0",
            thinking_level="medium",  # Medium for final pass / report per Section 4.2
        )

        output: FinalSummaryOutput = await provider.generate(
            task="final_pass",
            prompt=bundle,
            schema=FinalSummaryOutput,
        )

        # Check if summary already exists (idempotency)
        summary = await db.get(LessonSummary, lesson_uuid)
        if not summary:
            summary = LessonSummary(
                lesson_id=lesson_uuid,
                tldr=output.tldr,
                outline=[o.model_dump() for o in output.outline],
                glossary=[g.model_dump() for g in output.glossary],
                takeaways=output.takeaways,
                homework=output.homework,
            )
            db.add(summary)
        else:
            summary.tldr = output.tldr
            summary.outline = [o.model_dump() for o in output.outline]
            summary.glossary = [g.model_dump() for g in output.glossary]
            summary.takeaways = output.takeaways
            summary.homework = output.homework

        # Update lesson status and ended_at
        lesson.status = "ready"
        if not lesson.ended_at:
            lesson.ended_at = datetime.now(timezone.utc)

        await db.flush()

        # Emit summary.ready persistent event with seq
        event_data = {
            "tldr": summary.tldr,
            "outline": summary.outline,
            "glossary": summary.glossary,
            "takeaways": summary.takeaways,
            "homework": summary.homework,
        }
        await emit_persistent_event(
            session=db,
            lesson_id=lesson_uuid,
            event_type="summary.ready",
            data=event_data,
            publish_to_redis_now=True,
        )

        # Emit lesson.status event -> ready
        await emit_persistent_event(
            session=db,
            lesson_id=lesson_uuid,
            event_type="lesson.status",
            data={"status": "ready"},
            publish_to_redis_now=True,
        )

        await db.commit()

        # Trigger quiz generation in draft status per Section 13.1 of TZ
        try:
            from app.quiz.generation import generate_quiz_for_lesson
            await generate_quiz_for_lesson(lesson_id=lesson_uuid, db=db, llm_provider=provider)
        except Exception as e:
            logger.warning("auto_quiz_generation_deferred", lesson_id=str(lesson_uuid), error=str(e))

        logger.info("lesson_finalized", lesson_id=str(lesson_uuid))
        return summary
