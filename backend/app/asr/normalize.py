import uuid
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.asr.base import AsrEvent, AsrSegment
from app.core.events import emit_ephemeral_event, emit_persistent_event
from app.core.logging import get_logger
from app.models.transcript import TranscriptSegment

logger = get_logger("asr.normalize")

PAUSE_THRESHOLD_MS = 800  # 0.8 seconds pause groups sentences per Section 6.1


class TranscriptNormalizer:
    """
    Normalizes stream tokens, groups segments by pauses or punctuation,
    persists final segments into Postgres, and emits SSE events.
    """

    def __init__(self, lesson_id: uuid.UUID | str):
        self.lesson_id = uuid.UUID(str(lesson_id))
        self.buffer_words: list[str] = []
        self.word_timings: list[dict[str, Any]] = []
        self.segment_start_ms: int | None = None
        self.segment_end_ms: int | None = None
        self.current_speaker: str | None = None
        self.current_lang: str | None = None
        self.confidence_sum: float = 0.0
        self.token_count: int = 0

    async def process_event(
        self,
        event: AsrEvent,
        db: AsyncSession,
    ) -> dict[str, Any] | None:
        """
        Processes an incoming ASR event.
        - Partials: emitted immediately as ephemeral pub/sub events.
        - Finals: aggregated into sentences and persisted to DB with seq.
        """
        if event.type == "partial":
            # Ephemeral event: no DB, no seq, only Redis pub/sub
            return await emit_ephemeral_event(
                lesson_id=self.lesson_id,
                event_type="transcript.partial",
                data={
                    "start_ms": event.segment.start_ms,
                    "text": event.segment.text,
                },
            )

        # Final tokens processing
        seg = event.segment
        if not seg.text.strip():
            return None

        # Check pause threshold
        if self.segment_end_ms is not None:
            pause = seg.start_ms - self.segment_end_ms
            if pause >= PAUSE_THRESHOLD_MS:
                # Flush the buffered sentence before starting a new one
                flushed_event = await self.flush(db)
                self._start_new_segment(seg)
                return flushed_event

        if self.segment_start_ms is None:
            self._start_new_segment(seg)
        else:
            self.buffer_words.append(seg.text)
            if seg.words:
                self.word_timings.extend(seg.words)
            else:
                self.word_timings.append({"word": seg.text, "start_ms": seg.start_ms, "end_ms": seg.end_ms})
            self.segment_end_ms = seg.end_ms
            self.confidence_sum += (seg.confidence or 0.9)
            self.token_count += 1

        # Check if sentence ends with punctuation or endpoint
        full_text = " ".join(self.buffer_words).strip()
        if event.is_endpoint or (full_text and full_text[-1] in (".", "!", "?", "…")):
            return await self.flush(db)

        return None

    def _start_new_segment(self, seg: AsrSegment) -> None:
        self.buffer_words = [seg.text]
        if seg.words:
            self.word_timings = list(seg.words)
        else:
            self.word_timings = [{"word": seg.text, "start_ms": seg.start_ms, "end_ms": seg.end_ms}]
        self.segment_start_ms = seg.start_ms
        self.segment_end_ms = seg.end_ms
        self.current_speaker = seg.speaker
        self.current_lang = seg.lang
        self.confidence_sum = seg.confidence or 0.9
        self.token_count = 1

    async def flush(self, db: AsyncSession) -> dict[str, Any] | None:
        """Flushes buffered tokens as a completed sentence segment."""
        if not self.buffer_words or self.segment_start_ms is None or self.segment_end_ms is None:
            return None

        text_content = " ".join(self.buffer_words).strip()
        if not text_content:
            return None

        avg_confidence = (
            round(self.confidence_sum / self.token_count, 3)
            if self.token_count > 0
            else 0.9
        )

        segment_id = uuid.uuid4()
        segment = TranscriptSegment(
            id=segment_id,
            lesson_id=self.lesson_id,
            start_ms=self.segment_start_ms,
            end_ms=self.segment_end_ms,
            text=text_content,
            speaker=self.current_speaker,
            confidence=avg_confidence,
            lang=self.current_lang,
            words=list(self.word_timings) if self.word_timings else None,
        )
        db.add(segment)
        await db.flush()

        # Emit persistent transcript.final event with allocated seq
        event_data = {
            "segment_id": str(segment_id),
            "start_ms": self.segment_start_ms,
            "end_ms": self.segment_end_ms,
            "text": text_content,
            "speaker": self.current_speaker,
            "words": list(self.word_timings) if self.word_timings else None,
        }
        published_event = await emit_persistent_event(
            session=db,
            lesson_id=self.lesson_id,
            event_type="transcript.final",
            data=event_data,
            publish_to_redis_now=True,
        )

        # Reset buffer
        self.buffer_words = []
        self.word_timings = []
        self.segment_start_ms = None
        self.segment_end_ms = None
        self.confidence_sum = 0.0
        self.token_count = 0

        return published_event
