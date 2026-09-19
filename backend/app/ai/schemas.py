from typing import Literal
from pydantic import BaseModel, Field, field_validator


class AnnotationItem(BaseModel):
    id: int = Field(..., description="Consecutive integer starting from 1")
    type: Literal["box", "arrow", "highlight"] = Field(..., description="Type of visual indicator")
    box_2d: list[int] = Field(..., description="[ymin, xmin, ymax, xmax] normalized to 0-1000")
    point_2d: list[int] | None = Field(None, description="[y, x] normalized to 0-1000 for arrows")
    label: str = Field(..., max_length=60, description="Short label explaining the annotated element")

    @field_validator("box_2d")
    @classmethod
    def validate_box_coords(cls, v: list[int]) -> list[int]:
        if len(v) != 4:
            raise ValueError("box_2d must contain exactly 4 numbers [ymin, xmin, ymax, xmax]")
        ymin, xmin, ymax, xmax = v
        if not (0 <= ymin <= 1000 and 0 <= xmin <= 1000 and 0 <= ymax <= 1000 and 0 <= xmax <= 1000):
            raise ValueError("Coordinates must be in normalized 0-1000 range")
        if ymin >= ymax or xmin >= xmax:
            raise ValueError("ymin must be < ymax and xmin < xmax")
        return v


class FrameAnalysisOutput(BaseModel):
    keep: bool = Field(..., description="True if frame is informative and should be retained")
    informativeness: float = Field(..., ge=0.0, le=1.0, description="Score 0.0 to 1.0 of informational value")
    kind: Literal["slide", "board", "code", "diagram", "screen", "other"] = Field(...)
    title: str = Field(..., max_length=80, description="Concise title of the frame")
    ocr_markdown: str = Field(..., description="Text from the frame in Markdown, formulas in LaTeX ($...$)")
    description: str = Field(..., description="1-3 sentences: what is shown and why")
    annotations: list[AnnotationItem] = Field(default_factory=list, max_length=5)
    duplicate_of_previous: bool = Field(False)


class KeyTermItem(BaseModel):
    term: str = Field(..., min_length=1, max_length=100)
    definition: str = Field(..., min_length=1)


class CalloutItem(BaseModel):
    kind: Literal["tip", "warning", "example", "definition"]
    text: str = Field(..., min_length=1)


class FrameRefItem(BaseModel):
    frame_id: str = Field(..., description="UUID of the referenced frame")
    caption: str = Field("", description="Caption explaining why this frame is relevant")
    annotation_ids: list[int] = Field(default_factory=list, description="IDs of badges highlighted in body")


class NoteBlockOutput(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    summary: str = Field(..., description="1-2 sentences summarizing the block")
    body_md: str = Field(..., description="Main block markdown text, formulas in LaTeX")
    key_terms: list[KeyTermItem] = Field(default_factory=list)
    callouts: list[CalloutItem] = Field(default_factory=list)
    frame_refs: list[FrameRefItem] = Field(default_factory=list)
    uncertain: list[str] = Field(default_factory=list, description="Ambiguities in transcript or visuals")


class OutlineItem(BaseModel):
    position: int
    title: str


class FinalSummaryOutput(BaseModel):
    tldr: str = Field(..., description="3-5 sentences overarching summary of the entire lesson")
    outline: list[OutlineItem] = Field(default_factory=list)
    glossary: list[KeyTermItem] = Field(default_factory=list)
    takeaways: list[str] = Field(default_factory=list, description="5-8 key takeaways")
    homework: str | None = Field(None, description="Homework if announced in lesson, else None")


class QuizQuestionItem(BaseModel):
    type: Literal["single", "multiple", "open"]
    text: str = Field(..., min_length=5)
    options: list[str] = Field(default_factory=list)
    correct: list[int] = Field(default_factory=list)
    rubric: str | None = Field(None, description="Grading criteria for open questions (2-4 items)")
    explanation: str | None = Field(None, description="Explanation of why the answer is correct")
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    topic: str | None = None
    block_position: int = Field(..., description="NoteBlock position this question tests")
    points: float = Field(default=1.0, ge=0.5, le=5.0)


class QuizOutput(BaseModel):
    questions: list[QuizQuestionItem] = Field(..., min_length=1)


class OpenQuestionGrading(BaseModel):
    points: float = Field(..., ge=0.0)
    feedback: str = Field(..., min_length=3)


class ReportWeakTopic(BaseModel):
    topic: str
    evidence: str
    block_position: int | None = None
    advice: str


class ReportMisconception(BaseModel):
    question_position: int
    description: str


class ReportNarrative(BaseModel):
    overview: str = Field(..., description="3-5 sentences overall summary of cohort performance")
    weak_topics: list[ReportWeakTopic] = Field(default_factory=list)
    strong_topics: list[str] = Field(default_factory=list)
    common_misconceptions: list[ReportMisconception] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)

