# Backend File Map - ESG Compliance Platform

## Directory Structure Overview

```
backend/
├── 📁 Main Application (FastAPI) - BROKEN
│   ├── 📄 main.py                    # Main FastAPI app (has critical issues)
│   ├── 📄 database.py               # Database configuration (broken)
│   ├── 📄 config.py                 # Settings management (incomplete)
│   └── 📄 config_production.py      # Production config
│
├── 📁 Working Alternative
│   ├── 📄 hybrid_main.py           # ✅ CURRENTLY USED - Works with in-memory storage
│   └── 📄 simple_main.py           # Simple FastAPI version
│
├── 📁 Authentication System - BROKEN
│   ├── 📄 auth/models.py            # User model (circular import issues)
│   ├── 📄 auth/router.py            # Auth endpoints (dependency failures)
│   └── 📄 auth/dependencies.py     # JWT dependencies (not working)
│
├── 📁 Core Business Logic
│   ├── 📄 core/task_generator.py    # ESG task generation
│   ├── 📄 core/report_generator.py  # PDF report generation
│   ├── 📄 core/esg_calculator.py    # ESG scoring algorithms
│   ├── 📄 core/markdown_parser.py   # Content parsing
│   └── 📄 core/report_engine.py     # Report processing
│
├── 📁 Data Models - PROBLEMATIC
│   ├── 📄 models/company.py         # Company model (Base class conflicts)
│   ├── 📄 models/tasks.py          # Task model (relationship issues)
│   ├── 📄 models/esg_scoping.py    # ESG scoping model
│   └── 📄 models/audit.py          # Audit logging
│
├── 📁 API Routers - NOT WORKING
│   ├── 📄 routers/companies.py     # Company management
│   ├── 📄 routers/tasks.py         # Task management
│   ├── 📄 routers/esg_scoping.py   # ESG scoping endpoints
│   ├── 📄 routers/reports.py       # Report generation
│   └── 📄 routers/evidence.py      # Evidence upload
│
├── 📁 Data Schemas
│   ├── 📄 schemas/company.py       # Company validation
│   ├── 📄 schemas/tasks.py         # Task validation
│   ├── 📄 schemas/users.py         # User validation
│   └── 📄 schemas/evidence.py      # Evidence validation
│
├── 📁 Testing
│   ├── 📄 tests/unit/              # Unit tests
│   ├── 📄 tests/integration/       # Integration tests
│   └── 📄 test_*.py               # Various test files
│
├── 📁 Database & Migration - BROKEN
│   ├── 📄 migrations/              # Alembic migrations (not working)
│   ├── 📄 data/esg_platform.db    # SQLite database
│   └── 📄 migrate_esg_fields.py   # Field migration script
│
├── 📁 Reports & Templates
│   ├── 📄 templates/reports/       # HTML report templates
│   └── 📄 sample_esg_report.html  # Sample output
│
└── 📁 Configuration & Dependencies
    ├── 📄 requirements.txt         # Python dependencies
    ├── 📄 Dockerfile              # Container configuration
    └── 📄 pytest.ini             # Test configuration
```

## File Relationships and Dependencies

### 🔴 BROKEN Main Application Flow
```
main.py (BROKEN)
    ├── config.py (incomplete)
    ├── database.py (connection issues)
    ├── auth/router.py (dependency failures)
    ├── routers/* (not accessible)
    └── models/* (import conflicts)
```

### ✅ WORKING Alternative Flow
```
hybrid_main.py (CURRENTLY USED)
    ├── In-memory storage (companies_db, tasks_db)
    ├── Simple authentication
    ├── Direct endpoint implementation
    └── ESG task generation
```

## Detailed File Analysis

### Core Application Files

#### 📄 `main.py` - Main FastAPI Application (BROKEN)
```python
# ISSUES: Database connection, router registration, dependency injection
from fastapi import FastAPI
from .database import engine  # ❌ Fails to connect
from .routers import *        # ❌ Import errors
```
**Status**: 🔴 Critical issues, not functional
**Dependencies**: database.py, auth/, routers/, models/
**Purpose**: Main application entry point

#### 📄 `hybrid_main.py` - Working Alternative (ACTIVE)
```python
# ✅ WORKS: In-memory storage, simple auth, direct implementation
app = FastAPI(title="ESG Platform - Hybrid Mode")
companies_db = {}  # In-memory storage
tasks_db = {}      # In-memory storage
```
**Status**: ✅ Fully functional, currently used
**Dependencies**: Minimal, self-contained
**Purpose**: Simplified working version

