"""
Company and location models for ESG platform.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from uuid import uuid4
from enum import Enum

from ..database import Base
from ..auth.models import user_site_permissions


class BusinessSector(str, Enum):
    """Business sectors supported by the ESG platform."""
    HOSPITALITY = "hospitality"
    CONSTRUCTION = "construction"
    REAL_ESTATE = "real_estate"
    EDUCATION = "education"
    HEALTH = "health"
    LOGISTICS = "logistics"
    MANUFACTURING = "manufacturing"
    RETAIL = "retail"


class LocationType(str, Enum):
    """Types of locations within a company."""
    PRIMARY = "primary"
    SUB_LOCATION = "sub_location"


class Company(Base):
    """Company model representing SMEs in the UAE."""
    
    __tablename__ = "companies"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String, nullable=False)
    main_location = Column(String, nullable=False)  # Dubai, Abu Dhabi, etc.
    business_sector = Column(SQLEnum(BusinessSector), nullable=False)
    
    # Company details
    description = Column(String, nullable=True)
    website = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    
    # ESG Configuration
    active_frameworks = Column(String, nullable=True)  # JSON string of active frameworks
    
    # ESG Scoping Data
    esg_scoping_completed = Column(Boolean, default=False, nullable=False)
    scoping_completed_at = Column(DateTime(timezone=True), nullable=True)
    scoping_data = Column(JSON, nullable=True)  # Store scoping wizard results
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    users = relationship("User", back_populates="company")
    locations = relationship("Location", back_populates="company", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="company")


class Location(Base):
    """Location model for company sites and sub-locations."""
    
    __tablename__ = "locations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    company_id = Column(String, ForeignKey('companies.id'), nullable=False)
    name = Column(String, nullable=False)
    location_type = Column(SQLEnum(LocationType), nullable=False, default=LocationType.PRIMARY)
    
    # Hierarchy support
    parent_location_id = Column(String, ForeignKey('locations.id'), nullable=True)
    
    # Location details
    address = Column(String, nullable=True)
    description = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="locations")
    parent_location = relationship("Location", remote_side=[id], backref="sub_locations")
    tasks = relationship("Task", back_populates="location")
    assigned_users = relationship("User", secondary=user_site_permissions, back_populates="accessible_sites")