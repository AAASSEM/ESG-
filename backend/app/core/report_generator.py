"""
PDF report generator for ESG compliance assessments.
"""
import os
import io
from datetime import datetime, date
from typing import Dict, List, Optional, Any
from pathlib import Path
import base64
import logging

from jinja2 import Environment, FileSystemLoader, Template
from weasyprint import HTML, CSS
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models.company import Company, BusinessSector
from ..models.tasks import Task, Evidence, TaskStatus, TaskCategory
from ..auth.models import User
from ..config import settings
from .markdown_parser import ESGContentParser

logger = logging.getLogger(__name__)


class ESGReportGenerator:
    """Generate comprehensive ESG compliance reports in PDF format."""
    
    def __init__(self):
        """Initialize the report generator with templates."""
        self.template_dir = Path(__file__).parent.parent / "templates" / "reports"
        self.template_dir.mkdir(parents=True, exist_ok=True)
        
        # Create Jinja2 environment
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(self.template_dir)),
            autoescape=True
        )
        
        # Register custom filters
        self.jinja_env.filters['format_date'] = self._format_date
        self.jinja_env.filters['format_percentage'] = self._format_percentage
        self.jinja_env.filters['get_status_color'] = self._get_status_color
        self.jinja_env.filters['get_category_icon'] = self._get_category_icon
        
        # Initialize ESG content parser
        self.esg_parser = ESGContentParser()
    
    def _format_date(self, value: datetime | date | None) -> str:
        """Format date for display in reports."""
        if not value:
            return "N/A"
        if isinstance(value, datetime):
            return value.strftime("%B %d, %Y")
        return value.strftime("%B %d, %Y")
    
    def _format_percentage(self, value: float) -> str:
        """Format percentage for display."""
        return f"{value:.1f}%"
    
    def _get_status_color(self, status: TaskStatus) -> str:
        """Get color for task status."""
        status_colors = {
            TaskStatus.TODO: "#ef4444",        # red
            TaskStatus.IN_PROGRESS: "#f59e0b", # amber
            TaskStatus.PENDING_REVIEW: "#8b5cf6", # violet
            TaskStatus.COMPLETED: "#10b981"     # green
        }
        return status_colors.get(status, "#6b7280")
    
    def _get_category_icon(self, category: TaskCategory) -> str:
        """Get icon for task category."""
        category_icons = {
            TaskCategory.GOVERNANCE: "⚖️",
            TaskCategory.ENERGY: "⚡",
            TaskCategory.WATER: "💧",
            TaskCategory.WASTE: "♻️",
            TaskCategory.SUPPLY_CHAIN: "🔗",
            TaskCategory.SOCIAL: "👥",
            TaskCategory.ENVIRONMENTAL: "🌱"
        }
        return category_icons.get(category, "📋")
    
    async def generate_company_esg_report(
        self,
        db: AsyncSession,
        company_id: str,
        include_evidence_links: bool = True,
        current_user: Optional[User] = None
    ) -> bytes:
        """
        Generate comprehensive ESG assessment report for a company.
        
        Args:
            db: Database session
            company_id: Company UUID
            include_evidence_links: Whether to include evidence links
            current_user: User generating the report for audit trail
            
        Returns:
            PDF report as bytes
        """
        try:
            # Gather report data
            report_data = await self._gather_report_data(db, company_id)
            
            # Create audit log entry
            if current_user:
                await self._create_audit_log(db, current_user.id, company_id, "report_generated")
            
            # Generate HTML from template
            html_content = await self._render_html_template(report_data, include_evidence_links)
            
            # Convert HTML to PDF
            pdf_bytes = self._generate_pdf_from_html(html_content)
            
            logger.info(f"Generated ESG report for company {company_id}")
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"Error generating ESG report for company {company_id}: {e}")
            raise
    
    async def _gather_report_data(self, db: AsyncSession, company_id: str) -> Dict[str, Any]:
        """Gather all data needed for the ESG report."""
        
        # Get company information
        company_result = await db.execute(
            select(Company).where(Company.id == company_id)
        )
        company = company_result.scalar_one_or_none()
        
        if not company:
            raise ValueError(f"Company not found: {company_id}")
        
        # Get all tasks for the company
        tasks_result = await db.execute(
            select(Task).where(Task.company_id == company_id)
        )
        tasks = tasks_result.scalars().all()
        
        # Get evidence for each task
        evidence_by_task = {}
        for task in tasks:
            evidence_result = await db.execute(
                select(Evidence).where(Evidence.task_id == task.id)
            )
            evidence_by_task[task.id] = evidence_result.scalars().all()
        
        # Calculate statistics
        stats = self._calculate_statistics(tasks)
        
        # Get framework information
        frameworks = []
        if company.business_sector:
            try:
                frameworks = self.esg_parser.get_sector_frameworks(company.business_sector.value)
            except Exception as e:
                logger.warning(f"Could not load frameworks for sector {company.business_sector}: {e}")
        
        # Group tasks by category
        tasks_by_category = self._group_tasks_by_category(tasks)
        
        # Prepare scoping data
        scoping_summary = self._prepare_scoping_summary(company)
        
        return {
            'company': company,
            'tasks': tasks,
            'evidence_by_task': evidence_by_task,
            'statistics': stats,
            'frameworks': frameworks,
            'tasks_by_category': tasks_by_category,
            'scoping_summary': scoping_summary,
            'generated_at': datetime.utcnow(),
            'report_version': '1.0'
        }
    
    def _calculate_statistics(self, tasks: List[Task]) -> Dict[str, Any]:
        """Calculate comprehensive statistics for the report."""
        total_tasks = len(tasks)
        
        if total_tasks == 0:
            return {
                'total_tasks': 0,
                'completion_rate': 0,
                'status_breakdown': {},
                'category_breakdown': {},
                'framework_coverage': {},
                'overdue_tasks': 0
            }
        
        # Status breakdown
        status_counts = {}
        for status in TaskStatus:
            status_counts[status.value] = len([t for t in tasks if t.status == status])
        
        completed_tasks = status_counts.get(TaskStatus.COMPLETED.value, 0)
        completion_rate = (completed_tasks / total_tasks) * 100
        
        # Category breakdown
        category_stats = {}
        for category in TaskCategory:
            category_tasks = [t for t in tasks if t.category == category]
            category_completed = len([t for t in category_tasks if t.status == TaskStatus.COMPLETED])
            
            category_stats[category.value] = {
                'total': len(category_tasks),
                'completed': category_completed,
                'completion_rate': (category_completed / len(category_tasks) * 100) if category_tasks else 0
            }
        
        # Framework coverage
        framework_coverage = {}
        for task in tasks:
            if task.framework_tags:
                for framework in task.framework_tags:
                    if framework not in framework_coverage:
                        framework_coverage[framework] = {'total': 0, 'completed': 0}
                    
                    framework_coverage[framework]['total'] += 1
                    if task.status == TaskStatus.COMPLETED:
                        framework_coverage[framework]['completed'] += 1
        
        # Calculate completion rates for frameworks
        for framework_data in framework_coverage.values():
            total = framework_data['total']
            completed = framework_data['completed']
            framework_data['completion_rate'] = (completed / total * 100) if total > 0 else 0
        
        # Overdue tasks
        today = date.today()
        overdue_tasks = len([
            t for t in tasks 
            if t.due_date and t.due_date < today and t.status != TaskStatus.COMPLETED
        ])
        
        return {
            'total_tasks': total_tasks,
            'completion_rate': completion_rate,
            'status_breakdown': status_counts,
            'category_breakdown': category_stats,
            'framework_coverage': framework_coverage,
            'overdue_tasks': overdue_tasks,
            'completed_tasks': completed_tasks,
            'in_progress_tasks': status_counts.get(TaskStatus.IN_PROGRESS.value, 0),
            'pending_tasks': status_counts.get(TaskStatus.TODO.value, 0)
        }
    
    def _group_tasks_by_category(self, tasks: List[Task]) -> Dict[TaskCategory, List[Task]]:
        """Group tasks by their category."""
        grouped = {}
        for category in TaskCategory:
            grouped[category] = [t for t in tasks if t.category == category]
        return grouped
    
    def _prepare_scoping_summary(self, company: Company) -> Dict[str, Any]:
        """Prepare scoping wizard summary data."""
        scoping_data = company.scoping_data or {}
        
        return {
            'completed': company.esg_scoping_completed,
            'completed_at': company.scoping_completed_at,
            'sector': company.business_sector.value if company.business_sector else None,
            'total_answers': len(scoping_data.get('answers', {})),
            'preferences': scoping_data.get('preferences', {})
        }
    
    async def _render_html_template(self, data: Dict[str, Any], include_evidence: bool) -> str:
        """Render the HTML template with report data."""
        
        # Create the template if it doesn't exist
        template_path = self.template_dir / "esg_report.html"
        if not template_path.exists():
            self._create_default_template()
        
        template = self.jinja_env.get_template("esg_report.html")
        
        # Add additional template variables
        template_data = {
            **data,
            'include_evidence': include_evidence,
            'css_styles': self._get_report_css()
        }
        
        return template.render(**template_data)
    
    def _generate_pdf_from_html(self, html_content: str) -> bytes:
        """Convert HTML content to PDF using WeasyPrint."""
        
        # Create CSS for styling
        css_content = self._get_report_css()
        css = CSS(string=css_content)
        
        # Generate PDF
        html_doc = HTML(string=html_content)
        pdf_bytes = html_doc.write_pdf(stylesheets=[css])
        
        return pdf_bytes
    
    def _create_default_template(self):
        """Create the default ESG report template."""
        template_content = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESG Assessment Report - {{ company.name }}</title>
    <style>{{ css_styles }}</style>
