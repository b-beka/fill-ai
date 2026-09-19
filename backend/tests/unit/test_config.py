from app.core.config import Settings


def test_settings_defaults():
    settings = Settings(
        DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/db",
        JWT_SECRET="secret",
    )
    assert settings.APP_NAME == "Fill AI Backend"
    assert settings.FRAME_SAMPLE_FPS == 1
    assert settings.CHANGE_DIFF_THRESHOLD == 0.04
    assert settings.STABLE_SECONDS == 2.0
    assert settings.MAX_COST_USD_PER_LESSON == 3.0
    assert settings.WINDOW_TARGET_SEC == 240
    assert settings.WINDOW_MAX_SEC == 360
    assert settings.VLM_MODEL == "gemini-3.5-flash-lite"
    assert settings.LLM_MODEL == "gemini-3.6-flash"


def test_cors_origins_parsing():
    settings = Settings(
        CORS_ORIGINS='["http://localhost:3000", "https://app.example.com"]',
        DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/db",
        JWT_SECRET="secret",
    )
    assert "http://localhost:3000" in settings.CORS_ORIGINS
    assert "https://app.example.com" in settings.CORS_ORIGINS
