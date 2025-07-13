"""
Main FastAPI application for ESG platform.
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import time
import logging

from .config import settings
from .database import init_db
from .auth.router import router as auth_router
from .routers.companies import router as companies_router
from .routers.tasks import router as tasks_router
from .core.markdown_parser import ESGContentParser
from .middleware.security import SecurityMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="ESG Scoping & Task Management Platform",
    description="A comprehensive ESG compliance platform for UAE SMEs",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware for security
if not settings.debug:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1"]
    )

# Add comprehensive security middleware
app.add_middleware(SecurityMiddleware)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time header to responses."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


@app.middleware("http")
async def rbac_middleware(request: Request, call_next):
    """
    RBAC middleware for site-scoped permissions.
    
    This middleware injects user permissions into request state for
    automatic data filtering based on user site access.
    """
    # Skip middleware for public endpoints
    public_paths = ["/docs", "/redoc", "/openapi.json", "/api/auth/register", "/api/auth/token"]
    
    if any(request.url.path.startswith(path) for path in public_paths):
        response = await call_next(request)
        return response
    
    # For API endpoints, extract user from token if present
    if request.url.path.startswith("/api/"):
        authorization = request.headers.get("Authorization")
        
        if authorization and authorization.startswith("Bearer "):
            try:
                from .auth.dependencies import get_current_user, get_user_site_permissions
                from .database import AsyncSessionLocal
                import jwt
                
                token = authorization.split(" ")[1]
                payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
                user_id = payload.get("sub")
                
                if user_id:
                    async with AsyncSessionLocal() as db:
                        from .auth.dependencies import get_user_by_id
                        user = await get_user_by_id(db, user_id)
                        
                        if user:
                            user_sites = await get_user_site_permissions(db, user.id)
                            request.state.user = user
                            request.state.accessible_sites = user_sites
                        
            except Exception as e:
                logger.warning(f"Token validation failed: {e}")
                # Continue without user context for optional authentication
                pass
    
    response = await call_next(request)
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "path": request.url.path
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """General exception handler for unhandled exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    if settings.debug:
        return JSONResponse(
            status_code=500,
            content={
                "error": str(exc),
                "type": type(exc).__name__,
                "path": request.url.path
            }
        )
    else:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "path": request.url.path
            }
        )


# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
app.include_router(companies_router, prefix="/api/companies", tags=["companies"])
app.include_router(tasks_router, prefix="/api/tasks", tags=["tasks"])

# Evidence management
from .routers.evidence import router as evidence_router
app.include_router(evidence_router, prefix="/api", tags=["evidence"])

# ESG scoping wizard
from .routers.esg_scoping import router as esg_scoping_router
app.include_router(esg_scoping_router, prefix="/api", tags=["esg_scoping"])

# Reports and analytics
from .routers.reports import router as reports_router
app.include_router(reports_router, prefix="/api/reports", tags=["reports"])

# Security audit endpoints
from .core.security_audit import create_security_audit_endpoint
create_security_audit_endpoint(app)

# Backup and disaster recovery
from .routers.backup import router as backup_router
app.include_router(backup_router, prefix="/api/admin", tags=["backup", "disaster-recovery"])


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    try:
        # Initialize database
        await init_db()
        logger.info("Database initialized successfully")
        
        # Validate ESG content structure
        parser = ESGContentParser()
        if parser.validate_content_structure():
            logger.info("ESG content validation passed")
        else:
            logger.warning("ESG content validation failed - some features may not work correctly")
        
        logger.info("Application startup completed")
        
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown."""
    logger.info("Application shutdown")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "ESG Scoping & Task Management Platform API",
        "version": "1.0.0",
        "status": "active"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0"
    }


@app.get("/api/sectors")
async def get_supported_sectors():
    """Get list of supported business sectors."""
    from .models.company import BusinessSector
    
    return {
        "sectors": [
            {
                "value": sector.value,
                "label": sector.value.replace("_", " ").title()
            }
            for sector in BusinessSector
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )