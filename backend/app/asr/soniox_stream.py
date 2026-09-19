import asyncio
from collections import deque
from collections.abc import AsyncIterator
import json
from typing import Any
import websockets
from app.asr.base import AsrEvent, AsrSegment, AsrStream
from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("asr.soniox")
settings = get_settings()

# 16kHz mono 16-bit PCM: 16000 * 2 = 32000 bytes per second
SAMPLE_RATE = 16000
BYTES_PER_SECOND = SAMPLE_RATE * 2
RING_BUFFER_SECONDS = 30
MAX_RING_BUFFER_BYTES = BYTES_PER_SECOND * RING_BUFFER_SECONDS


class AudioRingBuffer:
    """Ring buffer storing the last 30 seconds of PCM16 audio."""

    def __init__(self, max_bytes: int = MAX_RING_BUFFER_BYTES):
        self.max_bytes = max_bytes
        self.buffer = bytearray()

    def append(self, data: bytes) -> None:
        self.buffer.extend(data)
        if len(self.buffer) > self.max_bytes:
            excess = len(self.buffer) - self.max_bytes
            del self.buffer[:excess]

    def get_buffered_audio(self) -> bytes:
        return bytes(self.buffer)

    def clear(self) -> None:
        self.buffer.clear()


class SonioxStreamClient(AsrStream):
    """
    Streaming WebSocket client for Soniox ASR.
    Supports auto-reconnect, 30s ring buffer replay, and dual partial/final event emission.
    """

    def __init__(
        self,
        language: str = "ru",
        expected_terms: list[str] | None = None,
        api_key: str | None = None,
    ):
        self.language = language
        self.expected_terms = expected_terms or []
        self.api_key = api_key or settings.SONIOX_API_KEY
        self.ring_buffer = AudioRingBuffer()
        self._event_queue: asyncio.Queue[AsrEvent] = asyncio.Queue()
        self._ws: Any = None
        self._running = True
        self._reconnect_attempts = 0
        self._max_reconnect_attempts = 5
        self._connected = False
        self._audio_queue: asyncio.Queue[bytes] = asyncio.Queue()
        self._background_tasks: list[asyncio.Task] = []

    def _get_language_hints(self) -> list[str]:
        if self.language == "kk":
            return ["kk", "ru"]
        elif self.language == "en":
            return ["en"]
        return ["ru"]

    async def start(self) -> None:
        """Starts worker tasks for network I/O."""
        self._background_tasks.append(asyncio.create_task(self._connection_loop()))
        self._background_tasks.append(asyncio.create_task(self._send_loop()))

    async def send_audio(self, pcm16: bytes) -> None:
        """Appends audio to ring buffer and queues for transmission."""
        if not self._running:
            return
        self.ring_buffer.append(pcm16)
        await self._audio_queue.put(pcm16)

    async def _connection_loop(self) -> None:
        backoffs = [0.5, 1.0, 2.0, 4.0, 8.0]

        while self._running:
            try:
                uri = "wss://api.soniox.com/transcribe-websocket"
                headers = {"Authorization": f"Bearer {self.api_key}"}

                logger.info("soniox_connecting", language=self.language)
                async with websockets.connect(uri, extra_headers=headers) as ws:
                    self._ws = ws
                    self._connected = True
                    self._reconnect_attempts = 0
                    logger.info("soniox_connected")

                    # Send configuration payload
                    init_payload = {
                        "api_key": self.api_key,
                        "sample_rate_hertz": SAMPLE_RATE,
                        "num_channels": 1,
                        "language_hints": self._get_language_hints(),
                        "enable_diarization": True,
                        "enable_endpoint_detection": True,
                        "expected_terms": self.expected_terms,
                    }
                    await ws.send(json.dumps(init_payload))

                    # Replay buffered audio upon reconnect
                    buffered = self.ring_buffer.get_buffered_audio()
                    if buffered and self._reconnect_attempts > 0:
                        logger.info("soniox_replaying_buffered_audio", bytes=len(buffered))
                        await ws.send(buffered)

                    # Receive loop
                    async for message in ws:
                        await self._handle_message(message)

            except asyncio.CancelledError:
                break
            except Exception as e:
                self._connected = False
                self._ws = None
                self._reconnect_attempts += 1
                logger.warning(
                    "soniox_connection_error",
                    error=str(e),
                    attempt=self._reconnect_attempts,
                )

                if self._reconnect_attempts >= self._max_reconnect_attempts:
                    logger.error("soniox_max_reconnect_exceeded_triggering_fallback")
                    # Stop Soniox loop to allow fallback
                    break

                delay = backoffs[min(self._reconnect_attempts - 1, len(backoffs) - 1)]
                await asyncio.sleep(delay)

    async def _send_loop(self) -> None:
        while self._running:
            chunk = await self._audio_queue.get()
            if self._connected and self._ws:
                try:
                    await self._ws.send(chunk)
                except Exception as e:
                    logger.warning("soniox_send_failed", error=str(e))
            self._audio_queue.task_done()

    async def _handle_message(self, raw_message: str | bytes) -> None:
        try:
            if isinstance(raw_message, bytes):
                raw_message = raw_message.decode("utf-8")
            data = json.loads(raw_message)

            words = data.get("words", [])
            text = " ".join([w.get("text", "") for w in words]).strip()
            if not text:
                return

            is_final = data.get("is_final", False)
            start_ms = int(words[0].get("start_ms", 0)) if words else 0
            end_ms = int(words[-1].get("end_ms", 0)) if words else start_ms
            speaker = words[0].get("speaker", "speaker_0") if words else None

            event = AsrEvent(
                type="final" if is_final else "partial",
                segment=AsrSegment(
                    start_ms=start_ms,
                    end_ms=end_ms,
                    text=text,
                    speaker=speaker,
                    confidence=data.get("confidence", 0.95),
                    lang=self.language,
                ),
                is_endpoint=data.get("is_endpoint", False),
            )
            await self._event_queue.put(event)
        except Exception as e:
            logger.error("soniox_parse_message_failed", error=str(e))

    async def events(self) -> AsyncIterator[AsrEvent]:
        while self._running or not self._event_queue.empty():
            try:
                event = await asyncio.wait_for(self._event_queue.get(), timeout=0.5)
                yield event
                self._event_queue.task_done()
            except asyncio.TimeoutError:
                continue

    async def close(self) -> None:
        self._running = False
        self._connected = False
        for task in self._background_tasks:
            task.cancel()
        if self._ws:
            await self._ws.close()
        logger.info("soniox_client_closed")
