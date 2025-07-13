"""
Authentication and authorization dependencies.
"""
from datetime import datetime, timedelta
from typing import Optional, List
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..config import settings
from .models import User
from ..models import Location, AuditLog

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")


class AuthenticationError(HTTPException):
    """Custom authentication error."""
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthorizationError(HTTPException):
    """Custom authorization error."""
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get user by email address."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    """Get user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    """Authenticate user with email and password."""
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Get current authenticated user from JWT token."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise AuthenticationError()
    except jwt.PyJWTError:
        raise AuthenticationError()
    
    user = await get_user_by_id(db, user_id)
    if user is None:
        raise AuthenticationError()
    
    if not user.is_active:
        raise AuthenticationError("User account is disabled")
    
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise AuthenticationError("User account is disabled")
    return current_user


async def get_user_site_permissions(db: AsyncSession, user_id: str) -> List[str]:
    """Get list of site IDs user has access to."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        return []
    
    # Return site IDs user has access to
    return [site.id for site in user.accessible_sites]


class RoleChecker:
    """Dependency class for checking user roles."""
    
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles
    
    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise AuthorizationError(f"Role '{current_user.role}' not allowed. Required: {self.allowed_roles}")
        return current_user


class SiteAccessChecker:
    """Dependency class for checking site access permissions."""
    
    def __init__(self, require_site_access: bool = True):
        self.require_site_access = require_site_access
    
    async def __call__(
        self,
        site_id: Optional[str] = None,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        if not self.require_site_access:
            return current_user
        
        if site_id is None:
            return current_user  # No specific site required
        
        # Check if user has access to this site
        user_sites = await get_user_site_permissions(db, current_user.id)
        
        if current_user.role == "admin":
            return current_user  # Admins have access to all sites
        
        if site_id not in user_sites:
            raise AuthorizationError("Access denied to this site")
        
        return current_user


async def create_audit_log(
    db: AsyncSession,
    user_id: str,
    action: str,
    resource_type: str,
    resource_id: str,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Create audit log entry."""
    try:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.utcnow()
        )
        
        db.add(audit_log)
        await db.commit()
        
    except Exception as e:
        await db.rollback()
        # Log the error but don't fail the main operation
        import logging
        logging.error(f"Failed to create audit log: {e}")


# Role-based dependencies
require_admin = RoleChecker(["admin"])
require_manager = RoleChecker(["admin", "manager"])
require_any_role = RoleChecker(["admin", "manager", "contributor"])

# Site access dependencies  
require_site_access = SiteAccessChecker(require_site_access=True)
optional_site_access = SiteAccessChecker(require_site_access=False)

# Common role-based dependencies
get_admin_user = require_admin

# Optional authentication dependency
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Header

optional_bearer = HTTPBearer(auto_error=False)

async def get_current_user_optional(
    db: AsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_bearer)
) -> Optional[User]:
    """Get current user if token is provided, otherwise return None."""
    if not credentials:
        return None
    
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except jwt.PyJWTError:
        return None
    
    user = await get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        return None
    
    return user