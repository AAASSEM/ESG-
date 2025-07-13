"""
Integration tests for ESG scoping wizard endpoints.
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch


class TestESGScopingEndpoints:
    """Integration tests for ESG scoping wizard API endpoints."""
    
    @pytest.mark.asyncio
    async def test_get_available_sectors(self, client: AsyncClient):
        """Test getting available business sectors."""
        with patch('app.routers.esg_scoping.ESGContentParser') as mock_parser:
            mock_parser_instance = mock_parser.return_value
            mock_parser_instance.get_available_sectors.return_value = [
                'hospitality', 'construction_real_estate', 'manufacturing'
            ]
            
            response = await client.get("/api/esg/sectors")
            
            assert response.status_code == 200
            data = response.json()
            
            assert "sectors" in data
            assert len(data["sectors"]) == 3
            
            # Check sector structure
            first_sector = data["sectors"][0]
            assert "id" in first_sector
            assert "name" in first_sector
            assert "description" in first_sector
            assert first_sector["id"] == "hospitality"
            assert "Hospitality" in first_sector["name"]
    
    @pytest.mark.asyncio
    async def test_get_sector_questions_success(self, client: AsyncClient, auth_headers):
        """Test getting ESG questions for a specific sector."""
        with patch('app.routers.esg_scoping.ESGContentParser') as mock_parser:
            mock_parser_instance = mock_parser.return_value
            mock_parser_instance.parse_sector_questions.return_value = [
                {
                    "id": 1,
                    "question": "Do you have a sustainability policy?",
                    "rationale": "Policy is required for compliance",
                    "frameworks": "Green Key Global",
                    "data_source": "Policy document",
                    "category": "Governance & Management",
                    "sector": "hospitality",
                    "required": True,
                    "type": "yes_no"
                },
                {
                    "id": 2,
                    "question": "Do you track electricity consumption?",
                    "rationale": "Energy monitoring for carbon calculation",
                    "frameworks": "DST Carbon Calculator",
                    "data_source": "Monthly utility bills",
                    "category": "Energy",
                    "sector": "hospitality",
                    "required": True,
                    "type": "yes_no"
                }
            ]
            mock_parser_instance.get_sector_frameworks.return_value = [
                "Dubai Sustainable Tourism", "Green Key Global"
            ]
            
            response = await client.get("/api/esg/sectors/hospitality/questions", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            
            assert "sector" in data
            assert "total_questions" in data
            assert "categories" in data
            assert "questions_by_category" in data
            assert "frameworks" in data
            
            assert data["sector"] == "hospitality"
            assert data["total_questions"] == 2
            assert len(data["frameworks"]) == 2
            assert "Governance & Management" in data["categories"]
            assert "Energy" in data["categories"]
    
    @pytest.mark.asyncio
    async def test_get_sector_questions_unauthorized(self, client: AsyncClient):
        """Test getting sector questions without authentication."""
        response = await client.get("/api/esg/sectors/hospitality/questions")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_sector_questions_not_found(self, client: AsyncClient, auth_headers):
        """Test getting questions for non-existent sector."""
        with patch('app.routers.esg_scoping.ESGContentParser') as mock_parser:
            mock_parser_instance = mock_parser.return_value
            mock_parser_instance.parse_sector_questions.side_effect = ValueError("Unknown sector")
            
            response = await client.get("/api/esg/sectors/unknown_sector/questions", headers=auth_headers)
            
            assert response.status_code == 500
    
    @pytest.mark.asyncio
    async def test_get_sector_questions_no_questions(self, client: AsyncClient, auth_headers):
        """Test getting questions when none are available."""
        with patch('app.routers.esg_scoping.ESGContentParser') as mock_parser:
            mock_parser_instance = mock_parser.return_value
            mock_parser_instance.parse_sector_questions.return_value = []
            
            response = await client.get("/api/esg/sectors/hospitality/questions", headers=auth_headers)
            
            assert response.status_code == 404
            assert "No questions found" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_complete_esg_scoping_success(self, client: AsyncClient, auth_headers, test_company):
        """Test successful completion of ESG scoping wizard."""
        scoping_data = {
            "sector": "hospitality",
            "answers": {
                "1": "yes",
                "2": "no",
                "3": "100"
            },
            "preferences": {
                "priority_level": "high",
                "completion_timeframe": "6_months"
            }
        }
        
        with patch('app.routers.esg_scoping.TaskGenerator') as mock_generator:
            mock_generator_instance = mock_generator.return_value
            mock_generator_instance.generate_tasks_from_scoping.return_value = [
                {
                    "title": "Implement sustainability policy",
                    "description": "Create comprehensive sustainability policy",
                    "compliance_context": "Green Key Global requirement",
                    "action_required": "Policy document creation",
                    "category": "governance",
                    "priority": "high",
                    "due_date": "2024-02-15",
                    "framework_tags": ["Green Key Global"],
                    "required_evidence_count": 1
                }
            ]
            
            response = await client.post(
                f"/api/esg/scoping/{test_company.id}/complete",
                json=scoping_data,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert "message" in data
            assert "tasks_generated" in data
            assert "sector" in data
            assert "company_id" in data
            assert "tasks" in data
            
            assert data["tasks_generated"] == 1
            assert data["sector"] == "hospitality"
            assert data["company_id"] == test_company.id
            assert len(data["tasks"]) == 1
    
    @pytest.mark.asyncio
    async def test_complete_esg_scoping_missing_sector(self, client: AsyncClient, auth_headers, test_company):
        """Test ESG scoping completion without sector."""
        scoping_data = {
            "answers": {"1": "yes"},
            "preferences": {}
        }
        
        response = await client.post(
            f"/api/esg/scoping/{test_company.id}/complete",
            json=scoping_data,
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "Sector is required" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_complete_esg_scoping_company_not_found(self, client: AsyncClient, auth_headers):
        """Test ESG scoping completion for non-existent company."""
        scoping_data = {
            "sector": "hospitality",
            "answers": {"1": "yes"},
            "preferences": {}
        }
        
        response = await client.post(
            "/api/esg/scoping/nonexistent-company-id/complete",
            json=scoping_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_complete_esg_scoping_unauthorized(self, client: AsyncClient, test_company):
        """Test ESG scoping completion without authentication."""
        scoping_data = {
            "sector": "hospitality",
            "answers": {"1": "yes"},
            "preferences": {}
        }
        
        response = await client.post(
            f"/api/esg/scoping/{test_company.id}/complete",
            json=scoping_data
        )
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_scoping_status_success(self, client: AsyncClient, auth_headers, test_company, sample_tasks):
        """Test getting ESG scoping completion status."""
        response = await client.get(
            f"/api/esg/scoping/{test_company.id}/status",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "company_id" in data
        assert "scoping_completed" in data
        assert "business_sector" in data
        assert "scoping_completed_at" in data
        assert "progress" in data
        
        # Check progress structure
        progress = data["progress"]
        assert "total_tasks" in progress
        assert "completed_tasks" in progress
        assert "completion_percentage" in progress
        assert "category_breakdown" in progress
        
        assert data["company_id"] == test_company.id
        assert isinstance(progress["completion_percentage"], (int, float))
        assert progress["completion_percentage"] >= 0
        assert progress["completion_percentage"] <= 100
    
    @pytest.mark.asyncio
    async def test_get_scoping_status_company_not_found(self, client: AsyncClient, auth_headers):
        """Test getting scoping status for non-existent company."""
        response = await client.get(
            "/api/esg/scoping/nonexistent-company-id/status",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_get_scoping_status_unauthorized(self, client: AsyncClient, test_company):
        """Test getting scoping status without authentication."""
        response = await client.get(f"/api/esg/scoping/{test_company.id}/status")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_scoping_workflow_integration(self, client: AsyncClient, auth_headers, test_company):
        """Test complete ESG scoping workflow integration."""
        # Step 1: Get available sectors
        sectors_response = await client.get("/api/esg/sectors")
        assert sectors_response.status_code == 200
        sectors_data = sectors_response.json()
        assert len(sectors_data["sectors"]) > 0
        
        # Step 2: Get questions for hospitality sector
        with patch('app.routers.esg_scoping.ESGContentParser') as mock_parser:
            mock_parser_instance = mock_parser.return_value
            mock_parser_instance.parse_sector_questions.return_value = [
                {
                    "id": 1,
                    "question": "Do you have a sustainability policy?",
                    "rationale": "Policy is required",
                    "frameworks": "Green Key Global",
                    "data_source": "Policy document",
                    "category": "Governance",
                    "sector": "hospitality",
                    "required": True,
                    "type": "yes_no"
                }
            ]
            mock_parser_instance.get_sector_frameworks.return_value = ["Green Key Global"]
            
            questions_response = await client.get(
                "/api/esg/sectors/hospitality/questions",
                headers=auth_headers
            )
            assert questions_response.status_code == 200
            questions_data = questions_response.json()
            assert questions_data["total_questions"] > 0
        
        # Step 3: Complete scoping with answers
        with patch('app.routers.esg_scoping.TaskGenerator') as mock_generator:
            mock_generator_instance = mock_generator.return_value
            mock_generator_instance.generate_tasks_from_scoping.return_value = [
                {
                    "title": "Test task",
                    "description": "Test description",
                    "compliance_context": "Test context",
                    "action_required": "Test action",
                    "category": "governance",
                    "priority": "high",
                    "due_date": "2024-02-15",
                    "framework_tags": ["Green Key Global"],
                    "required_evidence_count": 1
                }
            ]
            
            scoping_data = {
                "sector": "hospitality",
                "answers": {"1": "no"},  # Answer 'no' to trigger task creation
                "preferences": {"priority_level": "high"}
            }
            
            complete_response = await client.post(
                f"/api/esg/scoping/{test_company.id}/complete",
                json=scoping_data,
                headers=auth_headers
            )
            assert complete_response.status_code == 200
            complete_data = complete_response.json()
            assert complete_data["tasks_generated"] > 0
        
        # Step 4: Check scoping status
        status_response = await client.get(
            f"/api/esg/scoping/{test_company.id}/status",
            headers=auth_headers
        )
        assert status_response.status_code == 200
        status_data = status_response.json()
        assert "progress" in status_data