from fastapi import APIRouter
from app.api.routes import events, health, lessons, quiz, reports, tasks

api_router = APIRouter(prefix="/v1")
api_router.include_router(lessons.router)
api_router.include_router(events.router)
api_router.include_router(quiz.router)
api_router.include_router(reports.router)
api_router.include_router(tasks.router)
