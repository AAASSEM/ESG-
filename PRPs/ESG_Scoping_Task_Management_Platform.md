# PRP: ESG Scoping & Task Management Platform for UAE SMEs

## Goal
Build a comprehensive web application that enables Small and Medium Enterprises (SMEs) in the UAE to go through a guided Environmental, Social, and Governance (ESG) scoping process based on their specific business sector. The application will dynamically generate actionable task checklists, enable team collaboration, track progress with evidence uploads, and generate comprehensive ESG reports for compliance.

## Why
- **Business Value**: Streamlines ESG compliance for UAE SMEs who lack dedicated sustainability teams
- **Regulatory Compliance**: Addresses growing ESG reporting requirements in the UAE market
- **Sector-Specific Guidance**: Provides tailored ESG frameworks based on business sectors (Hospitality, Construction, Real Estate, Education, Health, Logistics, Manufacturing, Retail)
- **Evidence Management**: Creates audit trails and maintains chain of custody for compliance documentation
- **Team Collaboration**: Enables multi-user task assignment and progress tracking across locations

## What
A full-stack web application with dynamic content-driven ESG scoping, collaborative task management, evidence handling, and comprehensive reporting capabilities.

### Success Criteria
- [ ] Users can complete sector-specific ESG scoping wizard driven by markdown configuration
- [ ] Tasks are dynamically generated with proper categorization and evidence requirements
- [ ] Multi-level location hierarchy supports granular task assignment
- [ ] Role-based access control enables secure team collaboration
- [ ] Evidence uploads maintain audit trails and chain of custody
- [ ] Dashboard provides real-time progress tracking and analytics
- [ ] PDF reports can be generated with complete ESG assessment summary
- [ ] System supports easy content updates via markdown file changes

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: /mnt/c/Users/20100/v1/build.md
  why: Complete feature requirements and business logic
  
- file: /mnt/c/Users/20100/v1/examples/2jul-Sector-Specific ESG Scoping for UAE SMEs.md
  why: Core content structure for dynamic scoping wizard and task generation

- file: /mnt/c/Users/20100/v1/examples/frond.exam/
  why: UI/UX patterns and design system using Tailwind CSS glassmorphism
  
- file: /mnt/c/Users/20100/v1/examples/climatesage-schema-sql-v3.3-sublocations-new-roles.pdf
  why: Database schema reference for RBAC and location hierarchy

- url: https://fastapi.tiangolo.com/tutorial/
  why: FastAPI fundamentals and best practices
  section: File uploads, dependencies, security

- url: https://python-markdown.github.io/extensions/tables/
  why: Markdown table parsing for dynamic content generation
  critical: Table structure parsing is core to application logic

- url: https://github.com/zhanymkanov/fastapi-best-practices
  why: FastAPI project structure and security patterns
  critical: RBAC implementation and middleware patterns

- url: https://medium.com/@abdulwasa.abdulkader/how-to-implement-a-simple-role-based-access-control-rbac-in-fastapi-using-middleware-af07d31efa9f
  why: RBAC middleware implementation patterns
  critical: Site-scoped permissions and data filtering

- url: https://pbpython.com/pdf-reports.html
  why: PDF report generation with Jinja2 and Python
  critical: ESG compliance report formatting
