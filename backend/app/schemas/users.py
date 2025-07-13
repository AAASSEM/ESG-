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
    role: Optional[str] = "contributor"
    
    # Company creation fields (for registration)
    company_name: Optional[str] = None
    main_location: Optional[str] = None
    business_sector: Optional[BusinessSector] = None
    company_description: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v
    
    @validator('role')
    def validate_role(cls, v):
        allowed_roles = ["admin", "manager", "contributor"]
        if v not in allowed_roles:
            raise ValueError(f'Role must be one of: {allowed_roles}')
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


class TokenData(BaseModel):
    """Schema for token data."""
    user_id: Optional[str] = None