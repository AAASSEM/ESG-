"""
Company and location schemas for API serialization.
"""
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime

from ..models.company import BusinessSector, LocationType


class LocationBase(BaseModel):
    """Base location schema."""
    name: str
    location_type: LocationType = LocationType.PRIMARY
    address: Optional[str] = None
    description: Optional[str] = None


class LocationCreate(LocationBase):
    """Schema for location creation."""
    parent_location_id: Optional[str] = None


class LocationUpdate(BaseModel):
    """Schema for location updates."""
    name: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None


class LocationResponse(LocationBase):
    """Schema for location responses."""
    id: str
    company_id: str
    parent_location_id: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class CompanyBase(BaseModel):
    """Base company schema."""
    name: str
    main_location: str
    business_sector: BusinessSector
    description: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None


class CompanyCreate(CompanyBase):
    """Schema for company creation."""
    pass


class CompanyUpdate(BaseModel):
    """Schema for company updates."""
    name: Optional[str] = None
    main_location: Optional[str] = None
    business_sector: Optional[BusinessSector] = None
    description: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    active_frameworks: Optional[str] = None


class CompanyResponse(CompanyBase):
    """Schema for company responses."""
    id: str
    active_frameworks: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Related data
    locations: Optional[List[LocationResponse]] = []
    
    class Config:
        from_attributes = True


class CompanyProfile(BaseModel):
    """Extended company profile with statistics."""
    id: str
    name: str
    main_location: str
    business_sector: BusinessSector
    description: Optional[str]
    website: Optional[str]
    phone: Optional[str]
    active_frameworks: Optional[str]
    created_at: datetime
    
    # Statistics
    total_users: int
    total_locations: int
    total_tasks: int
    completed_tasks: int
    completion_percentage: float
    
    # Locations
    locations: List[LocationResponse]
    
    class Config:
        from_attributes = True