```

### Current Codebase Tree
```bash
/mnt/c/Users/20100/v1/
├── .claude/
├── .gitattributes
├── .gitignore
├── build.md                    # Feature requirements
├── CLAUDE.md                   # Project instructions
├── examples/
│   ├── 2jul-Sector-Specific ESG Scoping for UAE SMEs.md
│   ├── climatesage-schema-sql-v3.3-sublocations-new-roles.pdf
│   └── frond.exam/            # Frontend UI examples
│       ├── dash.html
│       ├── home.html
│       ├── onboard.html
│       └── trcker.html
├── LICENSE
├── PRPs/
│   └── templates/
└── README.md
```

### Desired Codebase Tree with Files to be Added
```bash
/mnt/c/Users/20100/v1/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI application setup
│   │   ├── config.py                  # Environment configuration
│   │   ├── database.py                # Database connection and session
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── dependencies.py        # Auth dependencies and RBAC
│   │   │   ├── models.py              # User, Role, Permission models
│   │   │   └── router.py              # Authentication endpoints
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── markdown_parser.py     # ESG content parser
│   │   │   ├── task_generator.py      # Dynamic task creation
│   │   │   └── report_generator.py    # PDF report creation
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── company.py             # Company, Location models
│   │   │   ├── tasks.py               # Task, Evidence models
│   │   │   └── audit.py               # Audit log models
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── companies.py           # Company management
│   │   │   ├── tasks.py               # Task CRUD operations
│   │   │   ├── evidence.py            # File upload handling
│   │   │   └── reports.py             # Dashboard and PDF generation
│   │   └── schemas/
│   │       ├── __init__.py
│   │       ├── company.py             # Pydantic schemas
│   │       ├── tasks.py
│   │       └── users.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                  # Login, registration
│   │   │   ├── onboarding/            # Company setup wizard
│   │   │   ├── tasks/                 # Task management UI
│   │   │   ├── dashboard/             # Progress tracking
│   │   │   └── common/                # Shared components
│   │   ├── pages/
│   │   ├── utils/
│   │   └── App.tsx
├── data/
│   └── esg_content.md                 # ESG scoping content
├── tests/
│   ├── backend/
│   └── frontend/
├── requirements.txt
├── package.json
└── docker-compose.yml
```

### Known Gotchas & Library Quirks
```python
# CRITICAL: python-markdown table parsing requires exact formatting
# Tables must have proper headers and | separators
# Use markdown.extensions.tables for parsing sector-specific content

# CRITICAL: FastAPI file uploads require python-multipart
# pip install python-multipart for UploadFile support

# CRITICAL: SQLAlchemy RBAC requires implicit site filtering
# All database queries must automatically filter by user permissions
# Never expose data from sites user doesn't have access to

# CRITICAL: Evidence file handling needs secure storage
# Use secure file naming to prevent path traversal
# Implement virus scanning for uploaded files
# Maintain SHA-256 hashes for file integrity verification

# CRITICAL: Markdown content changes should not require code deployment
# Parser must be resilient to minor formatting changes
# Content validation should occur on application startup

# CRITICAL: Vue/React frontend needs dynamic form rendering
# Forms must be generated based on backend markdown parsing results
# State management required for multi-step wizard progression
```

## Implementation Blueprint

### Data Models and Structure

Create the core data models ensuring type safety and ESG-specific business logic:

```python
# Company and Location Hierarchy
class Company(SQLAlchemyModel):
    id: UUID
    name: str
    main_location: str  # Dubai, Abu Dhabi
    business_sector: BusinessSectorEnum  # From markdown file
    created_at: datetime

class Location(SQLAlchemyModel):
    id: UUID
    company_id: UUID
    name: str
    parent_location_id: Optional[UUID]  # For sub-locations
    location_type: LocationTypeEnum

# ESG Task Management
class Task(SQLAlchemyModel):
    id: UUID
    company_id: UUID
    location_id: Optional[UUID]
    title: str  # From "Wizard Question (Plain-English)"
    description: str  # From "Rationale / Underlying Metric"
    compliance_context: str  # From "Intersecting Frameworks"
    action_required: str  # From "Data Source / Checklist Item"
    status: TaskStatusEnum
    assigned_user_id: Optional[UUID]
    due_date: Optional[date]
    framework_tags: List[str]  # Multiple frameworks per task

# Evidence and Audit Trail
class Evidence(SQLAlchemyModel):
    id: UUID
    task_id: UUID
    file_path: str
    original_filename: str
    file_hash: str  # SHA-256 for integrity
    uploaded_by: UUID
    uploaded_at: datetime
    file_size: int
    mime_type: str

class AuditLog(SQLAlchemyModel):
    id: UUID
    user_id: UUID
    action: str
    resource_type: str
    resource_id: str
    details: JSON
    timestamp: datetime
    ip_address: str
```

### List of Tasks to Complete the PRP (in order)

```yaml
Task 1: Project Setup & Dependencies
SETUP Project Structure:
  - CREATE backend/ with FastAPI application structure
  - CREATE frontend/ with modern React/TypeScript setup
  - INSTALL core dependencies: FastAPI, SQLAlchemy, python-markdown, python-multipart, reportlab
  - CONFIGURE development environment with Docker Compose
  - SETUP linting (ruff) and type checking (mypy) for Python

