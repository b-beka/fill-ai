import asyncio
import json
import time
from typing import Any, TypeVar
import uuid
import httpx
from pydantic import BaseModel
from app.ai.providers.base import FrameRequest, PromptBundle, TextLLM, VisionLLM
from app.ai.providers.circuit_breaker import CircuitBreaker
from app.ai.schemas import FrameAnalysisOutput
from app.core.config import get_settings
from app.core.db import AsyncSessionLocal
from app.core.logging import get_logger
from app.models.ai import AiCall

logger = get_logger("ai.gemini")
settings = get_settings()

T = TypeVar("T", bound=BaseModel)

# Default pricing per 1M tokens (Section 4.1 of TZ)
MODEL_PRICING = {
    "gemini-3.6-flash": {"input": 0.75, "output": 3.75},
    "gemini-3.5-flash-lite": {"input": 0.30, "output": 2.50},
    "gemini-3.1-flash-lite": {"input": 0.25, "output": 1.50},
}


def calculate_call_cost(model: str, tokens_in: int, tokens_out: int) -> float:
    pricing = MODEL_PRICING.get(model, {"input": 0.30, "output": 2.50})
    cost_in = (tokens_in / 1_000_000.0) * pricing["input"]
    cost_out = (tokens_out / 1_000_000.0) * pricing["output"]
    return round(cost_in + cost_out, 6)


async def record_ai_call_metrics(
    task: str,
    model: str,
    prompt_version: str,
    tokens_in: int,
    tokens_out: int,
    latency_ms: int,
    status_str: str,
    lesson_id: uuid.UUID | str | None = None,
    error: str | None = None,
) -> None:
    """Logs metrics and saves an audit record to the ai_calls table."""
    cost = calculate_call_cost(model, tokens_in, tokens_out)
    try:
        async with AsyncSessionLocal() as db:
            call_record = AiCall(
                lesson_id=uuid.UUID(str(lesson_id)) if lesson_id else None,
                task=task,
                provider="gemini",
                model=model,
                prompt_version=prompt_version,
                tokens_in=tokens_in,
                tokens_out=tokens_out,
                latency_ms=latency_ms,
                cost_usd=cost,
                status=status_str,
                error=error,
            )
            db.add(call_record)
            await db.commit()
    except Exception as e:
        logger.warning("record_ai_call_failed", error=str(e))


