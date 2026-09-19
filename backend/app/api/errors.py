from typing import Any
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ProblemDetail(BaseModel):
    type: str = "about:blank"
    title: str
    status: int
    detail: str | None = None
    instance: str | None = None
    code: str | None = None
    invalid_params: list[dict[str, Any]] | None = None


def create_problem_response(
    status_code: int,
    title: str,
    detail: str | None = None,
    instance: str | None = None,
    code: str | None = None,
    invalid_params: list[dict[str, Any]] | None = None,
) -> JSONResponse:
    content = ProblemDetail(
        type=f"urn:fill-ai:error:{code}" if code else "about:blank",
        title=title,
        status=status_code,
        detail=detail,
        instance=instance,
        code=code,
        invalid_params=invalid_params,
    ).model_dump(exclude_none=True)

    return JSONResponse(
        status_code=status_code,
        content=content,
        media_type="application/problem+json",
    )


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        detail_msg = exc.detail
        code = None
        if isinstance(exc.detail, dict):
            code = exc.detail.get("code")
            detail_msg = exc.detail.get("message", str(exc.detail))

        return create_problem_response(
            status_code=exc.status_code,
            title="HTTP Exception",
            detail=str(detail_msg),
            instance=str(request.url.path),
            code=code,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        invalid_params = []
        for error in exc.errors():
            invalid_params.append({
                "loc": [str(x) for x in error.get("loc", [])],
                "msg": error.get("msg", ""),
                "type": error.get("type", ""),
            })

        return create_problem_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            title="Validation Error",
            detail="Request parameters failed validation.",
            instance=str(request.url.path),
            code="validation_error",
            invalid_params=invalid_params,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        return create_problem_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            title="Internal Server Error",
            detail="An unexpected error occurred processing your request.",
            instance=str(request.url.path),
            code="internal_server_error",
        )