Task 2: Database Schema & Models
CREATE backend/app/models/:
  - IMPLEMENT Company, Location, User, Role, Permission models
  - IMPLEMENT Task, Evidence, AuditLog models with proper relationships
  - CREATE Alembic migrations for initial schema
  - SETUP database connection with SQLAlchemy async support

Task 3: ESG Content Parser & Task Generator
CREATE backend/app/core/markdown_parser.py:
  - IMPLEMENT robust markdown table parser using python-markdown
  - PARSE "2jul-Sector-Specific ESG Scoping for UAE SMEs.md"
  - EXTRACT sector-specific questions, rationale, frameworks, and actions
  - VALIDATE content structure and provide error handling

CREATE backend/app/core/task_generator.py:
  - IMPLEMENT dynamic task generation based on business sector
  - MAP markdown content to Task model instances
  - SUPPORT framework tagging for "Collect Once, Use Many" logic
  - ENSURE tasks are location-aware and user-assignable

Task 4: Authentication & RBAC Implementation
CREATE backend/app/auth/:
  - IMPLEMENT JWT-based authentication with refresh tokens
  - CREATE role-based permission system (Admin, Manager, Contributor)
  - IMPLEMENT site-scoped permissions with automatic data filtering
  - CREATE middleware for request authorization and audit logging

Task 5: Core API Development
CREATE backend/app/routers/:
  - IMPLEMENT company onboarding endpoints with sector selection
  - CREATE location hierarchy management (primary + sub-locations)
  - IMPLEMENT task CRUD with dynamic filtering and assignment
  - CREATE user management with invitation and role assignment

Task 6: File Upload & Evidence Management
CREATE backend/app/routers/evidence.py:
  - IMPLEMENT secure file upload with validation (size, type, virus scan)
  - CREATE evidence linking to tasks with metadata storage
  - IMPLEMENT file integrity verification with SHA-256 hashing
  - SETUP secure file storage with access control

Task 7: Frontend Core Components
CREATE frontend/src/components/:
  - IMPLEMENT authentication pages (login, register, password reset)
  - CREATE company onboarding wizard with sector selection
  - DEVELOP location management interface (hierarchy visualization)
  - BUILD user invitation and permission management UI

Task 8: Dynamic ESG Scoping Wizard
CREATE frontend/src/components/onboarding/wizard/:
  - IMPLEMENT multi-step wizard for ESG scoping
  - CREATE dynamic form generation based on backend content parsing
  - SUPPORT conditional question flow based on previous answers
  - INTEGRATE with task generation upon wizard completion

Task 9: Task Management Interface
CREATE frontend/src/components/tasks/:
  - IMPLEMENT task list with filtering (status, assigned user, location)
  - CREATE task detail view with evidence upload capability
  - DEVELOP task assignment interface for managers
  - BUILD progress tracking and status management

Task 10: Dashboard & Analytics
CREATE frontend/src/components/dashboard/:
  - IMPLEMENT overall completion dashboard with progress bars
  - CREATE category-wise progress visualization (Energy, Water, Waste, etc.)
  - DEVELOP overdue task alerts and notification system
  - BUILD task status breakdown charts (pie/bar charts)

Task 11: PDF Report Generation
CREATE backend/app/core/report_generator.py:
  - IMPLEMENT Jinja2 templates for ESG compliance reports
  - CREATE PDF generation with ReportLab or WeasyPrint
  - INCLUDE company profile, wizard results, task completion status
  - EMBED evidence thumbnails/links in generated reports

Task 12: Testing & Quality Assurance
CREATE tests/:
  - IMPLEMENT comprehensive unit tests for all business logic
  - CREATE integration tests for API endpoints and database operations
  - DEVELOP end-to-end tests for complete user workflows
  - SETUP automated testing pipeline with coverage reporting

Task 13: Security & Compliance Hardening
IMPLEMENT Security Measures:
  - AUDIT all endpoints for proper RBAC enforcement
  - IMPLEMENT comprehensive audit logging for compliance
  - SETUP rate limiting and request validation
  - CREATE backup and disaster recovery procedures

