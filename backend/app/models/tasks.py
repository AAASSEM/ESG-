"""
Task model - Fixed for SQLite compatibility.
"""
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class TaskStatus(str, enum.Enum):
    """Task completion status."""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class TaskCategory(str, enum.Enum):
    """ESG task categories."""
    ENVIRONMENTAL = "environmental"
    SOCIAL = "social"
    GOVERNANCE = "governance"
    ENERGY = "energy"
    WATER = "water"
    WASTE = "waste"
    SUPPLY_CHAIN = "supply_chain"


class TaskPriority(str, enum.Enum):
    """Task priority levels."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TaskType(str, enum.Enum):
    """Task type classification."""
    COMPLIANCE = "compliance"
    MONITORING = "monitoring"
    IMPROVEMENT = "improvement"


class Task(Base):
    """Task model with SQLite-compatible string ID."""
    __tablename__ = "tasks"
    
    # Use String ID instead of UUID for SQLite compatibility
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"))
    
    # Task details
    title = Column(String, nullable=False)
    description = Column(Text)
    compliance_context = Column(Text)
    action_required = Column(Text)
    
    # Classification
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.TODO)
    category = Column(SQLEnum(TaskCategory), nullable=False)
    priority = Column(SQLEnum(TaskPriority), default=TaskPriority.MEDIUM)
    task_type = Column(SQLEnum(TaskType), default=TaskType.COMPLIANCE)
    
    # Framework and requirements
    framework_tags = Column(String)  # JSON string of framework tags
    regulatory_requirement = Column(String, default="false")  # Store as string for SQLite
    sector = Column(String)
    
    # Task metadata
    due_date = Column(DateTime, nullable=True)
    estimated_hours = Column(Integer, default=8)
    required_evidence_count = Column(Integer, default=1)
    recurring_frequency = Column(String, nullable=True)
    phase_dependency = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    company = relationship("Company", back_populates="tasks")
    evidence = relationship("Evidence", back_populates="task", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Task(id={self.id}, title={self.title}, status={self.status})>"

