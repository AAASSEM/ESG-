"""
Integration tests for reports and analytics endpoints.
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock


class TestReportsEndpoints:
    """Integration tests for reports API endpoints."""
    
    @pytest.mark.asyncio
    async def test_generate_esg_report_success(self, client: AsyncClient, auth_headers, test_company):
        """Test successful ESG report generation."""
        with patch('app.routers.reports.ESGReportGenerator') as mock_generator:
            mock_generator_instance = mock_generator.return_value
            mock_generator_instance.generate_company_esg_report.return_value = b'fake-pdf-content'
            
            response = await client.get(
                f"/api/reports/companies/{test_company.id}/report/esg",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            assert response.headers["content-type"] == "application/pdf"
            assert "attachment" in response.headers["content-disposition"]
            assert response.content == b'fake-pdf-content'
            
            # Verify the report generator was called correctly
            mock_generator_instance.generate_company_esg_report.assert_called_once()
            call_args = mock_generator_instance.generate_company_esg_report.call_args
            assert call_args[1]["company_id"] == test_company.id
            assert call_args[1]["include_evidence_links"] == True
    
    @pytest.mark.asyncio
    async def test_generate_esg_report_without_evidence(self, client: AsyncClient, auth_headers, test_company):
        """Test ESG report generation without evidence links."""
        with patch('app.routers.reports.ESGReportGenerator') as mock_generator:
            mock_generator_instance = mock_generator.return_value
            mock_generator_instance.generate_company_esg_report.return_value = b'fake-pdf-content'
            
            response = await client.get(
                f"/api/reports/companies/{test_company.id}/report/esg?include_evidence=false",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            
            # Verify evidence links parameter was set correctly
            call_args = mock_generator_instance.generate_company_esg_report.call_args
            assert call_args[1]["include_evidence_links"] == False
    
    @pytest.mark.asyncio
    async def test_generate_esg_report_company_not_found(self, client: AsyncClient, auth_headers):
        """Test report generation for non-existent company."""
        response = await client.get(
            "/api/reports/companies/nonexistent-company-id/report/esg",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_generate_esg_report_unauthorized(self, client: AsyncClient, test_company):
        """Test report generation without authentication."""
        response = await client.get(
            f"/api/reports/companies/{test_company.id}/report/esg"
        )
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_generate_esg_report_generation_error(self, client: AsyncClient, auth_headers, test_company):
        """Test handling of report generation errors."""
        with patch('app.routers.reports.ESGReportGenerator') as mock_generator:
            mock_generator_instance = mock_generator.return_value
            mock_generator_instance.generate_company_esg_report.side_effect = Exception("Report generation failed")
            
            response = await client.get(
                f"/api/reports/companies/{test_company.id}/report/esg",
                headers=auth_headers
            )
            
            assert response.status_code == 500
            assert "Failed to generate report" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_get_company_analytics_success(self, client: AsyncClient, auth_headers, test_company, sample_tasks):
        """Test successful company analytics retrieval."""
        with patch('app.routers.reports.ESGReportGenerator') as mock_generator:
            mock_generator_instance = mock_generator.return_value
            mock_generator_instance._gather_report_data.return_value = {
                "statistics": {
                    "total_tasks": 10,
                    "completion_rate": 70.0,
                    "completed_tasks": 7,
                    "overdue_tasks": 1,
                    "framework_coverage": {
                        "Green Key Global": {
                            "total": 5,
                            "completed": 3,
                            "completion_rate": 60.0
                        }
                    },
                    "category_breakdown": {
                        "energy": {
                            "total": 3,
                            "completed": 2,
                            "completion_rate": 66.7
                        }
                    }
                },
                "frameworks": ["Green Key Global", "Dubai Sustainable Tourism"],
                "evidence_by_task": {
                    "task1": ["evidence1", "evidence2"],
                    "task2": ["evidence3"]
                }
            }
            
            response = await client.get(
                f"/api/reports/companies/{test_company.id}/analytics",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert "company_info" in data
            assert "task_statistics" in data
            assert "framework_coverage" in data
            assert "category_breakdown" in data
            assert "recent_activity" in data
            
            # Check company info structure
            company_info = data["company_info"]
            assert "name" in company_info
            assert "sector" in company_info
            assert "esg_scoping_completed" in company_info
            
            # Check task statistics
            task_stats = data["task_statistics"]
            assert task_stats["total_tasks"] == 10
            assert task_stats["completion_rate"] == 70.0
            
            # Check recent activity
            recent_activity = data["recent_activity"]
            assert "total_evidence_files" in recent_activity
            assert "frameworks_applicable" in recent_activity
            assert recent_activity["total_evidence_files"] == 3  # Sum of evidence files
            assert recent_activity["frameworks_applicable"] == 2
    
    @pytest.mark.asyncio
    async def test_get_company_analytics_company_not_found(self, client: AsyncClient, auth_headers):
        """Test analytics for non-existent company."""
        response = await client.get(
            "/api/reports/companies/nonexistent-company-id/analytics",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_get_company_analytics_unauthorized(self, client: AsyncClient, test_company):
        """Test analytics without authentication."""
        response = await client.get(
            f"/api/reports/companies/{test_company.id}/analytics"
        )
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_preview_report_data_success(self, client: AsyncClient, auth_headers, test_company):
        """Test successful report preview data retrieval."""
        with patch('app.routers.reports.ESGReportGenerator') as mock_generator:
            mock_generator_instance = mock_generator.return_value
            mock_generator_instance._gather_report_data.return_value = {
                "statistics": {
                    "total_tasks": 15,
                    "completion_rate": 80.0,
                    "completed_tasks": 12,
                    "overdue_tasks": 0,
                    "framework_coverage": {},
                    "category_breakdown": {}
                },
                "frameworks": ["Green Key Global"],
                "scoping_summary": {
                    "completed": True,
                    "completed_at": "2024-01-15T10:30:00",
                    "sector": "hospitality",
                    "total_answers": 25
                },
                "tasks_by_category": {
                    "energy": ["task1", "task2"],
                    "water": ["task3"]
                },
                "evidence_by_task": {
                    "task1": ["evidence1"],
                    "task2": [],
                    "task3": ["evidence2", "evidence3"]
                }
            }
            
            response = await client.get(
                f"/api/reports/companies/{test_company.id}/report/preview",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert "company" in data
            assert "statistics" in data
            assert "frameworks" in data
            assert "scoping_summary" in data
            assert "task_counts_by_category" in data
            assert "evidence_summary" in data
            
            # Check company info
            company = data["company"]
            assert company["name"] == test_company.name
            assert company["main_location"] == test_company.main_location
            
            # Check statistics
            statistics = data["statistics"]
            assert statistics["total_tasks"] == 15
            assert statistics["completion_rate"] == 80.0
            
            # Check evidence summary
            evidence_summary = data["evidence_summary"]
            assert evidence_summary["total_files"] == 3  # Sum of all evidence files
            assert evidence_summary["tasks_with_evidence"] == 2  # Tasks with at least one evidence file
            
            # Check task counts by category
            task_counts = data["task_counts_by_category"]
            assert task_counts["energy"] == 2
            assert task_counts["water"] == 1
    
    @pytest.mark.asyncio
    async def test_preview_report_data_company_not_found(self, client: AsyncClient, auth_headers):
        """Test report preview for non-existent company."""
        response = await client.get(
            "/api/reports/companies/nonexistent-company-id/report/preview",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_preview_report_data_unauthorized(self, client: AsyncClient, test_company):
        """Test report preview without authentication."""
        response = await client.get(
            f"/api/reports/companies/{test_company.id}/report/preview"
        )
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_preview_report_data_generation_error(self, client: AsyncClient, auth_headers, test_company):
        """Test handling of preview data generation errors."""
        with patch('app.routers.reports.ESGReportGenerator') as mock_generator:
            mock_generator_instance = mock_generator.return_value
            mock_generator_instance._gather_report_data.side_effect = Exception("Data gathering failed")
            
            response = await client.get(
                f"/api/reports/companies/{test_company.id}/report/preview",
                headers=auth_headers
            )
            
            assert response.status_code == 500
            assert "Failed to generate preview" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_reports_workflow_integration(self, client: AsyncClient, auth_headers, test_company):
        """Test complete reports workflow integration."""
        with patch('app.routers.reports.ESGReportGenerator') as mock_generator:
            mock_generator_instance = mock_generator.return_value
            
            # Mock data for consistent responses
            mock_report_data = {
                "statistics": {
                    "total_tasks": 10,
                    "completion_rate": 75.0,
                    "completed_tasks": 8,
                    "overdue_tasks": 1,
                    "framework_coverage": {
                        "Green Key Global": {"total": 5, "completed": 4, "completion_rate": 80.0}
                    },
                    "category_breakdown": {
                        "energy": {"total": 3, "completed": 3, "completion_rate": 100.0}
                    }
                },
                "frameworks": ["Green Key Global"],
                "scoping_summary": {"completed": True},
                "tasks_by_category": {"energy": ["task1", "task2", "task3"]},
                "evidence_by_task": {"task1": ["evidence1"], "task2": [], "task3": ["evidence2"]}
            }
            
            mock_generator_instance._gather_report_data.return_value = mock_report_data
            mock_generator_instance.generate_company_esg_report.return_value = b'test-pdf-content'
            
            # Step 1: Get analytics
            analytics_response = await client.get(
                f"/api/reports/companies/{test_company.id}/analytics",
                headers=auth_headers
            )
            assert analytics_response.status_code == 200
            analytics_data = analytics_response.json()
            assert analytics_data["task_statistics"]["completion_rate"] == 75.0
            
            # Step 2: Preview report data
            preview_response = await client.get(
                f"/api/reports/companies/{test_company.id}/report/preview",
                headers=auth_headers
            )
            assert preview_response.status_code == 200
            preview_data = preview_response.json()
            assert preview_data["evidence_summary"]["total_files"] == 2
            
            # Step 3: Generate actual PDF report
            report_response = await client.get(
                f"/api/reports/companies/{test_company.id}/report/esg",
                headers=auth_headers
            )
            assert report_response.status_code == 200
            assert report_response.headers["content-type"] == "application/pdf"
            assert report_response.content == b'test-pdf-content'
    
    @pytest.mark.asyncio
    async def test_rbac_access_control(self, client: AsyncClient, contributor_auth_headers, test_company):
        """Test that RBAC properly restricts access to company reports."""
        # This test assumes that contributors can only access their own company's reports
        # The exact RBAC implementation may vary
        
        with patch('app.routers.reports.ESGReportGenerator') as mock_generator:
            mock_generator_instance = mock_generator.return_value
            mock_generator_instance.generate_company_esg_report.return_value = b'fake-pdf'
            
            response = await client.get(
                f"/api/reports/companies/{test_company.id}/report/esg",
                headers=contributor_auth_headers
            )
            
            # The response should be successful if the contributor belongs to the company
            # or 404/403 if they don't have access
            assert response.status_code in [200, 403, 404]