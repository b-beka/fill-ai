from app.ai.providers.circuit_breaker import CircuitBreaker


def test_circuit_breaker_tripping():
    cb = CircuitBreaker("test_provider", max_failures=3, reset_timeout_seconds=5.0)

    assert cb.is_available() is True

    # 2 failures -> still closed
    cb.record_failure()
    cb.record_failure()
    assert cb.is_available() is True

    # 3rd failure -> trips OPEN
    cb.record_failure()
    assert cb.is_available() is False
    assert cb.state == "OPEN"

    # Record success resets
    cb.record_success()
    assert cb.is_available() is True
    assert cb.state == "CLOSED"
