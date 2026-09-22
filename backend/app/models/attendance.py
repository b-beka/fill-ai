import uuid
from datetime import datetime, timezone
from sqlalchemy import BigInteger, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class StudentAttendance(Base):
    __tablename__ = "student_attendances"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    student_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")  # active | idle | disconnected
    
    joined_at_ms: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    left_at_ms: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    total_active_ms: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    focus_score: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)  # 0.0 - 1.0
    
    # List of presence intervals: [{start_ms: int, end_ms: int, is_focused: bool}]
    intervals: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, default=list)
    
    # List of note block IDs that this student missed due to disconnect or inactivity
    missed_block_ids: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    
    tasks_answered: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    tasks_correct: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    catchup_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    lesson = relationship("Lesson", back_populates="attendances")
