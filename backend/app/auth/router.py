"""
Authentication router for login, registration, and user management.
"""
from datetime import timedelta, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import uuid4

from ..database import get_db
from ..schemas.users import UserCreate, UserResponse, Token, UserUpdate, AuthResponse
from ..models import Company, User
from ..models.company import BusinessSector
from ..models.user import UserRole
from .dependencies import (
    authenticate_user, 
    create_access_token, 
    create_refresh_token,
    get_password_hash,
    get_current_user,
    create_audit_log,
    require_admin,
    require_manager
)
from ..config import settings

router = APIRouter()


@router.post("/register-debug")
async def debug_register_request(request: Request):
    """Debug endpoint to see what the frontend is sending."""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        body = await request.body()
        headers = dict(request.headers)
        logger.info(f"Request body: {body.decode()}")
        logger.info(f"Request headers: {headers}")
        return {"body": body.decode(), "headers": headers}
    except Exception as e:
        logger.error(f"Debug error: {e}")
        return {"error": str(e)}


@router.post("/register", response_model=AuthResponse)
async def register_user(
    user_data: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user and company."""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Registration attempt for email: {user_data.email}")
        logger.info(f"Business sector: {user_data.business_sector}")
        logger.info(f"Company name: {user_data.company_name}")
        # Check if user already exists
        existing_user = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if existing_user.scalar_one_or_none():
            logger.warning(f"User already exists: {user_data.email}")
            raise HTTPException(
                status_code=400,
                detail="User with this email already exists. Please use a different email or log in instead."
            )
        
        # Create company first (exactly like hybrid_main.py)
        company_id = str(uuid4())
        company = Company(
            name=user_data.company_name,
            main_location="UAE",  # Default value since frontend doesn't send this
            business_sector=user_data.business_sector,
            description=user_data.description,
            website=user_data.website,
            phone=user_data.phone,
            active_frameworks=user_data.active_frameworks,
            esg_scoping_completed=False
        )
        # Manually set the ID as string to avoid UUID type issues
        company.id = company_id
        db.add(company)
        await db.flush()  # Get company ID
        
        # Create user as admin of the company
        user_id = str(uuid4())
        hashed_password = get_password_hash(user_data.password)
        user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            company_id=company.id,
            role=UserRole.ADMIN,  # First user is always admin
            is_active=True,
            is_verified=False
        )
        # Manually set the ID as string to avoid UUID type issues
        user.id = user_id
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        # Create audit log
        await create_audit_log(
            db=db,
            user_id=user.id,
            action="user_register",
            resource_type="user",
            resource_id=str(user.id),
            details={
                "email": user.email,
                "company_id": str(company.id),
                "role": user.role
            },
            ip_address=request.client.host if request.client else None
        )
        
        # Create tokens for the new user
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=user.role,
                company_id=user.company_id,
                is_active=user.is_active,
                is_verified=user.is_verified,
                created_at=user.created_at
            )
        )
        
    except Exception as e:
        logger.error(f"Registration error for {user_data.email if 'user_data' in locals() else 'unknown'}: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Full error details: {repr(e)}")
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/token", response_model=AuthResponse)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Authenticate user and return JWT tokens."""
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled"
        )
    
    # Create tokens
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Update last login
    user.last_login = datetime.utcnow()  # Current time
    await db.commit()
    
    # Create audit log
    await create_audit_log(
        db=db,
        user_id=user.id,
        action="user_login",
        resource_type="user",
        resource_id=str(user.id),
        ip_address=request.client.host if request.client else None
    )
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            company_id=user.company_id,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        company_id=current_user.company_id,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user information."""
    try:
        # Update user fields
        if user_update.full_name is not None:
            current_user.full_name = user_update.full_name
        
        if user_update.password is not None:
            current_user.hashed_password = get_password_hash(user_update.password)
        
        await db.commit()
        await db.refresh(current_user)
        
        # Create audit log
        await create_audit_log(
            db=db,
            user_id=current_user.id,
            action="user_update",
            resource_type="user",
            resource_id=str(current_user.id),
            details={"updated_fields": user_update.dict(exclude_unset=True)}
        )
        
        return UserResponse(
            id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name,
            role=current_user.role,
            company_id=current_user.company_id,
            is_active=current_user.is_active,
            is_verified=current_user.is_verified,
            created_at=current_user.created_at
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/invite", response_model=UserResponse)
async def invite_user(
    user_data: UserCreate,
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db)
):
    """Invite a new user to the company (Manager/Admin only)."""
    try:
        # Check if user already exists
        existing_user = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if existing_user.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="User with this email already exists"
            )
        
        # Create user in same company
        hashed_password = get_password_hash(user_data.password)
        user = User(
            id=str(uuid4()),
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            company_id=current_user.company_id,  # Same company as inviter
            role=user_data.role or UserRole.CONTRIBUTOR,
            is_active=True,
            is_verified=False
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        # Create audit log
        await create_audit_log(
            db=db,
            user_id=current_user.id,
            action="user_invite",
            resource_type="user",
            resource_id=str(user.id),
            details={
                "invited_email": user.email,
                "role": user.role,
                "invited_by": current_user.email
            }
        )
        
        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            company_id=user.company_id,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Logout user (create audit log)."""
    await create_audit_log(
        db=db,
        user_id=current_user.id,
        action="user_logout",
        resource_type="user",
        resource_id=str(current_user.id),
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": "Successfully logged out"}