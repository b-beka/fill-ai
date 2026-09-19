import json
from pathlib import Path
import pytest
from app.main import app


def test_openapi_schema_completeness():
    schema = app.openapi()
    paths = schema.get("paths", {})

    required_endpoints = [
        "/healthz",
        "/readyz",
        "/metrics",
        "/v1/lessons",
        "/v1/lessons/{lesson_id}",
        "/v1/lessons/{lesson_id}/start",
        "/v1/lessons/{lesson_id}/end",
        "/v1/lessons/{lesson_id}/upload-url",
        "/v1/lessons/{lesson_id}/process",
        "/v1/lessons/{lesson_id}/state",
        "/v1/lessons/{lesson_id}/events",
        "/v1/lessons/{lesson_id}/sse-token",
        "/v1/lessons/{lesson_id}/blocks/{block_id}",
        "/v1/lessons/{lesson_id}/export",
        "/v1/lessons/{lesson_id}/quiz",
        "/v1/lessons/{lesson_id}/quiz/publish",
        "/v1/lessons/{lesson_id}/quiz/regenerate",
        "/v1/lessons/{lesson_id}/quiz/student",
        "/v1/quiz/{quiz_id}/attempts",
        "/v1/attempts/{attempt_id}/answers",
        "/v1/attempts/{attempt_id}/submit",
        "/v1/attempts/{attempt_id}",
        "/v1/lessons/{lesson_id}/report",
        "/v1/lessons/{lesson_id}/report/regenerate",
    ]

    for ep in required_endpoints:
        assert ep in paths, f"Endpoint {ep} missing from OpenAPI schema"


def test_openapi_file_exists_and_valid():
    openapi_file = Path(__file__).parent.parent.parent / "docs" / "openapi.json"
    assert openapi_file.exists(), "docs/openapi.json does not exist"

    with open(openapi_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data["info"]["title"] == "Fill AI Backend"
    assert "paths" in data
