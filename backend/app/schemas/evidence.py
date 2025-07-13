"""
Pydantic schemas for evidence management.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class EvidenceBase(BaseModel):
    """Base evidence schema."""
    original_filename: str = Field(..., description="Original filename of uploaded file")
    file_size: int = Field(..., ge=0, description="File size in bytes")
    mime_type: str = Field(..., description="MIME type of the file")


class EvidenceCreate(EvidenceBase):
    """Schema for creating evidence records."""
    task_id: str = Field(..., description="Task ID this evidence belongs to")


class EvidenceResponse(EvidenceBase):
    """Schema for evidence responses."""
    id: str = Field(..., description="Evidence record ID")
    task_id: str = Field(..., description="Task ID this evidence belongs to")
    file_path: str = Field(..., description="Relative file path in storage")
    file_hash: str = Field(..., description="SHA-256 hash for integrity verification")
    uploaded_by: str = Field(..., description="User ID who uploaded the file")
    uploaded_at: datetime = Field(..., description="Upload timestamp")
    
    class Config:
        from_attributes = True


class EvidenceUpdate(BaseModel):
    """Schema for updating evidence metadata."""
    original_filename: Optional[str] = None
    
    class Config:
        from_attributes = True


class FileUploadResponse(BaseModel):
    """Response schema for file uploads."""
    id: str = Field(..., description="Evidence record ID")
    message: str = Field(..., description="Success message")
    file_info: EvidenceResponse = Field(..., description="Uploaded file information")


class FileDownloadInfo(BaseModel):
    """Information about a file download."""
    filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type")
    download_url: str = Field(..., description="Download URL")