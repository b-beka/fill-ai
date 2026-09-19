import json
import re
import statistics
from typing import Any
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.pipeline import load_prompt_template
from app.ai.providers.base import PromptBundle
from app.ai.providers.gemini import GeminiProvider
from app.ai.schemas import ReportNarrative
from app.core.config import get_settings
from app.core.events import emit_persistent_event
from app.core.logging import get_logger
from app.models.lesson import Lesson
from app.models.quiz import Answer, Attempt, Quiz, QuizQuestion
from app.models.report import Report

logger = get_logger("quiz.report")
settings = get_settings()


def _extract_all_numbers_from_dict(obj: Any) -> set[str]:
    """Extracts all stringified numeric values from a nested dictionary/list for validation."""
    numbers = set()
    if isinstance(obj, (int, float)):
        numbers.add(str(obj))
        numbers.add(str(round(float(obj), 1)))
        numbers.add(str(int(obj)))
    elif isinstance(obj, dict):
        for v in obj.values():
            numbers.update(_extract_all_numbers_from_dict(v))
    elif isinstance(obj, list):
        for item in obj:
            numbers.update(_extract_all_numbers_from_dict(item))
    return numbers


async def generate_lesson_report(
    lesson_id: uuid.UUID | str,
    quiz_id: uuid.UUID | str,
    db: AsyncSession,
    llm_provider: GeminiProvider | None = None,
) -> Report:
    """
    Computes exact SQL/Python analytics and generates an LLM narrative
    with strict regex verification of numbers (Section 13.3 of TZ).
    """
    lesson_uid = uuid.UUID(str(lesson_id))
    quiz_uid = uuid.UUID(str(quiz_id))
    provider = llm_provider or GeminiProvider()

    lesson = await db.get(Lesson, lesson_uid)
    quiz = await db.get(Quiz, quiz_uid)
    if not lesson or not quiz:
        raise ValueError("Lesson or Quiz not found")

    # 1. Fetch completed attempts
    att_stmt = (
        select(Attempt)
        .where(Attempt.quiz_id == quiz_uid, Attempt.status == "completed")
    )
    att_res = await db.execute(att_stmt)
    attempts = att_res.scalars().all()

    # Fetch questions
    q_stmt = (
        select(QuizQuestion)
        .where(QuizQuestion.quiz_id == quiz_uid)
        .order_by(QuizQuestion.position.asc())
    )
    q_res = await db.execute(q_stmt)
    questions = q_res.scalars().all()

    # 2. Deterministic calculation of stats
    total_students = len(attempts)
    scores = [
        (a.score / a.max_score * 100.0)
        for a in attempts
        if a.score is not None and a.max_score and a.max_score > 0
    ]

    avg_score = round(statistics.mean(scores), 1) if scores else 0.0
    median_score = round(statistics.median(scores), 1) if scores else 0.0

    quartiles = {"q1": 0.0, "q2": 0.0, "q3": 0.0, "q4": 0.0}
    if len(scores) >= 4:
        sorted_scores = sorted(scores)
        n = len(sorted_scores)
        quartiles["q1"] = round(sorted_scores[n // 4], 1)
        quartiles["q2"] = round(sorted_scores[n // 2], 1)
        quartiles["q3"] = round(sorted_scores[(3 * n) // 4], 1)
        quartiles["q4"] = round(sorted_scores[-1], 1)
    elif scores:
        quartiles["q2"] = median_score
        quartiles["q4"] = round(max(scores), 1)

    # Question and topic stats
    question_stats = []
    topic_scores: dict[str, list[float]] = {}

    for q in questions:
        ans_stmt = select(Answer).where(Answer.question_id == q.id)
        ans_res = await db.execute(ans_stmt)
        answers = ans_res.scalars().all()

        total_ans = len(answers)
        correct_ans = sum(1 for a in answers if a.is_correct)
        correct_pct = round((correct_ans / total_ans * 100.0), 1) if total_ans > 0 else 0.0

        topic = q.topic or "Общие знания"
        topic_scores.setdefault(topic, []).append(correct_pct)

        question_stats.append({
            "position": q.position,
            "text": q.text,
            "type": q.type,
            "topic": topic,
            "correct_percentage": correct_pct,
            "total_answers": total_ans,
        })

    topic_stats = {
        top: round(statistics.mean(sc), 1) for top, sc in topic_scores.items()
    }

    # At-risk students (score < AT_RISK_THRESHOLD)
    at_risk_threshold_pct = settings.AT_RISK_THRESHOLD * 100.0
    at_risk_students = [
        {
            "student_id": str(a.student_id),
            "score": a.score,
            "max_score": a.max_score,
            "percentage": round((a.score / a.max_score * 100.0), 1) if a.max_score else 0.0,
        }
        for a in attempts
        if a.max_score and ((a.score or 0.0) / a.max_score * 100.0) < at_risk_threshold_pct
    ]

    stats = {
        "total_students": total_students,
        "completed_count": len(attempts),
        "avg_score": avg_score,
        "median_score": median_score,
        "quartiles": quartiles,
        "questions": question_stats,
        "topics": topic_stats,
        "at_risk_students": at_risk_students,
    }

    # 3. LLM Narrative Generation
    narrative_dict: dict[str, Any] | None = None
    if attempts:
        system_prompt = load_prompt_template("report")
        user_prompt = (
            f"Тема урока: {lesson.title}\n"
            f"Рассчитанная статистика успеваемости:\n{json.dumps(stats, ensure_ascii=False, indent=2)}\n\n"
            f"Составь аналитическое резюме. Напоминание: любые числа в тексте должны строго соответствовать приведенной статистике!"
        )

        bundle = PromptBundle(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            lesson_id=lesson_uid,
            prompt_version="1.0.0",
            thinking_level="medium",
        )

        try:
            narrative_output: ReportNarrative = await provider.generate(
                task="report_narrative",
                prompt=bundle,
                schema=ReportNarrative,
            )
            narrative_dict = narrative_output.model_dump()

            # 4. Strict Regex Validation: Numbers in narrative must exist in stats
            known_numbers = _extract_all_numbers_from_dict(stats)
            narrative_text = json.dumps(narrative_dict, ensure_ascii=False)
            extracted_numbers = re.findall(r"\b\d+(?:\.\d+)?\b", narrative_text)

            unverified_numbers = [num for num in extracted_numbers if num not in known_numbers and int(float(num)) > 5]
            if unverified_numbers:
                logger.warning(
                    "narrative_contains_unverified_numbers",
                    unverified=unverified_numbers[:5],
                )
        except Exception as e:
            logger.error("narrative_generation_failed", error=str(e))
            narrative_dict = {
                "overview": "Автоматическое текстовое резюме временно недоступно.",
                "weak_topics": [],
                "strong_topics": [],
                "common_misconceptions": [],
                "recommendations": ["Ознакомьтесь с числовой статистикой успеваемости выше."],
            }

    # 5. Persist Report in DB
    r_stmt = select(Report).where(Report.lesson_id == lesson_uid, Report.quiz_id == quiz_uid)
    r_res = await db.execute(r_stmt)
    report = r_res.scalar_one_or_none()

    if not report:
        report_id = uuid.uuid4()
        report = Report(
            id=report_id,
            lesson_id=lesson_uid,
            quiz_id=quiz_uid,
            stats=stats,
            narrative=narrative_dict,
        )
        db.add(report)
    else:
        report.stats = stats
        report.narrative = narrative_dict

    # Emit persistent event report.ready (seq allocated, teacher/admin only)
    await emit_persistent_event(
        session=db,
        lesson_id=lesson_uid,
        event_type="report.ready",
        data={"report_id": str(report.id), "quiz_id": str(quiz_uid)},
        publish_to_redis_now=True,
    )

    await db.commit()
    await db.refresh(report)
    logger.info("report_generated", report_id=str(report.id))
    return report
