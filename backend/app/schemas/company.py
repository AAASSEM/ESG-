"""
Updated schemas/company.py to match the actual Company model
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from ..models.company import BusinessSector


class CompanyBase(BaseModel):
    """Base company schema."""
    name: str = Field(..., min_length=1, max_length=255)
    main_location: Optional[str] = "UAE"
    business_sector: Optional[BusinessSector] = None


class CompanyCreate(CompanyBase):
    """Schema for creating a company."""
    pass


class CompanyUpdate(BaseModel):
    """Schema for updating a company."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    main_location: Optional[str] = None
    business_sector: Optional[BusinessSector] = None


class CompanyResponse(CompanyBase):
    """Company response schema."""
    id: str
    esg_scoping_completed: bool = False
    scoping_completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class CompanyProfile(CompanyResponse):
    """Extended company profile with statistics."""
    total_users: int = 0
    total_locations: int = 0
    total_tasks: int = 0
    completed_tasks: int = 0
    completion_percentage: float = 0.0
    locations: List[dict] = []  # Simplified for now
    scoping_data: Optional[dict] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }