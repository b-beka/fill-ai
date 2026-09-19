from typing import Any
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import enforce_rate_limit, get_db, get_lesson_for_user
from app.api.schemas.quiz import ReportResponse
from app.core.logging import get_logger
from app.core.security import CurrentUser, require_role
from app.models.lesson import Lesson
from app.models.quiz import Quiz
from app.models.report import Report
from app.quiz.report import generate_lesson_report

router = APIRouter(tags=["reports"])
logger = get_logger("routes.reports")


@router.get(
    "/lessons/{lesson_id}/report",
    response_model=ReportResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def get_lesson_report(
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("teacher", "admin")),
) -> Any:
    """Returns analytical report on student performance for the lesson."""
    # Find latest published quiz for lesson
    q_stmt = (
        select(Quiz)
        .where(Quiz.lesson_id == lesson.id)
        .order_by(Quiz.version.desc())
    )
    q_res = await db.execute(q_stmt)
    quiz = q_res.scalars().first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "quiz_not_found", "message": "No quiz exists for this lesson"},
        )

    r_stmt = select(Report).where(Report.lesson_id == lesson.id, Report.quiz_id == quiz.id)
    r_res = await db.execute(r_stmt)
    report = r_res.scalar_one_or_none()

    if not report:
        report = await generate_lesson_report(lesson_id=lesson.id, quiz_id=quiz.id, db=db)

    return ReportResponse.model_validate(report)


@router.post(
    "/lessons/{lesson_id}/report/regenerate",
    response_model=ReportResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def regenerate_lesson_report(
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("teacher", "admin")),
) -> Any:
    """Recalculates student analytics and re-generates narrative report."""
    q_stmt = (
        select(Quiz)
        .where(Quiz.lesson_id == lesson.id)
        .order_by(Quiz.version.desc())
    )
    q_res = await db.execute(q_stmt)
    quiz = q_res.scalars().first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "quiz_not_found", "message": "No quiz exists for this lesson"},
        )

    report = await generate_lesson_report(lesson_id=lesson.id, quiz_id=quiz.id, db=db)
    return ReportResponse.model_validate(report)
