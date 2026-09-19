import os
import uuid
from typing import Any
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.asr.base import AsrEvent, AsrSegment
from app.asr.groq_whisper import GroqWhisperClient
from app.asr.normalize import TranscriptNormalizer
from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.transcript import TranscriptSegment

settings = get_settings()
logger = get_logger("asr.soniox_async")


class SonioxAsyncClient:
    """
    Client for batch / offline audio file transcription using Soniox API
    with automatic fallback to Groq Whisper when Soniox is unavailable.
    """

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.SONIOX_API_KEY
        self.groq_client = GroqWhisperClient()

    async def transcribe_audio_file(
        self,
        audio_file_path: str,
        language: str = "ru",
        expected_terms: list[str] | None = None,
    ) -> list[AsrEvent]:
        """
        Transcribes an audio file and returns a list of AsrEvent tokens.
        """
        if not os.path.exists(audio_file_path):
            logger.error("audio_file_not_found", path=audio_file_path)
            return []

        # 1. Attempt Soniox batch transcription if API key is configured
        if self.api_key and not self.api_key.startswith("dummy"):
            try:
                events = await self._transcribe_soniox(
                    audio_file_path=audio_file_path,
                    language=language,
                    expected_terms=expected_terms,
                )
                if events:
                    return events
            except Exception as e:
                logger.warning(
                    "soniox_async_failed_falling_back_to_groq",
                    error=str(e),
                )

        # 2. Fallback to Groq Whisper if available
        if settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("dummy"):
            try:
                return await self._transcribe_groq(
                    audio_file_path=audio_file_path,
                    language=language,
                )
            except Exception as e:
                logger.error("groq_whisper_fallback_failed", error=str(e))

        logger.info(
            "no_asr_provider_available_or_mock_mode",
            path=audio_file_path,
        )
        return []

    async def _transcribe_soniox(
        self,
        audio_file_path: str,
        language: str,
        expected_terms: list[str] | None = None,
    ) -> list[AsrEvent]:
        url = "https://api.soniox.com/v1/transcribe"
        headers = {"Authorization": f"Bearer {self.api_key}"}

        lang_hints = [language]
        if language == "kk":
            lang_hints = ["kk", "ru"]

        data: dict[str, Any] = {
            "model": "standard",
            "language_hints": lang_hints,
            "enable_diarization": "true",
            "enable_endpoint_detection": "true",
        }
        if expected_terms:
            data["expected_terms"] = expected_terms

        async with httpx.AsyncClient(timeout=300.0) as client:
            with open(audio_file_path, "rb") as f:
                files = {"file": (os.path.basename(audio_file_path), f, "audio/wav")}
                response = await client.post(url, headers=headers, data=data, files=files)
                response.raise_for_status()
                res_data = response.json()

        events: list[AsrEvent] = []
        words = res_data.get("words", [])
        for w in words:
            events.append(
                AsrEvent(
                    type="final",
                    segment=AsrSegment(
                        start_ms=int(w.get("start_ms", 0)),
                        end_ms=int(w.get("end_ms", 0)),
                        text=w.get("text", ""),
                        speaker=w.get("speaker"),
                        confidence=float(w.get("confidence", 0.9)),
                        lang=language,
                    ),
                    is_endpoint=bool(w.get("is_endpoint", False)),
                )
            )
        return events

    async def _transcribe_groq(
        self,
        audio_file_path: str,
        language: str,
    ) -> list[AsrEvent]:
        """Reads audio file in PCM16 chunks and transcribes via Groq Whisper client."""
        with open(audio_file_path, "rb") as f:
            raw_audio = f.read()

        # Skip WAV header if present (44 bytes)
        if raw_audio.startswith(b"RIFF") and len(raw_audio) > 44:
            pcm_bytes = raw_audio[44:]
        else:
            pcm_bytes = raw_audio

        seg = await self.groq_client.transcribe_chunk(
            pcm16_bytes=pcm_bytes,
            start_ms=0,
            language=language,
        )
        if seg:
            return [
                AsrEvent(
                    type="final",
                    segment=seg,
                    is_endpoint=True,
                )
            ]
        return []

    async def transcribe_and_persist(
        self,
        lesson_id: uuid.UUID | str,
        audio_file_path: str,
        language: str,
        db: AsyncSession,
        expected_terms: list[str] | None = None,
    ) -> list[TranscriptSegment]:
        """
        Runs transcription and persists normalized segments into database with seq events.
        """
        lesson_uid = uuid.UUID(str(lesson_id))
        events = await self.transcribe_audio_file(
            audio_file_path=audio_file_path,
            language=language,
            expected_terms=expected_terms,
        )

        normalizer = TranscriptNormalizer(lesson_id=lesson_uid)
        for event in events:
            await normalizer.process_event(event, db)

        await normalizer.flush(db)
        await db.commit()

        # Return persisted segments
        stmt = (
            select(TranscriptSegment)
            .where(TranscriptSegment.lesson_id == lesson_uid)
            .order_by(TranscriptSegment.start_ms.asc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())
