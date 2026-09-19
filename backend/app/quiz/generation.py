import re
from typing import Any
import uuid
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.pipeline import load_prompt_template
from app.ai.providers.base import PromptBundle
from app.ai.providers.gemini import GeminiProvider
from app.ai.schemas import QuizOutput, QuizQuestionItem
from app.core.config import get_settings
from app.core.events import emit_persistent_event
from app.core.logging import get_logger
from app.models.lesson import Lesson
from app.models.note import LessonSummary, NoteBlock
from app.models.quiz import Quiz, QuizQuestion

logger = get_logger("quiz.generation")
settings = get_settings()


class VerificationOutput(BaseModel):
    answers: list[int] = Field(default_factory=list)


def _compute_trigrams(text: str) -> set[str]:
    normalized = re.sub(r"[^\w\s]", "", text.lower())
    clean = "".join(normalized.split())
    if len(clean) < 3:
        return {clean}
    return {clean[i : i + 3] for i in range(len(clean) - 2)}


def _trigram_similarity(set_a: set[str], set_b: set[str]) -> float:
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a.intersection(set_b))
    union = len(set_a.union(set_b))
    return intersection / union if union > 0 else 0.0


async def generate_quiz_for_lesson(
    lesson_id: uuid.UUID | str,
    db: AsyncSession,
    llm_provider: GeminiProvider | None = None,
) -> Quiz:
    """
    Generates a draft quiz (Section 13.1 of TZ):
    - 8-10 questions (single, multiple, open)
    - Code validations (exact options, correct bounds, trigram dedup, <= 3 per block)
    - Second-pass verification with Flash-Lite
    - Persists draft quiz and emits quiz.ready event
    """
    lesson_uid = uuid.UUID(str(lesson_id))
    provider = llm_provider or GeminiProvider()

    lesson = await db.get(Lesson, lesson_uid)
    if not lesson:
        raise ValueError(f"Lesson not found: {lesson_id}")

    # Fetch blocks
    b_stmt = select(NoteBlock).where(NoteBlock.lesson_id == lesson_uid).order_by(NoteBlock.position.asc())
    b_res = await db.execute(b_stmt)
    blocks = b_res.scalars().all()
    if not blocks:
        raise ValueError(f"Cannot generate quiz for lesson {lesson_id} without note blocks")

    block_map: dict[int, NoteBlock] = {b.position: b for b in blocks}
    valid_positions = set(block_map.keys())

    # Build context from blocks
    blocks_context_lines = []
    for b in blocks:
        blocks_context_lines.append(
            f"--- Блок {b.position}: {b.title} ---\n"
            f"Кратко: {b.summary}\n"
            f"Текст:\n{b.body_md}\n"
        )
    blocks_text = "\n".join(blocks_context_lines)

    # 1. First Pass: Generate Quiz
    system_prompt = load_prompt_template("quiz")
    user_prompt = (
        f"Тема урока: {lesson.title}\n"
        f"Предмет: {lesson.subject or 'Не указан'}\n"
        f"Язык: {lesson.language}\n"
        f"Доступные номера блоков конспекта: {sorted(list(valid_positions))}\n\n"
        f"Материалы конспекта:\n{blocks_text}\n\n"
        f"Сформируй 8-10 проверочных вопросов строго в соответствии с правилами."
    )

    bundle = PromptBundle(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        lesson_id=lesson_uid,
        prompt_version="1.0.0",
        thinking_level="medium",
    )

    quiz_output: QuizOutput = await provider.generate(
        task="quiz_generation",
        prompt=bundle,
        schema=QuizOutput,
    )

    # 2. Code-level validations and filtering
    filtered_questions: list[QuizQuestionItem] = []
    accepted_trigram_sets: list[set[str]] = []
    block_question_counts: dict[int, int] = {p: 0 for p in valid_positions}

    for q in quiz_output.questions:
        # A. Type & Option validations
        if q.type == "single":
            if len(q.options) != 4 or len(q.correct) != 1 or not (0 <= q.correct[0] < 4):
                continue
        elif q.type == "multiple":
            if len(q.options) != 4 or len(q.correct) < 2 or any(not (0 <= idx < 4) for idx in q.correct):
                continue
        elif q.type == "open":
            if not q.rubric or not q.rubric.strip():
                continue
            q.options = []
            q.correct = []
        else:
            continue

        # B. Duplicate deduplication via trigrams
        q_trigrams = _compute_trigrams(q.text)
        is_dup = any(_trigram_similarity(q_trigrams, s) > 0.6 for s in accepted_trigram_sets)
        if is_dup:
            logger.info("dropped_duplicate_question", text=q.text[:40])
            continue

        # C. Block position validation and <= 3 per block limit
        if q.block_position not in valid_positions:
            # Fallback to first available block
            q.block_position = blocks[0].position

        if block_question_counts[q.block_position] >= 3:
            logger.info("dropped_excess_block_question", block=q.block_position)
            continue

        block_question_counts[q.block_position] += 1
        accepted_trigram_sets.append(q_trigrams)
        filtered_questions.append(q)

    # 3. Second-pass verification using Flash-Lite
    verify_system_prompt = load_prompt_template("quiz_verify")
    questions_to_create: list[dict[str, Any]] = []

    for pos, q in enumerate(filtered_questions, start=1):
        needs_review = False
        target_block = block_map[q.block_position]

        if q.type in ("single", "multiple"):
            verify_user_prompt = (
                f"Текст фрагмента конспекта:\n{target_block.body_md}\n\n"
                f"Вопрос: {q.text}\n"
                f"Варианты ответа:\n"
                + "\n".join([f"{i}. {opt}" for i, opt in enumerate(q.options)])
            )
            verify_bundle = PromptBundle(
                system_prompt=verify_system_prompt,
                user_prompt=verify_user_prompt,
                lesson_id=lesson_uid,
                prompt_version="1.0.0",
                thinking_level="minimal",
                model="gemini-3.5-flash-lite",
            )
            try:
                ver_res: VerificationOutput = await provider.generate(
                    task="quiz_verification",
                    prompt=verify_bundle,
                    schema=VerificationOutput,
                )
                if sorted(ver_res.answers) != sorted(q.correct):
                    needs_review = True
                    logger.info("question_marked_needs_review", position=pos, text=q.text[:40])
            except Exception as e:
                logger.warning("verification_failed_skipping_check", error=str(e))

        explanation_text = q.explanation or ""
        if needs_review:
            explanation_text = f"[⚠️ Требует проверки преподавателем] {explanation_text}".strip()

        questions_to_create.append({
            "position": pos,
            "type": q.type,
            "text": q.text,
            "options": q.options,
            "correct": q.correct,
            "rubric": q.rubric,
            "explanation": explanation_text,
            "difficulty": q.difficulty,
            "topic": q.topic or target_block.title,
            "block_id": target_block.id,
            "points": q.points,
        })

    # 4. Save Quiz and Questions to DB
    quiz_id = uuid.uuid4()
    quiz = Quiz(
        id=quiz_id,
        lesson_id=lesson_uid,
        version=1,
        status="draft",
    )
    db.add(quiz)
    await db.flush()

    for item in questions_to_create:
        qq = QuizQuestion(
            id=uuid.uuid4(),
            quiz_id=quiz_id,
            position=item["position"],
            type=item["type"],
            text=item["text"],
            options=item["options"],
            correct=item["correct"],
            rubric=item["rubric"],
            explanation=item["explanation"],
            difficulty=item["difficulty"],
            topic=item["topic"],
            block_id=item["block_id"],
            points=item["points"],
        )
        db.add(qq)

    # 5. Emit persistent event quiz.ready (teacher only)
    await emit_persistent_event(
        session=db,
        lesson_id=lesson_uid,
        event_type="quiz.ready",
        data={"quiz_id": str(quiz_id), "status": "draft"},
        publish_to_redis_now=True,
    )

    await db.commit()
    await db.refresh(quiz)
    logger.info("quiz_draft_generated", quiz_id=str(quiz_id), count=len(questions_to_create))
    return quiz
