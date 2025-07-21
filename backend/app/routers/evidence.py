"""
Evidence management router for file uploads and downloads.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import uuid4
import os
import hashlib
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Optional

from ..database import get_db
from ..auth.dependencies import get_current_user
from ..models import Evidence, Task, User
from ..schemas.evidence import EvidenceResponse, EvidenceCreate
from ..config import settings

router = APIRouter()

# Allowed file types and sizes
ALLOWED_EXTENSIONS = {
    'application/pdf',
    'image/jpeg', 
    'image/png',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  # xlsx
    'text/csv'
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def validate_file(file: UploadFile) -> None:
    """Validate uploaded file type and size."""
    if file.content_type not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file.content_type} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )

async def verify_task_access(
    task_id: str, 
    user: User, 
    db: AsyncSession
) -> Task:
    """Verify user has access to task and return task."""
    # Get task with site access check
    query = select(Task).where(
        and_(
            Task.id == task_id,
            Task.company_id == user.company_id  # Site-scoped access
        )
    )
    result = await db.execute(query)
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or access denied"
        )
    
    return task

def calculate_file_hash(file_path: str) -> str:
    """Calculate SHA-256 hash of file for integrity verification."""
    hash_sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()

def ensure_upload_directory(task_id: str) -> Path:
    """Ensure upload directory exists for task."""
    upload_dir = Path(settings.evidence_storage_path) / str(task_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir

@router.post("/tasks/{task_id}/evidence", response_model=EvidenceResponse)
async def upload_evidence(
    task_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload evidence file for a task.
    
    Security features:
    - File type validation
    - File size limits
    - Secure filename generation
    - SHA-256 integrity verification
    - Site-scoped access control
    - Audit logging
    """
    # Validate file
    validate_file(file)
    
    # Verify task access
    task = await verify_task_access(task_id, current_user, db)
    
    # Generate secure filename
    file_extension = Path(file.filename or "").suffix
    secure_filename = f"{uuid4()}{file_extension}"
    
    # Ensure upload directory exists
    upload_dir = ensure_upload_directory(task_id)
    file_path = upload_dir / secure_filename
    
    try:
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Calculate file hash for integrity
        file_hash = calculate_file_hash(str(file_path))
        
        # Create evidence record
        evidence = Evidence(
            task_id=task_id,
            file_path=str(file_path.relative_to(Path(settings.evidence_storage_path))),
            original_filename=file.filename or "unknown",
            file_hash=file_hash,
            uploaded_by=current_user.id,
            uploaded_at=datetime.utcnow(),
            file_size=file.size or os.path.getsize(file_path),
            mime_type=file.content_type or "application/octet-stream"
        )
        
        db.add(evidence)
        await db.commit()
        await db.refresh(evidence)
        
        # Create audit log entry
        from ..models.audit import AuditLog
        audit_log = AuditLog(
            user_id=current_user.id,
            action="evidence_upload",
            resource_type="evidence",
            resource_id=str(evidence.id),
            details={
                "task_id": str(task_id),
                "filename": file.filename,
                "file_size": evidence.file_size,
                "file_hash": file_hash
            },
            timestamp=datetime.utcnow(),
            ip_address="unknown"  # TODO: Extract from request
        )
        db.add(audit_log)
        await db.commit()
        
        return evidence
        
    except Exception as e:
        # Clean up file if database operation fails
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )

@router.get("/tasks/{task_id}/evidence", response_model=List[EvidenceResponse])
async def get_task_evidence(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all evidence files for a task."""
    # Verify task access
    task = await verify_task_access(task_id, current_user, db)
    
    # Get evidence for task
    query = select(Evidence).where(Evidence.task_id == task_id)
    result = await db.execute(query)
    evidence_list = result.scalars().all()
    
    return evidence_list

@router.get("/evidence/{evidence_id}")
async def download_evidence(
    evidence_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Download evidence file."""
    # Get evidence record
    query = select(Evidence).where(Evidence.id == evidence_id)
    result = await db.execute(query)
    evidence = result.scalar_one_or_none()
    
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found"
        )
    
    # Verify task access
    await verify_task_access(evidence.task_id, current_user, db)
    
    # Check if file exists
    file_path = Path(settings.evidence_storage_path) / evidence.file_path
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    # Verify file integrity
    current_hash = calculate_file_hash(str(file_path))
    if current_hash != evidence.file_hash:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File integrity check failed"
        )
    
    # Create audit log entry
    from ..models.audit import AuditLog
    audit_log = AuditLog(
        user_id=current_user.id,
        action="evidence_download",
        resource_type="evidence",
        resource_id=str(evidence.id),
        details={
            "task_id": str(evidence.task_id),
            "filename": evidence.original_filename
        },
        timestamp=datetime.utcnow(),
        ip_address="unknown"  # TODO: Extract from request
    )
    db.add(audit_log)
    await db.commit()
    
    return FileResponse(
        path=str(file_path),
        filename=evidence.original_filename,
        media_type=evidence.mime_type
    )

@router.delete("/evidence/{evidence_id}")
async def delete_evidence(
    evidence_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete evidence file."""
    # Get evidence record
    query = select(Evidence).where(Evidence.id == evidence_id)
    result = await db.execute(query)
    evidence = result.scalar_one_or_none()
    
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found"
        )
    
    # Verify task access
    await verify_task_access(evidence.task_id, current_user, db)
    
    # Check if user can delete (only uploader or admin)
    if evidence.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete files you uploaded"
        )
    
    try:
        # Delete file from disk
        file_path = Path(settings.evidence_storage_path) / evidence.file_path
        if file_path.exists():
            file_path.unlink()
        
        # Delete database record
        await db.delete(evidence)
        await db.commit()
        
        # Create audit log entry
        from ..models.audit import AuditLog
        audit_log = AuditLog(
            user_id=current_user.id,
            action="evidence_delete",
            resource_type="evidence",
            resource_id=str(evidence.id),
            details={
                "task_id": str(evidence.task_id),
                "filename": evidence.original_filename
            },
            timestamp=datetime.utcnow(),
            ip_address="unknown"  # TODO: Extract from request
        )
        db.add(audit_log)
        await db.commit()
        
        return {"message": "Evidence deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete evidence: {str(e)}"
        )