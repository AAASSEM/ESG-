"""
Audit log model for compliance and traceability.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from uuid import uuid4

from ..database import Base


class AuditLog(Base):
    """Audit log model for tracking all system activities."""
    
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    
    # Action details
    action = Column(String, nullable=False)  # create, update, delete, upload, login, etc.
    resource_type = Column(String, nullable=False)  # company, task, evidence, user, etc.
    resource_id = Column(String, nullable=False)  # ID of the affected resource
    
    # Additional details
    details = Column(JSON, nullable=True)  # Additional context as JSON
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Timestamp
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")