class GeminiProvider(VisionLLM, TextLLM):
    """
    Adapter for Google Gemini 3.x API implementing Section 4.2 of TZ.
    - Uses thinking_level instead of thinking_budget.
    - Omits deprecated temperature, top_p, top_k parameters.
    - Enforces JSON Schema structured output with local Pydantic validation.
    - Employs circuit breaker and fallback chain.
    """

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.circuit_breaker = CircuitBreaker("gemini", max_failures=5, reset_timeout_seconds=30.0)
        self.http_client = httpx.AsyncClient(timeout=45.0)

    async def analyze_frame(self, req: FrameRequest) -> FrameAnalysisOutput:
        """
        Analyzes keyframe with Gemini 3.5 Flash-Lite (fallback to Gemini 3.6 Flash).
        Section 8.1 of TZ.
        """
        if not self.circuit_breaker.is_available():
            logger.warning("gemini_circuit_breaker_open_attempting_fallback")
            # In production, fallback to VLM_FALLBACK_MODEL
            raise RuntimeError("Gemini Circuit Breaker is OPEN")

        models_to_try = [settings.VLM_MODEL, settings.VLM_ESCALATION_MODEL]
        last_error = None

        import base64
        image_b64 = base64.b64encode(req.image_bytes).decode("utf-8")

        prompt_text = (
            f"Тема урока: {req.topic}\n"
            f"Язык урока: {req.language}\n"
            f"Ключевые термины: {', '.join(req.expected_terms)}\n"
            f"Контекст транскрипта речи вокруг кадра:\n{req.transcript_context}\n\n"
            f"Проанализируй кадр, извлеки текст, оцени полезность и разметь ключевые аннотации."
        )

        for model in models_to_try:
            start_time = time.perf_counter()
            try:
                result = await self._call_gemini_api(
                    model=model,
                    task="frame_analysis",
                    system_instruction="Ты — ассистент анализа учебных слайдов и доски. Строго следуй JSON-схеме.",
                    contents=[
                        {"text": prompt_text},
                        {
                            "inline_data": {
                                "mime_type": "image/webp",
                                "data": image_b64,
                            }
                        },
                    ],
                    response_schema=FrameAnalysisOutput.model_json_schema(),
                    thinking_level="minimal",  # Minimal for frames per Section 4.2
                    lesson_id=req.lesson_id,
                )
                self.circuit_breaker.record_success()
                return FrameAnalysisOutput.model_validate(result)
            except Exception as e:
                self.circuit_breaker.record_failure()
                last_error = e
                logger.warning("gemini_vlm_attempt_failed", model=model, error=str(e))

        raise RuntimeError(f"VLM frame analysis failed for all candidates: {last_error}")

    async def generate(
        self,
        task: str,
        prompt: PromptBundle,
        schema: type[T],
    ) -> T:
        """
        Generates structured text output with Gemini 3.6 Flash (fallback to Flash-Lite).
        """
        if not self.circuit_breaker.is_available():
            raise RuntimeError("Gemini Circuit Breaker is OPEN")

        models_to_try = [settings.LLM_MODEL, settings.LLM_LIGHT_MODEL]
        last_error = None

        for model in models_to_try:
            try:
                result = await self._call_gemini_api(
                    model=model,
                    task=task,
                    system_instruction=prompt.system_prompt,
                    contents=[{"text": prompt.user_prompt}],
                    response_schema=schema.model_json_schema(),
                    thinking_level=prompt.thinking_level,
                    lesson_id=prompt.lesson_id,
                    prompt_version=prompt.prompt_version,
                )
                self.circuit_breaker.record_success()
                return schema.model_validate(result)
            except Exception as e:
                self.circuit_breaker.record_failure()
                last_error = e
                logger.warning("gemini_generate_attempt_failed", model=model, error=str(e))

        raise RuntimeError(f"LLM generate failed: {last_error}")

    async def _call_gemini_api(
        self,
        model: str,
        task: str,
        system_instruction: str,
        contents: list[dict[str, Any]],
        response_schema: dict[str, Any],
        thinking_level: str = "minimal",
        lesson_id: uuid.UUID | str | None = None,
        prompt_version: str = "1.0.0",
    ) -> dict[str, Any]:
        """
        Calls the Gemini REST API v1beta conforming to Gemini 3.x specifications:
        - No temperature/top_p/top_k.
        - thinking_config = {"thinking_level": thinking_level}.
        - response_mime_type = "application/json" with response_schema.
        """
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"

        payload: dict[str, Any] = {
            "system_instruction": {"parts": [{"text": system_instruction}]},
            "contents": [{"parts": contents}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "response_schema": response_schema,
                "thinking_config": {
                    "thinking_level": thinking_level,
                },
            },
        }

        start_time = time.perf_counter()
        resp = await self.http_client.post(url, json=payload)
        latency_ms = int((time.perf_counter() - start_time) * 1000)

        if resp.status_code != 200:
            error_text = resp.text[:300]
            await record_ai_call_metrics(
                task=task,
                model=model,
                prompt_version=prompt_version,
                tokens_in=0,
                tokens_out=0,
                latency_ms=latency_ms,
                status_str="error",
                lesson_id=lesson_id,
                error=error_text,
            )
            raise RuntimeError(f"Gemini API returned {resp.status_code}: {error_text}")

        resp_data = resp.json()

        # Usage metadata
        usage = resp_data.get("usageMetadata", {})
        tokens_in = usage.get("promptTokenCount", 0)
        tokens_out = usage.get("candidatesTokenCount", 0)

        # Extract text candidate
        candidates = resp_data.get("candidates", [])
        if not candidates:
            raise RuntimeError("No candidates returned from Gemini")

        text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
        parsed_json = json.loads(text_content)

        await record_ai_call_metrics(
            task=task,
            model=model,
            prompt_version=prompt_version,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            latency_ms=latency_ms,
            status_str="success",
            lesson_id=lesson_id,
        )
        return parsed_json
