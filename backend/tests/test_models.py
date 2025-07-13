"""
Unit tests for database models.
"""
import pytest
from datetime import datetime, date

from app.models.company import Company, BusinessSector, Location, LocationType
from app.models.tasks import Task, TaskStatus, TaskCategory, Evidence
from app.auth.models import User
from app.models.audit import AuditLog


class TestCompanyModel:
    """Test suite for Company model."""
    
    def test_company_creation(self):
        """Test company instance creation."""
        company = Company(
            name="Test Company",
            main_location="Dubai",
            business_sector=BusinessSector.HOSPITALITY,
            description="A test company",
            website="https://testcompany.ae",
            phone="+971-4-123-4567"
        )
        
        assert company.name == "Test Company"
        assert company.main_location == "Dubai"
        assert company.business_sector == BusinessSector.HOSPITALITY
        assert company.description == "A test company"
        assert company.website == "https://testcompany.ae"
        assert company.phone == "+971-4-123-4567"
        assert company.esg_scoping_completed == False
        assert company.scoping_data is None
    
    def test_business_sector_enum(self):
        """Test BusinessSector enum values."""
        assert BusinessSector.HOSPITALITY == "hospitality"
        assert BusinessSector.CONSTRUCTION == "construction"
        assert BusinessSector.REAL_ESTATE == "real_estate"
        assert BusinessSector.EDUCATION == "education"
        assert BusinessSector.HEALTH == "health"
        assert BusinessSector.LOGISTICS == "logistics"
        assert BusinessSector.MANUFACTURING == "manufacturing"
        assert BusinessSector.RETAIL == "retail"
    
    def test_company_with_esg_scoping(self):
        """Test company with ESG scoping data."""
        scoping_data = {
            "sector": "hospitality",
            "answers": {"1": "yes", "2": "no"},
            "preferences": {"priority": "high"}
        }
        
        company = Company(
            name="Test Company",
            main_location="Dubai",
            business_sector=BusinessSector.HOSPITALITY,
            esg_scoping_completed=True,
            scoping_completed_at=datetime.utcnow(),
            scoping_data=scoping_data
        )
        
        assert company.esg_scoping_completed == True
        assert company.scoping_completed_at is not None
        assert company.scoping_data == scoping_data


class TestLocationModel:
    """Test suite for Location model."""
    
    def test_location_creation(self):
        """Test location instance creation."""
        location = Location(
            company_id="test-company-id",
            name="Main Office",
            location_type=LocationType.PRIMARY,
            address="123 Sheikh Zayed Road, Dubai",
            description="Main office location"
        )
        
        assert location.company_id == "test-company-id"
        assert location.name == "Main Office"
        assert location.location_type == LocationType.PRIMARY
        assert location.address == "123 Sheikh Zayed Road, Dubai"
        assert location.description == "Main office location"
        assert location.parent_location_id is None
    
    def test_location_hierarchy(self):
        """Test location parent-child relationship."""
        parent_location = Location(
            company_id="test-company-id",
            name="Main Office",
            location_type=LocationType.PRIMARY
        )
        
        sub_location = Location(
            company_id="test-company-id",
            name="Floor 2",
            location_type=LocationType.SUB_LOCATION,
            parent_location_id="parent-location-id"
        )
        
        assert sub_location.parent_location_id == "parent-location-id"
        assert sub_location.location_type == LocationType.SUB_LOCATION
    
    def test_location_type_enum(self):
        """Test LocationType enum values."""
        assert LocationType.PRIMARY == "primary"
        assert LocationType.SUB_LOCATION == "sub_location"


