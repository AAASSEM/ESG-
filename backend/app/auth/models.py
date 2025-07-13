"""
Authentication and authorization models.
"""
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from uuid import uuid4
from datetime import datetime

from ..database import Base


# Association table for user-site permissions
user_site_permissions = Table(
    'user_site_permissions',
    Base.metadata,
    Column('user_id', String, ForeignKey('users.id'), primary_key=True),
    Column('site_id', String, ForeignKey('locations.id'), primary_key=True)
)


class User(Base):
    """User model with role-based access control."""
    
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Company association
    company_id = Column(String, ForeignKey('companies.id'), nullable=False)
    
    # Role
    role = Column(String, nullable=False, default="contributor")  # admin, manager, contributor
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    company = relationship("Company", back_populates="users")
    accessible_sites = relationship("Location", secondary=user_site_permissions, back_populates="assigned_users")
    tasks_assigned = relationship("Task", foreign_keys="Task.assigned_user_id", back_populates="assigned_user")
    evidence_uploads = relationship("Evidence", back_populates="uploaded_by_user")
    audit_logs = relationship("AuditLog", back_populates="user")


class Role(Base):
    """Role definitions for RBAC."""
    
    __tablename__ = "roles"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String, unique=True, nullable=False)  # admin, manager, contributor
    description = Column(String, nullable=True)
    permissions = Column(String, nullable=False, default="[]")  # JSON string for SQLite
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Permission(Base):
    """Permission definitions for granular access control."""
    
    __tablename__ = "permissions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    resource_type = Column(String, nullable=False)  # company, location, task, evidence
    action = Column(String, nullable=False)  # create, read, update, delete
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())