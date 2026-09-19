import asyncio
from datetime import datetime, timezone
import json
import os
import shutil
import tempfile
from typing import Any, Callable
import uuid
import cv2
import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.pipeline import generate_note_block_for_window
from app.ai.providers.gemini import GeminiProvider
from app.ai.window_manager import WindowManager
from app.asr.soniox_async import SonioxAsyncClient
from app.core.config import get_settings
from app.core.db import AsyncSessionLocal
from app.core.events import emit_persistent_event
from app.core.logging import get_logger
from app.core.s3 import download_file, upload_bytes
from app.frames.dedup import FrameDeduplicator
from app.frames.detector import SlideBoardDetector
from app.frames.render import encode_image_to_webp
from app.models.frame import Frame
from app.models.lesson import Lesson
from app.models.transcript import TranscriptSegment
from app.models.window import Window
from app.workers.ai_worker import process_candidate_frame
from app.workers.finalizer import finalize_lesson

logger = get_logger("workers.file_processor")
settings = get_settings()


class FileProcessor:
    """
    Offline recording processor for uploaded video/audio files.
    Orchestrates:
    1. Media probing & duration verification
    2. Audio extraction via ffmpeg + batch speech recognition (Soniox/Groq)
    3. Frame extraction & slide/board change detection (ffmpeg / cv2)
    4. VLM analysis & Pillow annotation rendering
    5. Semantic window partitioning
    6. Concurrent note block generation (bounded by FILE_PROCESSING_CONCURRENCY)
    7. Lesson finalization (TL;DR, outline, glossary, takeaways, quiz readiness)
    """

    def __init__(
        self,
        asr_client: SonioxAsyncClient | None = None,
        vlm_provider: GeminiProvider | None = None,
    ):
        self.asr_client = asr_client or SonioxAsyncClient()
        self.vlm_provider = vlm_provider or GeminiProvider()
        self.concurrency_limit = settings.FILE_PROCESSING_CONCURRENCY

    async def _probe_media(self, file_path: str) -> tuple[float, bool, bool]:
        """
        Probes media file for duration (seconds), has_audio, has_video.
        Uses ffprobe if available, with cv2 / file-extension fallback.
        """
        duration_sec = 0.0
        has_audio = False
        has_video = False

        # Attempt ffprobe
        try:
            cmd = [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration:stream=codec_type",
                "-of",
                "json",
                file_path,
            ]
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await proc.communicate()
            if proc.returncode == 0:
                data = json.loads(stdout.decode("utf-8"))
                duration_sec = float(data.get("format", {}).get("duration", 0.0))
                streams = data.get("streams", [])
                for s in streams:
                    ctype = s.get("codec_type")
                    if ctype == "audio":
                        has_audio = True
                    elif ctype == "video":
                        has_video = True
                return duration_sec, has_audio, has_video
        except Exception as e:
            logger.debug("ffprobe_not_available_or_failed", error=str(e))

        # Fallback via OpenCV for video & duration
        try:
            cap = cv2.VideoCapture(file_path)
            if cap.isOpened():
                fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
                frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0.0
                if frame_count > 0 and fps > 0:
                    duration_sec = frame_count / fps
                    has_video = True
                cap.release()
        except Exception:
            pass

        # Check audio extension fallback
        ext = os.path.splitext(file_path)[1].lower()
        if ext in (".mp3", ".wav", ".m4a", ".aac", ".flac"):
            has_audio = True
            if duration_sec == 0.0:
                # Approximate duration if unknown
                size_bytes = os.path.getsize(file_path)
                duration_sec = max(1.0, size_bytes / (16000 * 2))  # rough guess for raw audio
        elif ext in (".mp4", ".mkv", ".webm", ".mov", ".avi"):
            has_video = True
            has_audio = True

        return duration_sec, has_audio, has_video

    async def _extract_audio(self, input_path: str, output_wav_path: str) -> bool:
        """
        Extracts 16kHz mono PCM16 WAV from media file using ffmpeg.
        """
        try:
            cmd = [
                "ffmpeg",
                "-y",
                "-i",
                input_path,
                "-vn",
                "-ac",
                "1",
                "-ar",
                "16000",
                "-c:a",
                "pcm_s16le",
                output_wav_path,
            ]
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await proc.communicate()
            if proc.returncode == 0 and os.path.exists(output_wav_path):
                return True
        except Exception as e:
            logger.debug("ffmpeg_audio_extraction_failed", error=str(e))

        # If input is already wav, copy it
        if input_path.lower().endswith(".wav"):
            shutil.copyfile(input_path, output_wav_path)
            return True

        return False

    async def process_lesson_recording(
        self,
        lesson_id: uuid.UUID | str,
        s3_key: str,
        db_factory: Callable[[], AsyncSession] = AsyncSessionLocal,
    ) -> None:
        """
        Complete processing pipeline for an uploaded lesson recording.
        """
        lesson_uid = uuid.UUID(str(lesson_id))
        temp_dir = tempfile.mkdtemp(prefix=f"fill_ai_{lesson_uid.hex[:8]}_")

        try:
            logger.info("file_processing_started", lesson_id=str(lesson_uid), s3_key=s3_key)

            # 1. Download file from S3
            input_ext = os.path.splitext(s3_key)[1] or ".mp4"
            local_input = os.path.join(temp_dir, f"recording{input_ext}")
            await download_file(s3_key, local_input)

            # 2. Probe media & validate duration
            duration_sec, has_audio, has_video = await self._probe_media(local_input)
            logger.info(
                "media_probed",
                duration_sec=duration_sec,
                has_audio=has_audio,
                has_video=has_video,
            )

            if duration_sec > settings.MAX_UPLOAD_DURATION_SEC:
                async with db_factory() as db:
                    lesson = await db.get(Lesson, lesson_uid)
                    if lesson:
                        lesson.status = "failed"
                        await emit_persistent_event(
                            session=db,
                            lesson_id=lesson_uid,
                            event_type="error.notice",
                            data={
                                "code": "duration_exceeded",
                                "message": f"Media duration {duration_sec}s exceeds maximum limit {settings.MAX_UPLOAD_DURATION_SEC}s",
                                "recoverable": False,
                            },
                            publish_to_redis_now=True,
                        )
                        await db.commit()
                return

            # Update lesson to processing status
            async with db_factory() as db:
                lesson = await db.get(Lesson, lesson_uid)
                if not lesson:
                    logger.error("lesson_not_found", lesson_id=str(lesson_uid))
                    return
                lesson.status = "processing"
                lesson.started_at = datetime.now(timezone.utc)
                await emit_persistent_event(
                    session=db,
                    lesson_id=lesson_uid,
                    event_type="lesson.status",
                    data={"status": "processing"},
                    publish_to_redis_now=True,
                )
                await db.commit()
                lesson_language = lesson.language
                expected_terms = lesson.expected_terms or []
                lesson_roi = lesson.roi

            # 3. Audio Extraction & Speech Recognition
            extracted_wav = os.path.join(temp_dir, "audio_16k.wav")
            audio_ok = await self._extract_audio(local_input, extracted_wav)
            audio_source = extracted_wav if audio_ok else local_input

            async with db_factory() as db:
                segments = await self.asr_client.transcribe_and_persist(
                    lesson_id=lesson_uid,
                    audio_file_path=audio_source,
                    language=lesson_language,
                    db=db,
                    expected_terms=expected_terms,
                )
            logger.info("transcription_completed", segment_count=len(segments))

            # 4. Video Frame Extraction & Candidate Detection
            candidate_frames: list[dict[str, Any]] = []
            if has_video:
                detector = SlideBoardDetector(roi=lesson_roi)
                cap = cv2.VideoCapture(local_input)
                fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
                frame_interval = max(1, int(round(fps)))  # 1 frame per second
                current_frame_idx = 0

                while cap.isOpened():
                    ret, frame_bgr = cap.read()
                    if not ret:
                        break

                    if current_frame_idx % frame_interval == 0:
                        sec = current_frame_idx / fps
                        t_ms = int(sec * 1000)
                        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

                        candidate = detector.process_frame(frame_rgb, t_ms=t_ms)
                        if candidate:
                            # Save full candidate to S3
                            frame_id = uuid.uuid4()
                            s3_frame_key = f"lessons/{lesson_uid}/frames/{t_ms}.webp"
                            webp_bytes = encode_image_to_webp(candidate.image_rgb, quality=90)
                            await upload_bytes(s3_frame_key, webp_bytes, content_type="image/webp")

                            # Insert Frame record as candidate
                            async with db_factory() as db:
                                frame_rec = Frame(
                                    id=frame_id,
                                    lesson_id=lesson_uid,
                                    t_ms=t_ms,
                                    status="candidate",
                                    phash=candidate.phash,
                                    s3_key=s3_frame_key,
                                    width=candidate.width,
                                    height=candidate.height,
                                )
                                db.add(frame_rec)
                                await db.commit()

                                # Analyze with VLM and Pillow
                                await process_candidate_frame(
                                    frame_id=frame_id,
                                    lesson_id=lesson_uid,
                                    s3_key=s3_frame_key,
                                    t_ms=t_ms,
                                    db=db,
                                    vlm_provider=self.vlm_provider,
                                )

                    current_frame_idx += 1
                cap.release()

            # 5. Semantic Window Partitioning
            async with db_factory() as db:
                # Fetch segments
                s_res = await db.execute(
                    select(TranscriptSegment)
                    .where(TranscriptSegment.lesson_id == lesson_uid)
                    .order_by(TranscriptSegment.start_ms.asc())
                )
                all_segments = s_res.scalars().all()

                # Fetch selected frames
                f_res = await db.execute(
                    select(Frame)
                    .where(Frame.lesson_id == lesson_uid, Frame.status == "selected")
                    .order_by(Frame.t_ms.asc())
                )
                selected_frames = f_res.scalars().all()

            windows_created: list[Window] = []
            max_media_ms = int(duration_sec * 1000)
            if all_segments:
                max_media_ms = max(max_media_ms, all_segments[-1].end_ms)

            # Build windows
            async with db_factory() as db:
                win_manager = WindowManager(lesson_id=lesson_uid)
                frame_idx = 0

                for seg in all_segments:
                    # Update slide title if any frame occurred
                    while frame_idx < len(selected_frames) and selected_frames[frame_idx].t_ms <= seg.end_ms:
                        win_manager.update_slide_title(selected_frames[frame_idx].title)
                        frame_idx += 1

                    if win_manager.should_close_window(
                        current_ms=seg.end_ms,
                        is_sentence_boundary=True,
                    ):
                        win = await win_manager.close_and_advance(end_ms=seg.end_ms, db=db)
                        windows_created.append(win)

                # Close remainder window if needed
                if win_manager.current_window_start_ms < max_media_ms or not windows_created:
                    final_end = max(max_media_ms, win_manager.current_window_start_ms + 1000)
                    win = await win_manager.close_and_advance(end_ms=final_end, db=db)
                    windows_created.append(win)

                await db.commit()

            logger.info("windows_partitioned", count=len(windows_created))

            # 6. Concurrent Note Block Generation
            sem = asyncio.Semaphore(self.concurrency_limit)

            async def _process_window_block(win: Window) -> None:
                async with sem:
                    async with db_factory() as db:
                        try:
                            await generate_note_block_for_window(
                                lesson_id=lesson_uid,
                                window_id=win.id,
                                position=win.idx,
                                start_ms=win.start_ms,
                                end_ms=win.end_ms,
                                db=db,
                                llm_provider=self.vlm_provider,
                            )
                        except Exception as e:
                            logger.error(
                                "window_block_generation_error",
                                window_id=str(win.id),
                                error=str(e),
                            )

            await asyncio.gather(*[_process_window_block(w) for w in windows_created])

            # 7. Finalization pass
            await finalize_lesson(lesson_id=lesson_uid, llm_provider=self.vlm_provider)

            # Mark lesson status as ready and record ended_at
            async with db_factory() as db:
                lesson = await db.get(Lesson, lesson_uid)
                if lesson:
                    lesson.status = "ready"
                    lesson.ended_at = datetime.now(timezone.utc)
                    await emit_persistent_event(
                        session=db,
                        lesson_id=lesson_uid,
                        event_type="lesson.ended",
                        data={"ended_at": lesson.ended_at.isoformat()},
                        publish_to_redis_now=True,
                    )
                    await db.commit()

            logger.info("file_processing_completed_successfully", lesson_id=str(lesson_uid))

        except Exception as e:
            logger.error("file_processing_fatal_error", lesson_id=str(lesson_uid), error=str(e))
            async with db_factory() as db:
                lesson = await db.get(Lesson, lesson_uid)
                if lesson:
                    lesson.status = "failed"
                    await emit_persistent_event(
                        session=db,
                        lesson_id=lesson_uid,
                        event_type="error.notice",
                        data={"code": "processing_failed", "message": str(e), "recoverable": False},
                        publish_to_redis_now=True,
                    )
                    await db.commit()
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
