"""
Audit log model for tracking user actions.
"""
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class AuditLog(Base):
    """Audit log for tracking all user actions."""
    __tablename__ = "audit_logs"
    
    # Use String ID instead of UUID for SQLite compatibility
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Action details
    action = Column(String, nullable=False)  # e.g., "user_login", "task_create"
    resource_type = Column(String)  # e.g., "task", "company", "user"
    resource_id = Column(String)  # ID of affected resource
    
    # Additional context
    details = Column(JSON)  # Additional action details
    ip_address = Column(String)
    user_agent = Column(Text)
    
    # Timestamp
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, user_id={self.user_id})>"