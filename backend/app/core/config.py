import json
from functools import lru_cache
from typing import Any, Literal
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    APP_NAME: str = "Fill AI Backend"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    CORS_ORIGINS: list[str] = ["*"]

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/fill_ai"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # S3 / MinIO
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_BUCKET: str = "lesson-media"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_REGION: str = "us-east-1"
    MEDIA_URL_MODE: Literal["signed", "proxy"] = "proxy"
    SIGNED_URL_EXPIRES_SECONDS: int = 21600  # 6 hours

    # LiveKit
    LIVEKIT_URL: str = "http://localhost:7880"
    LIVEKIT_API_KEY: str = "devkey"
    LIVEKIT_API_SECRET: str = "secret"

    # AI API Keys
    SONIOX_API_KEY: str = "dev_soniox_key"
    GROQ_API_KEY: str = "dev_groq_key"
    GEMINI_API_KEY: str = "dev_gemini_key"

    # AI Models
    VLM_MODEL: str = "gemini-3.5-flash-lite"
    VLM_ESCALATION_MODEL: str = "gemini-3.6-flash"
    LLM_MODEL: str = "gemini-3.6-flash"
    LLM_LIGHT_MODEL: str = "gemini-3.5-flash-lite"
    VLM_FALLBACK_MODEL: str | None = None
    LLM_FALLBACK_MODEL: str | None = None
    FALLBACK_BASE_URL: str | None = None
    FALLBACK_API_KEY: str | None = None
    MODEL_PRICES_JSON: str = "{}"

    # Auth & Security
    JWT_ISSUER: str = "fill-ai-auth"
    JWKS_URL: str | None = None
    JWT_SECRET: str = "dev-secret-fill-ai-backend-2026-super-secure"
    JWT_ALGORITHM: str = "HS256"
    SSE_TOKEN_EXPIRE_SECONDS: int = 300  # 5 minutes

    # Limits & Retention
    MAX_COST_USD_PER_LESSON: float = 3.0
    RAW_RETENTION_DAYS: int = 30
    MAX_UPLOAD_SIZE_BYTES: int = 4 * 1024 * 1024 * 1024  # 4 GB per Section 11 & 18.5
    MAX_UPLOAD_DURATION_SEC: int = 4 * 3600  # 4 hours
    ALLOWED_UPLOAD_EXTENSIONS: list[str] = ["mp4", "mkv", "webm", "mp3", "wav", "m4a", "mov"]

    # Frame Detection Thresholds (Раздел 7 ТЗ)
    FRAME_SAMPLE_FPS: int = 1
    CHANGE_DIFF_THRESHOLD: float = 0.04
    STABLE_DIFF_THRESHOLD: float = 0.01
    STABLE_SECONDS: float = 2.0
    MIN_LAPLACIAN_VAR: float = 60.0
    DEDUP_LAST_N: int = 8
    MIN_FRAME_GAP_SEC: float = 4.0
    MAX_FRAMES_PER_LESSON: int = 150
    MAX_FRAMES_PER_WINDOW: int = 6
    BOARD_ACCUMULATION_MIN_AREA: float = 0.03
    KEEP_THRESHOLD: float = 0.35

    # Window Management Thresholds (Раздел 8 ТЗ)
    WINDOW_TARGET_SEC: int = 240
    WINDOW_MIN_SEC: int = 120
    WINDOW_MAX_SEC: int = 360
    ENABLE_DIAGRAMS: bool = False

    # Quiz & Report Settings
    AT_RISK_THRESHOLD: float = 0.5
    REPORT_AUTO_REFRESH_HOURS: int = 24
    FILE_PROCESSING_CONCURRENCY: int = 4

    # Concurrency & Rate Limiting
    GEMINI_MAX_CONCURRENCY: int = 5
    SONIOX_MAX_STREAMS: int = 5
    RATE_LIMIT_PER_MINUTE: int = 60
    MAX_SSE_PER_USER: int = 5

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    @property
    def model_prices(self) -> dict[str, dict[str, float]]:
        try:
            return json.loads(self.MODEL_PRICES_JSON)
        except Exception:
            return {}


@lru_cache
def get_settings() -> Settings:
    return Settings()
