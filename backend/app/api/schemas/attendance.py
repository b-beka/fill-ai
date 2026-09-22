import uuid
from typing import Literal
from pydantic import BaseModel, Field


class HeartbeatRequest(BaseModel):
    student_id: uuid.UUID
    student_name: str = Field(min_length=1, max_length=255)
    timestamp_ms: int = Field(ge=0)
    is_tab_focused: bool = True
    interaction_type: str | None = None  # scroll | play_audio | task_answer | heartbeat


class HeartbeatResponse(BaseModel):
    status: str
    total_active_ms: int
    focus_score: float
    has_missed_blocks: bool
    missed_blocks_count: int


class MissedBlockInfo(BaseModel):
    id: str
    title: str
    t_start_ms: int
    t_end_ms: int
    duration_str: str
    reason: str  # disconnected | unfocused


class StudentAttendanceItem(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    student_name: str
    status: str  # active | idle | disconnected
    duration_minutes: float
    presence_percentage: float
    focus_score: float
    missed_blocks: list[MissedBlockInfo]
    tasks_answered: int
    tasks_correct: int
    tasks_accuracy: float
    catchup_sent: bool = False
    recommendation: str


class EngagementPulsePoint(BaseModel):
    minute: int
    active_students_count: int
    attention_percent: float
    is_drop_alert: bool = False


class LessonAttendanceReport(BaseModel):
    lesson_id: uuid.UUID
    lesson_title: str
    total_students_enrolled: int
    present_students_count: int
    average_presence_percent: float
    average_focus_score: float
    total_tasks_accuracy: float
    pulse: list[EngagementPulsePoint]
    students: list[StudentAttendanceItem]


class CatchupCardResponse(BaseModel):
    student_id: uuid.UUID
    student_name: str
    missed_topics_count: int
    bullet_points: list[str]
    estimated_read_minutes: int


class AttendanceExportResponse(BaseModel):
    format: Literal["whatsapp", "csv", "json"]
    content: str
