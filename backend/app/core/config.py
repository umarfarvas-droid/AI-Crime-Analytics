from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./crime_analytics.db"
    mongodb_url: str = "mongodb://crime_user:crime_pass@localhost:27017"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    openai_api_key: str = ""
    cors_origins: str = "http://localhost:3000"
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 50
    chroma_persist_dir: str = "./chroma_db"
    ai_disclaimer: str = (
        "This analysis is generated using available evidence and AI inference. "
        "It should not be interpreted as proof of guilt. All outputs require human verification."
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
