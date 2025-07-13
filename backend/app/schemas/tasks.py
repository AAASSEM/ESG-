"""
Task and evidence schemas for API serialization.
"""
from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date

from ..models.tasks import TaskStatus, TaskCategory


class TaskBase(BaseModel):
    """Base task schema."""
    title: str
    description: str
    compliance_context: str
    action_required: str
    category: TaskCategory
    due_date: Optional[date] = None


class TaskCreate(TaskBase):
    """Schema for task creation."""
    location_id: Optional[str] = None
    assigned_user_id: Optional[str] = None
    framework_tags: List[str] = []


class TaskUpdate(BaseModel):
    """Schema for task updates."""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    assigned_user_id: Optional[str] = None
    due_date: Optional[date] = None
    location_id: Optional[str] = None


class TaskAssignment(BaseModel):
    """Schema for task assignment."""
    assigned_user_id: Optional[str] = None
    location_id: Optional[str] = None


class EvidenceBase(BaseModel):
    """Base evidence schema."""
    description: Optional[str] = None


class EvidenceCreate(EvidenceBase):
    """Schema for evidence creation."""
    pass


class EvidenceResponse(EvidenceBase):
    """Schema for evidence responses."""
    id: str
    task_id: str
    original_filename: str
    file_size: int
    mime_type: str
    uploaded_by: str
    uploaded_at: datetime
    file_hash: str
    
    class Config:
        from_attributes = True


class TaskResponse(TaskBase):
    """Schema for task responses."""
    id: str
    company_id: str
    location_id: Optional[str]
    status: TaskStatus
    assigned_user_id: Optional[str]
    framework_tags: List[str]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Related data
    evidence: Optional[List[EvidenceResponse]] = []
    
    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    """Schema for task list responses with metadata."""
    tasks: List[TaskResponse]
    total_count: int
    completed_count: int
    in_progress_count: int
    todo_count: int
    pending_review_count: int


class TaskFilters(BaseModel):
    """Schema for task filtering."""
    status: Optional[TaskStatus] = None
    category: Optional[TaskCategory] = None
    assigned_user_id: Optional[str] = None
    location_id: Optional[str] = None
    framework_tag: Optional[str] = None
    due_before: Optional[date] = None
    due_after: Optional[date] = None


class TaskStats(BaseModel):
    """Schema for task statistics."""
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    todo_tasks: int
    pending_review_tasks: int
    overdue_tasks: int
    completion_percentage: float
    
    # Category breakdown
    category_stats: Dict[str, int]
    
    # Framework breakdown
    framework_stats: Dict[str, Dict[str, int]]


class WizardAnswers(BaseModel):
    """Schema for ESG wizard answers."""
    sector: str
    answers: Dict[str, Any]
    company_id: str
    location_id: Optional[str] = None


class TaskGeneration(BaseModel):
    """Schema for task generation request."""
    company_id: str
    location_id: Optional[str] = None
    assigned_user_id: Optional[str] = None
    regenerate: bool = False