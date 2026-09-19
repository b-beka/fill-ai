import asyncio
from collections.abc import AsyncIterator
import io
import wave
import httpx
from app.asr.base import AsrEvent, AsrSegment, AsrStream
from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("asr.groq")
settings = get_settings()

SAMPLE_RATE = 16000
BYTES_PER_SECOND = SAMPLE_RATE * 2
MIN_CHUNK_SECONDS = 15
MAX_CHUNK_SECONDS = 30


def pcm16_to_wav(pcm_bytes: bytes, sample_rate: int = SAMPLE_RATE) -> bytes:
    """Encodes raw PCM16 bytes into a WAV container."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm_bytes)
    return buf.getvalue()


class GroqWhisperClient(AsrStream):
    """
    Fallback ASR client using Groq's Whisper Large v3 Turbo.
    Processes audio in 15-30 second chunks and emits final transcript segments.
    """

    def __init__(
        self,
        language: str = "ru",
        api_key: str | None = None,
        concurrency_limit: int = 3,
    ):
        self.language = language
        self.api_key = api_key or settings.GROQ_API_KEY
        self._semaphore = asyncio.Semaphore(concurrency_limit)
        self._audio_buffer = bytearray()
        self._current_offset_ms = 0
        self._event_queue: asyncio.Queue[AsrEvent] = asyncio.Queue()
        self._running = True
        self._http_client = httpx.AsyncClient(timeout=30.0)

    async def send_audio(self, pcm16: bytes) -> None:
        if not self._running:
            return
        self._audio_buffer.extend(pcm16)

        # Once buffer reaches ~15-20 seconds of audio, process it
        chunk_size_bytes = MIN_CHUNK_SECONDS * BYTES_PER_SECOND
        if len(self._audio_buffer) >= chunk_size_bytes:
            chunk = bytes(self._audio_buffer)
            self._audio_buffer.clear()
            chunk_duration_ms = int((len(chunk) / BYTES_PER_SECOND) * 1000)
            start_ms = self._current_offset_ms
            end_ms = start_ms + chunk_duration_ms
            self._current_offset_ms = end_ms

            asyncio.create_task(self._transcribe_chunk(chunk, start_ms, end_ms))

    async def _transcribe_chunk(self, pcm_chunk: bytes, start_ms: int, end_ms: int) -> None:
        async with self._semaphore:
            try:
                wav_bytes = pcm16_to_wav(pcm_chunk)
                url = "https://api.groq.com/openai/v1/audio/transcriptions"
                headers = {"Authorization": f"Bearer {self.api_key}"}

                files = {"file": ("speech.wav", wav_bytes, "audio/wav")}
                data = {
                    "model": "whisper-large-v3-turbo",
                    "language": self.language if self.language in ("ru", "en") else "ru",
                    "response_format": "verbose_json",
                }

                response = await self._http_client.post(url, headers=headers, files=files, data=data)
                if response.status_code == 200:
                    resp_json = response.json()
                    text = resp_json.get("text", "").strip()
                    if text:
                        event = AsrEvent(
                            type="final",
                            segment=AsrSegment(
                                start_ms=start_ms,
                                end_ms=end_ms,
                                text=text,
                                speaker="speaker_0",
                                confidence=0.9,
                                lang=self.language,
                            ),
                            is_endpoint=True,
                        )
                        await self._event_queue.put(event)
                else:
                    logger.error("groq_whisper_failed", status=response.status_code, body=response.text[:200])
            except Exception as e:
                logger.error("groq_whisper_exception", error=str(e))

    async def events(self) -> AsyncIterator[AsrEvent]:
        while self._running or not self._event_queue.empty():
            try:
                event = await asyncio.wait_for(self._event_queue.get(), timeout=0.5)
                yield event
                self._event_queue.task_done()
            except asyncio.TimeoutError:
                continue

    async def flush(self) -> None:
        """Processes any remaining audio in the buffer."""
        if self._audio_buffer:
            chunk = bytes(self._audio_buffer)
            self._audio_buffer.clear()
            chunk_duration_ms = int((len(chunk) / BYTES_PER_SECOND) * 1000)
            start_ms = self._current_offset_ms
            end_ms = start_ms + chunk_duration_ms
            self._current_offset_ms = end_ms
            await self._transcribe_chunk(chunk, start_ms, end_ms)

    async def close(self) -> None:
        self._running = False
        await self.flush()
        await self._http_client.aclose()
