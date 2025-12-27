from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App
    app_name: str = "FootIntel API"
    debug: bool = False
    api_v1_str: str = "/api/v1"
    
    # Database
    database_url: str
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # JWT
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60  # 1 hour for access token
    jwt_refresh_expire_days: int = 30  # 30 days for refresh token
    
    # API Keys
    football_api_key: str = ""  # Legacy API-Football (RapidAPI) - deprecated
    football_data_api_key: str = ""  # Football-Data.org API key (free tier)
    gemini_api_key: str = ""
    stripe_api_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_starter: str = ""  # Stripe Price ID for Starter plan
    stripe_price_pro: str = ""  # Stripe Price ID for Pro plan
    stripe_price_lifetime: str = ""  # Stripe Price ID for Lifetime (one-time)
    moneroo_api_key: str = ""
    moneroo_webhook_secret: str = ""
    news_api_key: str = ""
    
    # SMTP Settings (FastAPI-Mail / Celery)
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@footintel.com"
    smtp_tls: bool = True
    smtp_ssl: bool = False
    
    # Celery
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"
    
    # CORS
    cors_origins: List[str] = ["*"]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
