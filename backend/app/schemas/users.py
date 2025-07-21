"""
User schemas for API serialization.
"""
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime

from ..models.company import BusinessSector


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    """Schema for user creation."""
    password: str
    company_name: str
    business_sector: BusinessSector
    description: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    active_frameworks: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v
    
    @validator('business_sector', pre=True)
    def validate_business_sector(cls, v):
        if isinstance(v, str):
            # Convert uppercase enum names to lowercase values
            sector_mapping = {
                'HOSPITALITY': 'hospitality',
                'CONSTRUCTION': 'construction', 
                'REAL_ESTATE': 'real_estate',
                'LOGISTICS': 'logistics',
                'RETAIL': 'retail',
                'MANUFACTURING': 'manufacturing',
                'EDUCATION': 'education',
                'HEALTH': 'health',
                'OTHER': 'other'
            }
            return sector_mapping.get(v.upper(), v.lower())
        return v
    


class UserUpdate(BaseModel):
    """Schema for user updates."""
    full_name: Optional[str] = None
    password: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if v is not None and len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserResponse(UserBase):
    """Schema for user responses."""
    id: str
    role: str
    company_id: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserInvite(BaseModel):
    """Schema for user invitations."""
    email: EmailStr
    full_name: str
    role: str = "contributor"
    
    @validator('role')
    def validate_role(cls, v):
        allowed_roles = ["manager", "contributor"]  # Can't invite admin
        if v not in allowed_roles:
            raise ValueError(f'Role must be one of: {allowed_roles}')
        return v


class Token(BaseModel):
    """Schema for JWT tokens."""
    access_token: str
    refresh_token: str
    token_type: str


class AuthResponse(BaseModel):
    """Schema for authentication responses."""
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    """Schema for token data."""
    user_id: Optional[str] = None