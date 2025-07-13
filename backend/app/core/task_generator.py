"""
Dynamic task generator for ESG compliance based on business sectors.
"""
from typing import List, Dict, Optional
from uuid import uuid4
from datetime import datetime, date, timedelta
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .markdown_parser import ESGContentParser, ESGQuestion
from ..models import Company, Task, TaskStatus, TaskCategory
from ..models.company import BusinessSector

logger = logging.getLogger(__name__)


class TaskGenerator:
    """Generate ESG tasks dynamically based on company sector and configuration."""
    
    def __init__(self, parser: Optional[ESGContentParser] = None):
        """Initialize task generator with ESG content parser."""
        self.parser = parser or ESGContentParser()
    
    async def generate_tasks_for_company(
        self,
        db: AsyncSession,
        company_id: str,
        location_id: Optional[str] = None,
        assigned_user_id: Optional[str] = None
    ) -> List[Task]:
        """
        Generate ESG tasks for a company based on their business sector.
        
        Args:
            db: Database session
            company_id: Company ID
            location_id: Optional location ID for task assignment
            assigned_user_id: Optional user ID for task assignment
            
        Returns:
            List of created Task objects
        """
        try:
            # Get company information
            result = await db.execute(
                select(Company).where(Company.id == company_id)
            )
            company = result.scalar_one_or_none()
            
            if not company:
                raise ValueError(f"Company not found: {company_id}")
            
            # Parse ESG questions for company's sector
            esg_questions = self.parser.parse_sector_content(company.business_sector)
            
            if not esg_questions:
                logger.warning(f"No ESG questions found for sector: {company.business_sector}")
                return []
            
            # Generate tasks from questions
            tasks = await self._create_tasks_from_questions(
                db=db,
                company_id=company_id,
                location_id=location_id,
                assigned_user_id=assigned_user_id,
                esg_questions=esg_questions
            )
            
            logger.info(f"Generated {len(tasks)} tasks for company {company_id}")
            return tasks
            
        except Exception as e:
            logger.error(f"Error generating tasks for company {company_id}: {e}")
            raise
    
    async def _create_tasks_from_questions(
        self,
        db: AsyncSession,
        company_id: str,
        location_id: Optional[str],
        assigned_user_id: Optional[str],
        esg_questions: List[ESGQuestion]
    ) -> List[Task]:
        """Create Task objects from ESG questions."""
        tasks = []
        
        for question in esg_questions:
            try:
                # Extract framework tags for "Collect Once, Use Many" logic
                framework_tags = self._extract_framework_tags(question.frameworks)
                
                # Generate due date (default: 30 days from now)
                due_date = date.today() + timedelta(days=30)
                
                task = Task(
                    id=uuid4(),
                    company_id=company_id,
                    location_id=location_id,
                    title=question.wizard_question,
                    description=question.rationale,
                    compliance_context=question.frameworks,
                    action_required=question.data_source,
                    status=TaskStatus.TODO,
                    category=question.category or TaskCategory.ENVIRONMENTAL,
                    assigned_user_id=assigned_user_id,
                    framework_tags=framework_tags,
                    due_date=due_date,
                    created_at=datetime.utcnow()
                )
                
                db.add(task)
                tasks.append(task)
                
            except Exception as e:
                logger.warning(f"Error creating task from question '{question.wizard_question}': {e}")
                continue
        
        try:
            await db.commit()
            logger.info(f"Successfully saved {len(tasks)} tasks to database")
        except Exception as e:
            await db.rollback()
            logger.error(f"Error saving tasks to database: {e}")
            raise
        
        return tasks
    
    def _extract_framework_tags(self, frameworks_text: str) -> List[str]:
        """
        Extract framework tags from the frameworks text for tagging.
        
        This enables "Collect Once, Use Many" logic where tasks can be
        associated with multiple frameworks.
        """
        if not frameworks_text:
            return []
        
        # Common framework abbreviations and names
        framework_mapping = {
            'dst': 'Dubai Sustainable Tourism',
            'green key': 'Green Key Global',
            'al sa\'fat': 'Al Sa\'fat Dubai',
            'estidama': 'Estidama Pearl',
            'leed': 'LEED',
            'breeam': 'BREEAM',
            'iso 14001': 'ISO 14001',
            'climate law': 'UAE Climate Law',
            'waste management': 'UAE Waste Management Law',
            'federal law': 'UAE Federal Law',
            'ssi': 'Sustainable Schools Initiative',
            'adek': 'ADEK Sustainability Policy',
            'doh': 'DoH Sustainability Goals',
            'mohap': 'MOHAP Hospital Regulation'
        }
        
        tags = []
        text_lower = frameworks_text.lower()
        
        for key, full_name in framework_mapping.items():
            if key in text_lower:
                tags.append(full_name)
        
        # If no specific frameworks found, categorize by content
        if not tags:
            if 'mandatory' in text_lower:
                tags.append('Mandatory Compliance')
            if 'voluntary' in text_lower:
                tags.append('Voluntary Standard')
            if 'dubai' in text_lower:
                tags.append('Dubai Regulation')
            if 'abu dhabi' in text_lower:
                tags.append('Abu Dhabi Regulation')
            if 'federal' in text_lower:
                tags.append('Federal Regulation')
        
        return list(set(tags))  # Remove duplicates
    
    async def regenerate_tasks_for_sector_update(
        self,
        db: AsyncSession,
        company_id: str,
        new_sector: BusinessSector
    ) -> List[Task]:
        """
        Regenerate tasks when a company's sector is updated.
        
        Args:
            db: Database session
            company_id: Company ID
            new_sector: New business sector
            
        Returns:
            List of newly created tasks
        """
        try:
            # Delete existing tasks that haven't been started
            await db.execute(
                select(Task).where(
                    Task.company_id == company_id,
                    Task.status == TaskStatus.TODO
                ).delete()
            )
            
            # Update company sector
            result = await db.execute(
                select(Company).where(Company.id == company_id)
            )
            company = result.scalar_one_or_none()
            
            if company:
                company.business_sector = new_sector
                await db.commit()
            
            # Generate new tasks
            new_tasks = await self.generate_tasks_for_company(
                db=db,
                company_id=company_id
            )
            
            logger.info(f"Regenerated {len(new_tasks)} tasks for company {company_id} with new sector {new_sector}")
            return new_tasks
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error regenerating tasks for company {company_id}: {e}")
            raise
    
    async def get_framework_coverage(
        self,
        db: AsyncSession,
        company_id: str
    ) -> Dict[str, Dict[str, int]]:
        """
        Get framework coverage statistics for a company.
        
        Returns:
            Dictionary with framework statistics
        """
        try:
            result = await db.execute(
                select(Task).where(Task.company_id == company_id)
            )
            tasks = result.scalars().all()
            
            framework_stats = {}
            
            for task in tasks:
                for framework in task.framework_tags:
                    if framework not in framework_stats:
                        framework_stats[framework] = {
                            'total': 0,
                            'completed': 0,
                            'in_progress': 0,
                            'pending': 0
                        }
                    
                    framework_stats[framework]['total'] += 1
                    
                    if task.status == TaskStatus.COMPLETED:
                        framework_stats[framework]['completed'] += 1
                    elif task.status == TaskStatus.IN_PROGRESS:
                        framework_stats[framework]['in_progress'] += 1
                    elif task.status == TaskStatus.PENDING_REVIEW:
                        framework_stats[framework]['pending'] += 1
            
            return framework_stats
            
        except Exception as e:
            logger.error(f"Error getting framework coverage for company {company_id}: {e}")
            return {}
    
    async def suggest_priority_tasks(
        self,
        db: AsyncSession,
        company_id: str,
        limit: int = 5
    ) -> List[Task]:
        """
        Suggest priority tasks based on frameworks and due dates.
        
        Args:
            db: Database session
            company_id: Company ID
            limit: Maximum number of tasks to return
            
        Returns:
            List of priority tasks
        """
        try:
            # Get tasks ordered by due date and mandatory frameworks
            result = await db.execute(
                select(Task)
                .where(
                    Task.company_id == company_id,
                    Task.status.in_([TaskStatus.TODO, TaskStatus.IN_PROGRESS])
                )
                .order_by(Task.due_date.asc())
                .limit(limit)
            )
            
            tasks = result.scalars().all()
            
            # Prioritize mandatory compliance tasks
            mandatory_tasks = [
                task for task in tasks 
                if any('mandatory' in tag.lower() for tag in task.framework_tags)
            ]
            
            other_tasks = [
                task for task in tasks 
                if not any('mandatory' in tag.lower() for tag in task.framework_tags)
            ]
            
            # Return mandatory tasks first, then others
            priority_tasks = mandatory_tasks + other_tasks
            return priority_tasks[:limit]
            
        except Exception as e:
            logger.error(f"Error getting priority tasks for company {company_id}: {e}")
            return []
    
    def generate_tasks_from_scoping(
        self,
        sector: str,
        answers: Dict[str, any],
        preferences: Dict[str, any],
        company_id: str
    ) -> List[Dict]:
        """
        Generate tasks based on ESG scoping wizard results.
        
        Args:
            sector: Business sector
            answers: User answers from scoping wizard
            preferences: User preferences for task generation
            company_id: Company ID for task assignment
            
        Returns:
            List of task data dictionaries
        """
        try:
            # Get sector questions and frameworks
            questions = self.parser.parse_sector_questions(sector)
            frameworks = self.parser.get_sector_frameworks(sector)
            
            tasks = []
            task_priority_map = {
                'high': 1,
                'medium': 2, 
                'low': 3
            }
            
            # Generate tasks based on question answers
            for question in questions:
                question_id = str(question.get('id', ''))
                answer = answers.get(question_id)
                
                # Skip if no answer provided
                if answer is None:
                    continue
                
                # Generate task based on question type and answer
                task_data = self._generate_task_from_question(
                    question, 
                    answer, 
                    sector, 
                    frameworks,
                    company_id
                )
                
                if task_data:
                    tasks.append(task_data)
            
            # Add framework-specific tasks
            framework_tasks = self._generate_framework_tasks(
                sector, 
                frameworks, 
                company_id
            )
            tasks.extend(framework_tasks)
            
            # Sort tasks by priority and due date
            tasks.sort(key=lambda x: (
                task_priority_map.get(x.get('priority', 'medium'), 2),
                x.get('due_date', datetime.now() + timedelta(days=30))
            ))
            
            logger.info(f"Generated {len(tasks)} tasks for sector {sector}")
            return tasks
            
        except Exception as e:
            logger.error(f"Error generating tasks from scoping: {e}")
            return []
    
    def _generate_task_from_question(
        self,
        question: Dict,
        answer: any,
        sector: str,
        frameworks: List[str],
        company_id: str
    ) -> Optional[Dict]:
        """Generate a task from a scoping question and answer."""
        question_text = question.get('question', '')
        question_type = question.get('type', 'text')
        category = question.get('category', 'General')
        
        # Map categories to task categories
        category_mapping = {
            'Governance & Management': 'governance',
            'Energy': 'environmental',
            'Water': 'environmental', 
            'Waste': 'environmental',
            'Supply Chain': 'governance',
            'Social': 'social',
            'General': 'environmental'
        }
        
        task_category = category_mapping.get(category, 'environmental')
        
        # Determine if task is needed based on answer
        task_needed = self._determine_task_necessity(question_type, answer)
        
        if not task_needed:
            return None
        
        # Generate task title and description
        task_title = self._generate_task_title(question_text, answer)
        task_description = question.get('rationale', question_text)
        
        # Determine priority based on frameworks and question importance
        priority = self._determine_task_priority(question, frameworks)
        
        # Calculate due date based on priority
        due_date = self._calculate_due_date(priority)
        
        return {
            'title': task_title,
            'description': task_description,
            'compliance_context': question.get('frameworks', ''),
            'action_required': question.get('data_source', ''),
            'category': task_category,
            'priority': priority,
            'due_date': due_date,
            'framework_tags': [fw.strip() for fw in question.get('frameworks', '').split(',')],
            'required_evidence_count': self._determine_evidence_count(question),
            'company_id': company_id,
            'sector': sector
        }
    
    def _determine_task_necessity(self, question_type: str, answer: any) -> bool:
        """Determine if a task is needed based on the answer."""
        if question_type == 'yes_no':
            # Create task if answer is 'no' (indicating action needed)
            return str(answer).lower() in ['no', 'false', '0']
        elif question_type == 'number':
            # Create task if number is 0 or very low
            try:
                value = float(answer) if answer else 0
                return value == 0
            except (ValueError, TypeError):
                return True
        else:
            # For text/other types, always create task for follow-up
            return bool(answer)
    
    def _generate_task_title(self, question_text: str, answer: any) -> str:
        """Generate an appropriate task title from question and answer."""
        question_lower = question_text.lower()
        
        if question_lower.startswith('do you'):
            # Convert question to action
            action_text = question_text.replace('Do you', 'Implement', 1)
            action_text = action_text.replace('do you', 'implement', 1)
            action_text = action_text.rstrip('?')
            return action_text
        else:
            # Add "Establish" or "Implement" prefix
            return f"Establish {question_text.rstrip('?').lower()}"
    
    def _determine_task_priority(self, question: Dict, frameworks: List[str]) -> str:
        """Determine task priority based on question and frameworks."""
        question_text = question.get('question', '').lower()
        frameworks_text = question.get('frameworks', '').lower()
        
        # High priority indicators
        high_priority_keywords = [
            'mandatory', 'required', 'compliance', 'legal', 'regulation',
            'policy', 'management', 'committee', 'carbon calculator'
        ]
        
        # Medium priority indicators
        medium_priority_keywords = [
            'training', 'monitoring', 'tracking', 'reporting'
        ]
        
        if any(keyword in frameworks_text or keyword in question_text 
               for keyword in high_priority_keywords):
            return 'high'
        elif any(keyword in frameworks_text or keyword in question_text 
                 for keyword in medium_priority_keywords):
            return 'medium'
        else:
            return 'low'
    
    def _calculate_due_date(self, priority: str) -> date:
        """Calculate due date based on task priority."""
        now = datetime.now()
        
        if priority == 'high':
            return (now + timedelta(days=30)).date()
        elif priority == 'medium':
            return (now + timedelta(days=60)).date()
        else:
            return (now + timedelta(days=90)).date()
    
    def _determine_evidence_count(self, question: Dict) -> int:
        """Determine required evidence count based on question complexity."""
        data_source = question.get('data_source', '').lower()
        
        if 'bills' in data_source or 'invoices' in data_source:
            return 3  # Multiple months of bills
        elif 'policy' in data_source or 'document' in data_source:
            return 1  # Single policy document
        elif 'records' in data_source or 'logs' in data_source:
            return 2  # Multiple records
        else:
            return 1  # Default
    
    def _generate_framework_tasks(
        self,
        sector: str,
        frameworks: List[str],
        company_id: str
    ) -> List[Dict]:
        """Generate additional tasks based on sector frameworks."""
        framework_tasks = []
        
        # Framework-specific mandatory tasks
        framework_requirements = {
            'Dubai Sustainable Tourism (DST)': [
                {
                    'title': 'Register for DST Carbon Calculator',
                    'description': 'Complete mandatory registration for Dubai Sustainable Tourism Carbon Calculator',
                    'category': 'governance',
                    'priority': 'high',
                    'compliance_context': 'Dubai Sustainable Tourism mandatory requirement'
                }
            ],
            'Green Key Global': [
                {
                    'title': 'Green Key Certification Assessment',
                    'description': 'Conduct initial assessment for Green Key Global certification',
                    'category': 'environmental',
                    'priority': 'medium',
                    'compliance_context': 'Green Key Global voluntary certification'
                }
            ]
        }
        
        for framework in frameworks:
            if framework in framework_requirements:
                for task_template in framework_requirements[framework]:
                    task_data = {
                        **task_template,
                        'action_required': f'Complete {framework} requirements',
                        'due_date': self._calculate_due_date(task_template['priority']),
                        'framework_tags': [framework],
                        'required_evidence_count': 1,
                        'company_id': company_id,
                        'sector': sector
                    }
                    framework_tasks.append(task_data)
        
        return framework_tasks