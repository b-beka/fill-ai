from datetime import datetime, timezone
from typing import Any
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import enforce_rate_limit, get_db, get_lesson_for_user
from app.api.schemas.quiz import (
    AttemptAnswerResponse,
    AttemptResponse,
    QuizQuestionResponse,
    QuizQuestionStudentResponse,
    QuizResponse,
    QuizStudentResponse,
    QuizUpdateRequest,
    SaveAnswersRequest,
)
from app.core.events import emit_persistent_event
from app.core.logging import get_logger
from app.core.security import CurrentUser, require_role
from app.models.lesson import Lesson
from app.models.quiz import Answer, Attempt, Quiz, QuizQuestion
from app.quiz.generation import generate_quiz_for_lesson
from app.quiz.grading import grade_attempt

router = APIRouter(tags=["quiz"])
logger = get_logger("routes.quiz")


@router.get(
    "/lessons/{lesson_id}/quiz",
    response_model=QuizResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def get_quiz_teacher(
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("teacher", "admin")),
) -> Any:
    """Returns the full quiz (with correct answers and rubrics) for teachers."""
    stmt = (
        select(Quiz)
        .where(Quiz.lesson_id == lesson.id)
        .order_by(Quiz.version.desc())
    )
    res = await db.execute(stmt)
    quiz = res.scalars().first()
    if not quiz:
        # If no quiz exists yet, auto-generate draft
        try:
            quiz = await generate_quiz_for_lesson(lesson.id, db)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "quiz_not_found", "message": f"Quiz not found: {str(e)}"},
            )

    # Fetch questions
    q_stmt = select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id).order_by(QuizQuestion.position.asc())
    q_res = await db.execute(q_stmt)
    questions = q_res.scalars().all()

    return QuizResponse(
        id=quiz.id,
        lesson_id=quiz.lesson_id,
        version=quiz.version,
        status=quiz.status,
        created_at=quiz.created_at,
        published_at=quiz.published_at,
        questions=[QuizQuestionResponse.model_validate(q) for q in questions],
    )


@router.put(
    "/lessons/{lesson_id}/quiz",
    response_model=QuizResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def update_quiz_draft(
    payload: QuizUpdateRequest,
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("teacher", "admin")),
) -> Any:
    """Updates questions of a draft quiz."""
    stmt = (
        select(Quiz)
        .where(Quiz.lesson_id == lesson.id)
        .order_by(Quiz.version.desc())
    )
    res = await db.execute(stmt)
    quiz = res.scalars().first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "quiz_not_found", "message": "Quiz not found"},
        )

    if quiz.status == "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "quiz_already_published", "message": "Cannot edit a published quiz directly"},
        )

    # Replace questions
    del_stmt = select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id)
    del_res = await db.execute(del_stmt)
    for old_q in del_res.scalars().all():
        await db.delete(old_q)
    await db.flush()

    new_questions = []
    for q_data in payload.questions:
        qq = QuizQuestion(
            id=uuid.uuid4(),
            quiz_id=quiz.id,
            position=q_data.position,
            type=q_data.type,
            text=q_data.text,
            options=q_data.options,
            correct=q_data.correct,
            rubric=q_data.rubric,
            explanation=q_data.explanation,
            difficulty=q_data.difficulty,
            topic=q_data.topic,
            points=q_data.points,
        )
        db.add(qq)
        new_questions.append(qq)

    await db.commit()
    await db.refresh(quiz)

    return QuizResponse(
        id=quiz.id,
        lesson_id=quiz.lesson_id,
        version=quiz.version,
        status=quiz.status,
        created_at=quiz.created_at,
        published_at=quiz.published_at,
        questions=[QuizQuestionResponse.model_validate(q) for q in new_questions],
    )


