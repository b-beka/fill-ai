from datetime import datetime
from typing import Any, Literal
import uuid
from pydantic import BaseModel, Field


class QuizQuestionResponse(BaseModel):
    id: uuid.UUID
    position: int
    type: Literal["single", "multiple", "open"]
    text: str
    options: list[str] | None = None
    correct: list[int] | None = None
    rubric: str | None = None
    explanation: str | None = None
    difficulty: str | None = None
    topic: str | None = None
    points: float

    model_config = {"from_attributes": True}


class QuizQuestionStudentResponse(BaseModel):
    id: uuid.UUID
    position: int
    type: Literal["single", "multiple", "open"]
    text: str
    options: list[str] | None = None
    points: float

    model_config = {"from_attributes": True}


class QuizResponse(BaseModel):
    id: uuid.UUID
    lesson_id: uuid.UUID
    version: int
    status: str
    created_at: datetime
    published_at: datetime | None = None
    questions: list[QuizQuestionResponse] = []

    model_config = {"from_attributes": True}


class QuizStudentResponse(BaseModel):
    id: uuid.UUID
    lesson_id: uuid.UUID
    version: int
    status: str
    questions: list[QuizQuestionStudentResponse] = []

    model_config = {"from_attributes": True}


class QuizQuestionUpdate(BaseModel):
    id: uuid.UUID | None = None
    position: int
    type: Literal["single", "multiple", "open"]
    text: str
    options: list[str] = Field(default_factory=list)
    correct: list[int] = Field(default_factory=list)
    rubric: str | None = None
    explanation: str | None = None
    difficulty: str | None = None
    topic: str | None = None
    points: float = 1.0


class QuizUpdateRequest(BaseModel):
    questions: list[QuizQuestionUpdate]


class AnswerSubmission(BaseModel):
    question_id: uuid.UUID
    value: Any


class SaveAnswersRequest(BaseModel):
    answers: list[AnswerSubmission]


class AttemptAnswerResponse(BaseModel):
    question_id: uuid.UUID
    value: Any
    is_correct: bool | None = None
    points: float | None = None
    feedback: str | None = None
    graded_by: str | None = None


class AttemptResponse(BaseModel):
    id: uuid.UUID
    quiz_id: uuid.UUID
    student_id: uuid.UUID
    started_at: datetime
    submitted_at: datetime | None = None
    score: float | None = None
    max_score: float | None = None
    status: str
    answers: list[AttemptAnswerResponse] = []

    model_config = {"from_attributes": True}


class ReportResponse(BaseModel):
    id: uuid.UUID
    lesson_id: uuid.UUID
    quiz_id: uuid.UUID
    stats: dict[str, Any]
    narrative: dict[str, Any] | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
