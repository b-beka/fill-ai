from dataclasses import dataclass
from typing import Any, Protocol, TypeVar
import uuid
from pydantic import BaseModel
from app.ai.schemas import FrameAnalysisOutput

T = TypeVar("T", bound=BaseModel)


@dataclass
class FrameRequest:
    lesson_id: uuid.UUID | str
    image_bytes: bytes  # JPEG or WebP bytes
    transcript_context: str  # Last 60s transcript
    topic: str
    expected_terms: list[str]
    recent_summary: str | None = None
    language: str = "ru"


@dataclass
class PromptBundle:
    system_prompt: str
    user_prompt: str
    lesson_id: uuid.UUID | str | None = None
    prompt_version: str = "1.0.0"
    thinking_level: str = "low"  # minimal | low | medium | high


class VisionLLM(Protocol):
    async def analyze_frame(self, req: FrameRequest) -> FrameAnalysisOutput:
        """Analyzes a keyframe image and extracts title, OCR, description, and visual annotations."""
        ...


class TextLLM(Protocol):
    async def generate(
        self,
        task: str,
        prompt: PromptBundle,
        schema: type[T],
    ) -> T:
        """Generates structured output according to the provided Pydantic schema."""
        ...