@router.post(
    "/lessons/{lesson_id}/quiz/publish",
    response_model=QuizResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def publish_quiz(
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("teacher", "admin")),
) -> Any:
    """Publishes the draft quiz and emits quiz.published event."""
    stmt = (
        select(Quiz)
        .where(Quiz.lesson_id == lesson.id)
        .order_by(Quiz.version.desc())
    )
    res = await db.execute(stmt)
    quiz = res.scalars().first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "quiz_not_found", "message": "Quiz not found"},
        )

    quiz.status = "published"
    quiz.published_at = datetime.now(timezone.utc)
    await db.flush()

    # Emit persistent quiz.published event (all users)
    await emit_persistent_event(
        session=db,
        lesson_id=lesson.id,
        event_type="quiz.published",
        data={"quiz_id": str(quiz.id)},
        publish_to_redis_now=True,
    )

    await db.commit()
    await db.refresh(quiz)

    q_stmt = select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id).order_by(QuizQuestion.position.asc())
    q_res = await db.execute(q_stmt)
    questions = q_res.scalars().all()

    logger.info("quiz_published", quiz_id=str(quiz.id), lesson_id=str(lesson.id))
    return QuizResponse(
        id=quiz.id,
        lesson_id=quiz.lesson_id,
        version=quiz.version,
        status=quiz.status,
        created_at=quiz.created_at,
        published_at=quiz.published_at,
        questions=[QuizQuestionResponse.model_validate(q) for q in questions],
    )


@router.post(
    "/lessons/{lesson_id}/quiz/regenerate",
    response_model=QuizResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def regenerate_quiz(
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("teacher", "admin")),
) -> Any:
    """Regenerates the draft quiz."""
    quiz = await generate_quiz_for_lesson(lesson.id, db)
    q_stmt = select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id).order_by(QuizQuestion.position.asc())
    q_res = await db.execute(q_stmt)
    questions = q_res.scalars().all()

    return QuizResponse(
        id=quiz.id,
        lesson_id=quiz.lesson_id,
        version=quiz.version,
        status=quiz.status,
        created_at=quiz.created_at,
        published_at=quiz.published_at,
        questions=[QuizQuestionResponse.model_validate(q) for q in questions],
    )


@router.get(
    "/lessons/{lesson_id}/quiz/student",
    response_model=QuizStudentResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def get_quiz_student(
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("student", "teacher", "admin")),
) -> Any:
    """Returns published quiz for students without answers, explanations, or rubrics."""
    stmt = (
        select(Quiz)
        .where(Quiz.lesson_id == lesson.id, Quiz.status == "published")
        .order_by(Quiz.version.desc())
    )
    res = await db.execute(stmt)
    quiz = res.scalars().first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "quiz_not_published", "message": "Quiz is not published yet"},
        )

    q_stmt = select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id).order_by(QuizQuestion.position.asc())
    q_res = await db.execute(q_stmt)
    questions = q_res.scalars().all()

    return QuizStudentResponse(
        id=quiz.id,
        lesson_id=quiz.lesson_id,
        version=quiz.version,
        status=quiz.status,
        questions=[
            QuizQuestionStudentResponse(
                id=q.id,
                position=q.position,
                type=q.type,
                text=q.text,
                options=q.options,
                points=q.points,
            )
            for q in questions
        ],
    )


