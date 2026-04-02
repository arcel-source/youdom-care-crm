"""Configuration de l'application Youdom Care CRM."""
import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db: str = "youdom_care"

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"

    # Security
    secret_key: str = "change-me-in-production-min-32-chars"
    encryption_key: str = ""  # Fernet key base64

    # Session
    session_expire_hours: int = 8

    # CORS
    allowed_origins: str = "http://localhost:3000"

    # Email SMTP
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "Youdom Care <noreply@youdomcare.fr>"

    # Brevo
    brevo_api_key: str = ""

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""

    # App
    app_name: str = "Youdom Care CRM"
    app_url: str = "http://localhost:3000"
    environment: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
