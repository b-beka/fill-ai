import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    group_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    title: Mapped[str] = mapped_column(Text, nullable=False)
    subject: Mapped[str | None] = mapped_column(Text, nullable=True)
    language: Mapped[str] = mapped_column(
        Text,
        CheckConstraint("language IN ('ru', 'kk', 'en')", name="chk_lesson_language"),
        nullable=False,
    )
    source: Mapped[str] = mapped_column(
        Text,
        CheckConstraint("source IN ('live', 'upload')", name="chk_lesson_source"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(Text, nullable=False, default="created")
    visibility_mode: Mapped[str] = mapped_column(String(20), default="live", server_default="live", nullable=False)
    expected_terms: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    roi: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    livekit_room: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_seq: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cost_usd: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    events = relationship("LessonEvent", back_populates="lesson", cascade="all, delete-orphan")
    transcript_segments = relationship("TranscriptSegment", back_populates="lesson", cascade="all, delete-orphan")
    frames = relationship("Frame", back_populates="lesson", cascade="all, delete-orphan")
    windows = relationship("Window", back_populates="lesson", cascade="all, delete-orphan")
    blocks = relationship("NoteBlock", back_populates="lesson", cascade="all, delete-orphan")
    summary = relationship("LessonSummary", back_populates="lesson", uselist=False, cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="lesson", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="lesson", cascade="all, delete-orphan")
    slides = relationship("LessonSlide", back_populates="lesson", cascade="all, delete-orphan")


class LessonEvent(Base):
    __tablename__ = "lesson_events"

    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), primary_key=True
    )
    seq: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    type: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    lesson = relationship("Lesson", back_populates="events")
