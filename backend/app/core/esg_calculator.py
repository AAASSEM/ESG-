"""
ESG calculation engine for scoring, carbon footprint, and compliance metrics.
"""
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
from enum import Enum


class ESGCategory(str, Enum):
    """ESG categories for scoring."""
    ENVIRONMENTAL = "environmental"
    SOCIAL = "social"
    GOVERNANCE = "governance"


class BusinessSector(str, Enum):
    """Business sectors supported by the platform."""
    HOSPITALITY = "hospitality"
    CONSTRUCTION = "construction"
    MANUFACTURING = "manufacturing"
    EDUCATION = "education"
    HEALTHCARE = "healthcare"
    LOGISTICS = "logistics"
    RETAIL = "retail"
    PROFESSIONAL_SERVICES = "professional_services"


@dataclass
class ESGScores:
    """ESG score breakdown."""
    overall: float
    environmental: float
    social: float
    governance: float
    
    def to_dict(self) -> Dict[str, float]:
        return {
            "overall": round(self.overall, 1),
            "environmental": round(self.environmental, 1),
            "social": round(self.social, 1),
            "governance": round(self.governance, 1)
        }


@dataclass
class CarbonFootprint:
    """Carbon footprint calculation results."""
    total_annual: float  # tonnes CO2e/year
    scope1: float       # Direct emissions
    scope2: float       # Indirect emissions (electricity)
    emissions_per_sqm: float
    emissions_per_employee: float
    
    def to_dict(self) -> Dict[str, float]:
        return {
            "total_annual": round(self.total_annual, 2),
            "scope1": round(self.scope1, 2),
            "scope2": round(self.scope2, 2),
            "emissions_per_sqm": round(self.emissions_per_sqm, 2),
            "emissions_per_employee": round(self.emissions_per_employee, 2)
        }


@dataclass
class ComplianceRate:
    """Framework compliance rate breakdown."""
    framework: str
    rate: float          # Percentage (0-100)
    completed: int       # Number of completed tasks
    total: int          # Total number of tasks
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "framework": self.framework,
            "rate": round(self.rate, 1),
            "completed": self.completed,
            "total": self.total
        }


@dataclass
class BenchmarkComparison:
    """Sector benchmark comparison results."""
    electricity_performance: str  # "efficient", "average", "inefficient"
    water_performance: str
    carbon_performance: str
    overall_ranking: str
    
    def to_dict(self) -> Dict[str, str]:
        return {
            "electricity_performance": self.electricity_performance,
            "water_performance": self.water_performance,
            "carbon_performance": self.carbon_performance,
            "overall_ranking": self.overall_ranking
        }


