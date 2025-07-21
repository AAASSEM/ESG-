# Main App Backend Issues Documentation

## Overview
This document outlines the critical issues with the main FastAPI application backend (`backend/app/main.py`) that have forced us to use the simplified `hybrid_main.py` instead.

## Primary Issues

### 1. Database Connection Problems
**Issue**: The main app fails to connect to the database properly, causing 500 Internal Server Errors.

**Files Involved**:
- `backend/app/main.py` - Main FastAPI application
- `backend/app/database.py` - Database configuration
- `backend/app/config.py` - Application settings

**Error Symptoms**:
- Server starts but returns 500 errors on API calls
- Database connection timeouts
- SQLAlchemy session management failures

### 2. Dependency Injection Failures
**Issue**: FastAPI dependency injection system not working correctly with database sessions.

**Files Involved**:
- `backend/app/dependencies.py` - Dependency providers
- `backend/app/auth/dependencies.py` - Authentication dependencies
- All router files that use `Depends(get_db)`

**Error Symptoms**:
- `get_db` dependency returning None
- Database session not properly initialized
- Authentication middleware failing

### 3. Router Registration Issues
**Issue**: API routes not being properly registered or accessible.

**Files Involved**:
- `backend/app/main.py` - Router registration
- `backend/app/routers/` - All router modules
- `backend/app/auth/router.py` - Authentication routes

**Error Symptoms**:
- 404 Not Found for existing endpoints
- Routes not appearing in OpenAPI docs
- Circular import issues

### 4. Environment Configuration Problems
**Issue**: Environment variables and configuration not loading correctly.

**Files Involved**:
- `backend/app/config.py` - Settings management
- `backend/.env` - Environment variables
- `backend/app/main.py` - Configuration loading

**Error Symptoms**:
- Missing database URL
- JWT secret key not found
- CORS configuration failures

## Detailed File Analysis

### Main Application File: `backend/app/main.py`
```python
# Expected structure but not working:
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .routers import auth, companies, tasks, esg_scoping
from .config import settings

app = FastAPI(title="ESG Compliance Platform")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # This might be too permissive
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router includes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(companies.router, prefix="/api/companies", tags=["companies"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(esg_scoping.router, prefix="/api/esg", tags=["esg"])
```

**Problems**:
1. Database engine not properly initialized
2. Router imports failing due to circular dependencies
3. Middleware configuration conflicts
4. Missing startup/shutdown event handlers

### Database Configuration: `backend/app/database.py`
```python
# Expected but problematic:
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from .config import settings

engine = create_async_engine(
    settings.database_url,
    echo=True,  # This causes performance issues
    future=True
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

**Problems**:
1. Database URL format issues (sqlite vs postgresql)
2. Connection pool configuration missing
3. Session lifecycle management incorrect
4. Missing database initialization

### Authentication Router: `backend/app/auth/router.py`
```python
# Current problematic state:
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..schemas.users import UserCreate, UserLogin
from .models import User
from .dependencies import get_current_user

router = APIRouter()

@router.post("/register")
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Database operations fail here
    pass

@router.post("/login")
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    # Authentication logic fails
    pass
```

**Problems**:
1. Database dependency not resolving
2. User model import conflicts
3. Password hashing not configured
4. JWT token generation failing

### ESG Scoping Router: `backend/app/routers/esg_scoping.py`
```python
# Current problematic implementation:
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..models.company import Company
from ..schemas.esg import ESGScopingRequest
from ..auth.dependencies import get_current_user

router = APIRouter()

@router.post("/scoping/{company_id}")
async def update_esg_scoping(
    company_id: str,
    scoping_data: ESGScopingRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # All database operations fail here
    pass
```

**Problems**:
1. Company model not properly defined
2. Database queries failing
3. Schema validation issues
4. Authentication dependency failures

### Task Generator: `backend/app/core/task_generator.py`
```python
# Current state with issues:
from typing import List, Dict, Any
from ..models.tasks import Task, TaskCategory, TaskStatus
from ..models.company import Company, BusinessSector

class ESGTaskGenerator:
    def __init__(self):
        # Initialization fails due to missing dependencies
        pass
    
    async def generate_tasks(self, company: Company, scoping_data: Dict[str, Any]) -> List[Task]:
        # Task generation logic exists but database operations fail
        pass
```

**Problems**:
1. Model imports failing
2. Database session not available
3. Task creation logic incomplete
4. Framework mapping not working

### Models Issues: `backend/app/models/`

**Company Model (`company.py`)**:
```python
# Issues with model definition:
from sqlalchemy import Column, String, JSON, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid

Base = declarative_base()

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    business_sector = Column(String)  # Should be Enum
    scoping_data = Column(JSON)
    # Missing relationships and constraints
```

**Problems**:
1. Base class conflicts with other models
2. UUID field not working with SQLite
3. Missing foreign key relationships
4. Enum fields not properly defined

**Task Model (`tasks.py`)**:
```python
# Similar issues:
from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from .company import Base

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True))  # Missing ForeignKey
    title = Column(String, nullable=False)
    # Missing proper relationships and constraints
