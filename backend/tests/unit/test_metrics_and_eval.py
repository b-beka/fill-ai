import pytest
from app.core.metrics import (
    AI_CALL_DURATION,
    AI_CALL_ERRORS,
    SLO_FRAME_LATENCY,
    SLO_TRANSCRIPT_LATENCY,
)
from scripts.eval_asr import calculate_cer, calculate_wer


def test_calculate_wer_and_cer():
    ref = "Первый закон термодинамики"
    hyp_exact = "Первый закон термодинамики"
    hyp_err = "Первый закон механики"

    assert calculate_wer(ref, hyp_exact) == 0.0
    assert calculate_cer(ref, hyp_exact) == 0.0

    wer_err = calculate_wer(ref, hyp_err)
    assert 0.3 < wer_err < 0.4  # 1 out of 3 words changed

    cer_err = calculate_cer(ref, hyp_err)
    assert cer_err > 0.1


def test_prometheus_metrics_recording():
    # Verify histograms and counters accept observations without errors
    AI_CALL_DURATION.labels(task="frame_analysis", provider="gemini", model="gemini-3.5-flash-lite").observe(1.25)
    AI_CALL_ERRORS.labels(task="frame_analysis", provider="gemini", model="gemini-3.5-flash-lite", error_type="timeout").inc()
    SLO_TRANSCRIPT_LATENCY.observe(1.8)
    SLO_FRAME_LATENCY.observe(7.4)
