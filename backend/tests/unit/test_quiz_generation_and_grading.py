import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.ai.schemas import OpenQuestionGrading, QuizOutput, QuizQuestionItem
from app.models.quiz import Answer, Attempt, Quiz, QuizQuestion
from app.quiz.generation import _compute_trigrams, _trigram_similarity
from app.quiz.grading import grade_attempt
from app.quiz.report import _extract_all_numbers_from_dict


def test_trigram_similarity():
    s1 = _compute_trigrams("Что такое первый закон Ньютона?")
    s2 = _compute_trigrams("Что такое 1-й закон Ньютона?")
    s3 = _compute_trigrams("Какова формула фотосинтеза в биологии?")

    sim_high = _trigram_similarity(s1, s2)
    sim_low = _trigram_similarity(s1, s3)

    assert sim_high > 0.4
    assert sim_low < 0.2


def test_extract_numbers_from_dict():
    sample_stats = {
        "avg_score": 75.5,
        "completed_count": 12,
        "quartiles": {"q1": 60, "q2": 75.5, "q3": 90, "q4": 100},
        "topics": {"Механика": 80.0},
    }
    nums = _extract_all_numbers_from_dict(sample_stats)
    assert "75.5" in nums
    assert "12" in nums
    assert "60" in nums
    assert "80.0" in nums


@pytest.mark.asyncio
async def test_grade_attempt_auto_scoring():
    attempt_id = uuid.uuid4()
    quiz_id = uuid.uuid4()

    q_single_id = uuid.uuid4()
    q_single = QuizQuestion(
        id=q_single_id,
        quiz_id=quiz_id,
        position=1,
        type="single",
        text="2 + 2 = ?",
        options=["3", "4", "5", "6"],
        correct=[1],
        points=1.0,
    )

    q_multi_id = uuid.uuid4()
    q_multi = QuizQuestion(
        id=q_multi_id,
        quiz_id=quiz_id,
        position=2,
        type="multiple",
        text="Простые числа:",
        options=["2", "3", "4", "6"],
        correct=[0, 1],
        points=2.0,
    )

    attempt = Attempt(
        id=attempt_id,
        quiz_id=quiz_id,
        student_id=uuid.uuid4(),
        status="in_progress",
    )

    ans_single = Answer(
        attempt_id=attempt_id,
        question_id=q_single_id,
        value=1,  # Correct index
    )

    ans_multi = Answer(
        attempt_id=attempt_id,
        question_id=q_multi_id,
        value=[0, 1],  # Exact match
    )

    mock_db = AsyncMock()
    mock_db.get = AsyncMock(return_value=attempt)

    mock_q_res = MagicMock()
    mock_q_res.scalars.return_value.all.return_value = [q_single, q_multi]

    mock_a_res = MagicMock()
    mock_a_res.scalars.return_value.all.return_value = [ans_single, ans_multi]

    mock_db.execute = AsyncMock(side_effect=[mock_q_res, mock_a_res])
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    result = await grade_attempt(attempt_id, mock_db)
    assert result.score == 3.0
    assert result.max_score == 3.0
    assert result.status == "completed"
    assert ans_single.is_correct is True
    assert ans_multi.is_correct is True
