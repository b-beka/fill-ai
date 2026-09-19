from prometheus_client import Counter, Gauge, Histogram

# HTTP Metrics
HTTP_REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests received",
    ["method", "endpoint", "status_code"],
)
HTTP_REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["endpoint"],
)

# AI Provider Metrics
AI_CALL_DURATION = Histogram(
    "ai_call_duration_seconds",
    "Latency of AI calls by task, provider, and model",
    ["task", "provider", "model"],
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 30.0, 60.0, 120.0],
)
AI_CALL_ERRORS = Counter(
    "ai_call_errors_total",
    "Total AI provider errors",
    ["task", "provider", "model", "error_type"],
)

# Active Resources
ACTIVE_LESSONS = Gauge(
    "active_lessons_total",
    "Number of currently active lessons by source",
    ["source"],
)
ACTIVE_SSE_CONNECTIONS = Gauge(
    "active_sse_connections_total",
    "Number of active SSE streaming connections",
)

# Queues and Dead Letter
STREAM_QUEUE_LENGTH = Gauge(
    "redis_stream_length",
    "Current length of Redis stream",
    ["stream"],
)
STREAM_CONSUMER_LAG = Gauge(
    "redis_stream_lag_seconds",
    "Lag of consumer groups in seconds",
    ["stream", "group"],
)
DLQ_MESSAGES = Counter(
    "dlq_messages_total",
    "Total messages routed to DLQ",
    ["stream"],
)

# SLO Histograms (Section 15.1 of TZ)
SLO_TRANSCRIPT_LATENCY = Histogram(
    "slo_transcript_latency_seconds",
    "Latency of transcript.partial delivery (target <= 2.5s)",
    buckets=[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 5.0, 10.0],
)
SLO_FRAME_LATENCY = Histogram(
    "slo_frame_latency_seconds",
    "Latency of frame.selected from stabilization (target <= 12s)",
    buckets=[2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 15.0, 20.0, 30.0],
)
SLO_BLOCK_LATENCY = Histogram(
    "slo_block_latency_seconds",
    "Latency of note.block.created from window close (target <= 30s)",
    buckets=[5.0, 10.0, 15.0, 20.0, 25.0, 30.0, 45.0, 60.0, 90.0],
)
SLO_SUMMARY_LATENCY = Histogram(
    "slo_summary_latency_seconds",
    "Latency of summary.ready from lesson end (target <= 90s)",
    buckets=[15.0, 30.0, 45.0, 60.0, 75.0, 90.0, 120.0, 180.0],
)
SLO_QUIZ_LATENCY = Histogram(
    "slo_quiz_latency_seconds",
    "Latency of quiz.ready from lesson end (target <= 150s)",
    buckets=[30.0, 60.0, 90.0, 120.0, 150.0, 180.0, 240.0],
)
