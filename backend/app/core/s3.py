import io
from typing import BinaryIO
import aioboto3
from botocore.config import Config
from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger("core.s3")

_session = aioboto3.Session()


def _get_client_kwargs() -> dict:
    return {
        "service_name": "s3",
        "endpoint_url": settings.S3_ENDPOINT,
        "aws_access_key_id": settings.S3_ACCESS_KEY,
        "aws_secret_access_key": settings.S3_SECRET_KEY,
        "region_name": settings.S3_REGION,
        "config": Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    }


async def ensure_bucket_exists() -> None:
    """Verifies that the configured S3 bucket exists, or creates it if not."""
    async with _session.client(**_get_client_kwargs()) as s3:
        try:
            await s3.head_bucket(Bucket=settings.S3_BUCKET)
        except Exception:
            try:
                await s3.create_bucket(Bucket=settings.S3_BUCKET)
                logger.info("s3_bucket_created", bucket=settings.S3_BUCKET)
            except Exception as e:
                logger.warning("s3_bucket_create_failed_or_exists", error=str(e))


async def upload_bytes(
    key: str,
    data: bytes,
    content_type: str = "application/octet-stream",
) -> str:
    """Uploads raw bytes to S3 and returns the key."""
    async with _session.client(**_get_client_kwargs()) as s3:
        await s3.put_object(
            Bucket=settings.S3_BUCKET,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
    return key


async def download_bytes(key: str) -> bytes:
    """Downloads an object from S3 as bytes."""
    async with _session.client(**_get_client_kwargs()) as s3:
        response = await s3.get_object(Bucket=settings.S3_BUCKET, Key=key)
        async with response["Body"] as stream:
            return await stream.read()


async def head_object(key: str) -> dict:
    """Gets metadata (size, content type) for an object in S3."""
    async with _session.client(**_get_client_kwargs()) as s3:
        return await s3.head_object(Bucket=settings.S3_BUCKET, Key=key)


async def download_file(key: str, local_path: str) -> None:
    """Streams an object from S3 directly to a local file path."""
    async with _session.client(**_get_client_kwargs()) as s3:
        response = await s3.get_object(Bucket=settings.S3_BUCKET, Key=key)
        with open(local_path, "wb") as f:
            async with response["Body"] as stream:
                while chunk := await stream.read(1024 * 1024):
                    f.write(chunk)


async def get_presigned_url(
    key: str,
    client_method: str = "get_object",
    expires_in: int = settings.SIGNED_URL_EXPIRES_SECONDS,
) -> str:
    """
    Generates a presigned URL for GET or PUT operations on S3.
    """
    async with _session.client(**_get_client_kwargs()) as s3:
        url = await s3.generate_presigned_url(
            ClientMethod=client_method,
            Params={"Bucket": settings.S3_BUCKET, "Key": key},
            ExpiresIn=expires_in,
        )
        return url


def resolve_media_url(key: str | None) -> str | None:
    """
    Resolves S3 key to user-facing URL based on MEDIA_URL_MODE (proxy or direct/signed).
    """
    if not key:
        return None
    if settings.MEDIA_URL_MODE == "proxy":
        return f"/v1/media/{key}"
    # In signed mode, endpoints generate fresh presigned URLs
    return f"{settings.S3_ENDPOINT}/{settings.S3_BUCKET}/{key}"
