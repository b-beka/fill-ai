"""Add live_tasks and live_task_responses tables

Revision ID: 0003_live_tasks
Revises: 0002_moderation_and_materials
Create Date: 2026-09-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003_live_tasks"
down_revision = "0002_moderation_and_materials"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create live_tasks table
    op.create_table(
        "live_tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("kind", sa.String(length=20), server_default="single_choice", nullable=False),
        sa.Column("options", postgresql.JSONB(), server_default="[]", nullable=False),
        sa.Column("correct_option_id", sa.String(length=10), nullable=True),
        sa.Column("target_number", sa.Float(), nullable=True),
        sa.Column("tolerance", sa.Float(), server_default="0.01", nullable=True),
        sa.Column("status", sa.String(length=20), server_default="active", nullable=False),
        sa.Column("time_limit_seconds", sa.Integer(), server_default="30", nullable=False),
        sa.Column("started_at_ms", sa.BigInteger(), nullable=False),
        sa.Column("closed_at_ms", sa.BigInteger(), nullable=True),
        sa.Column("stats", postgresql.JSONB(), nullable=True),
        sa.Column("ai_commentary", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_live_tasks_lesson_id", "live_tasks", ["lesson_id"])
    op.create_index("ix_live_tasks_status", "live_tasks", ["status"])

    # 2. Create live_task_responses table
    op.create_table(
        "live_task_responses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("live_tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("selected_option", sa.String(length=50), nullable=True),
        sa.Column("number_value", sa.Float(), nullable=True),
        sa.Column("is_correct", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("response_ms", sa.Integer(), server_default="0", nullable=False),
        sa.Column("ai_feedback", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_live_task_responses_task_id", "live_task_responses", ["task_id"])
    op.create_index("ix_live_task_responses_lesson_id", "live_task_responses", ["lesson_id"])
    op.create_index("ix_live_task_responses_user_id", "live_task_responses", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_live_task_responses_user_id", table_name="live_task_responses")
    op.drop_index("ix_live_task_responses_lesson_id", table_name="live_task_responses")
    op.drop_index("ix_live_task_responses_task_id", table_name="live_task_responses")
    op.drop_table("live_task_responses")

    op.drop_index("ix_live_tasks_status", table_name="live_tasks")
    op.drop_index("ix_live_tasks_lesson_id", table_name="live_tasks")
    op.drop_table("live_tasks")