</head>
<body>
    <div class="report-container">
        <!-- Header -->
        <header class="report-header">
            <div class="header-content">
                <div class="logo-section">
                    <h1>ESG Assessment Report</h1>
                    <p class="report-subtitle">Environmental, Social & Governance Compliance</p>
                </div>
                <div class="company-info">
                    <h2>{{ company.name }}</h2>
                    <p>Sector: {{ company.business_sector.value.replace('_', ' ').title() if company.business_sector else 'N/A' }}</p>
                    <p>Generated: {{ generated_at|format_date }}</p>
                </div>
            </div>
        </header>

        <!-- Executive Summary -->
        <section class="executive-summary">
            <h2>Executive Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Overall Completion</h3>
                    <div class="metric-large">{{ statistics.completion_rate|format_percentage }}</div>
                    <p>{{ statistics.completed_tasks }} of {{ statistics.total_tasks }} tasks completed</p>
                </div>
                <div class="summary-card">
                    <h3>ESG Scoping</h3>
                    <div class="metric-status {{ 'completed' if scoping_summary.completed else 'pending' }}">
                        {{ 'Completed' if scoping_summary.completed else 'Pending' }}
                    </div>
                    {% if scoping_summary.completed %}
                    <p>Completed on {{ scoping_summary.completed_at|format_date }}</p>
                    {% endif %}
                </div>
                <div class="summary-card">
                    <h3>Active Frameworks</h3>
                    <div class="metric-medium">{{ frameworks|length }}</div>
                    <p>Applicable ESG frameworks</p>
                </div>
                <div class="summary-card">
                    <h3>Overdue Tasks</h3>
                    <div class="metric-medium {{ 'alert' if statistics.overdue_tasks > 0 else 'good' }}">
                        {{ statistics.overdue_tasks }}
                    </div>
                    <p>Tasks past due date</p>
                </div>
            </div>
        </section>

        <!-- Progress by Category -->
        <section class="category-progress">
            <h2>Progress by ESG Category</h2>
            <div class="category-grid">
                {% for category, stats in statistics.category_breakdown.items() %}
                <div class="category-card">
                    <div class="category-header">
                        <span class="category-icon">{{ category|get_category_icon }}</span>
                        <h3>{{ category.replace('_', ' ').title() }}</h3>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {{ stats.completion_rate }}%"></div>
                    </div>
                    <p>{{ stats.completed }} / {{ stats.total }} tasks ({{ stats.completion_rate|format_percentage }})</p>
                </div>
                {% endfor %}
            </div>
        </section>

        <!-- Framework Coverage -->
        {% if statistics.framework_coverage %}
        <section class="framework-coverage">
            <h2>Framework Coverage</h2>
            <div class="framework-list">
                {% for framework, coverage in statistics.framework_coverage.items() %}
                <div class="framework-item">
                    <div class="framework-info">
                        <h4>{{ framework }}</h4>
                        <span class="coverage-percentage">{{ coverage.completion_rate|format_percentage }}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {{ coverage.completion_rate }}%"></div>
                    </div>
                    <p>{{ coverage.completed }} / {{ coverage.total }} requirements completed</p>
                </div>
                {% endfor %}
            </div>
        </section>
        {% endif %}

        <!-- Detailed Task Breakdown -->
        <section class="task-breakdown">
            <h2>Detailed Task Analysis</h2>
            {% for category, task_list in tasks_by_category.items() %}
            {% if task_list %}
            <div class="category-section">
                <h3>{{ category|get_category_icon }} {{ category.replace('_', ' ').title() }}</h3>
                <div class="task-list">
                    {% for task in task_list %}
                    <div class="task-item {{ task.status.value }}">
                        <div class="task-header">
                            <h4>{{ task.title }}</h4>
                            <span class="task-status" style="background-color: {{ task.status|get_status_color }}">
                                {{ task.status.value.replace('_', ' ').title() }}
                            </span>
                        </div>
                        {% if task.description %}
                        <p class="task-description">{{ task.description }}</p>
                        {% endif %}
                        <div class="task-meta">
                            {% if task.due_date %}
                            <span class="due-date">Due: {{ task.due_date|format_date }}</span>
                            {% endif %}
                            {% if task.framework_tags %}
                            <span class="frameworks">Frameworks: {{ task.framework_tags|join(', ') }}</span>
                            {% endif %}
                        </div>
                        {% if include_evidence and evidence_by_task.get(task.id) %}
                        <div class="evidence-section">
                            <h5>Evidence Files ({{ evidence_by_task[task.id]|length }})</h5>
                            <ul class="evidence-list">
                                {% for evidence in evidence_by_task[task.id] %}
                                <li>
                                    {{ evidence.original_filename }}
                                    <span class="upload-date">({{ evidence.uploaded_at|format_date }})</span>
                                </li>
                                {% endfor %}
                            </ul>
                        </div>
                        {% endif %}
                    </div>
                    {% endfor %}
                </div>
            </div>
            {% endif %}
            {% endfor %}
        </section>

        <!-- Footer -->
        <footer class="report-footer">
            <div class="footer-content">
                <p>This report was generated automatically by the ESG Scoping & Task Management Platform</p>
                <p>Report Version: {{ report_version }} | Generated: {{ generated_at|format_date }}</p>
                <p class="disclaimer">
                    This report provides a comprehensive overview of ESG compliance progress based on current task completion status.
                    Please ensure all evidence files are properly maintained for regulatory compliance.
                </p>
            </div>
        </footer>
    </div>
