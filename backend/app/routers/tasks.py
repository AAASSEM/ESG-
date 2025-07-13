"""
Task management router for ESG compliance.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from datetime import date

from ..database import get_db
from ..schemas.tasks import (
    TaskResponse, 
    TaskListResponse,
    TaskUpdate, 
    TaskAssignment,
    TaskFilters,
    TaskStats,
    TaskGeneration
)
from ..models import Task, User, Evidence, Company
from ..models.tasks import TaskStatus, TaskCategory
from ..auth.dependencies import (
    get_current_user, 
    require_manager,
    create_audit_log
)
from ..core.task_generator import TaskGenerator

router = APIRouter()


@router.get("/", response_model=TaskListResponse)
async def get_tasks(
    status: Optional[TaskStatus] = Query(None),
    category: Optional[TaskCategory] = Query(None),
    assigned_user_id: Optional[str] = Query(None),
    location_id: Optional[str] = Query(None),
    framework_tag: Optional[str] = Query(None),
    due_before: Optional[date] = Query(None),
    due_after: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get tasks with filtering and pagination."""
    try:
        # Build query filters
        filters = [Task.company_id == current_user.company_id]
        
        if status:
            filters.append(Task.status == status)
        if category:
            filters.append(Task.category == category)
        if assigned_user_id:
            filters.append(Task.assigned_user_id == assigned_user_id)
        if location_id:
            filters.append(Task.location_id == location_id)
        if framework_tag:
            filters.append(Task.framework_tags.contains([framework_tag]))
        if due_before:
            filters.append(Task.due_date <= due_before)
        if due_after:
            filters.append(Task.due_date >= due_after)
        
        # Site-scoped access control for non-admin users
        if current_user.role != "admin":
            accessible_sites = getattr(current_user, 'accessible_sites', [])
            site_ids = [site.id for site in accessible_sites]
            if site_ids:
                filters.append(
                    or_(
                        Task.location_id.in_(site_ids),
                        Task.location_id.is_(None)  # Company-wide tasks
                    )
                )
        
        # Get tasks with pagination
        tasks_result = await db.execute(
            select(Task)
            .where(and_(*filters))
            .order_by(Task.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        tasks = tasks_result.scalars().all()
        
        # Get total count
        count_result = await db.execute(
            select(func.count(Task.id))
            .where(and_(*filters))
        )
        total_count = count_result.scalar()
        
        # Get status counts
        status_counts = {}
        for task_status in TaskStatus:
            status_filters = filters + [Task.status == task_status]
            status_result = await db.execute(
                select(func.count(Task.id))
                .where(and_(*status_filters))
            )
            status_counts[task_status.value] = status_result.scalar()
        
        # Convert to response format
        task_responses = []
        for task in tasks:
            # Get evidence for task
            evidence_result = await db.execute(
                select(Evidence).where(Evidence.task_id == task.id)
            )
            evidence = evidence_result.scalars().all()
            
            task_responses.append(TaskResponse(
                id=task.id,
                company_id=task.company_id,
                location_id=task.location_id,
                title=task.title,
                description=task.description,
                compliance_context=task.compliance_context,
                action_required=task.action_required,
                status=task.status,
                category=task.category,
                assigned_user_id=task.assigned_user_id,
                framework_tags=task.framework_tags,
                due_date=task.due_date,
                completed_at=task.completed_at,
                created_at=task.created_at,
                updated_at=task.updated_at,
                evidence=[
                    {
                        "id": ev.id,
                        "task_id": ev.task_id,
                        "original_filename": ev.original_filename,
                        "file_size": ev.file_size,
                        "mime_type": ev.mime_type,
                        "uploaded_by": ev.uploaded_by,
                        "uploaded_at": ev.uploaded_at,
                        "file_hash": ev.file_hash,
                        "description": ev.description
                    } for ev in evidence
                ]
            ))
        
        return TaskListResponse(
            tasks=task_responses,
            total_count=total_count,
            completed_count=status_counts.get('completed', 0),
            in_progress_count=status_counts.get('in_progress', 0),
            todo_count=status_counts.get('todo', 0),
            pending_review_count=status_counts.get('pending_review', 0)
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific task by ID."""
    try:
        result = await db.execute(
            select(Task)
            .where(
                Task.id == task_id,
                Task.company_id == current_user.company_id
            )
        )
        task = result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Site access check for non-admin users
        if current_user.role != "admin" and task.location_id:
            accessible_sites = getattr(current_user, 'accessible_sites', [])
            site_ids = [site.id for site in accessible_sites]
            if task.location_id not in site_ids:
                raise HTTPException(status_code=403, detail="Access denied to this task")
        
        # Get evidence
        evidence_result = await db.execute(
            select(Evidence).where(Evidence.task_id == task.id)
        )
        evidence = evidence_result.scalars().all()
        
        return TaskResponse(
            id=task.id,
            company_id=task.company_id,
            location_id=task.location_id,
            title=task.title,
            description=task.description,
            compliance_context=task.compliance_context,
            action_required=task.action_required,
            status=task.status,
            category=task.category,
            assigned_user_id=task.assigned_user_id,
            framework_tags=task.framework_tags,
            due_date=task.due_date,
            completed_at=task.completed_at,
            created_at=task.created_at,
            updated_at=task.updated_at,
            evidence=[
                {
                    "id": ev.id,
                    "task_id": ev.task_id,
                    "original_filename": ev.original_filename,
                    "file_size": ev.file_size,
                    "mime_type": ev.mime_type,
                    "uploaded_by": ev.uploaded_by,
                    "uploaded_at": ev.uploaded_at,
                    "file_hash": ev.file_hash,
                    "description": ev.description
                } for ev in evidence
            ]
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_update: TaskUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a task."""
    try:
        result = await db.execute(
            select(Task)
            .where(
                Task.id == task_id,
                Task.company_id == current_user.company_id
            )
        )
        task = result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Site access check for non-admin users
        if current_user.role != "admin" and task.location_id:
            accessible_sites = getattr(current_user, 'accessible_sites', [])
            site_ids = [site.id for site in accessible_sites]
            if task.location_id not in site_ids:
                raise HTTPException(status_code=403, detail="Access denied to this task")
        
        # Permission check: only assigned user, managers, or admins can update
        if (current_user.role == "contributor" and 
            task.assigned_user_id != current_user.id):
            raise HTTPException(
                status_code=403, 
                detail="Only assigned user or managers can update this task"
            )
        
        # Update fields
        update_data = task_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)
        
        # Set completion timestamp if status changed to completed
        if task_update.status == TaskStatus.COMPLETED:
            from datetime import datetime
            task.completed_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(task)
        
        # Create audit log
        await create_audit_log(
            db=db,
            user_id=current_user.id,
            action="task_update",
            resource_type="task",
            resource_id=str(task.id),
            details=update_data,
            ip_address=request.client.host if request.client else None
        )
        
        return TaskResponse(
            id=task.id,
            company_id=task.company_id,
            location_id=task.location_id,
            title=task.title,
            description=task.description,
            compliance_context=task.compliance_context,
            action_required=task.action_required,
            status=task.status,
            category=task.category,
            assigned_user_id=task.assigned_user_id,
            framework_tags=task.framework_tags,
            due_date=task.due_date,
            completed_at=task.completed_at,
            created_at=task.created_at,
            updated_at=task.updated_at,
            evidence=[]
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{task_id}/assign", response_model=TaskResponse)
async def assign_task(
    task_id: str,
    assignment: TaskAssignment,
    request: Request,
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db)
):
    """Assign a task to a user (Manager/Admin only)."""
    try:
        result = await db.execute(
            select(Task)
            .where(
                Task.id == task_id,
                Task.company_id == current_user.company_id
            )
        )
        task = result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Verify assigned user belongs to same company
        if assignment.assigned_user_id:
            user_result = await db.execute(
                select(User)
                .where(
                    User.id == assignment.assigned_user_id,
                    User.company_id == current_user.company_id
                )
            )
            assigned_user = user_result.scalar_one_or_none()
            
            if not assigned_user:
                raise HTTPException(
                    status_code=400, 
                    detail="Assigned user not found in company"
                )
        
        # Update assignment
        task.assigned_user_id = assignment.assigned_user_id
        task.location_id = assignment.location_id
        
        await db.commit()
        await db.refresh(task)
        
        # Create audit log
        await create_audit_log(
            db=db,
            user_id=current_user.id,
            action="task_assign",
            resource_type="task",
            resource_id=str(task.id),
            details={
                "assigned_user_id": str(assignment.assigned_user_id) if assignment.assigned_user_id else None,
                "location_id": str(assignment.location_id) if assignment.location_id else None
            },
            ip_address=request.client.host if request.client else None
        )
        
        return TaskResponse(
            id=task.id,
            company_id=task.company_id,
            location_id=task.location_id,
            title=task.title,
            description=task.description,
            compliance_context=task.compliance_context,
            action_required=task.action_required,
            status=task.status,
            category=task.category,
            assigned_user_id=task.assigned_user_id,
            framework_tags=task.framework_tags,
            due_date=task.due_date,
            completed_at=task.completed_at,
            created_at=task.created_at,
            updated_at=task.updated_at,
            evidence=[]
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/generate", response_model=List[TaskResponse])
async def generate_tasks(
    generation_request: TaskGeneration,
    request: Request,
    current_user: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db)
):
    """Generate ESG tasks for a company based on business sector."""
    try:
        # Verify company access
        if generation_request.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Access denied to this company")
        
        # Initialize task generator
        task_generator = TaskGenerator()
        
        # Generate tasks
        if generation_request.regenerate:
            # Get company to get sector
            company_result = await db.execute(
                select(Company).where(Company.id == generation_request.company_id)
            )
            company = company_result.scalar_one_or_none()
            
            if not company:
                raise HTTPException(status_code=404, detail="Company not found")
            
            tasks = await task_generator.regenerate_tasks_for_sector_update(
                db=db,
                company_id=generation_request.company_id,
                new_sector=company.business_sector
            )
        else:
            tasks = await task_generator.generate_tasks_for_company(
                db=db,
                company_id=generation_request.company_id,
                location_id=generation_request.location_id,
                assigned_user_id=generation_request.assigned_user_id
            )
        
        # Create audit log
        await create_audit_log(
            db=db,
            user_id=current_user.id,
            action="tasks_generate",
            resource_type="task",
            resource_id=str(generation_request.company_id),
            details={
                "company_id": str(generation_request.company_id),
                "location_id": str(generation_request.location_id) if generation_request.location_id else None,
                "assigned_user_id": str(generation_request.assigned_user_id) if generation_request.assigned_user_id else None,
                "regenerate": generation_request.regenerate,
                "tasks_generated": len(tasks)
            },
            ip_address=request.client.host if request.client else None
        )
        
        # Convert to response format
        return [
            TaskResponse(
                id=task.id,
                company_id=task.company_id,
                location_id=task.location_id,
                title=task.title,
                description=task.description,
                compliance_context=task.compliance_context,
                action_required=task.action_required,
                status=task.status,
                category=task.category,
                assigned_user_id=task.assigned_user_id,
                framework_tags=task.framework_tags,
                due_date=task.due_date,
                completed_at=task.completed_at,
                created_at=task.created_at,
                updated_at=task.updated_at,
                evidence=[]
            ) for task in tasks
        ]
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stats/overview", response_model=TaskStats)
async def get_task_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get task statistics for the current user's company."""
    try:
        # Base filter for company
        base_filter = Task.company_id == current_user.company_id
        
        # Site access control for non-admin users
        if current_user.role != "admin":
            accessible_sites = getattr(current_user, 'accessible_sites', [])
            site_ids = [site.id for site in accessible_sites]
            if site_ids:
                base_filter = and_(
                    base_filter,
                    or_(
                        Task.location_id.in_(site_ids),
                        Task.location_id.is_(None)
                    )
                )
        
        # Get total counts by status
        status_counts = {}
        for status in TaskStatus:
            result = await db.execute(
                select(func.count(Task.id))
                .where(and_(base_filter, Task.status == status))
            )
            status_counts[status.value] = result.scalar()
        
        total_tasks = sum(status_counts.values())
        completed_tasks = status_counts.get('completed', 0)
        
        # Get overdue tasks count
        from datetime import date
        overdue_result = await db.execute(
            select(func.count(Task.id))
            .where(
                and_(
                    base_filter,
                    Task.due_date < date.today(),
                    Task.status != TaskStatus.COMPLETED
                )
            )
        )
        overdue_tasks = overdue_result.scalar()
        
        # Get category breakdown
        category_stats = {}
        for category in TaskCategory:
            result = await db.execute(
                select(func.count(Task.id))
                .where(and_(base_filter, Task.category == category))
            )
            category_stats[category.value] = result.scalar()
        
        # Get framework statistics
        task_generator = TaskGenerator()
        framework_stats = await task_generator.get_framework_coverage(
            db=db,
            company_id=current_user.company_id
        )
        
        completion_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        return TaskStats(
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            in_progress_tasks=status_counts.get('in_progress', 0),
            todo_tasks=status_counts.get('todo', 0),
            pending_review_tasks=status_counts.get('pending_review', 0),
            overdue_tasks=overdue_tasks,
            completion_percentage=completion_percentage,
            category_stats=category_stats,
            framework_stats=framework_stats
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))