#### 📄 `database.py` - Database Configuration (BROKEN)
```python
# ❌ ISSUES: Connection pooling, session management, async setup
from sqlalchemy.ext.asyncio import create_async_engine
engine = create_async_engine(settings.database_url)  # Fails
```
**Status**: 🔴 Connection and session issues
**Dependencies**: config.py, models/
**Purpose**: Database connection management

### Authentication System (BROKEN)

#### 📄 `auth/models.py` - User Model
```python
# ❌ ISSUES: Circular imports, Base class conflicts
from ..models.company import Base  # Circular import
class User(Base): ...
```
**Status**: 🔴 Import and relationship issues
**Dependencies**: models/company.py (circular)
**Purpose**: User authentication model

#### 📄 `auth/router.py` - Authentication Endpoints
```python
# ❌ ISSUES: Database dependency failures, JWT issues
@router.post("/login")
async def login(db: AsyncSession = Depends(get_db)):  # get_db fails
```
**Status**: 🔴 Dependency injection failures
**Dependencies**: auth/models.py, database.py
**Purpose**: User login/registration endpoints

#### 📄 `auth/dependencies.py` - JWT Dependencies
```python
# ❌ ISSUES: Token validation, database session access
async def get_current_user(token: str = Depends(oauth2_scheme)):
    # Token validation fails
```
**Status**: 🔴 Authentication middleware failures
**Dependencies**: auth/models.py, config.py
**Purpose**: JWT token validation

### Core Business Logic (WORKING)

#### 📄 `core/task_generator.py` - ESG Task Generation
```python
# ✅ WORKS: Task generation logic functional
class ESGTaskGenerator:
    def generate_tasks(self, scoping_data): ...
```
**Status**: ✅ Core logic works
**Dependencies**: models/tasks.py
**Purpose**: Generate ESG compliance tasks

#### 📄 `core/report_generator.py` - PDF Report Generation
```python
# ✅ MOSTLY WORKS: Report generation with templates
class ESGReportGenerator:
    def generate_company_esg_report(self): ...
```
**Status**: ✅ Template and PDF generation works
**Dependencies**: templates/, models/
**Purpose**: Generate PDF compliance reports

#### 📄 `core/esg_calculator.py` - ESG Scoring
```python
# ✅ WORKS: Calculation algorithms
def calculate_esg_score(tasks, frameworks): ...
def calculate_carbon_footprint(locations): ...
```
**Status**: ✅ Calculation logic functional
**Dependencies**: None (pure calculations)
**Purpose**: ESG scoring and carbon footprint calculations

### Data Models (PROBLEMATIC)

#### 📄 `models/company.py` - Company Model
```python
# ⚠️ ISSUES: Base class conflicts, UUID fields with SQLite
from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()  # Conflicts with other models
```
**Status**: ⚠️ Model definition issues
**Dependencies**: database.py
**Purpose**: Company data model

#### 📄 `models/tasks.py` - Task Model
```python
# ⚠️ ISSUES: Foreign key relationships, enum definitions
class Task(Base):
    company_id = Column(UUID)  # Missing ForeignKey
```
**Status**: ⚠️ Relationship and constraint issues
**Dependencies**: models/company.py
**Purpose**: Task data model

#### 📄 `models/esg_scoping.py` - ESG Scoping Model
```python
# ⚠️ ISSUES: JSON field handling, validation
class ESGScoping(Base):
    answers = Column(JSON)  # Validation issues
```
**Status**: ⚠️ JSON field and validation problems
**Dependencies**: models/company.py
**Purpose**: ESG scoping data model

### API Routers (NOT WORKING)

#### 📄 `routers/esg_scoping.py` - ESG Scoping Endpoints
```python
# ❌ ISSUES: Database dependency failures, smart task regeneration bugs
@router.post("/scoping/{company_id}")
async def update_scoping(db: AsyncSession = Depends(get_db)):  # Fails
```
**Status**: 🔴 Database and smart regeneration issues
**Dependencies**: database.py, auth/, models/
**Purpose**: ESG scoping and task management

