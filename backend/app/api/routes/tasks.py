import time
from typing import Any
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis
from app.api.deps import enforce_rate_limit, get_db, get_lesson_for_user, get_redis
from app.api.schemas.live_task import (
    CreateLiveTaskRequest,
    LiveTaskStudentView,
    LiveTaskTeacherView,
    StudentTaskResponseRequest,
    StudentTaskResponseResult,
)
from app.ai.providers.gemini import GeminiProvider
from app.ai.tasks.extractor import generate_teacher_diagnostic
from app.core.events import emit_ephemeral_event, emit_persistent_event
from app.core.logging import get_logger
from app.core.security import CurrentUser, get_current_user, require_role
from app.models.lesson import Lesson
from app.models.live_task import LiveTask, LiveTaskResponse

router = APIRouter(prefix="/lessons", tags=["tasks"])
logger = get_logger("routes.tasks")


@router.post(
    "/{lesson_id}/tasks",
    response_model=LiveTaskTeacherView,
    dependencies=[Depends(enforce_rate_limit)],
)
async def create_live_task(
    req: CreateLiveTaskRequest,
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("teacher", "admin")),
) -> Any:
    """Manually launches an interactive live task in the lesson."""
    now_ms = int(time.time() * 1000)
    task = LiveTask(
        id=uuid.uuid4(),
        lesson_id=lesson.id,
        question=req.question,
        kind=req.kind,
        options=[o.model_dump() for o in req.options],
        correct_option_id=req.correct_option_id,
        target_number=req.target_number,
        tolerance=req.tolerance,
        status="active",
        time_limit_seconds=req.time_limit_seconds,
        started_at_ms=now_ms,
    )
    db.add(task)
    await db.flush()

    # Emit task.published persistent event
    student_options = [{"id": o.get("id"), "text": o.get("text")} for o in task.options]
    await emit_persistent_event(
        session=db,
        lesson_id=lesson.id,
        event_type="task.published",
        data={
            "task_id": str(task.id),
            "question": task.question,
            "kind": task.kind,
            "options": student_options,
            "time_limit_seconds": task.time_limit_seconds,
            "started_at_ms": task.started_at_ms,
        },
        publish_to_redis_now=True,
    )

    await db.commit()
    await db.refresh(task)
    return task


@router.get(
    "/{lesson_id}/tasks/active",
    dependencies=[Depends(enforce_rate_limit)],
)
async def get_active_live_task(
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> Any:
    """Returns currently active task for the lesson, sanitizing correct answers for students."""
    stmt = select(LiveTask).where(
        LiveTask.lesson_id == lesson.id,
        LiveTask.status == "active",
    ).order_by(LiveTask.started_at_ms.desc()).limit(1)

    res = await db.execute(stmt)
    task = res.scalar_one_or_none()
    if not task:
        return None

    if user.role == "student":
        student_options = [{"id": o.get("id"), "text": o.get("text")} for o in task.options]
        return LiveTaskStudentView(
            id=task.id,
            lesson_id=task.lesson_id,
            question=task.question,
            kind=task.kind,
            options=student_options,
            time_limit_seconds=task.time_limit_seconds,
            started_at_ms=task.started_at_ms,
            status=task.status,
        )

    return LiveTaskTeacherView.model_validate(task)


@router.get(
    "/{lesson_id}/tasks",
    response_model=list[LiveTaskTeacherView],
    dependencies=[Depends(enforce_rate_limit)],
)
async def get_lesson_tasks(
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> Any:
    """Returns history of all live tasks in the lesson."""
    stmt = select(LiveTask).where(LiveTask.lesson_id == lesson.id).order_by(LiveTask.started_at_ms.asc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post(
    "/{lesson_id}/tasks/{task_id}/response",
    response_model=StudentTaskResponseResult,
    dependencies=[Depends(enforce_rate_limit)],
)
async def submit_task_response(
    task_id: uuid.UUID,
    req: StudentTaskResponseRequest,
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    user: CurrentUser = Depends(get_current_user),
) -> Any:
    """Fast-Path student answer submission with 0ms Redis counters and instant feedback."""
    task = await db.get(LiveTask, task_id)
    if not task or task.lesson_id != lesson.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "task_not_found", "message": "Live task not found"},
        )

    if task.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "task_not_active", "message": "Task is already closed"},
        )

    # 1. Determine correctness and find option explanation
    is_correct = False
    feedback = "Ответ принят."
    matched_option = None

    if task.kind == "single_choice" or task.kind == "poll":
        for opt in task.options:
            if opt.get("id") == req.selected_option:
                matched_option = opt
                is_correct = bool(opt.get("is_correct", False))
                feedback = opt.get("explanation") or ("Верно!" if is_correct else "Неверно.")
                break
    elif task.kind == "number" and req.number_value is not None:
        if task.target_number is not None:
            tol = task.tolerance or 0.01
            is_correct = abs(req.number_value - task.target_number) <= tol
            feedback = f"Верно! Ответ: {task.target_number}." if is_correct else f"Не сошлось. Правильный ответ: {task.target_number}."

    # 2. Redis Fast-Path aggregation
    voters_key = f"task:{task.id}:voters"
    counts_key = f"task:{task.id}:counts"
    user_str = str(user.user_id)
    vote_val = req.selected_option or str(req.number_value)

    # Check if student already voted
    prev_vote = await redis.hget(voters_key, user_str)
    if prev_vote:
        # Decrement previous vote
        await redis.hincrby(counts_key, prev_vote, -1)

    await redis.hset(voters_key, user_str, vote_val)
    await redis.hincrby(counts_key, vote_val, 1)

    # Record / update in PostgreSQL
    resp_stmt = select(LiveTaskResponse).where(
        LiveTaskResponse.task_id == task.id,
        LiveTaskResponse.user_id == user.user_id,
    )
    r_res = await db.execute(resp_stmt)
    existing_resp = r_res.scalar_one_or_none()

    if existing_resp:
        existing_resp.selected_option = req.selected_option
        existing_resp.number_value = req.number_value
        existing_resp.is_correct = is_correct
        existing_resp.response_ms = req.response_ms
        existing_resp.ai_feedback = feedback
    else:
        new_resp = LiveTaskResponse(
            id=uuid.uuid4(),
            task_id=task.id,
            lesson_id=lesson.id,
            user_id=user.user_id,
            selected_option=req.selected_option,
            number_value=req.number_value,
            is_correct=is_correct,
            response_ms=req.response_ms,
            ai_feedback=feedback,
        )
        db.add(new_resp)

    await db.commit()

    # Emit ephemeral task.results progress for teacher
    raw_counts = await redis.hgetall(counts_key)
    parsed_counts = {k: int(v) for k, v in raw_counts.items() if int(v) > 0}
    total_responses = sum(parsed_counts.values())

    await emit_ephemeral_event(
        lesson_id=lesson.id,
        event_type="task.results",
        data={
            "task_id": str(task.id),
            "counts": parsed_counts,
            "total": total_responses,
        },
    )

    return StudentTaskResponseResult(
        is_correct=is_correct,
        feedback=feedback,
        selected_option=req.selected_option,
    )


