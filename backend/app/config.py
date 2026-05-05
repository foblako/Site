from typing import Annotated, Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables / `.env`."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    database_url: str = "sqlite+aiosqlite:///./dev.db"

    # Annotated with `NoDecode` so pydantic-settings does not try to JSON-parse
    # the raw env value: we accept both a JSON list (e.g. '["http://a"]') and a
    # plain comma-separated string (e.g. 'http://a,http://b'), normalized below.
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173"]
    )

    # JWT / auth. The default secret is fine for local development only —
    # production deployments MUST set JWT_SECRET to a random value.
    jwt_secret: str = "dev-jwt-secret-do-not-use-in-prod"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 30
    refresh_token_ttl_days: int = 14

    debug: bool = False

    # Absolute or relative path where uploaded files (avatars, project
    # screenshots) are written. Served back as static content under `/uploads`.
    uploads_dir: str = "./uploads"
    # 5 MiB by default. Rejected files return 413 before any disk write.
    max_upload_size_bytes: int = 5 * 1024 * 1024

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value: Any) -> Any:
        if value is None or isinstance(value, list):
            return value
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("["):
                import json

                return json.loads(stripped)
            return [item.strip() for item in stripped.split(",") if item.strip()]
        return value

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


settings = Settings()
