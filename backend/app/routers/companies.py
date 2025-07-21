"""
Fixed routers/companies.py to match the actual Company model
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..schemas.company import (
    CompanyResponse, 
    CompanyUpdate, 
    CompanyProfile
)
from ..models import Company, User, Task, TaskStatus
from ..auth.dependencies import (
    get_current_user, 
    require_admin, 
    require_manager,
    create_audit_log
)

router = APIRouter()


@router.get("/me", response_model=CompanyProfile)
@router.get("/current", response_model=CompanyProfile)  # Alternative endpoint
async def get_my_company(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's company with statistics."""
    try:
        # Get company with related data
        result = await db.execute(
            select(Company)
            .where(Company.id == current_user.company_id)
        )
        company = result.scalar_one_or_none()
        
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Get statistics
        users_count = await db.execute(
            select(func.count(User.id))
            .where(User.company_id == company.id)
        )
        total_users = users_count.scalar() or 0
        
        # Get task statistics
        tasks_count = await db.execute(
            select(func.count(Task.id))
            .where(Task.company_id == company.id)
        )
        total_tasks = tasks_count.scalar() or 0
        
        completed_tasks_count = await db.execute(
            select(func.count(Task.id))
            .where(
                Task.company_id == company.id,
                Task.status == TaskStatus.COMPLETED
            )
        )
        completed_tasks = completed_tasks_count.scalar() or 0
        
        # Calculate completion percentage
        completion_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Get location data from scoping_data if available
        locations = []
        if company.scoping_data and 'location_data' in company.scoping_data:
            locations = company.scoping_data['location_data']
        
        return CompanyProfile(
            id=company.id,
            name=company.name,
            main_location=company.main_location,
            business_sector=company.business_sector,
            esg_scoping_completed=company.esg_scoping_completed,
            scoping_completed_at=company.scoping_completed_at,
            created_at=company.created_at,
            updated_at=company.updated_at,
            total_users=total_users,
            total_locations=len(locations),
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            completion_percentage=completion_percentage,
            locations=locations,
            scoping_data=company.scoping_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.put("/me", response_model=CompanyResponse)
async def update_my_company(
    company_update: CompanyUpdate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's company (Admin only)."""
    try:
        result = await db.execute(
            select(Company).where(Company.id == current_user.company_id)
        )
        company = result.scalar_one_or_none()
        
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Update fields
        update_data = company_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(company, field, value)
        
        await db.commit()
        await db.refresh(company)
        
        # Create audit log
        await create_audit_log(
            db=db,
            user_id=current_user.id,
            action="company_update",
            resource_type="company",
            resource_id=str(company.id),
            details=update_data,
            ip_address=request.client.host if request.client else None
        )
        
        return CompanyResponse(
            id=company.id,
            name=company.name,
            main_location=company.main_location,
            business_sector=company.business_sector,
            esg_scoping_completed=company.esg_scoping_completed,
            scoping_completed_at=company.scoping_completed_at,
            created_at=company.created_at,
            updated_at=company.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")


@router.post("/{company_id}/locations")
async def save_locations(
    company_id: str,
    locations: List[dict],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save location data to company's scoping_data."""
    if current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Get company
        result = await db.execute(
            select(Company).where(Company.id == company_id)
        )
        company = result.scalar_one_or_none()
        
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Update scoping_data with locations
        if not company.scoping_data:
            company.scoping_data = {}
        
        company.scoping_data['location_data'] = locations
        
        # Mark the column as modified to ensure SQLAlchemy saves it
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(company, "scoping_data")
        
        await db.commit()
        
        return {
            "message": "Locations saved successfully",
            "locations_count": len(locations),
            "company_id": company_id,
            "locations": locations
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save locations: {str(e)}")


@router.get("/{company_id}/locations")
async def get_locations(
    company_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get location data from company's scoping_data."""
    if current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Get company
        result = await db.execute(
            select(Company).where(Company.id == company_id)
        )
        company = result.scalar_one_or_none()
        
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Get locations from scoping_data
        locations = []
        if company.scoping_data and 'location_data' in company.scoping_data:
            locations = company.scoping_data['location_data']
        
        return {
            "locations": locations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get locations: {str(e)}")