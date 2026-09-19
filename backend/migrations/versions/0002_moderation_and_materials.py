"""Add moderation, words timestamps, and lesson_slides table

Revision ID: 0002_moderation_and_materials
Revises: 0001_initial_schema
Create Date: 2026-09-19 17:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_moderation_and_materials"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add visibility_mode to lessons
    op.add_column(
        "lessons",
        sa.Column("visibility_mode", sa.String(length=20), server_default="live", nullable=False),
    )

    # 2. Add status to note_blocks
    op.add_column(
        "note_blocks",
        sa.Column("status", sa.String(length=20), server_default="approved", nullable=False),
    )

    # 3. Add words to transcript_segments
    op.add_column(
        "transcript_segments",
        sa.Column("words", postgresql.JSONB(), nullable=True),
    )

    # 4. Create lesson_slides table
    op.create_table(
        "lesson_slides",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("slide_idx", sa.Integer(), nullable=False),
        sa.Column("s3_key", sa.Text(), nullable=False),
        sa.Column("phash", sa.String(length=32), nullable=False),
        sa.Column("extracted_text", sa.Text(), server_default="", nullable=False),
        sa.Column("terms", postgresql.ARRAY(sa.Text()), server_default="{}", nullable=True),
        sa.Column("width", sa.Integer(), server_default="1920", nullable=False),
        sa.Column("height", sa.Integer(), server_default="1080", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_lesson_slides_lesson_id", "lesson_slides", ["lesson_id"])
    op.create_index("ix_lesson_slides_phash", "lesson_slides", ["phash"])


def downgrade() -> None:
    op.drop_index("ix_lesson_slides_phash", table_name="lesson_slides")
    op.drop_index("ix_lesson_slides_lesson_id", table_name="lesson_slides")
    op.drop_table("lesson_slides")
    op.drop_column("transcript_segments", "words")
    op.drop_column("note_blocks", "status")
    op.drop_column("lessons", "visibility_mode")
