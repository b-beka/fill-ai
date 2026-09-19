import uuid
from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class NoteBlock(Base):
    __tablename__ = "note_blocks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    window_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("windows.id", ondelete="SET NULL"), nullable=True
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    t_start_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    t_end_ms: Mapped[int] = mapped_column(Integer, nullable=False)

    title: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_md: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="approved", server_default="approved", nullable=False)

    key_terms: Mapped[list] = mapped_column(JSONB, default=list)
    callouts: Mapped[list] = mapped_column(JSONB, default=list)
    frame_refs: Mapped[list] = mapped_column(JSONB, default=list)
    uncertain: Mapped[list] = mapped_column(JSONB, default=list)

    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    edited_by_teacher: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    lesson = relationship("Lesson", back_populates="blocks")
    window = relationship("Window", back_populates="note_blocks")
    quiz_questions = relationship("QuizQuestion", back_populates="block")

    __table_args__ = (
        UniqueConstraint("lesson_id", "position", name="uq_note_blocks_lesson_position"),
    )


class LessonSummary(Base):
    __tablename__ = "lesson_summary"

    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), primary_key=True
    )
    tldr: Mapped[str | None] = mapped_column(Text, nullable=True)
    outline: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    glossary: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    takeaways: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    homework: Mapped[str | None] = mapped_column(Text, nullable=True)

    lesson = relationship("Lesson", back_populates="summary")
