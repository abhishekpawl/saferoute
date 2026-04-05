from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="SafeRoute API", alias="APP_NAME")
    api_v1_prefix: str = "/api/v1"
    environment: str = Field(default="development", alias="ENVIRONMENT")
    secret_key: str = Field(default="change-me", alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=1440, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/saferoute",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    cors_origins_raw: str = Field(
        default="http://localhost:19006,http://localhost:8081,http://localhost:3000",
        alias="CORS_ORIGINS",
    )
    default_otp_code: str | None = Field(default="123456", alias="DEFAULT_OTP_CODE")
    otp_expiry_seconds: int = Field(default=300, alias="OTP_EXPIRY_SECONDS")
    guardian_discovery_radius_km: float = Field(default=10.0, alias="GUARDIAN_DISCOVERY_RADIUS_KM")
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-5-mini", alias="OPENAI_MODEL")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()
