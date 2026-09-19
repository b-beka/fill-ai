from datetime import datetime, timezone
from typing import Any
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.pipeline import load_prompt_template
from app.ai.providers.base import PromptBundle
from app.ai.providers.gemini import GeminiProvider
from app.ai.schemas import OpenQuestionGrading
from app.core.logging import get_logger
from app.models.quiz import Answer, Attempt, Quiz, QuizQuestion

logger = get_logger("quiz.grading")


async def grade_attempt(
    attempt_id: uuid.UUID | str,
    db: AsyncSession,
    llm_provider: GeminiProvider | None = None,
) -> Attempt:
    """
    Grades all answers for an attempt (Section 13.2 of TZ):
    - single & multiple: evaluated deterministically by code
    - open: graded by LLM (Flash-Lite) with prompt-injection defense
    - updates attempt score, max_score, and sets status='completed'
    """
    attempt_uid = uuid.UUID(str(attempt_id))
    provider = llm_provider or GeminiProvider()

    attempt = await db.get(Attempt, attempt_uid)
    if not attempt:
        raise ValueError(f"Attempt not found: {attempt_id}")

    # Fetch quiz questions
    q_stmt = (
        select(QuizQuestion)
        .where(QuizQuestion.quiz_id == attempt.quiz_id)
        .order_by(QuizQuestion.position.asc())
    )
    q_res = await db.execute(q_stmt)
    questions = q_res.scalars().all()
    question_map: dict[uuid.UUID, QuizQuestion] = {q.id: q for q in questions}

    # Fetch submitted answers
    a_stmt = select(Answer).where(Answer.attempt_id == attempt_uid)
    a_res = await db.execute(a_stmt)
    answers = a_res.scalars().all()
    answer_map: dict[uuid.UUID, Answer] = {a.question_id: a for a in answers}

    total_score = 0.0
    max_score = sum(q.points for q in questions)

    grading_system_prompt = load_prompt_template("grading")

    for q in questions:
        ans = answer_map.get(q.id)
        if not ans:
            # Question was unanswered by student
            ans = Answer(
                attempt_id=attempt_uid,
                question_id=q.id,
                value=None,
                is_correct=False,
                points=0.0,
                feedback="Вопрос оставлен без ответа",
                graded_by="auto",
            )
            db.add(ans)
            continue

        # Skip if already graded manually by teacher
        if ans.graded_by == "teacher":
            total_score += (ans.points or 0.0)
            continue

        val = ans.value

        if q.type == "single":
            correct_idx = q.correct[0] if (q.correct and len(q.correct) > 0) else None
            student_idx = None
            if isinstance(val, int):
                student_idx = val
            elif isinstance(val, list) and len(val) > 0 and isinstance(val[0], int):
                student_idx = val[0]

            is_correct = (student_idx is not None and student_idx == correct_idx)
            points = q.points if is_correct else 0.0
            feedback = "Верно" if is_correct else f"Неверно. {q.explanation or ''}".strip()

            ans.is_correct = is_correct
            ans.points = points
            ans.feedback = feedback
            ans.graded_by = "auto"
            total_score += points

        elif q.type == "multiple":
            correct_set = set(q.correct or [])
            student_set = set(val if isinstance(val, list) else [])
            if not correct_set:
                is_correct = False
                points = 0.0
            elif student_set == correct_set:
                is_correct = True
                points = q.points
            elif student_set.issubset(correct_set) and len(student_set) > 0:
                # Partial credit proportional to correct selections without penalty
                points = round((len(student_set) / len(correct_set)) * q.points, 2)
                is_correct = False
            else:
                is_correct = False
                points = 0.0

            feedback = "Верно" if is_correct else f"Частично верно или неверно. {q.explanation or ''}".strip()
            ans.is_correct = is_correct
            ans.points = points
            ans.feedback = feedback
            ans.graded_by = "auto"
            total_score += points

        elif q.type == "open":
            student_text = str(val or "")[:2000]  # Max 2000 characters limit
            if not student_text.strip():
                ans.is_correct = False
                ans.points = 0.0
                ans.feedback = "Ответ пуст"
                ans.graded_by = "auto"
                continue

            # Build prompt injection resistant prompt
            user_prompt = (
                f"Вопрос: {q.text}\n"
                f"Максимальный балл: {q.points}\n"
                f"Критерии оценивания (рубрика):\n{q.rubric or 'Критерии не указаны'}\n\n"
                f"Текст ответа ученика:\n"
                f"<student_answer>\n{student_text}\n</student_answer>\n\n"
                f"Оцени ответ ученика и выведи оценку строго по схеме."
            )

            bundle = PromptBundle(
                system_prompt=grading_system_prompt,
                user_prompt=user_prompt,
                lesson_id=uuid.uuid4(),
                prompt_version="1.0.0",
                thinking_level="minimal",
                model="gemini-3.5-flash-lite",
            )

            try:
                grading_out: OpenQuestionGrading = await provider.generate(
                    task="open_question_grading",
                    prompt=bundle,
                    schema=OpenQuestionGrading,
                )
                assigned_points = min(q.points, max(0.0, float(grading_out.points)))
                ans.points = assigned_points
                ans.is_correct = bool(assigned_points >= (q.points * 0.5))
                ans.feedback = grading_out.feedback
                ans.graded_by = "llm"
                total_score += assigned_points
            except Exception as e:
                logger.error("llm_grading_failed", error=str(e), question_id=str(q.id))
                ans.points = 0.0
                ans.is_correct = False
                ans.feedback = "Ошибка автоматической проверки, требуется проверка преподавателем."
                ans.graded_by = "llm"

    attempt.score = round(total_score, 2)
    attempt.max_score = round(max_score, 2)
    attempt.status = "completed"
    attempt.submitted_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(attempt)
    logger.info(
        "attempt_graded",
        attempt_id=str(attempt_uid),
        score=attempt.score,
        max_score=attempt.max_score,
    )
    return attempt