class ESGCalculator:
    """Main ESG calculation engine."""
    
    # UAE-specific emission factors
    EMISSION_FACTORS = {
        "electricity": 0.469,      # kg CO2e/kWh (UAE grid average)
        "natural_gas": 2.75,       # kg CO2e/kg
        "lpg": 3.03,               # kg CO2e/kg
        "district_cooling": 0.385, # kg CO2e/kWh
        "diesel": 2.68,            # kg CO2e/liter
        "petrol": 2.31             # kg CO2e/liter
    }
    
    # UAE SME benchmarks by sector (annual values)
    SECTOR_BENCHMARKS = {
        BusinessSector.HOSPITALITY: {
            "electricity_intensity": {"efficient": 100, "average": 150, "inefficient": 200},  # kWh/sqm/year
            "water_intensity": {"efficient": 300, "average": 500, "inefficient": 700},        # L/sqm/year
            "carbon_intensity": {"efficient": 50, "average": 75, "inefficient": 100}          # kg CO2e/sqm/year
        },
        BusinessSector.MANUFACTURING: {
            "electricity_intensity": {"efficient": 200, "average": 300, "inefficient": 400},
            "water_intensity": {"efficient": 100, "average": 200, "inefficient": 300},
            "carbon_intensity": {"efficient": 100, "average": 150, "inefficient": 200}
        },
        BusinessSector.CONSTRUCTION: {
            "electricity_intensity": {"efficient": 80, "average": 120, "inefficient": 160},
            "water_intensity": {"efficient": 150, "average": 250, "inefficient": 350},
            "carbon_intensity": {"efficient": 40, "average": 60, "inefficient": 80}
        },
        BusinessSector.EDUCATION: {
            "electricity_intensity": {"efficient": 60, "average": 90, "inefficient": 120},
            "water_intensity": {"efficient": 200, "average": 300, "inefficient": 400},
            "carbon_intensity": {"efficient": 30, "average": 45, "inefficient": 60}
        },
        BusinessSector.HEALTHCARE: {
            "electricity_intensity": {"efficient": 250, "average": 350, "inefficient": 450},
            "water_intensity": {"efficient": 400, "average": 600, "inefficient": 800},
            "carbon_intensity": {"efficient": 120, "average": 170, "inefficient": 220}
        },
        BusinessSector.LOGISTICS: {
            "electricity_intensity": {"efficient": 40, "average": 60, "inefficient": 80},
            "water_intensity": {"efficient": 50, "average": 100, "inefficient": 150},
            "carbon_intensity": {"efficient": 200, "average": 300, "inefficient": 400}  # Higher due to fleet
        }
    }
    
    def calculate_esg_score(
        self, 
        scoping_answers: Dict[str, Any], 
        tasks: List[Dict[str, Any]], 
        sector: str
    ) -> ESGScores:
        """
        Calculate comprehensive ESG scores based on responses and task completion.
        
        Args:
            scoping_answers: Dictionary of question responses
            tasks: List of task completion data
            sector: Business sector for weighting adjustments
            
        Returns:
            ESGScores: Calculated scores breakdown
        """
        environmental_score = self._calculate_category_score(
            scoping_answers, tasks, ESGCategory.ENVIRONMENTAL
        )
        
        social_score = self._calculate_category_score(
            scoping_answers, tasks, ESGCategory.SOCIAL
        )
        
        governance_score = self._calculate_category_score(
            scoping_answers, tasks, ESGCategory.GOVERNANCE
        )
        
        # Apply sector-specific weightings
        weights = self._get_sector_weights(sector)
        
        overall_score = (
            environmental_score * weights["environmental"] +
            social_score * weights["social"] +
            governance_score * weights["governance"]
        )
        
        return ESGScores(
            overall=overall_score,
            environmental=environmental_score,
            social=social_score,
            governance=governance_score
        )
    
    def _calculate_category_score(
        self, 
        scoping_answers: Dict[str, Any], 
        tasks: List[Dict[str, Any]], 
        category: ESGCategory
    ) -> float:
        """Calculate score for a specific ESG category."""
        # Filter questions and tasks for this category
        category_questions = {
            qid: answer for qid, answer in scoping_answers.items()
            if answer.get("category") == category.value
        }
        
        category_tasks = [
            task for task in tasks
            if task.get("category") == category.value
        ]
        
        if not category_questions and not category_tasks:
            return 0.0
        
        # Score from scoping questions (40% weight)
        question_score = self._score_questions(category_questions)
        
        # Score from task completion (60% weight)
        task_score = self._score_tasks(category_tasks)
        
        # Weighted combination
        category_score = (question_score * 0.4) + (task_score * 0.6)
        
        return min(100.0, max(0.0, category_score))
    
    def _score_questions(self, questions: Dict[str, Any]) -> float:
        """Score based on scoping question responses."""
        if not questions:
            return 0.0
        
        total_score = 0.0
        total_weight = 0.0
        
        for question_id, answer_data in questions.items():
            answer = answer_data.get("answer")
            frameworks = answer_data.get("frameworks", [])
            
            # Weight by number of frameworks (more frameworks = higher importance)
            weight = max(1.0, len(frameworks))
            
            if isinstance(answer, bool):
                score = 100.0 if answer else 0.0
            elif isinstance(answer, str):
                # For text answers, assume positive if not empty
                score = 100.0 if answer.strip() else 0.0
            else:
                score = 0.0
            
            total_score += score * weight
            total_weight += weight
        
        return total_score / total_weight if total_weight > 0 else 0.0
    
    def _score_tasks(self, tasks: List[Dict[str, Any]]) -> float:
        """Score based on task completion status."""
        if not tasks:
            return 0.0
        
        total_score = 0.0
        total_weight = 0.0
        
        for task in tasks:
            status = task.get("status", "to_do")
            priority = task.get("priority", "medium")
            frameworks = task.get("frameworks", [])
            
            # Weight by priority and framework count
            priority_weight = {"high": 3.0, "medium": 2.0, "low": 1.0}.get(priority, 1.0)
            framework_weight = max(1.0, len(frameworks))
            weight = priority_weight * framework_weight
            
            # Score by completion status
            if status == "completed":
                score = 100.0
            elif status == "in_progress":
                score = 50.0
            else:  # to_do
                score = 0.0
            
            total_score += score * weight
            total_weight += weight
        
        return total_score / total_weight if total_weight > 0 else 0.0
    
    def _get_sector_weights(self, sector: str) -> Dict[str, float]:
        """Get sector-specific ESG category weights."""
        sector_weights = {
            BusinessSector.HOSPITALITY: {
                "environmental": 0.45, "social": 0.35, "governance": 0.20
            },
            BusinessSector.MANUFACTURING: {
                "environmental": 0.50, "social": 0.30, "governance": 0.20
            },
            BusinessSector.CONSTRUCTION: {
                "environmental": 0.45, "social": 0.35, "governance": 0.20
            },
            BusinessSector.HEALTHCARE: {
                "environmental": 0.35, "social": 0.45, "governance": 0.20
            },
            BusinessSector.EDUCATION: {
                "environmental": 0.30, "social": 0.50, "governance": 0.20
            },
            BusinessSector.LOGISTICS: {
                "environmental": 0.50, "social": 0.25, "governance": 0.25
            }
        }
        
        return sector_weights.get(
            sector, 
            {"environmental": 0.40, "social": 0.30, "governance": 0.30}  # Default
        )
    
    def calculate_carbon_footprint(
        self, 
        location_data: List[Dict[str, Any]], 
        company_data: Dict[str, Any]
    ) -> CarbonFootprint:
        """
        Calculate comprehensive carbon footprint with UAE emission factors.
        
        Args:
            location_data: List of facility data with utility consumption
            company_data: Company information including employee count
            
        Returns:
            CarbonFootprint: Calculated emissions breakdown
        """
        total_scope1 = 0.0
        total_scope2 = 0.0
        total_floor_area = 0.0
        
        for location in location_data:
            utilities = location.get("utilities", {})
            floor_area = location.get("totalFloorArea", 0)
            total_floor_area += floor_area
            
            # Scope 1: Direct emissions
            scope1_location = self._calculate_scope1_emissions(utilities)
            total_scope1 += scope1_location
            
            # Scope 2: Indirect emissions
            scope2_location = self._calculate_scope2_emissions(utilities)
            total_scope2 += scope2_location
        
        total_annual = total_scope1 + total_scope2
        
        # Calculate intensities
        employees = company_data.get("employees", 1)
        emissions_per_sqm = total_annual / total_floor_area if total_floor_area > 0 else 0
        emissions_per_employee = total_annual / employees if employees > 0 else 0
        
        return CarbonFootprint(
            total_annual=total_annual,
            scope1=total_scope1,
            scope2=total_scope2,
            emissions_per_sqm=emissions_per_sqm,
            emissions_per_employee=emissions_per_employee
        )
    
    def _calculate_scope1_emissions(self, utilities: Dict[str, Any]) -> float:
        """Calculate Scope 1 (direct) emissions from utilities."""
        scope1_emissions = 0.0
        
        # Natural gas consumption
        if "naturalGas" in utilities:
            monthly_gas = utilities["naturalGas"].get("monthlyConsumption", 0)
            annual_gas = monthly_gas * 12  # kg/year
            scope1_emissions += annual_gas * self.EMISSION_FACTORS["natural_gas"] / 1000  # tonnes CO2e
        
        # LPG consumption
        if "lpg" in utilities:
            monthly_lpg = utilities["lpg"].get("monthlyConsumption", 0)
            annual_lpg = monthly_lpg * 12  # kg/year
            scope1_emissions += annual_lpg * self.EMISSION_FACTORS["lpg"] / 1000  # tonnes CO2e
        
        return scope1_emissions
    
    def _calculate_scope2_emissions(self, utilities: Dict[str, Any]) -> float:
        """Calculate Scope 2 (indirect) emissions from utilities."""
        scope2_emissions = 0.0
        
        # Electricity consumption
        if "electricity" in utilities:
            monthly_electricity = utilities["electricity"].get("monthlyConsumption", 0)
            annual_electricity = monthly_electricity * 12  # kWh/year
            scope2_emissions += annual_electricity * self.EMISSION_FACTORS["electricity"] / 1000  # tonnes CO2e
        
        # District cooling
        if "districtCooling" in utilities:
            monthly_cooling = utilities["districtCooling"].get("monthlyConsumption", 0)
            annual_cooling = monthly_cooling * 12  # kWh/year
            scope2_emissions += annual_cooling * self.EMISSION_FACTORS["district_cooling"] / 1000  # tonnes CO2e
        
        return scope2_emissions
    
    def calculate_compliance_rates(
        self, 
        tasks: List[Dict[str, Any]], 
        frameworks: List[str]
    ) -> List[ComplianceRate]:
        """
        Calculate compliance rates for each framework.
        
        Args:
            tasks: List of tasks with framework assignments
            frameworks: List of frameworks to calculate rates for
            
        Returns:
            List[ComplianceRate]: Compliance rates by framework
        """
        compliance_rates = []
        
        for framework in frameworks:
            framework_tasks = [
                task for task in tasks
                if framework in task.get("frameworks", [])
            ]
            
            if not framework_tasks:
                compliance_rates.append(ComplianceRate(
                    framework=framework,
                    rate=0.0,
                    completed=0,
                    total=0
                ))
                continue
            
            completed_tasks = [
                task for task in framework_tasks
                if task.get("status") == "completed"
            ]
            
            rate = (len(completed_tasks) / len(framework_tasks)) * 100
            
            compliance_rates.append(ComplianceRate(
                framework=framework,
                rate=rate,
                completed=len(completed_tasks),
                total=len(framework_tasks)
            ))
        
        return compliance_rates
    
    def compare_to_benchmarks(
        self, 
        location_data: List[Dict[str, Any]], 
        carbon_footprint: CarbonFootprint,
        sector: str
    ) -> BenchmarkComparison:
        """
        Compare company performance to sector benchmarks.
        
        Args:
            location_data: Facility consumption data
            carbon_footprint: Calculated carbon footprint
            sector: Business sector for comparison
            
        Returns:
            BenchmarkComparison: Performance comparison results
        """
        benchmarks = self.SECTOR_BENCHMARKS.get(sector)
        if not benchmarks:
            return BenchmarkComparison(
                electricity_performance="unknown",
                water_performance="unknown", 
                carbon_performance="unknown",
                overall_ranking="unknown"
            )
        
        # Calculate annual intensities
        total_electricity = sum(
            loc.get("utilities", {}).get("electricity", {}).get("monthlyConsumption", 0) * 12
            for loc in location_data
        )
        total_water = sum(
            loc.get("utilities", {}).get("water", {}).get("monthlyConsumption", 0) * 12
            for loc in location_data
        )
        total_floor_area = sum(loc.get("totalFloorArea", 0) for loc in location_data)
        
        if total_floor_area == 0:
            return BenchmarkComparison(
                electricity_performance="unknown",
                water_performance="unknown",
                carbon_performance="unknown", 
                overall_ranking="unknown"
            )
        
        electricity_intensity = total_electricity / total_floor_area  # kWh/sqm/year
        water_intensity = (total_water * 1000) / total_floor_area    # L/sqm/year (convert m³ to L)
        carbon_intensity = carbon_footprint.emissions_per_sqm * 1000  # kg CO2e/sqm/year
        
        # Compare to benchmarks
        electricity_perf = self._categorize_performance(
            electricity_intensity, benchmarks["electricity_intensity"]
        )
        water_perf = self._categorize_performance(
            water_intensity, benchmarks["water_intensity"]
        )
        carbon_perf = self._categorize_performance(
            carbon_intensity, benchmarks["carbon_intensity"]
        )
        
        # Overall ranking
        performance_scores = {
            "efficient": 3, "average": 2, "inefficient": 1
        }
        avg_score = (
            performance_scores.get(electricity_perf, 0) +
            performance_scores.get(water_perf, 0) +
            performance_scores.get(carbon_perf, 0)
        ) / 3
        
        if avg_score >= 2.5:
            overall_ranking = "efficient"
        elif avg_score >= 1.5:
            overall_ranking = "average"
        else:
            overall_ranking = "inefficient"
        
        return BenchmarkComparison(
            electricity_performance=electricity_perf,
            water_performance=water_perf,
            carbon_performance=carbon_perf,
            overall_ranking=overall_ranking
        )
    
    def _categorize_performance(
        self, 
        actual_value: float, 
        benchmarks: Dict[str, float]
    ) -> str:
        """Categorize performance against benchmarks."""
        if actual_value <= benchmarks["efficient"]:
            return "efficient"
        elif actual_value <= benchmarks["average"]:
            return "average"
        else:
            return "inefficient"