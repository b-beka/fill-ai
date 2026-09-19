import uuid
from typing import Any
from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.s3 import get_presigned_url

logger = get_logger("media.egress")
settings = get_settings()


async def start_room_recording(room_name: str, lesson_id: uuid.UUID) -> str | None:
    """
    Starts room composite recording via LiveKit Egress, writing directly to S3.
    Returns the egress_id or recording key.
    """
    s3_key = f"lessons/{lesson_id}/recording.mp4"
    try:
        from livekit import api
        egress_client = api.EgressClient(
            settings.LIVEKIT_URL,
            settings.LIVEKIT_API_KEY,
            settings.LIVEKIT_API_SECRET,
        )
        # Configure S3 output
        file_output = api.EncodedFileOutput(
            filepath=s3_key,
            s3=api.S3Upload(
                endpoint=settings.S3_ENDPOINT,
                access_key=settings.S3_ACCESS_KEY,
                secret=settings.S3_SECRET_KEY,
                bucket=settings.S3_BUCKET,
            ),
        )
        request = api.RoomCompositeEgressRequest(
            room_name=room_name,
            file=file_output,
        )
        info = await egress_client.start_room_composite_egress(request)
        logger.info("livekit_egress_started", egress_id=info.egress_id, room_name=room_name)
        return info.egress_id
    except Exception as e:
        logger.warning("livekit_egress_start_failed_or_dev_mode", error=str(e), room_name=room_name)
        return f"dev_egress_{lesson_id}"


async def stop_room_recording(egress_id: str) -> None:
    """Stops an active LiveKit egress recording."""
    if not egress_id or egress_id.startswith("dev_"):
        return
    try:
        from livekit import api
        egress_client = api.EgressClient(
            settings.LIVEKIT_URL,
            settings.LIVEKIT_API_KEY,
            settings.LIVEKIT_API_SECRET,
        )
        await egress_client.stop_egress(api.StopEgressRequest(egress_id=egress_id))
        logger.info("livekit_egress_stopped", egress_id=egress_id)
    except Exception as e:
        logger.warning("livekit_egress_stop_failed", error=str(e), egress_id=egress_id)


async def get_recording_playback_url(lesson_id: uuid.UUID) -> str:
    """Generates a presigned URL for playback of the lesson recording."""
    s3_key = f"lessons/{lesson_id}/recording.mp4"
    return await get_presigned_url(s3_key, expires_in=3600)
