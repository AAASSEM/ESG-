"""
Unit tests for ESG content markdown parser.
"""
import pytest
import tempfile
import os
from unittest.mock import patch

from app.core.markdown_parser import ESGContentParser, ESGQuestion
from app.models.company import BusinessSector
from app.models.tasks import TaskCategory


class TestESGContentParser:
    """Test suite for ESG content markdown parser."""
    
    def test_parser_initialization(self):
        """Test parser initialization with default settings."""
        parser = ESGContentParser()
        assert parser.content_file_path is not None
        assert parser._content_cache is None
        assert parser.md is not None
    
    def test_parser_initialization_with_custom_path(self):
        """Test parser initialization with custom content file path."""
        custom_path = "/custom/path/content.md"
        parser = ESGContentParser(custom_path)
        assert parser.content_file_path == custom_path
    
    def test_load_content_file_success(self, esg_content_sample):
        """Test successful loading of content file."""
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.md') as tmp_file:
            tmp_file.write(esg_content_sample)
            tmp_file_path = tmp_file.name
        
        try:
            parser = ESGContentParser(tmp_file_path)
            content = parser.load_content_file()
            
            assert content == esg_content_sample
            assert parser._content_cache == esg_content_sample
            
            # Test caching - second call should return cached content
            content_cached = parser.load_content_file()
            assert content_cached == content
        finally:
            os.unlink(tmp_file_path)
    
    def test_load_content_file_not_found(self):
        """Test handling of missing content file."""
        parser = ESGContentParser("/nonexistent/file.md")
        
        with pytest.raises(ValueError, match="ESG content file not found"):
            parser.load_content_file()
    
    def test_get_available_sectors(self, esg_content_sample):
        """Test extraction of available sectors from content."""
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.md') as tmp_file:
            # Create content with multiple sectors
            content = '''
#### **1\\. Hospitality Sector (Hotels & Restaurants)**
#### **2\\. Construction & Real Estate Sector**
#### **3\\. Manufacturing Sector**
#### **4\\. Logistics & Transportation Sector**
#### **5\\. Education Sector**
#### **6\\. Health Sector**
'''
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            parser = ESGContentParser(tmp_file_path)
            sectors = parser.get_available_sectors()
            
            expected_sectors = [
                'hospitality',
                'construction_real_estate', 
                'manufacturing',
                'logistics_transportation',
                'education',
                'health'
            ]
            
            assert sectors == expected_sectors
        finally:
            os.unlink(tmp_file_path)
    
    def test_parse_sector_questions_hospitality(self, esg_content_sample):
        """Test parsing questions for hospitality sector."""
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.md') as tmp_file:
            tmp_file.write(esg_content_sample)
            tmp_file_path = tmp_file.name
        
        try:
            parser = ESGContentParser(tmp_file_path)
            questions = parser.parse_sector_questions('hospitality')
            
            assert len(questions) > 0
            
            # Check first question structure
            first_question = questions[0]
            assert 'id' in first_question
            assert 'question' in first_question
            assert 'rationale' in first_question
            assert 'frameworks' in first_question
            assert 'data_source' in first_question
            assert 'category' in first_question
            assert 'sector' in first_question
            assert 'required' in first_question
            assert 'type' in first_question
            
            assert first_question['sector'] == 'hospitality'
            assert first_question['required'] == True
            
            # Test specific question content
            policy_question = next(
                (q for q in questions if 'sustainability policy' in q['question'].lower()), 
                None
            )
            assert policy_question is not None
            assert policy_question['type'] == 'yes_no'
            
        finally:
            os.unlink(tmp_file_path)
    
    def test_parse_sector_questions_unknown_sector(self, esg_content_sample):
        """Test handling of unknown sector."""
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.md') as tmp_file:
            tmp_file.write(esg_content_sample)
            tmp_file_path = tmp_file.name
        
        try:
            parser = ESGContentParser(tmp_file_path)
            
            with pytest.raises(ValueError, match="Unknown sector: unknown_sector"):
                parser.parse_sector_questions('unknown_sector')
        finally:
            os.unlink(tmp_file_path)
    
    def test_infer_question_type(self):
        """Test question type inference logic."""
        parser = ESGContentParser()
        
        # Test yes/no questions
        assert parser._infer_question_type("Do you have a policy?") == "yes_no"
        assert parser._infer_question_type("do you track energy?") == "yes_no"
        
        # Test number questions
        assert parser._infer_question_type("How many employees do you have?") == "number"
        assert parser._infer_question_type("What is the energy consumption?") == "number"
        
        # Test date questions
        assert parser._infer_question_type("When was the policy implemented?") == "date"
        
        # Test multiple choice questions
        assert parser._infer_question_type("What type of energy do you use?") == "multiple_choice"
        assert parser._infer_question_type("Which certification do you have?") == "multiple_choice"
        
        # Test text questions (default)
        assert parser._infer_question_type("Describe your sustainability efforts") == "text"
        assert parser._infer_question_type("Other question format") == "text"
    
    def test_get_sector_frameworks(self, esg_content_sample):
        """Test extraction of sector-specific frameworks."""
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.md') as tmp_file:
            tmp_file.write(esg_content_sample)
            tmp_file_path = tmp_file.name
        
        try:
            parser = ESGContentParser(tmp_file_path)
            frameworks = parser.get_sector_frameworks('hospitality')
            
            assert len(frameworks) > 0
            assert 'Dubai Sustainable Tourism (DST)' in frameworks
            assert 'Green Key Global' in frameworks
            
        finally:
            os.unlink(tmp_file_path)
    
    def test_get_sector_frameworks_unknown_sector(self, esg_content_sample):
        """Test frameworks for unknown sector returns empty list."""
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.md') as tmp_file:
            tmp_file.write(esg_content_sample)
            tmp_file_path = tmp_file.name
        
        try:
            parser = ESGContentParser(tmp_file_path)
            frameworks = parser.get_sector_frameworks('unknown_sector')
            
            assert frameworks == []
            
        finally:
            os.unlink(tmp_file_path)
    
    def test_validate_content_structure(self, esg_content_sample):
        """Test content structure validation."""
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.md') as tmp_file:
            tmp_file.write(esg_content_sample)
            tmp_file_path = tmp_file.name
        
        try:
            parser = ESGContentParser(tmp_file_path)
            
            # Mock the get_all_sectors_content to return some content
            with patch.object(parser, 'get_all_sectors_content') as mock_get_content:
                mock_get_content.return_value = {
                    BusinessSector.HOSPITALITY: [ESGQuestion(
                        wizard_question="Test question",
                        rationale="Test rationale",
                        frameworks="Test framework",
                        data_source="Test data source",
                        sector=BusinessSector.HOSPITALITY,
                        category=TaskCategory.GOVERNANCE
                    )]
                }
                
                result = parser.validate_content_structure()
                assert result == True
                
        finally:
            os.unlink(tmp_file_path)
    
    def test_validate_content_structure_insufficient_coverage(self, esg_content_sample):
        """Test content validation with insufficient sector coverage."""
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.md') as tmp_file:
            tmp_file.write(esg_content_sample)
            tmp_file_path = tmp_file.name
        
        try:
            parser = ESGContentParser(tmp_file_path)
            
            # Mock to return very little content (below 50% threshold)
            with patch.object(parser, 'get_all_sectors_content') as mock_get_content:
                mock_get_content.return_value = {
                    sector: [] for sector in BusinessSector
                }
                
                result = parser.validate_content_structure()
                assert result == False
                
        finally:
            os.unlink(tmp_file_path)
    
    def test_categorize_question(self):
        """Test question categorization logic."""
        parser = ESGContentParser()
        
        # Test governance categorization
        assert parser._categorize_question("Do you have a governance policy?") == TaskCategory.GOVERNANCE
        assert parser._categorize_question("Management structure requirements") == TaskCategory.GOVERNANCE
        
        # Test energy categorization
        assert parser._categorize_question("Track electricity consumption") == TaskCategory.ENERGY
        assert parser._categorize_question("Solar power installation") == TaskCategory.ENERGY
        
        # Test water categorization
        assert parser._categorize_question("Water conservation measures") == TaskCategory.WATER
        assert parser._categorize_question("Monitor water consumption") == TaskCategory.WATER
        
        # Test waste categorization
        assert parser._categorize_question("Waste disposal procedures") == TaskCategory.WASTE
        assert parser._categorize_question("Recycling programs") == TaskCategory.WASTE
        
        # Test supply chain categorization
        assert parser._categorize_question("Supplier assessment") == TaskCategory.SUPPLY_CHAIN
        assert parser._categorize_question("Local sourcing policy") == TaskCategory.SUPPLY_CHAIN
        
        # Test social categorization
        assert parser._categorize_question("Employee training programs") == TaskCategory.SOCIAL
        assert parser._categorize_question("Community engagement") == TaskCategory.SOCIAL
        
        # Test environmental (default) categorization
        assert parser._categorize_question("Environmental impact assessment") == TaskCategory.ENVIRONMENTAL
        assert parser._categorize_question("Carbon emissions tracking") == TaskCategory.ENVIRONMENTAL
        assert parser._categorize_question("Some other question") == TaskCategory.ENVIRONMENTAL
    
    def test_clean_cell_text(self):
        """Test cell text cleaning functionality."""
        from bs4 import BeautifulSoup
        
        parser = ESGContentParser()
        
        # Test with HTML cell
        html = "<td>  Some text with   multiple   spaces  </td>"
        soup = BeautifulSoup(html, 'html.parser')
        cell = soup.find('td')
        
        cleaned = parser._clean_cell_text(cell)
        assert cleaned == "Some text with multiple spaces"
        
        # Test with None cell
        assert parser._clean_cell_text(None) == ""
        
        # Test with empty cell
        html = "<td></td>"
        soup = BeautifulSoup(html, 'html.parser')
        cell = soup.find('td')
        
        cleaned = parser._clean_cell_text(cell)
        assert cleaned == ""