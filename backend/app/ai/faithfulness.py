import uuid
from pydantic import BaseModel, Field
from app.ai.providers.base import PromptBundle, TextLLM
from app.ai.schemas import CalloutItem, NoteBlockOutput
from app.core.logging import get_logger

logger = get_logger("ai.faithfulness")


class FaithfulnessOutput(BaseModel):
    is_faithful: bool = Field(..., description="True if all statements are grounded in source transcript or slide")
    unfaithful_claims: list[str] = Field(default_factory=list, description="List of ungrounded or hallucinated claims")
    corrected_body_md: str | None = Field(None, description="Cleaned body_md without hallucinations")
    factuality_score: float = Field(default=1.0, ge=0.0, le=1.0, description="Fraction of grounded claims from 0.0 to 1.0")


async def verify_block_faithfulness(
    output: NoteBlockOutput,
    transcript_text: str,
    slide_text: str | None,
    provider: TextLLM,
    lesson_id: uuid.UUID | None = None,
) -> NoteBlockOutput:
    """
    Second-pass factuality verification using gemini-3.5-flash-lite.
    Checks draft block body against raw transcript and slide text.
    Corrects hallucinations or flags uncertain statements.
    """
    from app.ai.pipeline import load_prompt_template

    system_prompt = load_prompt_template("faithfulness")
    user_prompt = (
        f"--- ПЕРВОИСТОЧНИК (СТЕНОГРАММА) ---\n"
        f"{transcript_text}\n\n"
        f"--- ТЕКСТ СЛАЙДА ---\n"
        f"{slide_text or 'Слайд отсутствует'}\n\n"
        f"--- ЧЕРНОВИК КОНСПЕКТА ---\n"
        f"Заголовок: {output.title}\n"
        f"Тело блока:\n{output.body_md}\n\n"
        f"Проверь обоснованность фактов и верни вердикт в JSON."
    )

    bundle = PromptBundle(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        lesson_id=lesson_id,
        prompt_version="1.0.0",
        thinking_level="minimal",  # Flash-Lite fast check
    )

    try:
        verdict: FaithfulnessOutput = await provider.generate(
            task="faithfulness",
            prompt=bundle,
            schema=FaithfulnessOutput,
        )

        if not verdict.is_faithful:
            logger.warning(
                "block_faithfulness_flagged",
                unfaithful_claims=verdict.unfaithful_claims,
                factuality_score=verdict.factuality_score,
            )

            # If cleaned markdown is returned, use it
            if verdict.corrected_body_md and len(verdict.corrected_body_md.strip()) > 20:
                output.body_md = verdict.corrected_body_md.strip()

            # Append warning callout
            output.callouts.append(
                CalloutItem(
                    kind="warning",
                    text="Тезисы проверены на фактическую точность: спорные утверждения скорректированы по стенограмме.",
                )
            )

            # Add claims to uncertain list
            output.uncertain.extend(verdict.unfaithful_claims)

    except Exception as e:
        logger.warning("faithfulness_check_skipped_on_error", error=str(e))

    return output
