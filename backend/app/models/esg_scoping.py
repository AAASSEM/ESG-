"""
ESG Scoping models for storing assessment data.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Integer, Boolean, Float, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from ..database import Base


class ESGScopingResponse(Base):
    """Store ESG scoping wizard responses and assessment data."""
    
    __tablename__ = "esg_scoping_responses"
    
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey('companies.id'), nullable=False)
    
    # Scoping data
    sector = Column(String, nullable=False)
    answers = Column(JSON, nullable=False)  # Question ID -> answer mapping
    preferences = Column(JSON, nullable=True)  # User preferences
    location_data = Column(JSON, nullable=True)  # Location-specific data
    
    # Completion tracking
    completed_at = Column(DateTime(timezone=True), nullable=False)
    tasks_generated_count = Column(Integer, default=0)
    
    # Assessment metadata
    assessment_score = Column(Float, nullable=True)
    framework_compliance = Column(JSON, nullable=True)  # Framework -> compliance status
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="esg_scoping_responses")


class UtilityMeter(Base):
    """Store utility meter information for consumption tracking."""
    
    __tablename__ = "utility_meters"
    
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey('companies.id'), nullable=False)
    location_name = Column(String, nullable=True)  # Simple location name instead of foreign key
    
    # Meter details
    meter_type = Column(String, nullable=False)  # electricity, water, gas
    meter_number = Column(String, nullable=True)
    provider = Column(String, nullable=True)  # DEWA, ADWEA, etc.
    unit_of_measurement = Column(String, nullable=False)  # kWh, m³, etc.
    
    # Installation and status
    installation_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="utility_meters")
    consumption_records = relationship("ConsumptionRecord", back_populates="meter")


class ConsumptionRecord(Base):
    """Store monthly utility consumption data."""
    
    __tablename__ = "consumption_records"
    
    id = Column(String, primary_key=True)
    meter_id = Column(String, ForeignKey('utility_meters.id'), nullable=False)
    
    # Consumption data
    reading_date = Column(Date, nullable=False)
    consumption_amount = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=True)
    total_cost = Column(Float, nullable=True)
    bill_reference = Column(String, nullable=True)
    
    # Upload tracking
    uploaded_by = Column(String, ForeignKey('users.id'), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    meter = relationship("UtilityMeter", back_populates="consumption_records")
    uploader = relationship("User", back_populates="consumption_uploads")


class FrameworkRegistration(Base):
    """Track company registrations with ESG frameworks."""
    
    __tablename__ = "framework_registrations"
    
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey('companies.id'), nullable=False)
    
    # Framework details
    framework_name = Column(String, nullable=False)  # DST, Green Key, etc.
    registration_number = Column(String, nullable=True)
    registration_date = Column(Date, nullable=True)
    status = Column(String, default="pending")  # pending, active, expired
    renewal_date = Column(Date, nullable=True)
    
    # Registration metadata
    registration_data = Column(JSON, nullable=True)  # Framework-specific data
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="framework_registrations")