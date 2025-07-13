"""
Reports router for PDF generation and analytics.
"""
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from typing import Optional
from datetime import datetime
import io

from ..database import get_db
from ..auth.dependencies import get_current_user
from ..auth.models import User
from ..models.company import Company
from ..core.report_generator import ESGReportGenerator
from ..config import settings

router = APIRouter()


@router.get("/companies/{company_id}/report/esg")
async def generate_esg_report(
    company_id: str,
    include_evidence: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate comprehensive ESG assessment report for a company.
    
    Args:
        company_id: Company UUID
        include_evidence: Whether to include evidence file listings
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        PDF report as downloadable file
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
        # Generate the report
        report_generator = ESGReportGenerator()
        pdf_bytes = await report_generator.generate_company_esg_report(
            db=db,
            company_id=company_id,
            include_evidence_links=include_evidence,
            current_user=current_user
        )
        
        # Create filename with timestamp
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"ESG_Report_{company.name.replace(' ', '_')}_{timestamp}.pdf"
        
        # Return PDF as downloadable file
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )


@router.get("/companies/{company_id}/analytics")
async def get_company_analytics(
    company_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get analytical data for company dashboard.
    
    Args:
        company_id: Company UUID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Analytical data for dashboard display
    """
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
    
    try:
        # Use report generator to gather analytics data
        report_generator = ESGReportGenerator()
        report_data = await report_generator._gather_report_data(db, company_id)
        
        # Extract relevant analytics
        analytics = {
            "company_info": {
                "name": company.name,
                "sector": company.business_sector.value if company.business_sector else None,
                "esg_scoping_completed": company.esg_scoping_completed,
                "scoping_completed_at": company.scoping_completed_at
            },
            "task_statistics": report_data["statistics"],
            "framework_coverage": report_data["statistics"]["framework_coverage"],
            "category_breakdown": report_data["statistics"]["category_breakdown"],
            "recent_activity": {
                "total_evidence_files": sum(
                    len(evidence_list) for evidence_list in report_data["evidence_by_task"].values()
                ),
                "frameworks_applicable": len(report_data["frameworks"])
            }
        }
        
        return analytics
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analytics: {str(e)}"
        )


@router.get("/companies/{company_id}/report/preview")
async def preview_report_data(
    company_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get report data for preview without generating PDF.
    
    Useful for showing report summary before actual generation.
    """
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
    
    try:
        # Generate report data for preview
        report_generator = ESGReportGenerator()
        report_data = await report_generator._gather_report_data(db, company_id)
        
        # Return summarized data suitable for preview
        preview_data = {
            "company": {
                "name": company.name,
                "sector": company.business_sector.value if company.business_sector else None,
                "main_location": company.main_location
            },
            "statistics": report_data["statistics"],
            "frameworks": report_data["frameworks"],
            "scoping_summary": report_data["scoping_summary"],
            "task_counts_by_category": {
                category.value: len(tasks) 
                for category, tasks in report_data["tasks_by_category"].items()
                if tasks
            },
            "evidence_summary": {
                "total_files": sum(len(evidence_list) for evidence_list in report_data["evidence_by_task"].values()),
                "tasks_with_evidence": len([
                    task_id for task_id, evidence_list in report_data["evidence_by_task"].items()
                    if evidence_list
                ])
            }
        }
        
        return preview_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate preview: {str(e)}"
        )