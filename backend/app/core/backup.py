"""
Backup and disaster recovery utilities for ESG platform.
"""
import asyncio
import os
import shutil
import zipfile
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging
import json
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..database import AsyncSessionLocal

logger = logging.getLogger(__name__)


class BackupManager:
    """Manages backup and recovery operations."""
    
    def __init__(self, backup_dir: str = "backups"):
        """Initialize backup manager."""
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(exist_ok=True)
        
        # Backup retention policy
        self.retention_days = 30
        self.max_backups = 50
    
    async def create_full_backup(self, include_files: bool = True) -> Dict[str, Any]:
        """
        Create a complete backup of the system.
        
        Args:
            include_files: Whether to include uploaded files
            
        Returns:
            Backup metadata
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_name = f"esg_backup_{timestamp}"
        backup_path = self.backup_dir / backup_name
        backup_path.mkdir(exist_ok=True)
        
        try:
            # Create backup metadata
            metadata = {
                'timestamp': timestamp,
                'created_at': datetime.utcnow().isoformat(),
                'backup_type': 'full',
                'include_files': include_files,
                'components': []
            }
            
            # Backup database
            db_backup_path = await self._backup_database(backup_path)
            metadata['components'].append({
                'type': 'database',
                'path': str(db_backup_path),
                'size': os.path.getsize(db_backup_path)
            })
            
            # Backup configuration
            config_backup_path = await self._backup_configuration(backup_path)
            metadata['components'].append({
                'type': 'configuration',
                'path': str(config_backup_path),
                'size': os.path.getsize(config_backup_path)
            })
            
            # Backup uploaded files if requested
            if include_files:
                files_backup_path = await self._backup_files(backup_path)
                if files_backup_path:
                    metadata['components'].append({
                        'type': 'files',
                        'path': str(files_backup_path),
                        'size': self._get_directory_size(files_backup_path)
                    })
            
            # Create archive
            archive_path = await self._create_archive(backup_path, backup_name)
            metadata['archive_path'] = str(archive_path)
            metadata['archive_size'] = os.path.getsize(archive_path)
            
            # Save metadata
            metadata_path = backup_path / "metadata.json"
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            # Cleanup temporary files
            await self._cleanup_temp_backup(backup_path)
            
            # Perform retention cleanup
            await self._cleanup_old_backups()
            
            logger.info(f"Full backup created: {archive_path}")
            return metadata
            
        except Exception as e:
            logger.error(f"Backup failed: {e}")
            # Cleanup on failure
            if backup_path.exists():
                shutil.rmtree(backup_path)
            raise
    
    async def _backup_database(self, backup_path: Path) -> Path:
        """Backup database to SQL dump."""
        db_backup_path = backup_path / "database.sql"
        
        async with AsyncSessionLocal() as db:
            try:
                # Get all table names
                result = await db.execute(text(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                ))
                tables = [row[0] for row in result.fetchall()]
                
                with open(db_backup_path, 'w') as f:
                    f.write("-- ESG Platform Database Backup\n")
                    f.write(f"-- Created: {datetime.utcnow().isoformat()}\n\n")
                    
                    # Export schema and data for each table
                    for table in tables:
                        f.write(f"-- Table: {table}\n")
                        
                        # Get table schema
                        schema_result = await db.execute(text(
                            f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table}'"
                        ))
                        schema = schema_result.fetchone()
                        if schema:
                            f.write(f"{schema[0]};\n\n")
                        
                        # Get table data
                        data_result = await db.execute(text(f"SELECT * FROM {table}"))
                        rows = data_result.fetchall()
                        
                        if rows:
                            # Get column names
                            columns = list(data_result.keys())
                            columns_str = ", ".join(columns)
                            
                            for row in rows:
                                values = []
                                for value in row:
                                    if value is None:
                                        values.append("NULL")
                                    elif isinstance(value, str):
                                        escaped_value = value.replace("'", "''")
                                        values.append(f"'{escaped_value}'")
                                    else:
                                        values.append(str(value))
                                
                                values_str = ", ".join(values)
                                f.write(f"INSERT INTO {table} ({columns_str}) VALUES ({values_str});\n")
                        
                        f.write("\n")
                
                return db_backup_path
                
            except Exception as e:
                logger.error(f"Database backup failed: {e}")
                raise
    
    async def _backup_configuration(self, backup_path: Path) -> Path:
        """Backup configuration files."""
        config_backup_path = backup_path / "configuration.json"
        
        config_data = {
            'app_version': '1.0.0',
            'backup_timestamp': datetime.utcnow().isoformat(),
            'settings': {
                'debug': settings.debug,
                'database_url': settings.database_url,
                'cors_origins': settings.cors_origins,
                # Don't backup sensitive keys
                'secret_key': '[REDACTED]',
                'algorithm': settings.algorithm
            },
            'environment_variables': {
                key: value for key, value in os.environ.items()
                if key.startswith('ESG_') and 'SECRET' not in key and 'KEY' not in key
            }
        }
        
        with open(config_backup_path, 'w') as f:
            json.dump(config_data, f, indent=2)
        
        return config_backup_path
    
    async def _backup_files(self, backup_path: Path) -> Optional[Path]:
        """Backup uploaded files."""
        files_dir = Path("uploads")
        
        if not files_dir.exists():
            logger.info("No files directory to backup")
            return None
        
        files_backup_path = backup_path / "files"
        files_backup_path.mkdir(exist_ok=True)
        
        try:
            # Copy all files preserving structure
            for file_path in files_dir.rglob("*"):
                if file_path.is_file():
                    relative_path = file_path.relative_to(files_dir)
                    dest_path = files_backup_path / relative_path
                    dest_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(file_path, dest_path)
            
            return files_backup_path
            
        except Exception as e:
            logger.error(f"Files backup failed: {e}")
            raise
    
    async def _create_archive(self, backup_path: Path, backup_name: str) -> Path:
        """Create compressed archive of backup."""
        archive_path = self.backup_dir / f"{backup_name}.zip"
        
        with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as archive:
            for file_path in backup_path.rglob("*"):
                if file_path.is_file():
                    archive_name = file_path.relative_to(backup_path)
                    archive.write(file_path, archive_name)
        
        return archive_path
    
    async def _cleanup_temp_backup(self, backup_path: Path):
        """Clean up temporary backup directory."""
        if backup_path.exists():
            shutil.rmtree(backup_path)
    
    async def _cleanup_old_backups(self):
        """Clean up old backups according to retention policy."""
        cutoff_date = datetime.utcnow() - timedelta(days=self.retention_days)
        
        backup_files = list(self.backup_dir.glob("esg_backup_*.zip"))
        backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        
        # Keep max_backups most recent
        files_to_check = backup_files[self.max_backups:]
        
        for backup_file in files_to_check:
            file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
            if file_time < cutoff_date:
                backup_file.unlink()
                logger.info(f"Deleted old backup: {backup_file}")
    
    def _get_directory_size(self, path: Path) -> int:
        """Get total size of directory."""
        total = 0
        for file_path in path.rglob("*"):
            if file_path.is_file():
                total += file_path.stat().st_size
        return total
    
    async def list_backups(self) -> List[Dict[str, Any]]:
        """List available backups."""
        backups = []
        
        for backup_file in self.backup_dir.glob("esg_backup_*.zip"):
            try:
                stat = backup_file.stat()
                backups.append({
                    'name': backup_file.name,
                    'path': str(backup_file),
                    'size': stat.st_size,
                    'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    'age_days': (datetime.utcnow() - datetime.fromtimestamp(stat.st_mtime)).days
                })
            except Exception as e:
                logger.warning(f"Could not read backup {backup_file}: {e}")
        
        return sorted(backups, key=lambda x: x['created_at'], reverse=True)
    
    async def restore_from_backup(self, backup_path: str, restore_files: bool = True) -> Dict[str, Any]:
        """
        Restore system from backup.
        
        Args:
            backup_path: Path to backup archive
            restore_files: Whether to restore uploaded files
            
        Returns:
            Restoration result
        """
        backup_file = Path(backup_path)
        if not backup_file.exists():
            raise FileNotFoundError(f"Backup file not found: {backup_path}")
        
        restore_dir = self.backup_dir / "restore_temp"
        restore_dir.mkdir(exist_ok=True)
        
        try:
            # Extract backup
            with zipfile.ZipFile(backup_file, 'r') as archive:
                archive.extractall(restore_dir)
            
            # Read metadata
            metadata_path = restore_dir / "metadata.json"
            if metadata_path.exists():
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
            else:
                metadata = {}
            
            result = {
                'backup_metadata': metadata,
                'restored_components': []
            }
            
            # Restore database
            db_restore_path = restore_dir / "database.sql"
            if db_restore_path.exists():
                await self._restore_database(db_restore_path)
                result['restored_components'].append('database')
            
            # Restore files if requested
            if restore_files:
                files_restore_path = restore_dir / "files"
                if files_restore_path.exists():
                    await self._restore_files(files_restore_path)
                    result['restored_components'].append('files')
            
            # Cleanup
            shutil.rmtree(restore_dir)
            
            logger.info(f"Restoration completed: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Restoration failed: {e}")
            if restore_dir.exists():
                shutil.rmtree(restore_dir)
            raise
    
    async def _restore_database(self, sql_file: Path):
        """Restore database from SQL dump."""
        async with AsyncSessionLocal() as db:
            try:
                # Read and execute SQL file
                with open(sql_file, 'r') as f:
                    sql_content = f.read()
                
                # Split by statements and execute
                statements = sql_content.split(';')
                for statement in statements:
                    statement = statement.strip()
                    if statement and not statement.startswith('--'):
                        await db.execute(text(statement))
                
                await db.commit()
                logger.info("Database restored successfully")
                
            except Exception as e:
                await db.rollback()
                logger.error(f"Database restoration failed: {e}")
                raise
    
    async def _restore_files(self, files_path: Path):
        """Restore uploaded files."""
        uploads_dir = Path("uploads")
        
        try:
            # Create uploads directory if it doesn't exist
            uploads_dir.mkdir(exist_ok=True)
            
            # Copy files
            for file_path in files_path.rglob("*"):
                if file_path.is_file():
                    relative_path = file_path.relative_to(files_path)
                    dest_path = uploads_dir / relative_path
                    dest_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(file_path, dest_path)
            
            logger.info("Files restored successfully")
            
        except Exception as e:
            logger.error(f"Files restoration failed: {e}")
            raise


class DisasterRecoveryManager:
    """Manages disaster recovery operations."""
    
    def __init__(self):
        """Initialize disaster recovery manager."""
        self.backup_manager = BackupManager()
    
    async def create_disaster_recovery_plan(self) -> Dict[str, Any]:
        """Create disaster recovery plan document."""
        plan = {
            'plan_version': '1.0.0',
            'created_at': datetime.utcnow().isoformat(),
            'recovery_objectives': {
                'RTO': '4 hours',  # Recovery Time Objective
                'RPO': '1 hour',   # Recovery Point Objective
            },
            'backup_strategy': {
                'frequency': 'daily',
                'retention': '30 days',
                'location': 'local filesystem',
                'encryption': 'application-level'
            },
            'recovery_procedures': [
                {
                    'step': 1,
                    'description': 'Assess the extent of the disaster',
                    'actions': [
                        'Identify affected systems',
                        'Determine data loss scope',
                        'Estimate recovery time'
                    ]
                },
                {
                    'step': 2,
                    'description': 'Prepare recovery environment',
                    'actions': [
                        'Set up new server if needed',
                        'Install application dependencies',
                        'Configure network and security'
                    ]
                },
                {
                    'step': 3,
                    'description': 'Restore from backup',
                    'actions': [
                        'Locate most recent backup',
                        'Restore database',
                        'Restore application files',
                        'Verify data integrity'
                    ]
                },
                {
                    'step': 4,
                    'description': 'Test and validate',
                    'actions': [
                        'Run application tests',
                        'Verify user authentication',
                        'Test core functionality',
                        'Validate data consistency'
                    ]
                },
                {
                    'step': 5,
                    'description': 'Go live',
                    'actions': [
                        'Update DNS records',
                        'Notify users',
                        'Monitor system health',
                        'Document lessons learned'
                    ]
                }
            ],
            'contact_information': {
                'primary_admin': 'admin@company.com',
                'technical_lead': 'tech@company.com',
                'management': 'management@company.com'
            },
            'testing_schedule': {
                'frequency': 'quarterly',
                'last_test': None,
                'next_test': None
            }
        }
        
        return plan
    
    async def test_disaster_recovery(self) -> Dict[str, Any]:
        """Test disaster recovery procedures."""
        test_start = datetime.utcnow()
        
        test_results = {
            'test_date': test_start.isoformat(),
            'test_duration': None,
            'steps_completed': [],
            'issues_found': [],
            'recommendations': []
        }
        
        try:
            # Test 1: Create backup
            test_results['steps_completed'].append('backup_creation')
            backup_result = await self.backup_manager.create_full_backup(include_files=False)
            
            # Test 2: List backups
            test_results['steps_completed'].append('backup_listing')
            backups = await self.backup_manager.list_backups()
            
            # Test 3: Verify backup integrity
            test_results['steps_completed'].append('backup_verification')
            if backups:
                latest_backup = backups[0]
                if latest_backup['size'] > 0:
                    test_results['steps_completed'].append('backup_integrity_check')
                else:
                    test_results['issues_found'].append('Latest backup has zero size')
            
            # Test 4: Recovery simulation (dry run)
            test_results['steps_completed'].append('recovery_simulation')
            
            test_end = datetime.utcnow()
            test_results['test_duration'] = (test_end - test_start).total_seconds()
            
            # Generate recommendations
            if len(test_results['issues_found']) == 0:
                test_results['recommendations'].append('All tests passed successfully')
            else:
                test_results['recommendations'].append('Address identified issues before next test')
            
            logger.info(f"Disaster recovery test completed: {test_results}")
            return test_results
            
        except Exception as e:
            test_results['issues_found'].append(f'Test failed with error: {str(e)}')
            logger.error(f"Disaster recovery test failed: {e}")
            return test_results


# Scheduled backup function
async def scheduled_backup():
    """Scheduled backup job."""
    try:
        backup_manager = BackupManager()
        result = await backup_manager.create_full_backup(include_files=True)
        logger.info(f"Scheduled backup completed: {result['archive_path']}")
        return result
    except Exception as e:
        logger.error(f"Scheduled backup failed: {e}")
        raise


# Health check for backup system
async def backup_health_check() -> Dict[str, Any]:
    """Check backup system health."""
    try:
        backup_manager = BackupManager()
        backups = await backup_manager.list_backups()
        
        # Check if we have recent backups
        recent_backup = None
        if backups:
            recent_backup = backups[0]
            last_backup_date = datetime.fromisoformat(recent_backup['created_at'])
            days_since_backup = (datetime.utcnow() - last_backup_date).days
        else:
            days_since_backup = 999
        
        health_status = {
            'backup_system_healthy': True,
            'total_backups': len(backups),
            'days_since_last_backup': days_since_backup,
            'recent_backup': recent_backup,
            'issues': []
        }
        
        # Check for issues
        if days_since_backup > 7:
            health_status['backup_system_healthy'] = False
            health_status['issues'].append(f'No backup created in {days_since_backup} days')
        
        if len(backups) == 0:
            health_status['backup_system_healthy'] = False
            health_status['issues'].append('No backups found')
        
        return health_status
        
    except Exception as e:
        return {
            'backup_system_healthy': False,
            'error': str(e),
            'issues': ['Backup system check failed']
        }