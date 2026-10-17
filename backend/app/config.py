"""
Nova Configuration — loads all settings from environment variables.
Uses Pydantic Settings for type-safe, validated configuration.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Required API Keys ──
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    tavily_api_key: str = ""

    # ── Media APIs (optional) ──
    spotify_client_id: str = ""
    spotify_client_secret: str = ""
    spotify_redirect_uri: str = "http://localhost:8000/api/spotify/callback"
    youtube_api_key: str = ""

    # ── Voice (optional) ──
    elevenlabs_api_key: str = ""

    # ── Database ──
    database_url: str = "postgresql+asyncpg://nova:nova@localhost:5432/nova"
    database_url_sync: str = "postgresql://nova:nova@localhost:5432/nova"

    # ── LLM Configuration ──
    llm_model: str = "claude-sonnet-4-6"
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536

    # ── Sandbox ──
    sandbox_image: str = "nova-sandbox:latest"
    sandbox_timeout: int = 30
    sandbox_memory_limit: str = "256m"
    sandbox_cpu_limit: float = 0.5

    # ── App ──
    app_name: str = "Nova"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    @property
    def has_spotify(self) -> bool:
        return bool(self.spotify_client_id and self.spotify_client_secret)

    @property
    def has_youtube(self) -> bool:
        return bool(self.youtube_api_key)

    @property
    def has_elevenlabs(self) -> bool:
        return bool(self.elevenlabs_api_key)


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — reads .env once at startup."""
    return Settings()
