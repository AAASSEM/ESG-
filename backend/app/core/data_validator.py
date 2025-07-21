"""
Data validation and quality assurance for ESG report generation.
"""
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class ValidationSeverity(str, Enum):
    """Validation issue severity levels."""
    ERROR = "error"      # Critical - prevents report generation
    WARNING = "warning"  # Important - affects data quality
    INFO = "info"       # Minor - informational only


@dataclass
class ValidationIssue:
    """Represents a data validation issue."""
    severity: ValidationSeverity
    field: str
    message: str
    value: Any = None
    suggestion: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "severity": self.severity.value,
            "field": self.field,
            "message": self.message,
            "value": self.value,
            "suggestion": self.suggestion
        }


@dataclass
class ValidationResult:
    """Results of data validation."""
    is_valid: bool
    completeness_score: float  # 0-100%
    quality_score: float       # 0-100%
    issues: List[ValidationIssue]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_valid": self.is_valid,
            "completeness_score": round(self.completeness_score, 1),
            "quality_score": round(self.quality_score, 1),
            "issues": [issue.to_dict() for issue in self.issues],
            "summary": {
                "total_issues": len(self.issues),
                "errors": len([i for i in self.issues if i.severity == ValidationSeverity.ERROR]),
                "warnings": len([i for i in self.issues if i.severity == ValidationSeverity.WARNING]),
                "info": len([i for i in self.issues if i.severity == ValidationSeverity.INFO])
            }
        }


