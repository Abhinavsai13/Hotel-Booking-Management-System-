import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hotel Booking Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Secret Key for JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-jwt-token-hotel-key-2026-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    # Default to SQLite for easy local setup, or set DATABASE_URL=postgresql://user:pass@localhost:5432/hotel_db
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hotel_booking.db")
    
    # Booking & Cancellation Policy
    CANCELLATION_DEADLINE_HOURS: int = 24

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
