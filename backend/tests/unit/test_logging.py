from app.core.logging import filter_sensitive_lesson_content


def test_redact_lesson_content_at_info_level():
    event_dict = {
        "level": "info",
        "lesson_id": "12345",
        "text": "Секретный текст урока преподавателя",
        "transcript": "Полная расшифровка речи",
        "ocr_markdown": "# Доска с формулами",
        "answer": "Ответ ученика",
        "metric_latency_ms": 120,
    }

    filtered = filter_sensitive_lesson_content(None, "info", event_dict)

    assert filtered["lesson_id"] == "12345"
    assert filtered["metric_latency_ms"] == 120
    assert filtered["text"] == "[REDACTED_CONTENT]"
    assert filtered["transcript"] == "[REDACTED_CONTENT]"
    assert filtered["ocr_markdown"] == "[REDACTED_CONTENT]"
    assert filtered["answer"] == "[REDACTED_CONTENT]"
