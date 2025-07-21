"""
User model - Fixed for SQLite compatibility.
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class UserRole(str, enum.Enum):
    """User roles with permissions."""
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    CONTRIBUTOR = "CONTRIBUTOR"
    VIEWER = "VIEWER"


class User(Base):
    """User model with SQLite-compatible string ID."""
    __tablename__ = "users"
    
    # Use String ID instead of UUID for SQLite compatibility
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    
    # Role and permissions
    role = Column(SQLEnum(UserRole), default=UserRole.CONTRIBUTOR)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Company association
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    company = relationship("Company", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    consumption_uploads = relationship("ConsumptionRecord", back_populates="uploader")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"