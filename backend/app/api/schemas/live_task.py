from datetime import datetime
from typing import Any, Literal
import uuid
from pydantic import BaseModel, Field


class TaskOptionRequest(BaseModel):
    id: str = Field(..., description="A, B, C, D")
    text: str = Field(..., description="Option content or formula")
    is_correct: bool = Field(False, description="True if correct")
    explanation: str = Field("", description="Feedback to display")


class CreateLiveTaskRequest(BaseModel):
    question: str = Field(..., min_length=1)
    kind: Literal["single_choice", "multiple_choice", "number", "poll"] = "single_choice"
    options: list[TaskOptionRequest] = Field(default_factory=list)
    correct_option_id: str | None = None
    target_number: float | None = None
    tolerance: float | None = 0.01
    time_limit_seconds: int = Field(30, ge=10, le=300)


class StudentTaskResponseRequest(BaseModel):
    selected_option: str | None = None
    number_value: float | None = None
    response_ms: int = Field(0, ge=0)


class StudentTaskResponseResult(BaseModel):
    is_correct: bool
    feedback: str
    selected_option: str | None = None


class LiveTaskStudentView(BaseModel):
    id: uuid.UUID
    lesson_id: uuid.UUID
    question: str
    kind: str
    options: list[dict[str, Any]]  # id, text (sanitized without is_correct/explanation)
    time_limit_seconds: int
    started_at_ms: int
    status: str

    model_config = {"from_attributes": True}


class LiveTaskTeacherView(BaseModel):
    id: uuid.UUID
    lesson_id: uuid.UUID
    question: str
    kind: str
    options: list[dict[str, Any]]
    correct_option_id: str | None = None
    target_number: float | None = None
    time_limit_seconds: int
    started_at_ms: int
    closed_at_ms: int | None = None
    status: str
    stats: dict[str, Any] | None = None
    ai_commentary: str | None = None

    model_config = {"from_attributes": True}
