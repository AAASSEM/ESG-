"""
Pytest configuration and fixtures for ESG platform testing.
"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from httpx import AsyncClient
from faker import Faker

from app.main import app
from app.database import Base, get_db
from app.models.company import Company, BusinessSector, Location, LocationType
from app.auth.models import User
from app.models.tasks import Task, TaskStatus, TaskCategory, Evidence
from app.models.audit import AuditLog
from app.auth.dependencies import get_password_hash

# Initialize Faker for test data
fake = Faker()

# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
        echo=False
    )
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Clean up
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture(scope="function")
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    async_session_maker = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session_maker() as session:
        yield session


@pytest.fixture(scope="function")
async def client(test_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTP client with dependency overrides."""
    
    async def override_get_db():
        yield test_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
async def test_company(test_session: AsyncSession) -> Company:
    """Create a test company."""
    company = Company(
        name="Test SME Company",
        main_location="Dubai",
        business_sector=BusinessSector.HOSPITALITY,
        description="A test hospitality company",
        website="https://test-company.ae",
        phone="+971-4-123-4567",
        esg_scoping_completed=False
    )
    test_session.add(company)
    await test_session.commit()
    await test_session.refresh(company)
    return company


@pytest.fixture
async def test_location(test_session: AsyncSession, test_company: Company) -> Location:
    """Create a test location."""
    location = Location(
        company_id=test_company.id,
        name="Main Hotel",
        location_type=LocationType.PRIMARY,
        address="123 Sheikh Zayed Road, Dubai",
        description="Main hotel location"
    )
    test_session.add(location)
    await test_session.commit()
    await test_session.refresh(location)
    return location


@pytest.fixture
async def test_user(test_session: AsyncSession, test_company: Company) -> User:
    """Create a test user."""
    user = User(
        email="test@testcompany.ae",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test User",
        is_active=True,
        is_verified=True,
        company_id=test_company.id,
        role="admin"
    )
    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)
    return user


@pytest.fixture
async def test_manager_user(test_session: AsyncSession, test_company: Company) -> User:
    """Create a test manager user."""
    user = User(
        email="manager@testcompany.ae",
        hashed_password=get_password_hash("managerpass123"),
        full_name="Test Manager",
        is_active=True,
        is_verified=True,
        company_id=test_company.id,
        role="manager"
    )
    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)
    return user


@pytest.fixture
async def test_contributor_user(test_session: AsyncSession, test_company: Company) -> User:
    """Create a test contributor user."""
    user = User(
        email="contributor@testcompany.ae",
        hashed_password=get_password_hash("contributorpass123"),
        full_name="Test Contributor",
        is_active=True,
        is_verified=True,
        company_id=test_company.id,
        role="contributor"
    )
    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)
    return user


@pytest.fixture
async def test_task(test_session: AsyncSession, test_company: Company, test_location: Location) -> Task:
    """Create a test task."""
    task = Task(
        company_id=test_company.id,
        location_id=test_location.id,
        title="Implement sustainability policy",
        description="Create and implement a comprehensive sustainability policy",
        compliance_context="Green Key Global: 1.2 Sustainability Policy (I)",
        action_required="Signed policy document",
        status=TaskStatus.TODO,
        category=TaskCategory.GOVERNANCE,
        framework_tags=["Green Key Global", "Dubai Sustainable Tourism"],
        priority="high",
        required_evidence_count=1
    )
    test_session.add(task)
    await test_session.commit()
    await test_session.refresh(task)
    return task


@pytest.fixture
async def test_completed_task(test_session: AsyncSession, test_company: Company, test_user: User) -> Task:
    """Create a completed test task."""
    task = Task(
        company_id=test_company.id,
        title="Track electricity consumption",
        description="Monitor monthly electricity usage from DEWA",
        compliance_context="DST Carbon Calculator: Mandatory Input",
        action_required="Monthly utility bills",
        status=TaskStatus.COMPLETED,
        category=TaskCategory.ENERGY,
        assigned_user_id=test_user.id,
        framework_tags=["Dubai Sustainable Tourism"],
        priority="high",
        required_evidence_count=3
    )
    test_session.add(task)
    await test_session.commit()
    await test_session.refresh(task)
    return task