@router.post(
    "/quiz/{quiz_id}/attempts",
    response_model=AttemptResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def start_quiz_attempt(
    quiz_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("student", "teacher", "admin")),
) -> Any:
    """Starts an attempt on a quiz (enforcing one attempt per student)."""
    quiz = await db.get(Quiz, quiz_id)
    if not quiz or quiz.status != "published":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "quiz_not_found_or_not_published", "message": "Quiz is not available for attempts"},
        )

    # Check lesson org isolation
    lesson = await db.get(Lesson, quiz.lesson_id)
    if not lesson or lesson.org_id != user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "forbidden_org", "message": "Access denied to quiz from different organization"},
        )

    # Check existing attempt
    stmt = select(Attempt).where(Attempt.quiz_id == quiz_id, Attempt.student_id == user.user_id)
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()
    if existing:
        return AttemptResponse.model_validate(existing)

    attempt_id = uuid.uuid4()
    attempt = Attempt(
        id=attempt_id,
        quiz_id=quiz_id,
        student_id=user.user_id,
        status="in_progress",
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    logger.info("quiz_attempt_started", attempt_id=str(attempt_id), student_id=str(user.user_id))
    return AttemptResponse.model_validate(attempt)


@router.put(
    "/attempts/{attempt_id}/answers",
    dependencies=[Depends(enforce_rate_limit)],
)
async def save_attempt_answers(
    attempt_id: uuid.UUID,
    payload: SaveAnswersRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("student", "teacher", "admin")),
) -> Any:
    """Idempotently saves student answers during an active attempt."""
    attempt = await db.get(Attempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "attempt_not_found", "message": "Attempt not found"})

    if attempt.student_id != user.user_id and user.role not in ("teacher", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"code": "forbidden", "message": "Cannot modify another student's attempt"})

    if attempt.status == "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"code": "attempt_already_submitted", "message": "Cannot modify answers of a completed attempt"})

    for item in payload.answers:
        stmt = select(Answer).where(Answer.attempt_id == attempt_id, Answer.question_id == item.question_id)
        res = await db.execute(stmt)
        ans = res.scalar_one_or_none()
        if not ans:
            ans = Answer(attempt_id=attempt_id, question_id=item.question_id, value=item.value)
            db.add(ans)
        else:
            ans.value = item.value

    await db.commit()
    return {"status": "saved", "count": len(payload.answers)}


@router.post(
    "/attempts/{attempt_id}/submit",
    response_model=AttemptResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def submit_quiz_attempt(
    attempt_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("student", "teacher", "admin")),
) -> Any:
    """Submits and grades an attempt."""
    attempt = await db.get(Attempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "attempt_not_found", "message": "Attempt not found"})

    if attempt.student_id != user.user_id and user.role not in ("teacher", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"code": "forbidden", "message": "Cannot submit another student's attempt"})

    if attempt.status == "completed":
        # Already graded
        a_stmt = select(Answer).where(Answer.attempt_id == attempt_id)
        a_res = await db.execute(a_stmt)
        answers = a_res.scalars().all()
        return AttemptResponse(
            id=attempt.id,
            quiz_id=attempt.quiz_id,
            student_id=attempt.student_id,
            started_at=attempt.started_at,
            submitted_at=attempt.submitted_at,
            score=attempt.score,
            max_score=attempt.max_score,
            status=attempt.status,
            answers=[AttemptAnswerResponse.model_validate(a) for a in answers],
        )

    graded = await grade_attempt(attempt_id=attempt_id, db=db)

    a_stmt = select(Answer).where(Answer.attempt_id == attempt_id)
    a_res = await db.execute(a_stmt)
    answers = a_res.scalars().all()

    return AttemptResponse(
        id=graded.id,
        quiz_id=graded.quiz_id,
        student_id=graded.student_id,
        started_at=graded.started_at,
        submitted_at=graded.submitted_at,
        score=graded.score,
        max_score=graded.max_score,
        status=graded.status,
        answers=[AttemptAnswerResponse.model_validate(a) for a in answers],
    )


@router.get(
    "/attempts/{attempt_id}",
    response_model=AttemptResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def get_quiz_attempt(
    attempt_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("student", "teacher", "admin")),
) -> Any:
    """Retrieves an attempt and its graded answers."""
    attempt = await db.get(Attempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "attempt_not_found", "message": "Attempt not found"})

    if attempt.student_id != user.user_id and user.role not in ("teacher", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"code": "forbidden", "message": "Cannot view another student's attempt"})

    a_stmt = select(Answer).where(Answer.attempt_id == attempt_id)
    a_res = await db.execute(a_stmt)
    answers = a_res.scalars().all()

    return AttemptResponse(
        id=attempt.id,
        quiz_id=attempt.quiz_id,
        student_id=attempt.student_id,
        started_at=attempt.started_at,
        submitted_at=attempt.submitted_at,
        score=attempt.score,
        max_score=attempt.max_score,
        status=attempt.status,
        answers=[AttemptAnswerResponse.model_validate(a) for a in answers],
    )
