"""
Task and evidence models for ESG platform.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Date, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from uuid import uuid4
from enum import Enum
from datetime import datetime

from ..database import Base


class TaskStatus(str, Enum):
    """Task status options."""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    PENDING_REVIEW = "pending_review"
    COMPLETED = "completed"


class TaskCategory(str, Enum):
    """ESG task categories."""
    GOVERNANCE = "governance"
    ENERGY = "energy"
    WATER = "water"
    WASTE = "waste"
    SUPPLY_CHAIN = "supply_chain"
    SOCIAL = "social"
    ENVIRONMENTAL = "environmental"


class Task(Base):
    """Task model for ESG compliance activities."""
    
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    company_id = Column(String, ForeignKey('companies.id'), nullable=False)
    location_id = Column(String, ForeignKey('locations.id'), nullable=True)
    
    # Task content from markdown parsing
    title = Column(String, nullable=False)  # From "Wizard Question (Plain-English)"
    description = Column(Text, nullable=False)  # From "Rationale / Underlying Metric"
    compliance_context = Column(Text, nullable=False)  # From "Intersecting Frameworks"
    action_required = Column(Text, nullable=False)  # From "Data Source / Checklist Item"
    
    # Task management
    status = Column(SQLEnum(TaskStatus), nullable=False, default=TaskStatus.TODO)
    category = Column(SQLEnum(TaskCategory), nullable=False)
    assigned_user_id = Column(String, ForeignKey('users.id'), nullable=True)
    
    # Framework associations for "Collect Once, Use Many"
    framework_tags = Column(ARRAY(String), nullable=False, default=[])
    
    # Dates
    due_date = Column(Date, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="tasks")
    location = relationship("Location", back_populates="tasks")
    assigned_user = relationship("User", foreign_keys=[assigned_user_id], back_populates="tasks_assigned")
    evidence = relationship("Evidence", back_populates="task", cascade="all, delete-orphan")


class Evidence(Base):
    """Evidence model for task completion documentation."""
    
    __tablename__ = "evidence"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    task_id = Column(String, ForeignKey('tasks.id'), nullable=False)
    
    # File information
    file_path = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)  # SHA-256 for integrity
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=False)
    
    # Upload metadata
    uploaded_by = Column(String, ForeignKey('users.id'), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Description
    description = Column(Text, nullable=True)
    
    # Relationships
    task = relationship("Task", back_populates="evidence")
    uploaded_by_user = relationship("User", back_populates="evidence_uploads")