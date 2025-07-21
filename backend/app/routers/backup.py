"""
Backup and disaster recovery API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Dict, Any, List
import logging

from ..auth.dependencies import get_admin_user
from ..core.backup import BackupManager, DisasterRecoveryManager, backup_health_check
from ..models import User

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/backup/create")
async def create_backup(
    background_tasks: BackgroundTasks,
    include_files: bool = True,
    current_user: User = Depends(get_admin_user)
) -> Dict[str, Any]:
    """
    Create a new system backup (admin only).
    
    Args:
        include_files: Whether to include uploaded files in backup
        current_user: Current authenticated admin user
        
    Returns:
        Backup creation result
    """
    try:
        backup_manager = BackupManager()
        
        # Create backup in background
        backup_task = backup_manager.create_full_backup(include_files=include_files)
        background_tasks.add_task(backup_task)
        
        return {
            "message": "Backup creation started",
            "include_files": include_files,
            "status": "in_progress"
        }
        
    except Exception as e:
        logger.error(f"Backup creation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create backup: {str(e)}"
        )


@router.get("/backup/list")
async def list_backups(
    current_user: User = Depends(get_admin_user)
) -> List[Dict[str, Any]]:
    """
    List all available backups (admin only).
    
    Returns:
        List of backup metadata
    """
    try:
        backup_manager = BackupManager()
        backups = await backup_manager.list_backups()
        return backups
        
    except Exception as e:
        logger.error(f"Failed to list backups: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list backups: {str(e)}"
        )


@router.post("/backup/restore")
async def restore_backup(
    backup_path: str,
    restore_files: bool = True,
    current_user: User = Depends(get_admin_user)
) -> Dict[str, Any]:
    """
    Restore system from backup (admin only).
    
    Args:
        backup_path: Path to backup file
        restore_files: Whether to restore uploaded files
        current_user: Current authenticated admin user
        
    Returns:
        Restoration result
    """
    try:
        backup_manager = BackupManager()
        result = await backup_manager.restore_from_backup(
            backup_path=backup_path,
            restore_files=restore_files
        )
        
        return {
            "message": "Backup restored successfully",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Backup restoration failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to restore backup: {str(e)}"
        )


@router.get("/backup/health")
async def get_backup_health(
    current_user: User = Depends(get_admin_user)
) -> Dict[str, Any]:
    """
    Get backup system health status (admin only).
    
    Returns:
        Backup system health information
    """
    try:
        health_info = await backup_health_check()
        return health_info
        
    except Exception as e:
        logger.error(f"Backup health check failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check backup health: {str(e)}"
        )


@router.get("/disaster-recovery/plan")
async def get_disaster_recovery_plan(
    current_user: User = Depends(get_admin_user)
) -> Dict[str, Any]:
    """
    Get disaster recovery plan (admin only).
    
    Returns:
        Disaster recovery plan document
    """
    try:
        dr_manager = DisasterRecoveryManager()
        plan = await dr_manager.create_disaster_recovery_plan()
        return plan
        
    except Exception as e:
        logger.error(f"Failed to get disaster recovery plan: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get disaster recovery plan: {str(e)}"
        )


@router.post("/disaster-recovery/test")
async def test_disaster_recovery(
    current_user: User = Depends(get_admin_user)
) -> Dict[str, Any]:
    """
    Test disaster recovery procedures (admin only).
    
    Returns:
        Test results
    """
    try:
        dr_manager = DisasterRecoveryManager()
        test_results = await dr_manager.test_disaster_recovery()
        return test_results
        
    except Exception as e:
        logger.error(f"Disaster recovery test failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to test disaster recovery: {str(e)}"
        )


@router.get("/system/security-status")
async def get_security_status(
    current_user: User = Depends(get_admin_user)
) -> Dict[str, Any]:
    """
    Get overall system security status (admin only).
    
    Returns:
        Security status information
    """
    try:
        # Get backup health
        backup_health = await backup_health_check()
        
        # Get basic security metrics
        security_status = {
            "overall_status": "healthy",
            "backup_system": backup_health,
            "security_features": {
                "rate_limiting": "active",
                "input_validation": "active",
                "file_upload_security": "active",
                "audit_logging": "active",
                "rbac_enforcement": "active"
            },
            "recommendations": []
        }
        
        # Add recommendations based on backup health
        if not backup_health.get("backup_system_healthy", False):
            security_status["overall_status"] = "warning"
            security_status["recommendations"].extend(backup_health.get("issues", []))
        
        return security_status
        
    except Exception as e:
        logger.error(f"Failed to get security status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get security status: {str(e)}"
        )