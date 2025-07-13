"""
ESG content parser for dynamic task generation from markdown files.
"""
import markdown
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from dataclasses import dataclass
from pathlib import Path
import re
import logging

from ..models.company import BusinessSector
from ..models.tasks import TaskCategory
from ..config import settings

logger = logging.getLogger(__name__)


@dataclass
class ESGQuestion:
    """Data class for ESG questions parsed from markdown."""
    wizard_question: str
    rationale: str
    frameworks: str
    data_source: str
    sector: BusinessSector
    category: Optional[TaskCategory] = None


class ESGContentParser:
    """Parser for ESG content from markdown files."""
    
    def __init__(self, content_file_path: Optional[str] = None):
        """Initialize parser with content file path."""
        self.content_file_path = content_file_path or settings.esg_content_file
        self._content_cache = None
        self.md = markdown.Markdown(extensions=['tables', 'extra'])
    
    def load_content_file(self) -> str:
        """Load markdown content from file with caching."""
        if self._content_cache is None:
            try:
                with open(self.content_file_path, 'r', encoding='utf-8') as file:
                    self._content_cache = file.read()
                logger.info(f"Loaded ESG content from {self.content_file_path}")
            except FileNotFoundError:
                logger.error(f"ESG content file not found: {self.content_file_path}")
                raise ValueError(f"ESG content file not found: {self.content_file_path}")
            except Exception as e:
                logger.error(f"Error loading ESG content file: {e}")
                raise ValueError(f"Error loading ESG content file: {e}")
        
        return self._content_cache
    
    def parse_sector_content(self, sector: BusinessSector) -> List[ESGQuestion]:
        """
        Parse sector-specific ESG content from markdown file.
        
        Args:
            sector: Business sector to parse questions for
            
        Returns:
            List of ESGQuestion objects with framework mappings
        """
        try:
            markdown_content = self.load_content_file()
            
            # Use python-markdown with tables extension
            md = markdown.Markdown(extensions=['tables', 'extra'])
            html_content = md.convert(markdown_content)
            
            # Parse HTML with BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Find sector section
            sector_section = self._find_sector_section(soup, sector)
            if not sector_section:
                logger.warning(f"No section found for sector: {sector}")
                return []
            
            # Find and parse table
            table = sector_section.find('table')
            if not table:
                logger.warning(f"No table found in sector section: {sector}")
                return []
            
            questions = self._parse_table_rows(table, sector)
            logger.info(f"Parsed {len(questions)} questions for sector: {sector}")
            
            return questions
            
        except Exception as e:
            logger.error(f"Error parsing sector content for {sector}: {e}")
            raise ValueError(f"Error parsing sector content: {e}")
    
    def _find_sector_section(self, soup: BeautifulSoup, sector: BusinessSector) -> Optional[BeautifulSoup]:
        """Find the section for a specific business sector."""
        sector_patterns = {
            BusinessSector.HOSPITALITY: [r"hospitality", r"hotels?\s*&?\s*restaurants?"],
            BusinessSector.CONSTRUCTION: [r"construction", r"real\s*estate"],
            BusinessSector.REAL_ESTATE: [r"real\s*estate", r"construction"],
            BusinessSector.EDUCATION: [r"education"],
            BusinessSector.HEALTH: [r"health"],
            BusinessSector.LOGISTICS: [r"logistics", r"transportation"],
            BusinessSector.MANUFACTURING: [r"manufacturing"],
            BusinessSector.RETAIL: [r"retail", r"trading"]
        }
        
        patterns = sector_patterns.get(sector, [sector.value])
        
        # Look for section headers
        for header in soup.find_all(['h1', 'h2', 'h3', 'h4']):
            header_text = header.get_text().lower()
            for pattern in patterns:
                if re.search(pattern, header_text):
                    # Find the next section or end of document
                    current = header.next_sibling
                    section_content = []
                    
                    while current:
                        if current.name in ['h1', 'h2', 'h3', 'h4']:
                            break
                        if hasattr(current, 'name'):
                            section_content.append(current)
                        current = current.next_sibling
                    
                    # Create a new soup with section content
                    section_soup = BeautifulSoup("", 'html.parser')
                    for element in section_content:
                        if hasattr(element, 'name'):
                            section_soup.append(element)
                    
                    return section_soup
        
        return None
    
    def _parse_table_rows(self, table: BeautifulSoup, sector: BusinessSector) -> List[ESGQuestion]:
        """Parse table rows into ESGQuestion objects."""
        questions = []
        rows = table.find_all('tr')
        
        if not rows:
            return questions
        
        # Skip header row
        data_rows = rows[1:] if len(rows) > 1 else rows
        
        for row in data_rows:
            cells = row.find_all(['td', 'th'])
            
            if len(cells) >= 4:
                try:
                    question = ESGQuestion(
                        wizard_question=self._clean_cell_text(cells[0]),
                        rationale=self._clean_cell_text(cells[1]),
                        frameworks=self._clean_cell_text(cells[2]),
                        data_source=self._clean_cell_text(cells[3]),
                        sector=sector,
                        category=self._categorize_question(cells[0].get_text())
                    )
                    
                    # Only add non-empty questions
                    if question.wizard_question and question.wizard_question.strip():
                        questions.append(question)
                        
                except Exception as e:
                    logger.warning(f"Error parsing table row: {e}")
                    continue
        
        return questions
    
    def _clean_cell_text(self, cell) -> str:
        """Clean and normalize cell text content."""
        if not cell:
            return ""
        
        text = cell.get_text().strip()
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        return text
    
    def _categorize_question(self, question_text: str) -> TaskCategory:
        """Categorize question based on content keywords."""
        text_lower = question_text.lower()
        
        # Define keyword mappings
        category_keywords = {
            TaskCategory.GOVERNANCE: ['governance', 'policy', 'management', 'committee', 'strategy'],
            TaskCategory.ENERGY: ['energy', 'electricity', 'fuel', 'power', 'solar', 'renewable'],
            TaskCategory.WATER: ['water', 'conservation', 'consumption', 'flow'],
            TaskCategory.WASTE: ['waste', 'recycling', 'disposal', 'landfill'],
            TaskCategory.SUPPLY_CHAIN: ['supply', 'supplier', 'procurement', 'local', 'sourcing'],
            TaskCategory.SOCIAL: ['employee', 'training', 'social', 'community', 'safety'],
            TaskCategory.ENVIRONMENTAL: ['environmental', 'emissions', 'carbon', 'climate']
        }
        
        # Check for keyword matches
        for category, keywords in category_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                return category
        
        # Default category
        return TaskCategory.ENVIRONMENTAL
    
    def get_all_sectors_content(self) -> Dict[BusinessSector, List[ESGQuestion]]:
        """Parse content for all supported business sectors."""
        all_content = {}
        
        for sector in BusinessSector:
            try:
                questions = self.parse_sector_content(sector)
                all_content[sector] = questions
            except Exception as e:
                logger.error(f"Error parsing content for sector {sector}: {e}")
                all_content[sector] = []
        
        return all_content
    
    def validate_content_structure(self) -> bool:
        """Validate that the content file has proper structure."""
        try:
            all_content = self.get_all_sectors_content()
            
            # Check that we have content for most sectors
            sectors_with_content = sum(1 for questions in all_content.values() if questions)
            total_sectors = len(BusinessSector)
            
            if sectors_with_content < total_sectors * 0.5:  # At least 50% of sectors
                logger.warning(f"Only {sectors_with_content}/{total_sectors} sectors have content")
                return False
            
            logger.info(f"Content validation passed: {sectors_with_content}/{total_sectors} sectors have content")
            return True
            
        except Exception as e:
            logger.error(f"Content validation failed: {e}")
            return False
    
    def get_available_sectors(self) -> List[str]:
        """Get list of available business sectors from content."""
        content = self.load_content_file()
        
        # Extract sector headers using regex
        sector_pattern = re.compile(r'#### \*\*(\d+)\\?\. (.+?) Sector', re.MULTILINE)
        matches = sector_pattern.findall(content)
        
        sectors = []
        for match in matches:
            sector_name = match[1].lower().replace(' & ', '_').replace(' ', '_')
            # Map to standard sector names
            sector_mapping = {
                'hospitality_(hotels_&_restaurants)': 'hospitality',
                'construction_&_real_estate': 'construction',
                'manufacturing': 'manufacturing', 
                'logistics_&_transportation': 'logistics',
                'education': 'education',
                'health': 'health'
            }
            
            mapped_sector = sector_mapping.get(sector_name, sector_name)
            sectors.append(mapped_sector)
        
        return sectors
    
    def parse_sector_questions(self, sector: str) -> List[Dict]:
        """
        Parse scoping questions for a specific sector.
        
        Args:
            sector: Business sector name
            
        Returns:
            List of structured questions with metadata
        """
        content = self.load_content_file()
        
        # Find sector section
        sector_mappings = {
            'hospitality': '1\\\\\\. Hospitality Sector \\(Hotels & Restaurants\\)',
            'construction_real_estate': '2\\\\\\. Construction & Real Estate Sector', 
            'manufacturing': '3\\\\\\. Manufacturing Sector',
            'logistics_transportation': '4\\\\\\. Logistics & Transportation Sector',
            'education': '5\\\\\\. Education Sector',
            'health': '6\\\\\\. Health Sector'
        }
        
        sector_pattern = sector_mappings.get(sector)
        if not sector_pattern:
            raise ValueError(f"Unknown sector: {sector}")
        
        # Extract sector section
        sector_regex = re.compile(f'#### \\*\\*{sector_pattern}\\*\\*.*?(?=#### |$)', re.DOTALL)
        sector_match = sector_regex.search(content)
        
        if not sector_match:
            raise ValueError(f"Sector content not found: {sector}")
        
        sector_content = sector_match.group(0)
        
        # Convert to HTML and parse table
        html_content = self.md.convert(sector_content)
        soup = BeautifulSoup(html_content, 'html.parser')
        
        table = soup.find('table')
        if not table:
            raise ValueError(f"No table found for sector: {sector}")
        
        questions = []
        current_category = "General"
        
        rows = table.find_all('tr')[1:]  # Skip header row
        
        for row in rows:
            cells = row.find_all('td')
            if len(cells) >= 4:
                question_text = cells[0].get_text().strip()
                
                # Check if this is a category header
                if question_text.startswith('**') and question_text.endswith('**'):
                    current_category = question_text.strip('*')
                    continue
                
                if question_text and not question_text.startswith('**'):
                    question = {
                        "id": len(questions) + 1,
                        "question": question_text,
                        "rationale": cells[1].get_text().strip(),
                        "frameworks": cells[2].get_text().strip(),
                        "data_source": cells[3].get_text().strip(),
                        "category": current_category,
                        "sector": sector,
                        "required": True,  # All questions are required by default
                        "type": self._infer_question_type(question_text)
                    }
                    questions.append(question)
        
        return questions
    
    def _infer_question_type(self, question_text: str) -> str:
        """Infer question type from question text."""
        question_lower = question_text.lower()
        
        if question_lower.startswith('do you'):
            return 'yes_no'
        elif 'how many' in question_lower or 'what is the' in question_lower:
            return 'number'
        elif 'when' in question_lower:
            return 'date'
        elif 'what type' in question_lower or 'which' in question_lower:
            return 'multiple_choice'
        else:
            return 'text'
    
    def get_sector_frameworks(self, sector: str) -> List[str]:
        """Get frameworks applicable to a sector."""
        content = self.load_content_file()
        
        # Find frameworks section for sector
        sector_mappings = {
            'hospitality': '1\\\\\\. Hospitality Sector \\(Hotels & Restaurants\\)',
            'construction_real_estate': '2\\\\\\. Construction & Real Estate Sector',
            'manufacturing': '3\\\\\\. Manufacturing Sector', 
            'logistics_transportation': '4\\\\\\. Logistics & Transportation Sector',
            'education': '5\\\\\\. Education Sector',
            'health': '6\\\\\\. Health Sector'
        }
        
        sector_pattern = sector_mappings.get(sector)
        if not sector_pattern:
            return []
        
        # Extract frameworks from content
        frameworks_regex = re.compile(f'#### \\*\\*{sector_pattern}\\*\\*.*?\\*\\*Intersecting Frameworks:\\*\\*(.*?)\\*\\*Scoping Questions', re.DOTALL)
        frameworks_match = frameworks_regex.search(content)
        
        if not frameworks_match:
            return []
        
        frameworks_text = frameworks_match.group(1)
        
        # Extract framework names
        framework_lines = [line.strip() for line in frameworks_text.split('\n') if line.strip()]
        frameworks = []
        
        for line in framework_lines:
            if line.startswith('*'):
                # Extract framework name from bullet point
                framework_match = re.match(r'\* \*\*(.*?):\*\*', line)
                if framework_match:
                    frameworks.append(framework_match.group(1))
        
        return frameworks