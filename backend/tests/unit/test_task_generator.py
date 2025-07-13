"""
Unit tests for task generator functionality.
"""
import pytest
from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from app.core.task_generator import TaskGenerator
from app.core.markdown_parser import ESGQuestion
from app.models.company import Company, BusinessSector
from app.models.tasks import Task, TaskStatus, TaskCategory


class TestTaskGenerator:
    """Test suite for task generator."""
    
    def test_task_generator_initialization(self):
        """Test task generator initialization."""
        generator = TaskGenerator()
        assert generator.parser is not None
        
        # Test with custom parser
        custom_parser = MagicMock()
        generator = TaskGenerator(custom_parser)
        assert generator.parser == custom_parser
    
    @pytest.mark.asyncio
    async def test_generate_tasks_for_company_success(self, test_session, test_company):
        """Test successful task generation for a company."""
        generator = TaskGenerator()
        
        # Mock parser to return sample questions
        sample_questions = [
            ESGQuestion(
                wizard_question="Do you have a sustainability policy?",
                rationale="Formal commitment to sustainability",
                frameworks="Green Key: 1.2 Sustainability Policy",
                data_source="Signed policy document",
                sector=BusinessSector.HOSPITALITY,
                category=TaskCategory.GOVERNANCE
            ),
            ESGQuestion(
                wizard_question="Do you track electricity consumption?",
                rationale="Monitor energy usage for carbon calculation",
                frameworks="DST Carbon Calculator: Mandatory Input",
                data_source="Monthly utility bills",
                sector=BusinessSector.HOSPITALITY,
                category=TaskCategory.ENERGY
            )
        ]
        
        with patch.object(generator.parser, 'parse_sector_content', return_value=sample_questions):
            tasks = await generator.generate_tasks_for_company(
                db=test_session,
                company_id=test_company.id
            )
            
            assert len(tasks) == 2
            
            # Check first task
            policy_task = tasks[0]
            assert policy_task.title == "Do you have a sustainability policy?"
            assert policy_task.description == "Formal commitment to sustainability"
            assert policy_task.company_id == test_company.id
            assert policy_task.status == TaskStatus.TODO
            assert policy_task.category == TaskCategory.GOVERNANCE
            
            # Check second task
            energy_task = tasks[1]
            assert energy_task.title == "Do you track electricity consumption?"
            assert energy_task.category == TaskCategory.ENERGY
            assert "DST" in energy_task.framework_tags or "Dubai Sustainable Tourism" in energy_task.framework_tags
    
    @pytest.mark.asyncio
    async def test_generate_tasks_for_nonexistent_company(self, test_session):
        """Test task generation for non-existent company."""
        generator = TaskGenerator()
        
        with pytest.raises(ValueError, match="Company not found"):
            await generator.generate_tasks_for_company(
                db=test_session,
                company_id="nonexistent-id"
            )
    
    @pytest.mark.asyncio
    async def test_generate_tasks_no_questions_available(self, test_session, test_company):
        """Test task generation when no questions are available for sector."""
        generator = TaskGenerator()
        
        with patch.object(generator.parser, 'parse_sector_content', return_value=[]):
            tasks = await generator.generate_tasks_for_company(
                db=test_session,
                company_id=test_company.id
            )
            
            assert tasks == []
    
    def test_extract_framework_tags(self):
        """Test framework tag extraction."""
        generator = TaskGenerator()
        
        # Test with known frameworks
        frameworks_text = "Dubai Sustainable Tourism (DST) and Green Key Global certification"
        tags = generator._extract_framework_tags(frameworks_text)
        
        assert "Dubai Sustainable Tourism" in tags
        assert "Green Key Global" in tags
        
        # Test with mandatory compliance
        frameworks_text = "This is a mandatory requirement under Federal Law"
        tags = generator._extract_framework_tags(frameworks_text)
        
        assert "Mandatory Compliance" in tags
        assert "Federal Regulation" in tags
        
        # Test with empty text
        tags = generator._extract_framework_tags("")
        assert tags == []
        
        # Test with None
        tags = generator._extract_framework_tags(None)
        assert tags == []
        
        # Test with specific certifications
        frameworks_text = "ISO 14001 and LEED certification requirements"
        tags = generator._extract_framework_tags(frameworks_text)
        
        assert "ISO 14001" in tags
        assert "LEED" in tags
    
    @pytest.mark.asyncio
    async def test_regenerate_tasks_for_sector_update(self, test_session, test_company, test_task):
        """Test task regeneration when company sector is updated."""
        generator = TaskGenerator()
        
        # Create initial task
        initial_task_count = len(
            (await test_session.execute(
                "SELECT * FROM tasks WHERE company_id = ?", (test_company.id,)
            )).fetchall()
        )
        
        with patch.object(generator, 'generate_tasks_for_company', return_value=[]) as mock_generate:
            new_tasks = await generator.regenerate_tasks_for_sector_update(
                db=test_session,
                company_id=test_company.id,
                new_sector=BusinessSector.MANUFACTURING
            )
            
            # Verify the method was called
            mock_generate.assert_called_once()
            assert new_tasks == []
    
    @pytest.mark.asyncio
    async def test_get_framework_coverage(self, test_session, test_company, sample_tasks):
        """Test framework coverage statistics calculation."""
        generator = TaskGenerator()
        
        coverage = await generator.get_framework_coverage(
            db=test_session,
            company_id=test_company.id
        )
        
        assert isinstance(coverage, dict)
        
        # Check if framework statistics are calculated correctly
        for framework, stats in coverage.items():
            assert 'total' in stats
            assert 'completed' in stats
            assert 'in_progress' in stats
            assert 'pending' in stats
            assert stats['total'] >= 0
            assert stats['completed'] >= 0
    
    @pytest.mark.asyncio
    async def test_suggest_priority_tasks(self, test_session, test_company, sample_tasks):
        """Test priority task suggestion."""
        generator = TaskGenerator()
        
        priority_tasks = await generator.suggest_priority_tasks(
            db=test_session,
            company_id=test_company.id,
            limit=3
        )
        
        assert len(priority_tasks) <= 3
        
        # Check that completed tasks are not included
        for task in priority_tasks:
            assert task.status != TaskStatus.COMPLETED
        
        # Check that tasks belong to the company
        for task in priority_tasks:
            assert task.company_id == test_company.id
    
    def test_generate_tasks_from_scoping(self):
        """Test task generation from scoping wizard results."""
        generator = TaskGenerator()
        
        # Mock parser methods
        with patch.object(generator.parser, 'parse_sector_questions') as mock_questions, \
             patch.object(generator.parser, 'get_sector_frameworks') as mock_frameworks:
            
            mock_questions.return_value = [
                {
                    'id': 1,
                    'question': 'Do you have a sustainability policy?',
                    'rationale': 'Policy is required for compliance',
                    'frameworks': 'Green Key Global',
                    'data_source': 'Policy document',
                    'category': 'Governance & Management',
                    'type': 'yes_no'
                }
            ]
            
            mock_frameworks.return_value = ['Green Key Global', 'Dubai Sustainable Tourism']
            
            answers = {'1': 'no'}  # Answer 'no' to trigger task creation
            preferences = {'priority_level': 'high'}
            
            tasks = generator.generate_tasks_from_scoping(
                sector='hospitality',
                answers=answers,
                preferences=preferences,
                company_id='test-company-id'
            )
            
            assert len(tasks) > 0
            
            # Check task structure
            task = tasks[0]
            assert 'title' in task
            assert 'description' in task
            assert 'category' in task
            assert 'priority' in task
            assert 'due_date' in task
            assert task['company_id'] == 'test-company-id'
    
    def test_determine_task_necessity(self):
        """Test task necessity determination logic."""
        generator = TaskGenerator()
        
        # Test yes/no questions
        assert generator._determine_task_necessity('yes_no', 'no') == True  # Create task for 'no'
        assert generator._determine_task_necessity('yes_no', 'yes') == False  # No task for 'yes'
        assert generator._determine_task_necessity('yes_no', 'false') == True
        
        # Test number questions
        assert generator._determine_task_necessity('number', '0') == True  # Create task for 0
        assert generator._determine_task_necessity('number', '5') == False  # No task for positive
        assert generator._determine_task_necessity('number', '') == True  # Create task for empty
        
        # Test other question types
        assert generator._determine_task_necessity('text', 'some answer') == True
        assert generator._determine_task_necessity('text', '') == False
    
    def test_generate_task_title(self):
        """Test task title generation."""
        generator = TaskGenerator()
        
        # Test "Do you" questions
        title = generator._generate_task_title("Do you have a policy?", "no")
        assert title == "Implement have a policy"
        
        # Test other question formats
        title = generator._generate_task_title("What is your energy consumption?", "100")
        assert title == "Establish what is your energy consumption"
    
    def test_determine_task_priority(self):
        """Test task priority determination."""
        generator = TaskGenerator()
        
        question = {
            'question': 'Do you have mandatory compliance training?',
            'frameworks': 'This is a mandatory requirement under UAE law'
        }
        frameworks = ['UAE Federal Law']
        
        priority = generator._determine_task_priority(question, frameworks)
        assert priority == 'high'
        
        # Test medium priority
        question = {
            'question': 'Do you provide training to employees?',
            'frameworks': 'Training recommendations'
        }
        
        priority = generator._determine_task_priority(question, frameworks)
        assert priority == 'medium'
        
        # Test low priority (default)
        question = {
            'question': 'Do you have optional features?',
            'frameworks': 'Optional guidelines'
        }
        
        priority = generator._determine_task_priority(question, frameworks)
        assert priority == 'low'
    
    def test_calculate_due_date(self):
        """Test due date calculation based on priority."""
        generator = TaskGenerator()
        
        # Test high priority (30 days)
        due_date = generator._calculate_due_date('high')
        expected_date = (date.today() + timedelta(days=30))
        assert due_date == expected_date
        
        # Test medium priority (60 days)
        due_date = generator._calculate_due_date('medium')
        expected_date = (date.today() + timedelta(days=60))
        assert due_date == expected_date
        
        # Test low priority (90 days)
        due_date = generator._calculate_due_date('low')
        expected_date = (date.today() + timedelta(days=90))
        assert due_date == expected_date
    
    def test_determine_evidence_count(self):
        """Test evidence count determination."""
        generator = TaskGenerator()
        
        # Test bills/invoices
        question = {'data_source': 'Monthly utility bills and invoices'}
        count = generator._determine_evidence_count(question)
        assert count == 3
        
        # Test policy documents
        question = {'data_source': 'Policy document'}
        count = generator._determine_evidence_count(question)
        assert count == 1
        
        # Test records/logs
        question = {'data_source': 'Training records and attendance logs'}
        count = generator._determine_evidence_count(question)
        assert count == 2
        
        # Test default
        question = {'data_source': 'Other type of evidence'}
        count = generator._determine_evidence_count(question)
        assert count == 1
    
    def test_generate_framework_tasks(self):
        """Test framework-specific task generation."""
        generator = TaskGenerator()
        
        frameworks = ['Dubai Sustainable Tourism (DST)', 'Green Key Global']
        
        framework_tasks = generator._generate_framework_tasks(
            sector='hospitality',
            frameworks=frameworks,
            company_id='test-company-id'
        )
        
        assert len(framework_tasks) > 0
        
        # Check that DST mandatory task is created
        dst_task = next((t for t in framework_tasks if 'DST Carbon Calculator' in t['title']), None)
        assert dst_task is not None
        assert dst_task['priority'] == 'high'
        assert dst_task['company_id'] == 'test-company-id'
        
        # Check Green Key task
        green_key_task = next((t for t in framework_tasks if 'Green Key' in t['title']), None)
        assert green_key_task is not None
        assert green_key_task['priority'] == 'medium'