</body>
</html>
'''
        
        template_path = self.template_dir / "esg_report.html"
        with open(template_path, 'w', encoding='utf-8') as f:
            f.write(template_content)
    
    def _get_report_css(self) -> str:
        """Get CSS styles for the report."""
        return '''
        @page {
            size: A4;
            margin: 2cm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        .report-container {
            max-width: 100%;
        }
        
        .report-header {
            background: linear-gradient(135deg, #2EC57D, #3DAEFF);
            color: white;
            padding: 2rem;
            margin-bottom: 2rem;
            border-radius: 8px;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo-section h1 {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .report-subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .company-info {
            text-align: right;
        }
        
        .company-info h2 {
            font-size: 1.8rem;
            margin-bottom: 0.5rem;
        }
        
        .executive-summary {
            margin-bottom: 3rem;
        }
        
        .executive-summary h2 {
            font-size: 1.8rem;
            color: #2EC57D;
            margin-bottom: 1.5rem;
            border-bottom: 2px solid #2EC57D;
            padding-bottom: 0.5rem;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .summary-card {
            background: #f8fafc;
            padding: 1.5rem;
            border-radius: 8px;
            border-left: 4px solid #2EC57D;
            text-align: center;
        }
        
        .summary-card h3 {
            font-size: 1rem;
            color: #64748b;
            margin-bottom: 1rem;
        }
        
        .metric-large {
            font-size: 3rem;
            font-weight: bold;
            color: #2EC57D;
            margin-bottom: 0.5rem;
        }
        
        .metric-medium {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .metric-medium.good {
            color: #10b981;
        }
        
        .metric-medium.alert {
            color: #ef4444;
        }
        
        .metric-status {
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.9rem;
        }
        
        .metric-status.completed {
            background: #d1fae5;
            color: #065f46;
        }
        
        .metric-status.pending {
            background: #fef3c7;
            color: #92400e;
        }
        
        .category-progress, .framework-coverage, .task-breakdown {
            margin-bottom: 3rem;
        }
        
        .category-progress h2, .framework-coverage h2, .task-breakdown h2 {
            font-size: 1.8rem;
            color: #2EC57D;
            margin-bottom: 1.5rem;
            border-bottom: 2px solid #2EC57D;
            padding-bottom: 0.5rem;
        }
        
        .category-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
        }
        
        .category-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5rem;
        }
        
        .category-header {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .category-icon {
            font-size: 1.5rem;
            margin-right: 0.5rem;
        }
        
        .category-header h3 {
            font-size: 1.2rem;
            color: #1e293b;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 0.5rem;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #2EC57D, #3DAEFF);
            transition: width 0.3s ease;
        }
        
        .framework-list {
            space-y: 1rem;
        }
        
        .framework-item {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1rem;
        }
        
        .framework-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .framework-info h4 {
            font-size: 1.1rem;
            color: #1e293b;
        }
        
        .coverage-percentage {
            font-weight: bold;
            color: #2EC57D;
        }
        
        .category-section {
            margin-bottom: 2rem;
        }
        
        .category-section h3 {
            font-size: 1.4rem;
            color: #1e293b;
            margin-bottom: 1rem;
            padding: 0.5rem 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .task-list {
            space-y: 1rem;
        }
        
        .task-item {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1rem;
        }
        
        .task-item.completed {
            border-left: 4px solid #10b981;
            background: #f0fdf4;
        }
        
        .task-item.in_progress {
            border-left: 4px solid #f59e0b;
            background: #fffbeb;
        }
        
        .task-item.todo {
            border-left: 4px solid #ef4444;
            background: #fef2f2;
        }
        
        .task-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }
        
        .task-header h4 {
            font-size: 1.1rem;
            color: #1e293b;
            flex: 1;
            margin-right: 1rem;
        }
        
        .task-status {
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            color: white;
            font-size: 0.75rem;
            font-weight: bold;
            text-transform: uppercase;
            white-space: nowrap;
        }
        
        .task-description {
            color: #64748b;
            margin-bottom: 1rem;
            line-height: 1.5;
        }
        
        .task-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .due-date, .frameworks {
            font-size: 0.875rem;
            color: #64748b;
        }
        
        .due-date::before {
            content: "📅 ";
        }
        
        .frameworks::before {
            content: "🏛️ ";
        }
        
        .evidence-section {
            background: #f8fafc;
            padding: 1rem;
            border-radius: 6px;
            margin-top: 1rem;
        }
        
        .evidence-section h5 {
            color: #2EC57D;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
        }
        
        .evidence-list {
            list-style: none;
        }
        
        .evidence-list li {
            padding: 0.25rem 0;
            color: #64748b;
            font-size: 0.875rem;
        }
        
        .evidence-list li::before {
            content: "📎 ";
            margin-right: 0.5rem;
        }
        
        .upload-date {
            color: #94a3b8;
            font-size: 0.75rem;
        }
        
        .report-footer {
            background: #f8fafc;
            padding: 2rem;
            border-radius: 8px;
            margin-top: 3rem;
            border-top: 2px solid #2EC57D;
        }
        
        .footer-content {
            text-align: center;
            color: #64748b;
        }
        
        .footer-content p {
            margin-bottom: 0.5rem;
        }
        
        .disclaimer {
            font-size: 0.875rem;
            font-style: italic;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e2e8f0;
        }
        '''
    
    async def _create_audit_log(self, db: AsyncSession, user_id: str, company_id: str, action: str):
        """Create audit log entry for report generation."""
        from ..models.audit import AuditLog
        
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type="company",
            resource_id=company_id,
            details={
                "report_type": "esg_assessment",
                "generated_at": datetime.utcnow().isoformat()
            },
            timestamp=datetime.utcnow(),
            ip_address="system"
        )
        
        db.add(audit_log)
        await db.commit()