class TestTaskModel:
    """Test suite for Task model."""
    
    def test_task_creation(self):
        """Test task instance creation."""
        task = Task(
            company_id="test-company-id",
            title="Implement sustainability policy",
            description="Create and implement a comprehensive sustainability policy",
            compliance_context="Green Key Global: 1.2 Sustainability Policy",
            action_required="Signed policy document",
            status=TaskStatus.TODO,
            category=TaskCategory.GOVERNANCE,
            framework_tags=["Green Key Global", "Dubai Sustainable Tourism"],
            priority="high",
            required_evidence_count=1
        )
        
        assert task.company_id == "test-company-id"
        assert task.title == "Implement sustainability policy"
        assert task.status == TaskStatus.TODO
        assert task.category == TaskCategory.GOVERNANCE
        assert task.framework_tags == ["Green Key Global", "Dubai Sustainable Tourism"]
        assert task.priority == "high"
        assert task.required_evidence_count == 1
    
    def test_task_status_enum(self):
        """Test TaskStatus enum values."""
        assert TaskStatus.TODO == "todo"
        assert TaskStatus.IN_PROGRESS == "in_progress"
        assert TaskStatus.PENDING_REVIEW == "pending_review"
        assert TaskStatus.COMPLETED == "completed"
    
    def test_task_category_enum(self):
        """Test TaskCategory enum values."""
        assert TaskCategory.GOVERNANCE == "governance"
        assert TaskCategory.ENERGY == "energy"
        assert TaskCategory.WATER == "water"
        assert TaskCategory.WASTE == "waste"
        assert TaskCategory.SUPPLY_CHAIN == "supply_chain"
        assert TaskCategory.SOCIAL == "social"
        assert TaskCategory.ENVIRONMENTAL == "environmental"
    
    def test_task_with_assignment(self):
        """Test task with user assignment."""
        task = Task(
            company_id="test-company-id",
            title="Test task",
            description="Test description",
            status=TaskStatus.IN_PROGRESS,
            category=TaskCategory.ENERGY,
            assigned_user_id="test-user-id",
            due_date=date(2024, 12, 31)
        )
        
        assert task.assigned_user_id == "test-user-id"
        assert task.due_date == date(2024, 12, 31)
        assert task.status == TaskStatus.IN_PROGRESS


class TestEvidenceModel:
    """Test suite for Evidence model."""
    
    def test_evidence_creation(self):
        """Test evidence instance creation."""
        evidence = Evidence(
            task_id="test-task-id",
            file_path="evidence/sustainability_policy.pdf",
            original_filename="sustainability_policy.pdf",
            file_hash="abc123def456",
            uploaded_by="test-user-id",
            file_size=1024000,
            mime_type="application/pdf"
        )
        
        assert evidence.task_id == "test-task-id"
        assert evidence.file_path == "evidence/sustainability_policy.pdf"
        assert evidence.original_filename == "sustainability_policy.pdf"
        assert evidence.file_hash == "abc123def456"
        assert evidence.uploaded_by == "test-user-id"
        assert evidence.file_size == 1024000
        assert evidence.mime_type == "application/pdf"


class TestUserModel:
    """Test suite for User model."""
    
    def test_user_creation(self):
        """Test user instance creation."""
        user = User(
            email="test@example.com",
            hashed_password="hashed_password_here",
            full_name="Test User",
            is_active=True,
            is_verified=True,
            company_id="test-company-id",
            role="admin"
        )
        
        assert user.email == "test@example.com"
        assert user.hashed_password == "hashed_password_here"
        assert user.full_name == "Test User"
        assert user.is_active == True
        assert user.is_verified == True
        assert user.company_id == "test-company-id"
        assert user.role == "admin"
    
    def test_user_defaults(self):
        """Test user model defaults."""
        user = User(
            email="test@example.com",
            hashed_password="hashed_password_here",
            full_name="Test User",
            company_id="test-company-id"
        )
        
        assert user.is_active == True  # Default value
        assert user.is_verified == False  # Default value
        assert user.role == "contributor"  # Default value


class TestAuditLogModel:
    """Test suite for AuditLog model."""
    
    def test_audit_log_creation(self):
        """Test audit log instance creation."""
        audit_log = AuditLog(
            user_id="test-user-id",
            action="task_created",
            resource_type="task",
            resource_id="test-task-id",
            details={"title": "Test task creation"},
            ip_address="192.168.1.100"
        )
        
        assert audit_log.user_id == "test-user-id"
        assert audit_log.action == "task_created"
        assert audit_log.resource_type == "task"
        assert audit_log.resource_id == "test-task-id"
        assert audit_log.details == {"title": "Test task creation"}
        assert audit_log.ip_address == "192.168.1.100"
        assert audit_log.timestamp is not None