class ESGDataValidator:
    """Validates ESG data for report generation quality and completeness."""
    
    def __init__(self):
        self.required_company_fields = [
            "name", "sector", "employees", "establishedYear"
        ]
        self.required_location_fields = [
            "name", "totalFloorArea", "utilities"
        ]
        self.required_utility_fields = [
            "electricity", "water"
        ]
    
    def validate_report_data(
        self,
        company_data: Dict[str, Any],
        location_data: List[Dict[str, Any]],
        scoping_answers: Dict[str, Any],
        tasks: List[Dict[str, Any]]
    ) -> ValidationResult:
        """
        Comprehensive validation of all data required for report generation.
        
        Args:
            company_data: Company information
            location_data: Facilities and utilities data
            scoping_answers: ESG questionnaire responses
            tasks: Task completion data
            
        Returns:
            ValidationResult: Detailed validation results
        """
        issues = []
        
        # Validate each data category
        issues.extend(self._validate_company_data(company_data))
        issues.extend(self._validate_location_data(location_data))
        issues.extend(self._validate_scoping_answers(scoping_answers))
        issues.extend(self._validate_tasks_data(tasks))
        
        # Cross-validation checks
        issues.extend(self._validate_data_consistency(
            company_data, location_data, scoping_answers, tasks
        ))
        
        # Calculate scores
        completeness_score = self._calculate_completeness_score(
            company_data, location_data, scoping_answers, tasks
        )
        quality_score = self._calculate_quality_score(issues, completeness_score)
        
        # Determine if data is valid for report generation
        error_count = len([i for i in issues if i.severity == ValidationSeverity.ERROR])
        is_valid = error_count == 0 and completeness_score >= 60.0
        
        return ValidationResult(
            is_valid=is_valid,
            completeness_score=completeness_score,
            quality_score=quality_score,
            issues=issues
        )
    
    def _validate_company_data(self, company_data: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate company information."""
        issues = []
        
        # Check required fields
        for field in self.required_company_fields:
            if field not in company_data or not company_data[field]:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    field=f"company.{field}",
                    message=f"Required field '{field}' is missing or empty",
                    suggestion=f"Please provide {field} information"
                ))
        
        # Validate specific fields
        if "employees" in company_data:
            employees = company_data["employees"]
            if not isinstance(employees, (int, float)) or employees <= 0:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    field="company.employees",
                    message="Employee count should be a positive number",
                    value=employees,
                    suggestion="Provide accurate employee count for better calculations"
                ))
        
        if "establishedYear" in company_data:
            year = company_data["establishedYear"]
            if not isinstance(year, int) or year < 1900 or year > 2024:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    field="company.establishedYear",
                    message="Establishment year seems invalid",
                    value=year,
                    suggestion="Provide a valid year between 1900 and 2024"
                ))
        
        if "sector" in company_data:
            valid_sectors = [
                "hospitality", "construction", "manufacturing", 
                "education", "healthcare", "logistics", "retail", "professional_services"
            ]
            if company_data["sector"] not in valid_sectors:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    field="company.sector",
                    message="Sector not recognized for benchmarking",
                    value=company_data["sector"],
                    suggestion=f"Use one of: {', '.join(valid_sectors)}"
                ))
        
        return issues
    
    def _validate_location_data(self, location_data: List[Dict[str, Any]]) -> List[ValidationIssue]:
        """Validate location and utilities data."""
        issues = []
        
        if not location_data:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                field="locations",
                message="At least one location is required for carbon footprint calculations",
                suggestion="Add facility information with utility consumption data"
            ))
            return issues
        
        for i, location in enumerate(location_data):
            location_prefix = f"locations[{i}]"
            
            # Check required location fields
            for field in self.required_location_fields:
                if field not in location or not location[field]:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        field=f"{location_prefix}.{field}",
                        message=f"Required location field '{field}' is missing",
                        suggestion=f"Provide {field} for accurate calculations"
                    ))
            
            # Validate floor area
            if "totalFloorArea" in location:
                area = location["totalFloorArea"]
                if not isinstance(area, (int, float)) or area <= 0:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        field=f"{location_prefix}.totalFloorArea",
                        message="Floor area must be a positive number",
                        value=area,
                        suggestion="Provide floor area in square meters"
                    ))
                elif area > 1000000:  # 100 hectares seems excessive
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        field=f"{location_prefix}.totalFloorArea",
                        message="Floor area seems unusually large",
                        value=area,
                        suggestion="Verify floor area is in square meters"
                    ))
            
            # Validate utilities data
            if "utilities" in location:
                utilities = location["utilities"]
                issues.extend(self._validate_utilities_data(utilities, location_prefix))
            
        return issues
    
    def _validate_utilities_data(self, utilities: Dict[str, Any], location_prefix: str) -> List[ValidationIssue]:
        """Validate utility consumption data."""
        issues = []
        
        # Check required utilities
        for utility in self.required_utility_fields:
            if utility not in utilities:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    field=f"{location_prefix}.utilities.{utility}",
                    message=f"Missing {utility} consumption data",
                    suggestion=f"Add {utility} data for complete carbon footprint calculation"
                ))
            else:
                consumption = utilities[utility].get("monthlyConsumption", 0)
                if not isinstance(consumption, (int, float)) or consumption < 0:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        field=f"{location_prefix}.utilities.{utility}.monthlyConsumption",
                        message=f"{utility.title()} consumption must be non-negative",
                        value=consumption,
                        suggestion="Provide monthly consumption as a positive number"
                    ))
                elif consumption == 0:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        field=f"{location_prefix}.utilities.{utility}.monthlyConsumption",
                        message=f"Zero {utility} consumption seems unusual",
                        suggestion="Verify consumption data is accurate"
                    ))
        
        # Validate optional utilities
        optional_utilities = ["districtCooling", "naturalGas", "lpg"]
        for utility in optional_utilities:
            if utility in utilities:
                consumption = utilities[utility].get("monthlyConsumption", 0)
                if consumption < 0:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        field=f"{location_prefix}.utilities.{utility}.monthlyConsumption",
                        message=f"{utility} consumption cannot be negative",
                        value=consumption
                    ))
        
        return issues
    
    def _validate_scoping_answers(self, scoping_answers: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate ESG scoping questionnaire responses."""
        issues = []
        
        if not scoping_answers:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                field="scoping_answers",
                message="ESG scoping questionnaire responses are required",
                suggestion="Complete ESG assessment questionnaire"
            ))
            return issues
        
        unanswered_count = 0
        for question_id, answer_data in scoping_answers.items():
            if not isinstance(answer_data, dict):
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    field=f"scoping_answers.{question_id}",
                    message="Invalid answer format",
                    suggestion="Answer should include question, answer, frameworks, and category"
                ))
                continue
            
            # Check required answer fields
            required_fields = ["question", "answer", "frameworks", "category"]
            for field in required_fields:
                if field not in answer_data:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        field=f"scoping_answers.{question_id}.{field}",
                        message=f"Missing {field} in answer data"
                    ))
            
            # Check if answer is provided
            answer = answer_data.get("answer")
            if answer is None or answer == "":
                unanswered_count += 1
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.INFO,
                    field=f"scoping_answers.{question_id}.answer",
                    message="Question not answered",
                    suggestion="Complete answer for better ESG scoring"
                ))
            
            # Validate category
            valid_categories = ["environmental", "social", "governance"]
            category = answer_data.get("category")
            if category and category not in valid_categories:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    field=f"scoping_answers.{question_id}.category",
                    message="Invalid ESG category",
                    value=category,
                    suggestion=f"Use one of: {', '.join(valid_categories)}"
                ))
        
        # Overall completeness check
        if unanswered_count > len(scoping_answers) * 0.5:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                field="scoping_answers",
                message="Many questions remain unanswered",
                suggestion="Complete more questions for accurate ESG assessment"
            ))
        
        return issues
    
    def _validate_tasks_data(self, tasks: List[Dict[str, Any]]) -> List[ValidationIssue]:
        """Validate task completion data."""
        issues = []
        
        if not tasks:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                field="tasks",
                message="No tasks found",
                suggestion="Create ESG improvement tasks for better compliance tracking"
            ))
            return issues
        
        completed_count = 0
        high_priority_incomplete = 0
        
        for i, task in enumerate(tasks):
            task_prefix = f"tasks[{i}]"
            
            # Check required task fields
            required_fields = ["title", "category", "status", "priority"]
            for field in required_fields:
                if field not in task or not task[field]:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        field=f"{task_prefix}.{field}",
                        message=f"Task missing {field}",
                        suggestion=f"Provide {field} for better task management"
                    ))
            
            # Validate status
            valid_statuses = ["completed", "in_progress", "to_do"]
            status = task.get("status")
            if status not in valid_statuses:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    field=f"{task_prefix}.status",
                    message="Invalid task status",
                    value=status,
                    suggestion=f"Use one of: {', '.join(valid_statuses)}"
                ))
            elif status == "completed":
                completed_count += 1
            
            # Check high priority incomplete tasks
            if task.get("priority") == "high" and status != "completed":
                high_priority_incomplete += 1
        
        # Overall task analysis
        completion_rate = (completed_count / len(tasks)) * 100 if tasks else 0
        if completion_rate < 30:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.INFO,
                field="tasks",
                message="Low task completion rate",
                value=f"{completion_rate:.1f}%",
                suggestion="Focus on completing more ESG improvement tasks"
            ))
        
        if high_priority_incomplete > 0:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                field="tasks",
                message=f"{high_priority_incomplete} high-priority tasks incomplete",
                suggestion="Prioritize completing high-impact ESG tasks"
            ))
        
        return issues
    
    def _validate_data_consistency(
        self,
        company_data: Dict[str, Any],
        location_data: List[Dict[str, Any]],
        scoping_answers: Dict[str, Any],
        tasks: List[Dict[str, Any]]
    ) -> List[ValidationIssue]:
        """Cross-validate data consistency across different sources."""
        issues = []
        
        # Check if sector alignment between data sources
        company_sector = company_data.get("sector", "unknown")
        
        # Validate consumption vs company size
        if location_data and "employees" in company_data:
            total_area = sum(loc.get("totalFloorArea", 0) for loc in location_data)
            employees = company_data["employees"]
            
            if total_area > 0 and employees > 0:
                area_per_employee = total_area / employees
                
                # Typical office space is 10-25 sqm per employee
                if area_per_employee < 5:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        field="consistency.area_per_employee",
                        message="Very low floor area per employee",
                        value=f"{area_per_employee:.1f} sqm/employee",
                        suggestion="Verify floor area and employee count accuracy"
                    ))
                elif area_per_employee > 100:
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        field="consistency.area_per_employee",
                        message="Very high floor area per employee",
                        value=f"{area_per_employee:.1f} sqm/employee",
                        suggestion="Verify floor area and employee count accuracy"
                    ))
        
        # Check framework consistency between answers and tasks
        answer_frameworks = set()
        for answer in scoping_answers.values():
            if isinstance(answer, dict) and "frameworks" in answer:
                answer_frameworks.update(answer["frameworks"])
        
        task_frameworks = set()
        for task in tasks:
            if "frameworks" in task:
                task_frameworks.update(task["frameworks"])
        
        if answer_frameworks and task_frameworks:
            missing_in_tasks = answer_frameworks - task_frameworks
            if missing_in_tasks:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.INFO,
                    field="consistency.frameworks",
                    message="Some frameworks from answers not found in tasks",
                    value=list(missing_in_tasks),
                    suggestion="Ensure tasks cover all applicable frameworks"
                ))
        
        return issues
    
    def _calculate_completeness_score(
        self,
        company_data: Dict[str, Any],
        location_data: List[Dict[str, Any]],
        scoping_answers: Dict[str, Any],
        tasks: List[Dict[str, Any]]
    ) -> float:
        """Calculate data completeness score (0-100%)."""
        total_points = 0
        earned_points = 0
        
        # Company data (25 points)
        total_points += 25
        company_completeness = 0
        for field in self.required_company_fields:
            if field in company_data and company_data[field]:
                company_completeness += 1
        earned_points += (company_completeness / len(self.required_company_fields)) * 25
        
        # Location data (25 points)
        total_points += 25
        if location_data:
            location_completeness = 0
            for location in location_data:
                location_score = 0
                for field in self.required_location_fields:
                    if field in location and location[field]:
                        location_score += 1
                location_completeness += location_score / len(self.required_location_fields)
            earned_points += (location_completeness / len(location_data)) * 25
        
        # Scoping answers (30 points)
        total_points += 30
        if scoping_answers:
            answered_count = sum(
                1 for answer in scoping_answers.values()
                if isinstance(answer, dict) and answer.get("answer") not in [None, ""]
            )
            earned_points += (answered_count / len(scoping_answers)) * 30
        
        # Tasks data (20 points)
        total_points += 20
        if tasks:
            task_completeness = sum(
                1 for task in tasks
                if all(field in task and task[field] for field in ["title", "category", "status"])
            )
            earned_points += (task_completeness / len(tasks)) * 20
        
        return (earned_points / total_points) * 100 if total_points > 0 else 0
    
    def _calculate_quality_score(self, issues: List[ValidationIssue], completeness_score: float) -> float:
        """Calculate data quality score based on validation issues."""
        # Start with completeness score
        quality_score = completeness_score
        
        # Deduct points for issues
        for issue in issues:
            if issue.severity == ValidationSeverity.ERROR:
                quality_score -= 10
            elif issue.severity == ValidationSeverity.WARNING:
                quality_score -= 3
            elif issue.severity == ValidationSeverity.INFO:
                quality_score -= 1
        
        return max(0, min(100, quality_score))