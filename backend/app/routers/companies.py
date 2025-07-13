"""
Company and location management router.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..schemas.company import (
    CompanyResponse, 
    CompanyUpdate, 
    CompanyProfile,
    LocationCreate, 
    LocationResponse, 
    LocationUpdate
)
from ..models import Company, Location, User, Task
from ..auth.dependencies import (
    get_current_user, 
    require_admin, 
    require_manager,
    create_audit_log
)

router = APIRouter()


@router.get("/me", response_model=CompanyProfile)
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
        total_users = users_count.scalar()
        
        locations_count = await db.execute(
            select(func.count(Location.id))
            .where(Location.company_id == company.id)
        )
        total_locations = locations_count.scalar()
        
        tasks_count = await db.execute(
            select(func.count(Task.id))
            .where(Task.company_id == company.id)
        )
        total_tasks = tasks_count.scalar()
        
        completed_tasks_count = await db.execute(
            select(func.count(Task.id))
            .where(
                Task.company_id == company.id,
                Task.status == 'completed'
            )
        )
        completed_tasks = completed_tasks_count.scalar()
        
        # Get locations
        locations_result = await db.execute(
            select(Location)
            .where(Location.company_id == company.id)
            .order_by(Location.created_at)
        )
        locations = locations_result.scalars().all()
        
        completion_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        return CompanyProfile(
            id=company.id,
            name=company.name,
            main_location=company.main_location,
            business_sector=company.business_sector,
            description=company.description,
            website=company.website,
            phone=company.phone,
            active_frameworks=company.active_frameworks,
            created_at=company.created_at,
            total_users=total_users,
            total_locations=total_locations,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            completion_percentage=completion_percentage,
            locations=[
                LocationResponse(
                    id=loc.id,
                    company_id=loc.company_id,
                    name=loc.name,
                    location_type=loc.location_type,
                    parent_location_id=loc.parent_location_id,
                    address=loc.address,
                    description=loc.description,
                    created_at=loc.created_at,
                    updated_at=loc.updated_at
                ) for loc in locations
            ]
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


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
            description=company.description,
            website=company.website,
            phone=company.phone,
            active_frameworks=company.active_frameworks,
            created_at=company.created_at,
            updated_at=company.updated_at
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/locations", response_model=List[LocationResponse])
async def get_company_locations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all locations for current user's company."""
    try:
        result = await db.execute(
            select(Location)
            .where(Location.company_id == current_user.company_id)
            .order_by(Location.created_at)
        )
        locations = result.scalars().all()
        
        return [
            LocationResponse(
                id=loc.id,
                company_id=loc.company_id,
                name=loc.name,
                location_type=loc.location_type,
                parent_location_id=loc.parent_location_id,
                address=loc.address,
                description=loc.description,
                created_at=loc.created_at,
                updated_at=loc.updated_at
            ) for loc in locations
        ]
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/locations", response_model=LocationResponse)
async def create_location(
    location_data: LocationCreate,
    request: Request,
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db)
):
    """Create a new location (Manager/Admin only)."""
    try:
        from uuid import uuid4
        
        location = Location(
            id=uuid4(),
            company_id=current_user.company_id,
            name=location_data.name,
            location_type=location_data.location_type,
            parent_location_id=location_data.parent_location_id,
            address=location_data.address,
            description=location_data.description
        )
        
        db.add(location)
        await db.commit()
        await db.refresh(location)
        
        # Create audit log
        await create_audit_log(
            db=db,
            user_id=current_user.id,
            action="location_create",
            resource_type="location",
            resource_id=str(location.id),
            details={
                "name": location.name,
                "location_type": location.location_type.value,
                "parent_location_id": str(location.parent_location_id) if location.parent_location_id else None
            },
            ip_address=request.client.host if request.client else None
        )
        
        return LocationResponse(
            id=location.id,
            company_id=location.company_id,
            name=location.name,
            location_type=location.location_type,
            parent_location_id=location.parent_location_id,
            address=location.address,
            description=location.description,
            created_at=location.created_at,
            updated_at=location.updated_at
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/locations/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: str,
    location_update: LocationUpdate,
    request: Request,
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db)
):
    """Update a location (Manager/Admin only)."""
    try:
        result = await db.execute(
            select(Location)
            .where(
                Location.id == location_id,
                Location.company_id == current_user.company_id
            )
        )
        location = result.scalar_one_or_none()
        
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")
        
        # Update fields
        update_data = location_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(location, field, value)
        
        await db.commit()
        await db.refresh(location)
        
        # Create audit log
        await create_audit_log(
            db=db,
            user_id=current_user.id,
            action="location_update",
            resource_type="location",
            resource_id=str(location.id),
            details=update_data,
            ip_address=request.client.host if request.client else None
        )
        
        return LocationResponse(
            id=location.id,
            company_id=location.company_id,
            name=location.name,
            location_type=location.location_type,
            parent_location_id=location.parent_location_id,
            address=location.address,
            description=location.description,
            created_at=location.created_at,
            updated_at=location.updated_at
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/locations/{location_id}")
async def delete_location(
    location_id: str,
    request: Request,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a location (Admin only)."""
    try:
        result = await db.execute(
            select(Location)
            .where(
                Location.id == location_id,
                Location.company_id == current_user.company_id
            )
        )
        location = result.scalar_one_or_none()
        
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")
        
        # Check if location has sub-locations or tasks
        sub_locations = await db.execute(
            select(func.count(Location.id))
            .where(Location.parent_location_id == location_id)
        )
        if sub_locations.scalar() > 0:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete location with sub-locations"
            )
        
        tasks_count = await db.execute(
            select(func.count(Task.id))
            .where(Task.location_id == location_id)
        )
        if tasks_count.scalar() > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete location with associated tasks"
            )
        
        await db.delete(location)
        await db.commit()
        
        # Create audit log
        await create_audit_log(
            db=db,
            user_id=current_user.id,
            action="location_delete",
            resource_type="location",
            resource_id=str(location.id),
            details={"name": location.name},
            ip_address=request.client.host if request.client else None
        )
        
        return {"message": "Location deleted successfully"}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))