Task 14: Deployment & Production Setup
CONFIGURE Production Environment:
  - SETUP Docker containers with multi-stage builds
  - IMPLEMENT environment-specific configuration
  - CONFIGURE reverse proxy (nginx) and SSL certificates
  - SETUP monitoring and logging infrastructure
```

### Critical Pseudocode Examples

```python
# Task 3: Markdown Parser Core Logic
class ESGContentParser:
    def parse_sector_content(self, sector: BusinessSector) -> List[ESGQuestion]:
        """
        Parse sector-specific ESG content from markdown file.
        
        Returns:
            List of ESGQuestion objects with framework mappings
        """
        # CRITICAL: Parser must handle table format exactly
        markdown_content = self.load_content_file()
        
        # PATTERN: Use python-markdown with tables extension
        md = markdown.Markdown(extensions=['tables', 'extra'])
        html_content = md.convert(markdown_content)
        
        # GOTCHA: Table parsing requires BeautifulSoup for HTML parsing
        soup = BeautifulSoup(html_content, 'html.parser')
        
        sector_section = self.find_sector_section(soup, sector)
        table = sector_section.find('table')
        
        questions = []
        for row in table.find_all('tr')[1:]:  # Skip header
            cells = row.find_all('td')
            if len(cells) >= 4:
                question = ESGQuestion(
                    wizard_question=cells[0].get_text().strip(),
                    rationale=cells[1].get_text().strip(),
                    frameworks=cells[2].get_text().strip(),
                    data_source=cells[3].get_text().strip(),
                    sector=sector
                )
                questions.append(question)
        
        return questions

# Task 4: RBAC Middleware Implementation
@app.middleware("http")
async def rbac_middleware(request: Request, call_next):
    """
    Enforce site-scoped permissions on all requests.
    
    CRITICAL: Must filter all database queries by user site permissions
    """
    if request.url.path.startswith("/api/"):
        # PATTERN: Extract user from JWT token
        user = await get_current_user_from_token(request)
        
        if user:
            # GOTCHA: Inject user permissions into request state
            user_sites = await get_user_site_permissions(user.id)
            request.state.user = user
            request.state.accessible_sites = user_sites
        else:
            # CRITICAL: Block access to protected endpoints
            if not is_public_endpoint(request.url.path):
                raise HTTPException(401, "Authentication required")
    
    response = await call_next(request)
    return response