@router.post(
    "/{lesson_id}/tasks/{task_id}/close",
    response_model=LiveTaskTeacherView,
    dependencies=[Depends(enforce_rate_limit)],
)
async def close_live_task(
    task_id: uuid.UUID,
    lesson: Lesson = Depends(get_lesson_for_user),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    user: CurrentUser = Depends(require_role("teacher", "admin")),
) -> Any:
    """Closes task, computes class statistics, and synthesizes teacher diagnostic insight."""
    task = await db.get(LiveTask, task_id)
    if not task or task.lesson_id != lesson.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "task_not_found", "message": "Live task not found"},
        )

    task.status = "revealed"
    task.closed_at_ms = int(time.time() * 1000)

    # 1. Gather final stats from Redis
    counts_key = f"task:{task.id}:counts"
    raw_counts = await redis.hgetall(counts_key)
    parsed_counts = {k: int(v) for k, v in raw_counts.items() if int(v) > 0}
    total = sum(parsed_counts.values())

    correct_votes = 0
    if task.correct_option_id and task.correct_option_id in parsed_counts:
        correct_votes = parsed_counts[task.correct_option_id]

    accuracy = round(correct_votes / total, 3) if total > 0 else 0.0
    task.stats = {
        "counts": parsed_counts,
        "total": total,
        "accuracy": accuracy,
    }

    # 2. Generate teacher diagnostic commentary via LLM
    try:
        provider = GeminiProvider()
        diagnostic = await generate_teacher_diagnostic(
            question=task.question,
            stats=task.stats,
            options=task.options,
            provider=provider,
            lesson_id=lesson.id,
        )
        task.ai_commentary = diagnostic
    except Exception as e:
        logger.warning("close_task_diagnostic_failed", error=str(e))
        task.ai_commentary = f"Ответило {total} учеников, точность: {round(accuracy * 100)}%."

    await db.flush()

    # 3. Emit persistent event task.revealed
    await emit_persistent_event(
        session=db,
        lesson_id=lesson.id,
        event_type="task.revealed",
        data={
            "task_id": str(task.id),
            "question": task.question,
            "correct_option_id": task.correct_option_id,
            "target_number": task.target_number,
            "stats": task.stats,
            "ai_commentary": task.ai_commentary,
            "options": task.options,
        },
        publish_to_redis_now=True,
    )

    await db.commit()
    await db.refresh(task)
    return task