#### 📄 `routers/tasks.py` - Task Management
```python
# ❌ ISSUES: CRUD operations fail due to database issues
@router.get("/tasks")
async def get_tasks(db: AsyncSession = Depends(get_db)):  # Fails
```
**Status**: 🔴 Database dependency failures
**Dependencies**: database.py, models/tasks.py
**Purpose**: Task CRUD operations

#### 📄 `routers/companies.py` - Company Management
```python
# ❌ ISSUES: Company CRUD operations not working
@router.post("/companies")
async def create_company(db: AsyncSession = Depends(get_db)):  # Fails
```
**Status**: 🔴 Database and validation issues
**Dependencies**: database.py, models/company.py
**Purpose**: Company management endpoints

### Database and Migration (BROKEN)

#### 📄 `migrations/` - Alembic Migration System
```
migrations/
├── env.py              # ❌ Configuration issues
├── script.py.mako     # ❌ Template problems
└── versions/          # ❌ Migration scripts fail
```
**Status**: 🔴 Migration system completely broken
**Dependencies**: database.py, models/
**Purpose**: Database schema management

#### 📄 `data/esg_platform.db` - SQLite Database
```sql
-- ❌ ISSUES: Tables not created, foreign keys missing
-- Database exists but schema incomplete
```
**Status**: 🔴 Schema incomplete, data corruption
**Dependencies**: models/, migrations/
**Purpose**: Development database storage

### Testing System (PARTIAL)

#### 📄 `tests/unit/` - Unit Tests
```python
# ⚠️ PARTIAL: Some tests work, others fail due to dependencies
def test_task_generator():  # ✅ Works
def test_database_models():  # ❌ Fails
```
**Status**: ⚠️ Mixed success, dependency issues
**Dependencies**: All core modules
**Purpose**: Unit testing coverage

#### 📄 `tests/integration/` - Integration Tests
```python
# ❌ ISSUES: All integration tests fail due to database issues
def test_auth_endpoints():  # ❌ Fails
def test_esg_endpoints():   # ❌ Fails
```
**Status**: 🔴 All integration tests failing
**Dependencies**: Full application stack
**Purpose**: End-to-end testing

### Configuration and Dependencies

#### 📄 `requirements.txt` - Python Dependencies
```txt
fastapi==0.104.1        # ✅ Core framework
sqlalchemy[asyncio]     # ⚠️ Version conflicts
alembic                 # ❌ Migration issues
python-jose             # ❌ JWT problems
```
**Status**: ⚠️ Some package conflicts and missing drivers
**Dependencies**: None (external packages)
**Purpose**: Python package management

#### 📄 `config.py` - Application Settings
```python
# ⚠️ ISSUES: Environment loading, secret management
class Settings(BaseSettings):
    database_url: str = "sqlite:///..."  # Format issues
    secret_key: str = "hardcoded"        # Security issue
```
**Status**: ⚠️ Configuration and security issues
**Dependencies**: Environment variables
**Purpose**: Application configuration

## File Status Legend

- 🔴 **BROKEN**: Critical issues, not functional
- ⚠️ **PROBLEMATIC**: Has issues but may partially work
- ✅ **WORKING**: Functional and reliable
- 📁 **DIRECTORY**: Folder containing related files
- 📄 **FILE**: Individual code file

## Critical Dependencies

### Circular Dependency Issues
```
auth/models.py → models/company.py → auth/models.py
main.py → routers/* → auth/* → main.py
```

### Missing Dependencies
```
database.py → config.py (environment not loaded)
models/* → migrations/* (schema not created)
routers/* → database.py (connection not working)
```

### Working Dependencies
```
hybrid_main.py → core/task_generator.py ✅
core/report_generator.py → templates/ ✅
core/esg_calculator.py → (self-contained) ✅
```

## Recommended Action Plan

### Immediate (Use Working Files)
1. Continue using `hybrid_main.py` for development
2. Leverage working `core/` modules for business logic
3. Use `templates/` for report generation

### Short Term (Fix Critical Issues)
1. Resolve database configuration in `database.py`
2. Fix circular imports in `models/` and `auth/`
3. Repair dependency injection in `routers/`

### Long Term (Full Restoration)
1. Complete migration system repair
2. Implement proper authentication flow
3. Restore full FastAPI application functionality
4. Add comprehensive testing coverage

This file map shows why `hybrid_main.py` is currently the only reliable way to run the backend - it bypasses all the broken infrastructure while maintaining core functionality.