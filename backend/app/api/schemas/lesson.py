from datetime import datetime
from typing import Literal
import uuid
from pydantic import BaseModel, Field


class LessonCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    subject: str | None = Field(None, max_length=100)
    language: Literal["ru", "kk", "en"]
    source: Literal["live", "upload"]
    group_id: uuid.UUID | None = None
    expected_terms: list[str] = Field(default_factory=list)
    roi: dict | None = None
    consent_confirmed: bool = Field(
        False,
        description="Must be true for live lessons according to Section 15.3 of TZ",
    )


class LessonResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    group_id: uuid.UUID | None = None
    teacher_id: uuid.UUID
    title: str
    subject: str | None = None
    language: str
    source: str
    status: str
    expected_terms: list[str] = []
    roi: dict | None = None
    livekit_room: str | None = None
    last_seq: int
    cost_usd: float
    started_at: datetime | None = None
    ended_at: datetime | None = None
    created_at: datetime
    livekit_url: str | None = None
    teacher_token: str | None = None

    model_config = {"from_attributes": True}


class BlockUpdateRequest(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=150)
    body_md: str | None = Field(None, min_length=1)


class LessonStateResponse(BaseModel):
    lesson: LessonResponse
    last_seq: int
    blocks: list[dict] = []
    frames: list[dict] = []
    summary: dict | None = None
    transcript: list[dict] = []


class UploadUrlRequest(BaseModel):
    filename: str = Field(..., min_length=3, max_length=255)
    content_type: str = Field(default="video/mp4")


class UploadUrlResponse(BaseModel):
    upload_url: str
    s3_key: str
    expires_in: int


class ProcessLessonRequest(BaseModel):
    s3_key: str | None = None