@pytest.fixture
async def test_evidence(test_session: AsyncSession, test_task: Task, test_user: User) -> Evidence:
    """Create test evidence."""
    evidence = Evidence(
        task_id=test_task.id,
        file_path="evidence/test_file.pdf",
        original_filename="sustainability_policy.pdf",
        file_hash="abc123def456",
        uploaded_by=test_user.id,
        file_size=1024000,
        mime_type="application/pdf"
    )
    test_session.add(evidence)
    await test_session.commit()
    await test_session.refresh(evidence)
    return evidence


@pytest.fixture
async def test_audit_log(test_session: AsyncSession, test_user: User, test_company: Company) -> AuditLog:
    """Create test audit log."""
    audit_log = AuditLog(
        user_id=test_user.id,
        action="task_created",
        resource_type="task",
        resource_id="test-task-id",
        details={"title": "Test task creation"},
        ip_address="192.168.1.100"
    )
    test_session.add(audit_log)
    await test_session.commit()
    await test_session.refresh(audit_log)
    return audit_log


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """Create authentication headers for API requests."""
    from app.auth.dependencies import create_access_token
    
    access_token = create_access_token(data={"sub": test_user.id})
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def manager_auth_headers(test_manager_user: User) -> dict:
    """Create authentication headers for manager user."""
    from app.auth.dependencies import create_access_token
    
    access_token = create_access_token(data={"sub": test_manager_user.id})
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def contributor_auth_headers(test_contributor_user: User) -> dict:
    """Create authentication headers for contributor user."""
    from app.auth.dependencies import create_access_token
    
    access_token = create_access_token(data={"sub": test_contributor_user.id})
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
async def sample_tasks(test_session: AsyncSession, test_company: Company) -> list[Task]:
    """Create a collection of sample tasks for testing."""
    tasks = []
    
    # Create tasks across different categories and statuses
    task_data = [
        {
            "title": "Energy monitoring system",
            "category": TaskCategory.ENERGY,
            "status": TaskStatus.COMPLETED,
            "frameworks": ["Dubai Sustainable Tourism", "Green Key Global"]
        },
        {
            "title": "Water conservation program",
            "category": TaskCategory.WATER,
            "status": TaskStatus.IN_PROGRESS,
            "frameworks": ["Green Key Global"]
        },
        {
            "title": "Waste management policy",
            "category": TaskCategory.WASTE,
            "status": TaskStatus.TODO,
            "frameworks": ["UAE Federal Law No. 12 of 2018"]
        },
        {
            "title": "Supply chain assessment",
            "category": TaskCategory.SUPPLY_CHAIN,
            "status": TaskStatus.PENDING_REVIEW,
            "frameworks": ["Green Key Global"]
        },
        {
            "title": "Employee training program",
            "category": TaskCategory.SOCIAL,
            "status": TaskStatus.COMPLETED,
            "frameworks": ["Dubai Sustainable Tourism"]
        }
    ]
    
    for data in task_data:
        task = Task(
            company_id=test_company.id,
            title=data["title"],
            description=f"Description for {data['title']}",
            compliance_context=f"Framework requirements for {data['title']}",
            action_required="Required action items",
            status=data["status"],
            category=data["category"],
            framework_tags=data["frameworks"],
            priority="medium",
            required_evidence_count=1
        )
        test_session.add(task)
        tasks.append(task)
    
    await test_session.commit()
    
    # Refresh all tasks
    for task in tasks:
        await test_session.refresh(task)
    
    return tasks


@pytest.fixture
def esg_content_sample() -> str:
    """Sample ESG content for testing markdown parser."""
    return '''
#### **1\\. Hospitality Sector (Hotels & Restaurants)**

**Intersecting Frameworks:**

* **Dubai Sustainable Tourism (DST):** A mandatory framework for all hotel establishments
* **Green Key Global:** A voluntary international certification

**Scoping Questions for Hospitality:**

| Wizard Question (Plain-English) | Rationale / Underlying Metric | Intersecting Frameworks & Requirements | Data Source / Checklist Item |
| :---- | :---- | :---- | :---- |
| **Governance & Management** |  |  |  |
| Do you have a sustainability policy? | Formal Commitment | Green Key: 1.2 Sustainability Policy (I) | Signed policy document |
| Do you track electricity consumption? | Scope 2 Emissions | DST Carbon Calculator: Mandatory Input | Monthly utility bills |
| **Energy** |  |  |  |
| Do you use renewable energy? | Clean Energy Usage | Green Key: 7.3 Renewable Energy | Energy certificates |
'''