```

**Problems**:
1. Foreign key relationships not defined
2. Task status enum not working
3. Evidence relationship missing
4. Database constraints incomplete

### User Model (`backend/app/auth/models.py`)**:
```python
# Authentication model issues:
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from ..models.company import Base  # Circular import issue

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # Missing proper constraints and relationships
```

**Problems**:
1. Circular import with Base class
2. Password hashing not implemented
3. User-company relationship missing
4. Email validation not working

## Configuration Issues

### Settings (`backend/app/config.py`):
```python
# Current problematic configuration:
from pydantic import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    database_url: str = "sqlite:///./esg_platform.db"
    secret_key: str = "your-secret-key-here"  # Hardcoded secret
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    class Config:
        env_file = ".env"
        # Environment loading not working properly
```

**Problems**:
1. Hardcoded secrets
2. Database URL format issues
3. Environment file not found
4. Missing validation

### Environment File (`.env`):
```bash
# Current incomplete/missing .env:
DATABASE_URL=sqlite:///./esg_platform.db
SECRET_KEY=not-set-properly
DEBUG=True
# Missing required variables
```

**Problems**:
1. Missing critical environment variables
2. Database URL not properly formatted
3. Secret key not secure
4. Development vs production config not separated

## Migration Issues

### Alembic Configuration:
```python
# backend/alembic/env.py issues:
from alembic import context
from sqlalchemy import engine_from_config, pool
from app.models import *  # Import issues
from app.config import settings

# Configuration problems prevent migrations
```

**Problems**:
1. Model imports failing
2. Database URL not accessible
3. Migration scripts not generated
4. Table creation failing

## Dependencies and Package Issues

### Requirements (`backend/requirements.txt`):
```txt
# Some packages may be missing or incompatible:
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy[asyncio]==2.0.23
alembic==1.12.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic==2.5.0
# Version conflicts may exist
```

**Problems**:
1. Package version conflicts
2. Missing database drivers
3. Async/await compatibility issues
4. Dependencies not properly pinned

## Attempted Solutions That Failed

### 1. Database Recreation
- Tried deleting and recreating the database
- Alembic migrations still failed
- Table creation errors persisted

### 2. Dependency Reorganization
- Attempted to fix circular imports
- Router registration still failing
- Authentication middleware issues remained

### 3. Configuration Overhaul
- Modified settings and environment files
- Database connection still unstable
- Secret management issues persisted

### 4. Model Restructuring
- Tried to fix Base class conflicts
- UUID field issues with SQLite
- Relationship definitions still failing

## Why hybrid_main.py Works

The `hybrid_main.py` file works because it:

1. **Simplified Architecture**: Uses in-memory storage instead of complex database operations
2. **Direct Implementation**: Avoids the problematic dependency injection system
3. **Minimal Dependencies**: Doesn't rely on the broken SQLAlchemy setup
4. **Straightforward Routing**: Uses simple FastAPI routing without complex middleware
5. **No Authentication Issues**: Uses basic token validation instead of complex auth system

### Working Code Pattern in hybrid_main.py:
```python
# This pattern works:
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os

app = FastAPI(title="ESG Platform - Hybrid Mode")

# Simple in-memory storage
companies_db = {}
tasks_db = {}

@app.post("/api/esg/scoping/{company_id}")
async def update_scoping(company_id: str, data: dict):
    # Direct implementation without database complexity
    companies_db[company_id] = data
    return {"status": "success"}
```

## Impact on Development

### Current Workarounds:
1. Using `hybrid_main.py` for all development
2. In-memory storage for data persistence
3. Simplified authentication without database
4. Manual data management without proper models

### Limitations:
1. No data persistence between server restarts
2. No proper user management
3. No database migrations
4. Limited scalability
5. No proper error handling for production

## Required Fixes for Main App

### High Priority:
1. **Fix Database Configuration**: Proper SQLAlchemy async setup
2. **Resolve Circular Imports**: Restructure model and router imports
3. **Authentication System**: Complete JWT implementation with proper user management
4. **Migration System**: Working Alembic configuration

### Medium Priority:
1. **Environment Management**: Proper secrets and configuration handling
2. **Error Handling**: Comprehensive exception handling
3. **Testing Setup**: Unit and integration tests
4. **API Documentation**: Complete OpenAPI specs

### Low Priority:
1. **Performance Optimization**: Database connection pooling
2. **Logging System**: Structured logging implementation
3. **Monitoring**: Health checks and metrics
4. **Security Hardening**: Rate limiting, input validation

## Conclusion

The main app backend has fundamental architectural issues that prevent it from functioning correctly. The problems span across database configuration, dependency injection, model definitions, and authentication systems. Until these core issues are resolved, we must continue using the `hybrid_main.py` workaround for development and testing.

The complexity of fixing these issues requires a systematic approach, starting with database configuration and working through the dependency chain. Each component depends on others, making isolated fixes difficult without a comprehensive refactoring effort.