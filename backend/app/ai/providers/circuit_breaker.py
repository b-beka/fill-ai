import time
from app.core.logging import get_logger

logger = get_logger("ai.circuit_breaker")


class CircuitBreakerOpenException(Exception):
    """Raised when circuit breaker is OPEN and calls are fast-failed."""
    pass


class CircuitBreaker:
    """
    Tracks failure count for external providers.
    Trips to OPEN state after max_failures consecutive errors, and stays OPEN for reset_timeout_seconds.
    Section 4.3 of TZ: after 5 consecutive errors, opens for 30s.
    """

    def __init__(self, provider_name: str, max_failures: int = 5, reset_timeout_seconds: float = 30.0):
        self.provider_name = provider_name
        self.max_failures = max_failures
        self.reset_timeout_seconds = reset_timeout_seconds
        self.failure_count = 0
        self.last_failure_time = 0.0
        self.state = "CLOSED"  # "CLOSED" | "OPEN"

    def is_available(self) -> bool:
        if self.state == "OPEN":
            now = time.time()
            if now - self.last_failure_time >= self.reset_timeout_seconds:
                # Half-open trial
                logger.info("circuit_breaker_half_open", provider=self.provider_name)
                return True
            return False
        return True

    def record_success(self) -> None:
        if self.failure_count > 0 or self.state == "OPEN":
            logger.info("circuit_breaker_reset_closed", provider=self.provider_name)
        self.failure_count = 0
        self.state = "CLOSED"

    def record_failure(self) -> None:
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.max_failures:
            self.state = "OPEN"
            logger.warning(
                "circuit_breaker_opened",
                provider=self.provider_name,
                failures=self.failure_count,
                cooldown_sec=self.reset_timeout_seconds,
            )
