"""
Production configuration for ESG Platform.
"""
import os
from typing import List
from pydantic import BaseSettings, validator


class ProductionSettings(BaseSettings):
    """Production-specific settings with enhanced security and performance."""
    
    # Application
    app_name: str = "ESG Scoping & Task Management Platform"
    app_version: str = "1.0.0"
    environment: str = "production"
    debug: bool = False
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # Database
    database_url: str
    database_pool_size: int = 20
    database_max_overflow: int = 30
    database_pool_timeout: int = 30
    database_pool_recycle: int = 3600
    
    # Redis
    redis_url: str
    redis_pool_size: int = 20
    redis_timeout: int = 5
    
    # CORS
    cors_origins: List[str] = []
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    cors_allow_headers: List[str] = ["*"]
    
    # File Upload
    max_file_size: int = 52428800  # 50MB
    upload_dir: str = "/app/uploads"
    allowed_file_extensions: List[str] = [
        ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", 
        ".xls", ".xlsx", ".txt", ".csv"
    ]
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "/app/logs/esg_platform.log"
    log_max_size: int = 10485760  # 10MB
    log_backup_count: int = 5
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Performance
    worker_processes: int = 4
    worker_connections: int = 1000
    keepalive_timeout: int = 65
    request_timeout: int = 30
    
    # Rate Limiting
    rate_limit_per_minute: int = 60
    rate_limit_burst: int = 10
    rate_limit_login_attempts: int = 5
    rate_limit_window: int = 300  # 5 minutes
    
    # Session Management
    session_timeout_minutes: int = 30
    session_cookie_secure: bool = True
    session_cookie_httponly: bool = True
    session_cookie_samesite: str = "strict"
    
    # SSL/TLS
    ssl_cert_path: str = "/etc/ssl/certs/esg_platform.crt"
    ssl_key_path: str = "/etc/ssl/private/esg_platform.key"
    force_https: bool = True
    
    # Backup
    backup_schedule: str = "0 2 * * *"  # Daily at 2 AM
    backup_retention_days: int = 30
    backup_dir: str = "/app/backups"
    backup_compression: bool = True
    backup_encryption: bool = True
    
    # Monitoring
    enable_metrics: bool = True
    metrics_port: int = 9000
    health_check_interval: int = 30
    health_check_timeout: int = 10
    health_check_retries: int = 3
    
    # Email (for notifications)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_use_tls: bool = True
    
    # Security Headers
    security_headers: dict = {
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Content-Security-Policy": (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https:; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none';"
        ),
        "Permissions-Policy": (
            "camera=(), microphone=(), geolocation=(), "
            "payment=(), usb=(), magnetometer=(), gyroscope=()"
        )
    }
    
    # Content Security
    max_request_size: int = 104857600  # 100MB
    max_upload_files: int = 10
    scan_uploads: bool = True
    quarantine_suspicious_files: bool = True
    
    # Audit & Compliance
    enable_audit_logging: bool = True
    audit_log_file: str = "/app/logs/audit.log"
    audit_retention_days: int = 365
    compliance_mode: bool = True
    
    # Cache Settings
    cache_ttl: int = 3600  # 1 hour
    cache_max_size: int = 1000
    enable_query_cache: bool = True
    
    # Task Processing
    task_queue_size: int = 1000
    task_timeout: int = 300  # 5 minutes
    max_concurrent_tasks: int = 50
    
    @validator('cors_origins', pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v
    
    @validator('secret_key')
    def validate_secret_key(cls, v):
        """Validate secret key length."""
        if len(v) < 32:
            raise ValueError('Secret key must be at least 32 characters long')
        return v
    
    @validator('database_url')
    def validate_database_url(cls, v):
        """Validate database URL."""
        if not v.startswith(('postgresql://', 'postgresql+asyncpg://')):
            raise ValueError('Database URL must be PostgreSQL')
        return v
    
    @validator('log_level')
    def validate_log_level(cls, v):
        """Validate log level."""
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if v.upper() not in valid_levels:
            raise ValueError(f'Log level must be one of {valid_levels}')
        return v.upper()
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


class DevelopmentSettings(ProductionSettings):
    """Development settings with relaxed security."""
    
    environment: str = "development"
    debug: bool = True
    log_level: str = "DEBUG"
    
    # Relaxed security for development
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:8080"]
    force_https: bool = False
    session_cookie_secure: bool = False
    
    # Development performance
    worker_processes: int = 1
    database_pool_size: int = 5
    database_max_overflow: int = 10
    
    # Development rate limiting
    rate_limit_per_minute: int = 1000
    rate_limit_burst: int = 100


class TestingSettings(ProductionSettings):
    """Testing settings with test database."""
    
    environment: str = "testing"
    debug: bool = True
    log_level: str = "DEBUG"
    
    # Test database
    database_url: str = "sqlite+aiosqlite:///./test.db"
    
    # Disable external services in tests
    enable_metrics: bool = False
    enable_audit_logging: bool = False
    backup_schedule: str = ""
    
    # Fast testing
    access_token_expire_minutes: int = 1
    rate_limit_per_minute: int = 10000


def get_settings() -> ProductionSettings:
    """Get settings based on environment."""
    env = os.getenv("ENVIRONMENT", "production").lower()
    
    if env == "development":
        return DevelopmentSettings()
    elif env == "testing":
        return TestingSettings()
    else:
        return ProductionSettings()


# Global settings instance
settings = get_settings()


# Database configuration
DATABASE_CONFIG = {
    "pool_size": settings.database_pool_size,
    "max_overflow": settings.database_max_overflow,
    "pool_timeout": settings.database_pool_timeout,
    "pool_recycle": settings.database_pool_recycle,
    "pool_pre_ping": True,
    "echo": settings.debug,
}

# Redis configuration
REDIS_CONFIG = {
    "encoding": "utf-8",
    "decode_responses": True,
    "max_connections": settings.redis_pool_size,
    "socket_timeout": settings.redis_timeout,
    "socket_connect_timeout": settings.redis_timeout,
    "retry_on_timeout": True,
}

# Logging configuration
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": settings.log_format,
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "json": {
            "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
            "class": "pythonjsonlogger.jsonlogger.JsonFormatter",
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
        "file": {
            "formatter": "json",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": settings.log_file,
            "maxBytes": settings.log_max_size,
            "backupCount": settings.log_backup_count,
        },
        "audit": {
            "formatter": "json",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": settings.audit_log_file,
            "maxBytes": settings.log_max_size,
            "backupCount": settings.log_backup_count,
        },
    },
    "loggers": {
        "": {
            "level": settings.log_level,
            "handlers": ["default", "file"],
        },
        "audit": {
            "level": "INFO",
            "handlers": ["audit"],
            "propagate": False,
        },
        "uvicorn.access": {
            "level": "INFO",
            "handlers": ["file"],
            "propagate": False,
        },
    },
}