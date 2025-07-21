"""
Centralized model imports to avoid circular dependencies.
"""
from ..database import Base

# Import all models here to ensure they use the same Base
from .company import Company, BusinessSector
from .user import User, UserRole
from .tasks import Task, TaskStatus, TaskCategory, TaskPriority, TaskType
from .evidence import Evidence
from .audit import AuditLog
from .esg_scoping import ESGScopingResponse, UtilityMeter, ConsumptionRecord, FrameworkRegistration

__all__ = [
    'Base',
    'Company', 
    'BusinessSector',
    'User',
    'UserRole',
    'Task', 
    'TaskStatus', 
    'TaskCategory', 
    'TaskPriority', 
    'TaskType',
    'Evidence',
    'AuditLog',
    'ESGScopingResponse',
    'UtilityMeter',
    'ConsumptionRecord', 
    'FrameworkRegistration'
]