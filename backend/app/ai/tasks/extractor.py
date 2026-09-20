import uuid
from typing import Literal
from pydantic import BaseModel, Field
from app.ai.pipeline import load_prompt_template
from app.ai.providers.base import PromptBundle, TextLLM
from app.core.logging import get_logger

logger = get_logger("ai.tasks.extractor")


class LiveTaskOptionOutput(BaseModel):
    id: str = Field(..., description="Option identifier e.g. A, B, C, D")
    text: str = Field(..., description="Option text or formula")
    is_correct: bool = Field(False, description="True if this is the correct answer")
    explanation: str = Field(..., description="Immediate feedback explaining why this option is right or wrong")


class LiveTaskExtractionOutput(BaseModel):
    is_task: bool = Field(..., description="True if teacher actively asked students to solve a task/question right now")
    confidence: float = Field(0.0, ge=0.0, le=1.0, description="Confidence score from 0.0 to 1.0")
    question: str = Field("", description="Clear, student-friendly task description with LaTeX formulas")
    kind: Literal["single_choice", "number", "poll"] = Field("single_choice", description="Type of interactive task")
    options: list[LiveTaskOptionOutput] = Field(default_factory=list, description="List of options with distractors")
    correct_option_id: str | None = Field(None, description="Identifier of the correct option")
    target_number: float | None = Field(None, description="Target numerical value if kind is number")
    time_limit_seconds: int = Field(30, ge=10, le=180, description="Time limit in seconds for students")
    teacher_intent_snippet: str = Field("", description="Raw snippet from teacher speech that prompted this task")


class DiagnosticOutput(BaseModel):
    summary: str = Field(..., description="1-2 sentences of actionable pedagogical insight for the teacher")


async def extract_live_task_from_speech(
    transcript_window: str,
    slide_text: str | None,
    provider: TextLLM,
    lesson_id: uuid.UUID | None = None,
) -> LiveTaskExtractionOutput | None:
    """
    Extracts an interactive live task from recent teacher speech and current slide.
    Conforms to Hands-Free Teaching Assistant architecture.
    """
    system_prompt = load_prompt_template("live_task_extractor")
    user_prompt = (
        f"--- СТЕНОГРАММА РЕЧИ ПРЕПОДАВАТЕЛЯ (ПОСЛЕДНИЕ СЕКУНДЫ) ---\n"
        f"{transcript_window}\n\n"
        f"--- ТЕКСТ ТЕКУЩЕГО СЛАЙДА / ДОСКИ ---\n"
        f"{slide_text or 'Слайд отсутствует'}\n\n"
        f"Определи, дал ли преподаватель задание или вопрос классу для решения прямо сейчас. "
        f"Верни результат строго по схеме LiveTaskExtractionOutput."
    )

    bundle = PromptBundle(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        lesson_id=lesson_id,
        prompt_version="1.0.0",
        thinking_level="minimal",  # Fast evaluation via Flash-Lite
    )

    try:
        output: LiveTaskExtractionOutput = await provider.generate(
            task="live_task_extraction",
            prompt=bundle,
            schema=LiveTaskExtractionOutput,
        )

        if not output.is_task or output.confidence < 0.80 or not output.question.strip():
            logger.info(
                "live_task_skipped",
                is_task=output.is_task,
                confidence=output.confidence,
            )
            return None

        # Sanity check: Ensure at least 2 options and 1 correct answer for single_choice
        if output.kind == "single_choice":
            if len(output.options) < 2:
                return None
            correct_opts = [o for o in output.options if o.is_correct]
            if not correct_opts:
                # If model forgot to mark is_correct, mark the one matching correct_option_id
                if output.correct_option_id:
                    for o in output.options:
                        if o.id == output.correct_option_id:
                            o.is_correct = True
                            break
                else:
                    output.options[0].is_correct = True
                    output.correct_option_id = output.options[0].id
            else:
                output.correct_option_id = correct_opts[0].id

        return output

    except Exception as e:
        logger.warning("live_task_extraction_failed", error=str(e))
        return None


async def generate_teacher_diagnostic(
    question: str,
    stats: dict,
    options: list[dict],
    provider: TextLLM,
    lesson_id: uuid.UUID | None = None,
) -> str:
    """
    Synthesizes a 1-sentence diagnostic insight for the teacher when a task closes.
    """
    total = stats.get("total", 0)
    accuracy = stats.get("accuracy", 0.0)
    counts = stats.get("counts", {})

    options_summary = ", ".join([f"{o.get('id')}: {o.get('text')} ({'Верно' if o.get('is_correct') else 'Неверно'})" for o in options])

    user_prompt = (
        f"Задача: {question}\n"
        f"Варианты: {options_summary}\n"
        f"Статистика ответов: Всего ответило {total} учеников, Точность: {round(accuracy * 100)}%.\n"
        f"Распределение по вариантам: {counts}\n\n"
        f"Напиши ровно 1-2 кратких предложения для преподавателя: как справился класс, какую ошибку допустило большинство и стоит ли кратко разобрать вопрос."
    )

    bundle = PromptBundle(
        system_prompt="Ты — лаконичный методический консультант преподавателя. Твой ответ должен быть не более 2 предложений.",
        user_prompt=user_prompt,
        lesson_id=lesson_id,
        prompt_version="1.0.0",
        thinking_level="minimal",
    )

    try:
        res = await provider.generate(
            task="task_diagnostic",
            prompt=bundle,
            schema=DiagnosticOutput,
        )
        return res.summary
    except Exception as e:
        logger.warning("generate_teacher_diagnostic_failed", error=str(e))
        if total > 0:
            return f"Ответило {total} учеников, доля верных ответов: {round(accuracy * 100)}%."
        return "Сбор ответов завершен."
