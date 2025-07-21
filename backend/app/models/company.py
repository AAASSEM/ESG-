"""
Company model - Fixed for SQLite compatibility.
"""
from sqlalchemy import Column, String, Boolean, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class BusinessSector(str, enum.Enum):
    """Business sectors available for companies."""
    HOSPITALITY = "hospitality"
    CONSTRUCTION = "construction"
    REAL_ESTATE = "real_estate"
    LOGISTICS = "logistics"
    RETAIL = "retail"
    MANUFACTURING = "manufacturing"
    EDUCATION = "education"
    HEALTH = "health"
    OTHER = "other"


class Company(Base):
    """Company model with SQLite-compatible string ID."""
    __tablename__ = "companies"
    
    # Use String ID instead of UUID for SQLite compatibility
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    main_location = Column(String, default="UAE")
    business_sector = Column(SQLEnum(BusinessSector), nullable=True)
    description = Column(String, nullable=True)
    website = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    active_frameworks = Column(String, nullable=True)
    
    # ESG Scoping
    esg_scoping_completed = Column(Boolean, default=False)
    scoping_completed_at = Column(DateTime, nullable=True)
    scoping_data = Column(JSON, nullable=True)  # Store full scoping results
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="company", cascade="all, delete-orphan")
    esg_scoping_responses = relationship("ESGScopingResponse", back_populates="company", cascade="all, delete-orphan")
    framework_registrations = relationship("FrameworkRegistration", back_populates="company", cascade="all, delete-orphan")
    utility_meters = relationship("UtilityMeter", back_populates="company", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Company(id={self.id}, name={self.name})>"

