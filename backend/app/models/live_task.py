import uuid
from datetime import datetime, timezone
from sqlalchemy import BigInteger, Boolean, Float, ForeignKey, Integer, String, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class LiveTask(Base):
    __tablename__ = "live_tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    kind: Mapped[str] = mapped_column(String(20), nullable=False, default="single_choice")  # single_choice | number | poll
    options: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, default=list)  # list of {id, text, is_correct, explanation}
    correct_option_id: Mapped[str | None] = mapped_column(String(10), nullable=True)
    target_number: Mapped[float | None] = mapped_column(Float, nullable=True)
    tolerance: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.01)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", index=True)  # active | closed | revealed
    time_limit_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    started_at_ms: Mapped[int] = mapped_column(BigInteger, nullable=False)
    closed_at_ms: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    stats: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # {counts: {A: 20, B: 3}, total: 23, accuracy: 0.87}
    ai_commentary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    lesson = relationship("Lesson", back_populates="live_tasks")
    responses = relationship("LiveTaskResponse", back_populates="task", cascade="all, delete-orphan")


class LiveTaskResponse(Base):
    __tablename__ = "live_task_responses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("live_tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    selected_option: Mapped[str | None] = mapped_column(String(50), nullable=True)
    number_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    response_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ai_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    task = relationship("LiveTask", back_populates="responses")
