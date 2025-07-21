"""
Configuration settings for the ESG platform.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Database
    database_url: str = "sqlite:///./data/esg_platform.db"
    database_url_async: str = "sqlite+aiosqlite:///./data/esg_platform.db"
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # ESG Content
    esg_content_file: str = "data/esg_content.md"
    
    # File Storage
    evidence_storage_path: str = "./uploads/evidence"
    max_file_size_mb: int = 50
    allowed_file_types: set = {
        "application/pdf", 
        "image/jpeg", 
        "image/png", 
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
    
    # CORS
    cors_origins: list = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"]
    
    # Environment
    environment: str = "development"
    debug: bool = True
    
    class Config:
        env_file = ".env"


# Global settings instance
settings = Settings()