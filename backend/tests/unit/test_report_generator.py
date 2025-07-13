"""
Unit tests for ESG report generator.
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime

from app.core.report_generator import ESGReportGenerator
from app.models.tasks import TaskStatus, TaskCategory


class TestESGReportGenerator:
    """Test suite for ESG report generator."""
    
    def test_report_generator_initialization(self):
        """Test report generator initialization."""
        generator = ESGReportGenerator()
        
        assert generator.template_dir is not None
        assert generator.jinja_env is not None
        assert generator.esg_parser is not None
        
        # Check that custom filters are registered
        assert 'format_date' in generator.jinja_env.filters
        assert 'format_percentage' in generator.jinja_env.filters
        assert 'get_status_color' in generator.jinja_env.filters
        assert 'get_category_icon' in generator.jinja_env.filters
    
    def test_format_date_filter(self):
        """Test date formatting filter."""
        generator = ESGReportGenerator()
        
        # Test with datetime
        test_datetime = datetime(2024, 1, 15, 10, 30, 0)
        formatted = generator._format_date(test_datetime)
        assert formatted == "January 15, 2024"
        
        # Test with date
        from datetime import date
        test_date = date(2024, 1, 15)
        formatted = generator._format_date(test_date)
        assert formatted == "January 15, 2024"
        
        # Test with None
        formatted = generator._format_date(None)
        assert formatted == "N/A"
    
    def test_format_percentage_filter(self):
        """Test percentage formatting filter."""
        generator = ESGReportGenerator()
        
        assert generator._format_percentage(75.6789) == "75.7%"
        assert generator._format_percentage(100.0) == "100.0%"
        assert generator._format_percentage(0.0) == "0.0%"
    
    def test_get_status_color_filter(self):
        """Test status color filter."""
        generator = ESGReportGenerator()
        
        assert generator._get_status_color(TaskStatus.TODO) == "#ef4444"
        assert generator._get_status_color(TaskStatus.IN_PROGRESS) == "#f59e0b"
        assert generator._get_status_color(TaskStatus.PENDING_REVIEW) == "#8b5cf6"
        assert generator._get_status_color(TaskStatus.COMPLETED) == "#10b981"
    
    def test_get_category_icon_filter(self):
        """Test category icon filter."""
        generator = ESGReportGenerator()
        
        assert generator._get_category_icon(TaskCategory.GOVERNANCE) == "⚖️"
        assert generator._get_category_icon(TaskCategory.ENERGY) == "⚡"
        assert generator._get_category_icon(TaskCategory.WATER) == "💧"
        assert generator._get_category_icon(TaskCategory.WASTE) == "♻️"
        assert generator._get_category_icon(TaskCategory.SUPPLY_CHAIN) == "🔗"
        assert generator._get_category_icon(TaskCategory.SOCIAL) == "👥"
        assert generator._get_category_icon(TaskCategory.ENVIRONMENTAL) == "🌱"
    
    def test_calculate_statistics_empty_tasks(self):
        """Test statistics calculation with no tasks."""
        generator = ESGReportGenerator()
        
        stats = generator._calculate_statistics([])
        
        assert stats['total_tasks'] == 0
        assert stats['completion_rate'] == 0
        assert stats['status_breakdown'] == {}
        assert stats['category_breakdown'] == {}
        assert stats['framework_coverage'] == {}
        assert stats['overdue_tasks'] == 0
    
    def test_calculate_statistics_with_tasks(self, sample_tasks):
        """Test statistics calculation with sample tasks."""
        generator = ESGReportGenerator()
        
        # Mock tasks data since we can't use the fixture directly
        mock_tasks = []
        
        # Create mock tasks with different statuses and categories
        for i in range(5):
            mock_task = MagicMock()
            mock_task.status = [
                TaskStatus.COMPLETED,
                TaskStatus.IN_PROGRESS,
                TaskStatus.TODO,
                TaskStatus.PENDING_REVIEW,
                TaskStatus.COMPLETED
            ][i]
            mock_task.category = [
                TaskCategory.ENERGY,
                TaskCategory.WATER,
                TaskCategory.WASTE,
                TaskCategory.SOCIAL,
                TaskCategory.GOVERNANCE
            ][i]
            mock_task.framework_tags = ['Green Key Global', 'Dubai Sustainable Tourism'][i % 2:i % 2 + 1]
            mock_task.due_date = None  # No overdue tasks for simplicity
            mock_tasks.append(mock_task)
        
        stats = generator._calculate_statistics(mock_tasks)
        
        assert stats['total_tasks'] == 5
        assert stats['completion_rate'] == 40.0  # 2 completed out of 5
        assert stats['completed_tasks'] == 2
        assert len(stats['category_breakdown']) > 0
        assert len(stats['framework_coverage']) > 0
    
    def test_group_tasks_by_category(self):
        """Test task grouping by category."""
        generator = ESGReportGenerator()
        
        # Create mock tasks
        mock_tasks = []
        for category in [TaskCategory.ENERGY, TaskCategory.WATER, TaskCategory.ENERGY]:
            mock_task = MagicMock()
            mock_task.category = category
            mock_tasks.append(mock_task)
        
        grouped = generator._group_tasks_by_category(mock_tasks)
        
        assert TaskCategory.ENERGY in grouped
        assert TaskCategory.WATER in grouped
        assert len(grouped[TaskCategory.ENERGY]) == 2
        assert len(grouped[TaskCategory.WATER]) == 1
    
    def test_prepare_scoping_summary(self):
        """Test scoping summary preparation."""
        generator = ESGReportGenerator()
        
        # Create mock company
        mock_company = MagicMock()
        mock_company.esg_scoping_completed = True
        mock_company.scoping_completed_at = datetime(2024, 1, 15)
        mock_company.business_sector.value = 'hospitality'
        mock_company.scoping_data = {
            'answers': {'1': 'yes', '2': 'no'},
            'preferences': {'priority': 'high'}
        }
        
        summary = generator._prepare_scoping_summary(mock_company)
        
        assert summary['completed'] == True
        assert summary['completed_at'] == datetime(2024, 1, 15)
        assert summary['sector'] == 'hospitality'
        assert summary['total_answers'] == 2
        assert summary['preferences'] == {'priority': 'high'}
    
    def test_prepare_scoping_summary_no_data(self):
        """Test scoping summary with no scoping data."""
        generator = ESGReportGenerator()
        
        mock_company = MagicMock()
        mock_company.esg_scoping_completed = False
        mock_company.scoping_completed_at = None
        mock_company.business_sector.value = 'hospitality'
        mock_company.scoping_data = None
        
        summary = generator._prepare_scoping_summary(mock_company)
        
        assert summary['completed'] == False
        assert summary['completed_at'] is None
        assert summary['total_answers'] == 0
        assert summary['preferences'] == {}
    
    def test_create_default_template(self):
        """Test default template creation."""
        generator = ESGReportGenerator()
        
        # Mock the template directory to avoid file system operations
        with patch.object(generator.template_dir, 'mkdir'), \
             patch('builtins.open', create=True) as mock_open:
            
            mock_file = MagicMock()
            mock_open.return_value.__enter__.return_value = mock_file
            
            generator._create_default_template()
            
            # Verify file was opened for writing
            mock_open.assert_called_once()
            mock_file.write.assert_called_once()
            
            # Check that the written content contains expected sections
            written_content = mock_file.write.call_args[0][0]
            assert "ESG Assessment Report" in written_content
            assert "Executive Summary" in written_content
            assert "Progress by ESG Category" in written_content
    
    def test_get_report_css(self):
        """Test CSS generation for reports."""
        generator = ESGReportGenerator()
        
        css = generator._get_report_css()
        
        assert len(css) > 0
        assert "@page" in css
        assert "font-family" in css
        assert "gradient" in css
        assert ".report-header" in css
        assert ".executive-summary" in css
    
    @pytest.mark.asyncio
    async def test_gather_report_data(self, test_session, test_company, test_task):
        """Test report data gathering."""
        generator = ESGReportGenerator()
        
        # Mock ESG parser
        with patch.object(generator.esg_parser, 'get_sector_frameworks', return_value=['Test Framework']):
            
            data = await generator._gather_report_data(test_session, test_company.id)
            
            assert 'company' in data
            assert 'tasks' in data
            assert 'evidence_by_task' in data
            assert 'statistics' in data
            assert 'frameworks' in data
            assert 'tasks_by_category' in data
            assert 'scoping_summary' in data
            assert 'generated_at' in data
            assert 'report_version' in data
            
            assert data['company'].id == test_company.id
            assert data['report_version'] == '1.0'
            assert data['frameworks'] == ['Test Framework']
    
    @pytest.mark.asyncio
    async def test_gather_report_data_company_not_found(self, test_session):
        """Test report data gathering for non-existent company."""
        generator = ESGReportGenerator()
        
        with pytest.raises(ValueError, match="Company not found"):
            await generator._gather_report_data(test_session, "nonexistent-id")
    
    @pytest.mark.asyncio
    async def test_render_html_template(self):
        """Test HTML template rendering."""
        generator = ESGReportGenerator()
        
        # Mock data
        mock_data = {
            'company': MagicMock(),
            'statistics': {'completion_rate': 75.0},
            'frameworks': ['Test Framework'],
            'tasks_by_category': {},
            'evidence_by_task': {},
            'scoping_summary': {'completed': True},
            'generated_at': datetime.now()
        }
        
        # Mock template creation and rendering
        with patch.object(generator, '_create_default_template'), \
             patch.object(generator, '_get_report_css', return_value='test-css'), \
             patch.object(generator.jinja_env, 'get_template') as mock_get_template:
            
            mock_template = MagicMock()
            mock_template.render.return_value = "<html>Test Report</html>"
            mock_get_template.return_value = mock_template
            
            html = await generator._render_html_template(mock_data, True)
            
            assert html == "<html>Test Report</html>"
            mock_template.render.assert_called_once()
            
            # Check that template data includes the required fields
            render_call_args = mock_template.render.call_args[1]
            assert 'include_evidence' in render_call_args
            assert 'css_styles' in render_call_args
            assert render_call_args['include_evidence'] == True
    
    def test_generate_pdf_from_html(self):
        """Test PDF generation from HTML."""
        generator = ESGReportGenerator()
        
        html_content = "<html><body><h1>Test Report</h1></body></html>"
        
        # Mock WeasyPrint HTML and CSS
        with patch('app.core.report_generator.HTML') as mock_html, \
             patch('app.core.report_generator.CSS') as mock_css, \
             patch.object(generator, '_get_report_css', return_value='test-css'):
            
            mock_html_instance = MagicMock()
            mock_html_instance.write_pdf.return_value = b'fake-pdf-content'
            mock_html.return_value = mock_html_instance
            
            mock_css_instance = MagicMock()
            mock_css.return_value = mock_css_instance
            
            pdf_bytes = generator._generate_pdf_from_html(html_content)
            
            assert pdf_bytes == b'fake-pdf-content'
            mock_html.assert_called_once_with(string=html_content)
            mock_css.assert_called_once_with(string='test-css')
            mock_html_instance.write_pdf.assert_called_once_with(stylesheets=[mock_css_instance])
    
    @pytest.mark.asyncio
    async def test_create_audit_log(self, test_session, test_user, test_company):
        """Test audit log creation for report generation."""
        generator = ESGReportGenerator()
        
        await generator._create_audit_log(
            db=test_session,
            user_id=test_user.id,
            company_id=test_company.id,
            action="report_generated"
        )
        
        # Verify audit log was created
        from app.models.audit import AuditLog
        from sqlalchemy import select
        
        result = await test_session.execute(
            select(AuditLog).where(AuditLog.action == "report_generated")
        )
        audit_log = result.scalar_one_or_none()
        
        assert audit_log is not None
        assert audit_log.user_id == test_user.id
        assert audit_log.resource_id == test_company.id
        assert audit_log.action == "report_generated"
        assert audit_log.resource_type == "company"
    
    @pytest.mark.asyncio
    async def test_generate_company_esg_report_success(self, test_session, test_company, test_user):
        """Test successful ESG report generation."""
        generator = ESGReportGenerator()
        
        # Mock all the methods
        with patch.object(generator, '_gather_report_data') as mock_gather, \
             patch.object(generator, '_render_html_template') as mock_render, \
             patch.object(generator, '_generate_pdf_from_html') as mock_pdf, \
             patch.object(generator, '_create_audit_log') as mock_audit:
            
            mock_gather.return_value = {'test': 'data'}
            mock_render.return_value = '<html>Test</html>'
            mock_pdf.return_value = b'test-pdf-bytes'
            
            pdf_bytes = await generator.generate_company_esg_report(
                db=test_session,
                company_id=test_company.id,
                include_evidence_links=True,
                current_user=test_user
            )
            
            assert pdf_bytes == b'test-pdf-bytes'
            mock_gather.assert_called_once_with(test_session, test_company.id)
            mock_render.assert_called_once_with({'test': 'data'}, True)
            mock_pdf.assert_called_once_with('<html>Test</html>')
            mock_audit.assert_called_once_with(test_session, test_user.id, test_company.id, "report_generated")
    
    @pytest.mark.asyncio
    async def test_generate_company_esg_report_without_user(self, test_session, test_company):
        """Test ESG report generation without current user (no audit log)."""
        generator = ESGReportGenerator()
        
        with patch.object(generator, '_gather_report_data') as mock_gather, \
             patch.object(generator, '_render_html_template') as mock_render, \
             patch.object(generator, '_generate_pdf_from_html') as mock_pdf, \
             patch.object(generator, '_create_audit_log') as mock_audit:
            
            mock_gather.return_value = {'test': 'data'}
            mock_render.return_value = '<html>Test</html>'
            mock_pdf.return_value = b'test-pdf-bytes'
            
            pdf_bytes = await generator.generate_company_esg_report(
                db=test_session,
                company_id=test_company.id,
                include_evidence_links=False,
                current_user=None
            )
            
            assert pdf_bytes == b'test-pdf-bytes'
            mock_audit.assert_not_called()  # No audit log without user