"""
ESG scoping wizard router for dynamic question generation.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Dict, Any, Optional
from datetime import datetime

from ..database import get_db
from ..auth.dependencies import get_current_user
from ..auth.models import User
from ..models.company import Company
from ..models.tasks import Task, TaskStatus
from ..core.markdown_parser import ESGContentParser
from ..core.task_generator import TaskGenerator
from ..schemas.tasks import TaskCreate, TaskResponse
from ..config import settings

router = APIRouter()

@router.get("/esg/sectors")
async def get_available_sectors():
    """Get list of available business sectors for ESG scoping."""
    parser = ESGContentParser()
    sectors = parser.get_available_sectors()
    
    return {
        "sectors": [
            {
                "id": sector,
                "name": sector.replace("_", " ").title(),
                "description": f"ESG scoping questions for {sector.replace('_', ' ')} sector"
            }
            for sector in sectors
        ]
    }

@router.get("/esg/sectors/{sector}/questions")
async def get_sector_questions(
    sector: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get ESG scoping questions for a specific business sector.
    
    Returns structured questions parsed from markdown content.
    """
    try:
        parser = ESGContentParser()
        questions = parser.parse_sector_questions(sector)
        
        if not questions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No questions found for sector: {sector}"
            )
        
        # Group questions by category for better UX
        grouped_questions = {}
        for question in questions:
            category = question.get("category", "General")
            if category not in grouped_questions:
                grouped_questions[category] = []
            grouped_questions[category].append(question)
        
        return {
            "sector": sector,
            "total_questions": len(questions),
            "categories": list(grouped_questions.keys()),
            "questions_by_category": grouped_questions,
            "frameworks": parser.get_sector_frameworks(sector)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse sector questions: {str(e)}"
        )

@router.post("/esg/scoping/{company_id}/complete")
async def complete_esg_scoping(
    company_id: str,
    scoping_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Complete ESG scoping wizard and generate tasks.
    
    Accepts user answers and generates personalized task list.
    """
    # Verify user has access to company
    query = select(Company).where(
        and_(
            Company.id == company_id,
            Company.id == current_user.company_id  # Site-scoped access
        )
    )
    result = await db.execute(query)
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found or access denied"
        )
    
    try:
        # Extract sector and answers from scoping data
        sector = scoping_data.get("sector")
        answers = scoping_data.get("answers", {})
        preferences = scoping_data.get("preferences", {})
        
        if not sector:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sector is required"
            )
        
        # Generate tasks based on scoping results
        task_generator = TaskGenerator()
        generated_tasks = task_generator.generate_tasks_from_scoping(
            sector=sector,
            answers=answers,
            preferences=preferences,
            company_id=company_id
        )
        
        # Create tasks in database
        created_tasks = []
        for task_data in generated_tasks:
            task = Task(
                company_id=company_id,
                title=task_data["title"],
                description=task_data["description"],
                compliance_context=task_data.get("compliance_context", ""),
                action_required=task_data.get("action_required", ""),
                status=TaskStatus.TODO,
                category=task_data["category"],
                framework_tags=task_data.get("framework_tags", []),
                due_date=task_data.get("due_date"),
                priority=task_data.get("priority", "medium"),
                required_evidence_count=task_data.get("required_evidence_count", 1)
            )
            
            db.add(task)
            created_tasks.append(task)
        
        await db.commit()
        
        # Refresh tasks to get IDs
        for task in created_tasks:
            await db.refresh(task)
        
        # Update company's ESG scoping status
        company.esg_scoping_completed = True
        company.business_sector = sector
        company.scoping_completed_at = datetime.utcnow()
        company.scoping_data = scoping_data  # Store the full scoping results
        
        await db.commit()
        
        # Create audit log
        from ..models.audit import AuditLog
        audit_log = AuditLog(
            user_id=current_user.id,
            action="esg_scoping_completed",
            resource_type="company",
            resource_id=str(company_id),
            details={
                "sector": sector,
                "tasks_generated": len(created_tasks),
                "answers_count": len(answers)
            },
            timestamp=datetime.utcnow(),
            ip_address="unknown"  # TODO: Extract from request
        )
        db.add(audit_log)
        await db.commit()
        
        return {
            "message": "ESG scoping completed successfully",
            "tasks_generated": len(created_tasks),
            "sector": sector,
            "company_id": str(company_id),
            "tasks": [
                {
                    "id": str(task.id),
                    "title": task.title,
                    "category": task.category,
                    "priority": task.priority
                }
                for task in created_tasks
            ]
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete ESG scoping: {str(e)}"
        )

@router.get("/esg/scoping/{company_id}/status")
async def get_scoping_status(
    company_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get ESG scoping completion status for a company."""
    # Verify user has access to company
    query = select(Company).where(
        and_(
            Company.id == company_id,
            Company.id == current_user.company_id
        )
    )
    result = await db.execute(query)
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found or access denied"
        )
    
    # Get task counts by category
    task_query = select(Task).where(Task.company_id == company_id)
    task_result = await db.execute(task_query)
    tasks = task_result.scalars().all()
    
    # Calculate progress metrics
    total_tasks = len(tasks)
    completed_tasks = len([t for t in tasks if t.status == TaskStatus.COMPLETED])
    
    category_stats = {}
    for task in tasks:
        category = task.category
        if category not in category_stats:
            category_stats[category] = {"total": 0, "completed": 0}
        
        category_stats[category]["total"] += 1
        if task.status == TaskStatus.COMPLETED:
            category_stats[category]["completed"] += 1
    
    return {
        "company_id": str(company_id),
        "scoping_completed": company.esg_scoping_completed or False,
        "business_sector": company.business_sector,
        "scoping_completed_at": company.scoping_completed_at,
        "progress": {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "completion_percentage": (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            "category_breakdown": category_stats
        }
    }