# Task 6: Secure File Upload Implementation
@router.post("/tasks/{task_id}/evidence")
async def upload_evidence(
    task_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload evidence file with security validation.
    
    CRITICAL: Validate file type, size, and scan for malware
    """
    # PATTERN: Validate file constraints first
    if file.size > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(400, "File too large")
    
    allowed_types = {'application/pdf', 'image/jpeg', 'image/png', 'application/vnd.ms-excel'}
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Invalid file type")
    
    # CRITICAL: Generate secure filename to prevent path traversal
    secure_filename = f"{uuid4()}_{file.filename}"
    file_path = f"evidence/{task_id}/{secure_filename}"
    
    # PATTERN: Calculate file hash for integrity verification
    file_content = await file.read()
    file_hash = hashlib.sha256(file_content).hexdigest()
    
    # GOTCHA: Reset file pointer after reading for hash
    await file.seek(0)
    
    # CRITICAL: Verify user has permission to upload to this task
    task = await get_task_with_site_check(db, task_id, current_user)
    if not task:
        raise HTTPException(404, "Task not found or access denied")
    
    # PATTERN: Store file securely with metadata
    evidence = Evidence(
        task_id=task_id,
        file_path=file_path,
        original_filename=file.filename,
        file_hash=file_hash,
        uploaded_by=current_user.id,
        uploaded_at=datetime.utcnow(),
        file_size=file.size,
        mime_type=file.content_type
    )
    
    # CRITICAL: Audit log the upload action
    await create_audit_log(
        user_id=current_user.id,
        action="evidence_upload",
        resource_type="evidence",
        resource_id=str(evidence.id),
        details={"task_id": str(task_id), "filename": file.filename}
    )
    
    return evidence
```

### Integration Points
```yaml
DATABASE:
  - migration: "Create comprehensive ESG platform schema with RBAC"
  - indexes: "CREATE INDEX idx_task_company_location ON tasks(company_id, location_id)"
  - constraints: "ENFORCE foreign key relationships and data integrity"

CONFIG:
  - add to: backend/app/config.py
  - pattern: "ESG_CONTENT_FILE = os.getenv('ESG_CONTENT_FILE', 'data/esg_content.md')"
  - pattern: "EVIDENCE_STORAGE_PATH = os.getenv('EVIDENCE_STORAGE', './uploads/evidence')"

ROUTES:
  - add to: backend/app/main.py
  - pattern: "app.include_router(auth_router, prefix='/api/auth', tags=['authentication'])"
  - pattern: "app.include_router(tasks_router, prefix='/api/tasks', tags=['tasks'])"

FRONTEND_STATE:
  - pattern: "Use Context API or Redux for user authentication state"
  - pattern: "Implement optimistic updates for task status changes"
  - pattern: "Cache ESG content and user permissions for offline capability"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Backend Python validation
ruff check backend/ --fix
mypy backend/
black backend/

# Frontend TypeScript validation  
npm run lint -- --fix
npm run typecheck
npm run format

# Expected: No errors. If errors exist, READ and fix systematically.
```

### Level 2: Unit Tests
```python
# CREATE comprehensive test coverage for each component:

# Test ESG content parser
def test_parse_hospitality_sector():
    """Test parsing hospitality sector questions correctly"""
    parser = ESGContentParser()
    questions = parser.parse_sector_content(BusinessSector.HOSPITALITY)
    assert len(questions) > 0
    assert any("sustainability policy" in q.wizard_question.lower() for q in questions)

# Test RBAC enforcement
def test_site_scoped_task_access():
    """Test users can only access tasks from their assigned sites"""
    with pytest.raises(HTTPException) as exc:
        get_task_with_site_check(db, task_id, unauthorized_user)
    assert exc.value.status_code == 404

# Test file upload security
def test_file_upload_validation():
    """Test file upload rejects dangerous file types"""
    with pytest.raises(HTTPException) as exc:
        upload_evidence(task_id, malicious_file, user, db)
    assert "Invalid file type" in str(exc.value.detail)
```

```bash
# Run all tests with coverage
uv run pytest tests/ -v --cov=backend --cov-report=html
npm test -- --coverage

# Expected: >80% test coverage, all tests passing
```

### Level 3: Integration Test
```bash
# Start the development environment
docker-compose up -d

# Test complete user workflow
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!", "company_name": "Test SME", "business_sector": "hospitality"}'

# Test ESG wizard endpoint
curl -X GET http://localhost:8000/api/esg/sectors/hospitality/questions \
  -H "Authorization: Bearer $TOKEN"

# Test task creation
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"wizard_answers": {...}}'

# Expected: Complete workflow succeeds with proper data creation
```

## Final Validation Checklist
- [ ] All tests pass: `uv run pytest tests/ -v && npm test`
- [ ] No linting errors: `ruff check backend/ && npm run lint`
- [ ] No type errors: `mypy backend/ && npm run typecheck`
- [ ] ESG content parser handles all 8 business sectors correctly
- [ ] RBAC properly restricts access to site-specific data
- [ ] File uploads are secure and maintain audit trails
- [ ] Dynamic task generation creates proper framework associations
- [ ] PDF reports include all required ESG compliance elements
- [ ] Frontend wizard properly guides users through sector-specific questions
- [ ] Dashboard accurately reflects task completion and progress metrics

---

## Anti-Patterns to Avoid
- ❌ Don't hard-code ESG content - use markdown file parsing for flexibility
- ❌ Don't skip RBAC validation on any data access - all queries must be site-scoped
- ❌ Don't trust file uploads - always validate content type, size, and scan for threats
- ❌ Don't expose task data across company boundaries - enforce strict data isolation
- ❌ Don't generate tasks without proper framework tagging - breaks "Collect Once, Use Many"
- ❌ Don't skip audit logging for compliance actions - maintain complete chain of custody
- ❌ Don't allow direct database access without permission middleware
- ❌ Don't store sensitive company data without encryption at rest

---

**PRP Confidence Score: 9/10**

This PRP provides comprehensive implementation guidance with specific attention to ESG compliance requirements, security best practices, and the unique challenges of dynamic content-driven applications. The high score reflects thorough research, detailed technical specifications, and clear validation criteria that should enable one-pass implementation success.