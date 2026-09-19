"""Initial database schema for Fill AI backend

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. lessons
    op.create_table(
        "lessons",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("org_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("group_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("teacher_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("subject", sa.Text(), nullable=True),
        sa.Column("language", sa.Text(), nullable=False),
        sa.Column("source", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), server_default="created", nullable=False),
        sa.Column("expected_terms", postgresql.ARRAY(sa.Text()), server_default="{}", nullable=True),
        sa.Column("roi", postgresql.JSONB(), nullable=True),
        sa.Column("livekit_room", sa.Text(), nullable=True),
        sa.Column("last_seq", sa.BigInteger(), server_default="0", nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cost_usd", sa.Numeric(precision=10, scale=4), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("language IN ('ru', 'kk', 'en')", name="chk_lesson_language"),
        sa.CheckConstraint("source IN ('live', 'upload')", name="chk_lesson_source"),
    )
    op.create_index("ix_lessons_org_id", "lessons", ["org_id"])
    op.create_index("ix_lessons_teacher_id", "lessons", ["teacher_id"])

    # 2. lesson_events
    op.create_table(
        "lesson_events",
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("seq", sa.BigInteger(), primary_key=True),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 3. transcript_segments
    op.create_table(
        "transcript_segments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("start_ms", sa.Integer(), nullable=False),
        sa.Column("end_ms", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("speaker", sa.Text(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("lang", sa.Text(), nullable=True),
    )
    op.create_index("ix_transcript_segments_lesson_start_ms", "transcript_segments", ["lesson_id", "start_ms"])

    # 4. frames
    op.create_table(
        "frames",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("t_ms", sa.Integer(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("phash", sa.Text(), nullable=True),
        sa.Column("s3_key", sa.Text(), nullable=False),
        sa.Column("s3_key_annotated", sa.Text(), nullable=True),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("kind", sa.Text(), nullable=True),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("ocr_markdown", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("informativeness", sa.Float(), nullable=True),
        sa.Column("annotations", postgresql.JSONB(), server_default="[]", nullable=False),
        sa.CheckConstraint("status IN ('candidate', 'selected', 'rejected')", name="chk_frame_status"),
    )
    op.create_index("ix_frames_lesson_t_ms", "frames", ["lesson_id", "t_ms"])

    # 5. windows
    op.create_table(
        "windows",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("idx", sa.Integer(), nullable=False),
        sa.Column("start_ms", sa.Integer(), nullable=False),
        sa.Column("end_ms", sa.Integer(), nullable=False),
        sa.Column("status", sa.Text(), server_default="pending", nullable=False),
        sa.UniqueConstraint("lesson_id", "idx", name="uq_windows_lesson_idx"),
    )

    # 6. note_blocks
    op.create_table(
        "note_blocks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("window_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("windows.id", ondelete="SET NULL"), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("t_start_ms", sa.Integer(), nullable=False),
        sa.Column("t_end_ms", sa.Integer(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("body_md", sa.Text(), nullable=False),
        sa.Column("key_terms", postgresql.JSONB(), server_default="[]", nullable=False),
        sa.Column("callouts", postgresql.JSONB(), server_default="[]", nullable=False),
        sa.Column("frame_refs", postgresql.JSONB(), server_default="[]", nullable=False),
        sa.Column("uncertain", postgresql.JSONB(), server_default="[]", nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("edited_by_teacher", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.UniqueConstraint("lesson_id", "position", name="uq_note_blocks_lesson_position"),
    )

    # 7. lesson_summary
    op.create_table(
        "lesson_summary",
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tldr", sa.Text(), nullable=True),
        sa.Column("outline", postgresql.JSONB(), nullable=True),
        sa.Column("glossary", postgresql.JSONB(), nullable=True),
        sa.Column("takeaways", postgresql.JSONB(), nullable=True),
        sa.Column("homework", sa.Text(), nullable=True),
    )

    # 8. quizzes
    op.create_table(
        "quizzes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("status", sa.Text(), server_default="draft", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('draft', 'published', 'archived')", name="chk_quiz_status"),
    )

    # 9. quiz_questions
    op.create_table(
        "quiz_questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("quiz_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("options", postgresql.JSONB(), nullable=True),
        sa.Column("correct", postgresql.JSONB(), nullable=True),
        sa.Column("rubric", sa.Text(), nullable=True),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("difficulty", sa.Text(), nullable=True),
        sa.Column("topic", sa.Text(), nullable=True),
        sa.Column("block_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("note_blocks.id", ondelete="SET NULL"), nullable=True),
        sa.Column("points", sa.Float(), server_default="1", nullable=False),
        sa.CheckConstraint("type IN ('single', 'multiple', 'open')", name="chk_quiz_question_type"),
    )

    # 10. attempts
    op.create_table(
        "attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("quiz_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("max_score", sa.Float(), nullable=True),
        sa.Column("status", sa.Text(), server_default="in_progress", nullable=False),
        sa.UniqueConstraint("quiz_id", "student_id", name="uq_attempts_quiz_student"),
    )

    # 11. answers
    op.create_table(
        "answers",
        sa.Column("attempt_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("attempts.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("quiz_questions.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("value", postgresql.JSONB(), nullable=True),
        sa.Column("is_correct", sa.Boolean(), nullable=True),
        sa.Column("points", sa.Float(), nullable=True),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("graded_by", sa.Text(), nullable=True),
        sa.CheckConstraint("graded_by IN ('auto', 'llm', 'teacher')", name="chk_answer_graded_by"),
    )

    # 12. reports
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quiz_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("stats", postgresql.JSONB(), nullable=False),
        sa.Column("narrative", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 13. ai_calls
    op.create_table(
        "ai_calls",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("task", sa.Text(), nullable=False),
        sa.Column("provider", sa.Text(), nullable=False),
        sa.Column("model", sa.Text(), nullable=False),
        sa.Column("prompt_version", sa.Text(), nullable=True),
        sa.Column("tokens_in", sa.Integer(), nullable=True),
        sa.Column("tokens_out", sa.Integer(), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("cost_usd", sa.Numeric(precision=10, scale=6), nullable=True),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ai_calls_lesson_id", "ai_calls", ["lesson_id"])


def downgrade() -> None:
    op.drop_table("ai_calls")
    op.drop_table("reports")
    op.drop_table("answers")
    op.drop_table("attempts")
    op.drop_table("quiz_questions")
    op.drop_table("quizzes")
    op.drop_table("lesson_summary")
    op.drop_table("note_blocks")
    op.drop_table("windows")
    op.drop_table("frames")
    op.drop_table("transcript_segments")
    op.drop_table("lesson_events")
    op.drop_table("lessons")
