import asyncio
from datetime import datetime, timezone
import uuid
from typing import Any
from app.asr.normalize import TranscriptNormalizer
from app.asr.soniox_stream import SonioxStreamClient
from app.core.config import get_settings
from app.core.db import AsyncSessionLocal
from app.core.logging import get_logger
from app.core.redis import get_redis_client

logger = get_logger("media.livekit_bot")
settings = get_settings()


class LiveKitMediaBot:
    """
    Server-side participant bot connecting to a LiveKit room.
    Subscribes to teacher's audio and video tracks, streams audio to ASR,
    and maintains heartbeat for watchdog monitoring.
    """

    def __init__(
        self,
        lesson_id: uuid.UUID | str,
        room_name: str,
        language: str = "ru",
        expected_terms: list[str] | None = None,
    ):
        self.lesson_id = uuid.UUID(str(lesson_id))
        self.room_name = room_name
        self.language = language
        self.expected_terms = expected_terms or []
        self._running = False
        self._normalizer = TranscriptNormalizer(self.lesson_id)
        self._asr_client = SonioxStreamClient(
            language=self.language,
            expected_terms=self.expected_terms,
        )
        self._tasks: list[asyncio.Task] = []

    async def start(self) -> None:
        """Connects to LiveKit and starts audio ingestion & heartbeat."""
        self._running = True
        logger.info("bot_starting", lesson_id=str(self.lesson_id), room=self.room_name)

        await self._asr_client.start()
        self._tasks.append(asyncio.create_task(self._asr_consumer_loop()))
        self._tasks.append(asyncio.create_task(self._heartbeat_loop()))

        # LiveKit Room connection (wrapped safely in case LiveKit is simulated or in dev)
        self._tasks.append(asyncio.create_task(self._connect_livekit_room()))

    async def _connect_livekit_room(self) -> None:
        try:
            from livekit import api, rtc
            token = (
                api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
                .with_identity(f"bot-{self.lesson_id}")
                .with_name("Media Bot")
                .with_grants(api.VideoGrants(room_join=True, room=self.room_name, can_subscribe=True))
                .to_jwt()
            )

            room = rtc.Room()

            @room.on("track_subscribed")
            def on_track_subscribed(track: rtc.Track, publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
                if track.kind == rtc.TrackKind.KIND_AUDIO:
                    logger.info("audio_track_subscribed", participant=participant.identity)
                    self._tasks.append(asyncio.create_task(self._read_audio_stream(track)))

            await room.connect(settings.LIVEKIT_URL, token)
            logger.info("bot_connected_to_livekit", room=self.room_name)

            while self._running:
                await asyncio.sleep(1)

            await room.disconnect()
        except ImportError:
            logger.warning("livekit_rtc_not_installed_running_in_stub_mode")
        except Exception as e:
            logger.error("livekit_connection_failed", error=str(e))

    async def _read_audio_stream(self, track: Any) -> None:
        """Reads raw 16kHz mono audio frames from LiveKit AudioStream."""
        try:
            from livekit import rtc
            audio_stream = rtc.AudioStream(track, sample_rate=16000, num_channels=1)
            async for frame in audio_stream:
                if not self._running:
                    break
                await self._asr_client.send_audio(frame.data.tobytes())
        except Exception as e:
            logger.error("audio_stream_reading_error", error=str(e))

    async def _asr_consumer_loop(self) -> None:
        """Reads speech recognition events and routes through normalizer to DB & pub/sub."""
        try:
            async for asr_event in self._asr_client.events():
                if not self._running:
                    break
                async with AsyncSessionLocal() as db:
                    try:
                        await self._normalizer.process_event(asr_event, db)
                        await db.commit()
                    except Exception as e:
                        await db.rollback()
                        logger.error("process_asr_event_error", error=str(e))
        except Exception as e:
            logger.error("asr_consumer_loop_error", error=str(e))

    async def _heartbeat_loop(self) -> None:
        """Publishes heartbeat every 5s for watchdog monitoring (Section 14)."""
        redis = get_redis_client()
        key = f"bot:heartbeat:{self.lesson_id}"
        while self._running:
            try:
                now_str = datetime.now(timezone.utc).isoformat()
                await redis.setex(key, 20, now_str)
            except Exception as e:
                logger.warning("heartbeat_failed", error=str(e))
            await asyncio.sleep(5)

    async def stop(self) -> None:
        """Graceful shutdown of bot and final buffer flush."""
        self._running = False
        logger.info("bot_stopping", lesson_id=str(self.lesson_id))

        # Flush any remaining tokens into DB
        async with AsyncSessionLocal() as db:
            try:
                await self._normalizer.flush(db)
                await db.commit()
            except Exception as e:
                await db.rollback()
                logger.error("bot_final_flush_failed", error=str(e))

        await self._asr_client.close()
        for task in self._tasks:
            task.cancel()
        logger.info("bot_stopped", lesson_id=str(self.lesson_id))
