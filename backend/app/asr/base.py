from collections.abc import AsyncIterator
from typing import Literal, Protocol
from pydantic import BaseModel, Field


class AsrSegment(BaseModel):
    start_ms: int
    end_ms: int
    text: str
    speaker: str | None = None
    confidence: float | None = None
    lang: str | None = None


class AsrEvent(BaseModel):
    type: Literal["partial", "final"]
    segment: AsrSegment
    is_endpoint: bool = False


class AsrStream(Protocol):
    async def send_audio(self, pcm16: bytes) -> None:
        """Sends raw PCM16 (16kHz, mono) audio bytes into the ASR stream."""
        ...

    def events(self) -> AsyncIterator[AsrEvent]:
        """Yields partial and final speech recognition events."""
        ...

    async def close(self) -> None:
        """Closes the connection and releases resources."""
        ...
