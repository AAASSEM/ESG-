"""
ESG Report Generation Engine with template system and export capabilities.
"""
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, date
from dataclasses import dataclass, asdict
from enum import Enum
import json
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, Template
import logging

from .esg_calculator import (
    ESGCalculator, ESGScores, CarbonFootprint, 
    ComplianceRate, BenchmarkComparison, BusinessSector
)
from .data_validator import ESGDataValidator, ValidationResult

logger = logging.getLogger(__name__)


class ReportType(str, Enum):
    """Available report types."""
    EXECUTIVE_SUMMARY = "executive_summary"
    REGULATORY_COMPLIANCE = "regulatory_compliance"
    CARBON_FOOTPRINT = "carbon_footprint"
    FRAMEWORK_SPECIFIC = "framework_specific"
    SECTOR_COMPARISON = "sector_comparison"


class OutputFormat(str, Enum):
    """Available output formats."""
    HTML = "html"
    PDF = "pdf"
    EXCEL = "excel"
    JSON = "json"


@dataclass
class ReportMetadata:
    """Report metadata and configuration."""
    company_name: str
    report_type: ReportType
    sector: str
    reporting_period: str
    generation_date: datetime
    frameworks: List[str]
    locations_count: int
    data_completeness: float  # 0-100%
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            **asdict(self),
            "generation_date": self.generation_date.isoformat(),
            "data_completeness": round(self.data_completeness, 1)
        }


@dataclass
class ReportData:
    """Complete report data structure."""
    metadata: ReportMetadata
    esg_scores: ESGScores
    carbon_footprint: CarbonFootprint
    compliance_rates: List[ComplianceRate]
    benchmark_comparison: BenchmarkComparison
    raw_data: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "metadata": self.metadata.to_dict(),
            "esg_scores": self.esg_scores.to_dict(),
            "carbon_footprint": self.carbon_footprint.to_dict(),
            "compliance_rates": [rate.to_dict() for rate in self.compliance_rates],
            "benchmark_comparison": self.benchmark_comparison.to_dict(),
            "recommendations": self.recommendations,
            "raw_data": self.raw_data
        }


class ReportTemplateManager:
    """Manages report templates for different sectors and types."""
    
    def __init__(self, templates_dir: str = "app/templates/reports"):
        self.templates_dir = Path(templates_dir)
        self.env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=True
        )
        self._register_filters()
    
    def _register_filters(self):
        """Register custom Jinja2 filters for report formatting."""
        
        def format_score(value: float) -> str:
            """Format ESG scores with color coding."""
            if value >= 80:
                return f'<span class="score-excellent">{value:.1f}</span>'
            elif value >= 60:
                return f'<span class="score-good">{value:.1f}</span>'
            elif value >= 40:
                return f'<span class="score-fair">{value:.1f}</span>'
            else:
                return f'<span class="score-poor">{value:.1f}</span>'
        
        def format_emissions(value: float) -> str:
            """Format carbon emissions with units."""
            if value >= 1000:
                return f"{value/1000:.1f} kt CO₂e"
            else:
                return f"{value:.1f} t CO₂e"
        
        def format_percentage(value: float) -> str:
            """Format percentage values."""
            return f"{value:.1f}%"
        
        def performance_badge(performance: str) -> str:
            """Create performance badges."""
            badges = {
                "efficient": '<span class="badge badge-success">Efficient</span>',
                "average": '<span class="badge badge-warning">Average</span>',
                "inefficient": '<span class="badge badge-danger">Inefficient</span>',
                "unknown": '<span class="badge badge-secondary">Unknown</span>'
            }
            return badges.get(performance, performance)
        
        # Register filters
        self.env.filters['format_score'] = format_score
        self.env.filters['format_emissions'] = format_emissions
        self.env.filters['format_percentage'] = format_percentage
        self.env.filters['performance_badge'] = performance_badge
    
    def get_template(self, report_type: ReportType, sector: str) -> Template:
        """Get appropriate template for report type and sector."""
        template_files = [
            f"{sector}_{report_type.value}.html",
            f"{report_type.value}_{sector}.html",
            f"{report_type.value}.html",
            "base_report.html"
        ]
        
        for template_file in template_files:
            try:
                return self.env.get_template(template_file)
            except:
                continue
        
        # Fallback to basic template
        return self.env.from_string(self._get_basic_template())
    
    def _get_basic_template(self) -> str:
        """Basic fallback template."""
        return """
<!DOCTYPE html>
<html>
<head>
    <title>{{ metadata.company_name }} - ESG Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px; }
        .score-excellent { color: #27ae60; font-weight: bold; }
        .score-good { color: #f39c12; font-weight: bold; }
        .score-fair { color: #e67e22; font-weight: bold; }
        .score-poor { color: #e74c3c; font-weight: bold; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .badge-success { background: #27ae60; color: white; }
        .badge-warning { background: #f39c12; color: white; }
        .badge-danger { background: #e74c3c; color: white; }
        .metric-card { border: 1px solid #ddd; padding: 20px; margin: 10px 0; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ metadata.company_name }}</h1>
        <h2>ESG Performance Report</h2>
        <p>Reporting Period: {{ metadata.reporting_period }}</p>
        <p>Generated: {{ metadata.generation_date[:10] }}</p>
    </div>
    
    <div class="metric-card">
        <h3>Overall ESG Score</h3>
        <p>{{ esg_scores.overall | format_score }}/100</p>
    </div>
    
    <div class="metric-card">
        <h3>Carbon Footprint</h3>
        <p>{{ carbon_footprint.total_annual | format_emissions }} annually</p>
    </div>
    
    <div class="metric-card">
        <h3>Compliance Summary</h3>
        {% for rate in compliance_rates %}
        <p>{{ rate.framework }}: {{ rate.rate | format_percentage }}</p>
        {% endfor %}
    </div>
</body>
</html>
        """


class ReportGenerator:
    """Main report generation engine."""
    
    def __init__(self):
        self.calculator = ESGCalculator()
        self.template_manager = ReportTemplateManager()
        self.recommendations_engine = RecommendationEngine()
        self.validator = ESGDataValidator()
    
    async def generate_report(
        self,
        company_data: Dict[str, Any],
        location_data: List[Dict[str, Any]],
        scoping_answers: Dict[str, Any],
        tasks: List[Dict[str, Any]],
        report_type: ReportType = ReportType.EXECUTIVE_SUMMARY,
        output_format: OutputFormat = OutputFormat.HTML
    ) -> Dict[str, Any]:
        """
        Generate comprehensive ESG report.
        
        Args:
            company_data: Company information
            location_data: Facilities and utilities data
            scoping_answers: ESG questionnaire responses
            tasks: Task completion data
            report_type: Type of report to generate
            output_format: Output format (HTML, PDF, Excel)
            
        Returns:
            Dict containing report data and generated content
        """
        try:
            # Validate input data first
            validation_result = self.validator.validate_report_data(
                company_data, location_data, scoping_answers, tasks
            )
            
            # Extract key information
            sector = company_data.get("sector", "unknown")
            frameworks = self._extract_frameworks(scoping_answers, tasks)
            
            # Calculate all metrics
            esg_scores = self.calculator.calculate_esg_score(
                scoping_answers, tasks, sector
            )
            
            carbon_footprint = self.calculator.calculate_carbon_footprint(
                location_data, company_data
            )
            
            compliance_rates = self.calculator.calculate_compliance_rates(
                tasks, frameworks
            )
            
            benchmark_comparison = self.calculator.compare_to_benchmarks(
                location_data, carbon_footprint, sector
            )
            
            # Generate recommendations
            recommendations = self.recommendations_engine.generate_recommendations(
                esg_scores, compliance_rates, benchmark_comparison, sector
            )
            
            # Use validation result for data completeness
            data_completeness = validation_result.completeness_score
            
            # Create report metadata
            metadata = ReportMetadata(
                company_name=company_data.get("name", "Unknown Company"),
                report_type=report_type,
                sector=sector,
                reporting_period=self._get_reporting_period(),
                generation_date=datetime.now(),
                frameworks=frameworks,
                locations_count=len(location_data),
                data_completeness=data_completeness
            )
            
            # Compile report data
            report_data = ReportData(
                metadata=metadata,
                esg_scores=esg_scores,
                carbon_footprint=carbon_footprint,
                compliance_rates=compliance_rates,
                benchmark_comparison=benchmark_comparison,
                raw_data={
                    "company": company_data,
                    "locations": location_data,
                    "answers": scoping_answers,
                    "tasks": tasks
                },
                recommendations=recommendations
            )
            
            # Generate output based on format
            if output_format == OutputFormat.HTML:
                content = await self._generate_html(report_data)
            elif output_format == OutputFormat.PDF:
                content = await self._generate_pdf(report_data)
            elif output_format == OutputFormat.EXCEL:
                content = await self._generate_excel(report_data)
            else:  # JSON
                content = json.dumps(report_data.to_dict(), indent=2)
            
            return {
                "success": True,
                "report_data": report_data.to_dict(),
                "content": content,
                "format": output_format.value,
                "metadata": metadata.to_dict(),
                "validation": validation_result.to_dict()
            }
            
        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "report_data": None,
                "content": None
            }
    
    async def _generate_html(self, report_data: ReportData) -> str:
        """Generate HTML report content."""
        template = self.template_manager.get_template(
            report_data.metadata.report_type,
            report_data.metadata.sector
        )
        
        return template.render(**report_data.to_dict())
    
    async def _generate_pdf(self, report_data: ReportData) -> bytes:
        """Generate PDF report content."""
        # This would integrate with a PDF generation library like WeasyPrint
        html_content = await self._generate_html(report_data)
        
        # Placeholder - implement actual PDF generation
        logger.warning("PDF generation not yet implemented")
        return html_content.encode('utf-8')
    
    async def _generate_excel(self, report_data: ReportData) -> bytes:
        """Generate Excel report content."""
        # This would use openpyxl or xlsxwriter to create Excel files
        logger.warning("Excel generation not yet implemented")
        return json.dumps(report_data.to_dict(), indent=2).encode('utf-8')
    
    def _extract_frameworks(
        self, 
        scoping_answers: Dict[str, Any], 
        tasks: List[Dict[str, Any]]
    ) -> List[str]:
        """Extract unique frameworks from answers and tasks."""
        frameworks = set()
        
        # From scoping answers
        for answer_data in scoping_answers.values():
            if "frameworks" in answer_data:
                frameworks.update(answer_data["frameworks"])
        
        # From tasks
        for task in tasks:
            if "frameworks" in task:
                frameworks.update(task["frameworks"])
        
        return sorted(list(frameworks))
    
    def _calculate_data_completeness(
        self,
        company_data: Dict[str, Any],
        location_data: List[Dict[str, Any]],
        scoping_answers: Dict[str, Any],
        tasks: List[Dict[str, Any]]
    ) -> float:
        """Calculate percentage of required data that is complete."""
        total_fields = 0
        completed_fields = 0
        
        # Company data completeness
        required_company_fields = ["name", "sector", "employees", "establishedYear"]
        for field in required_company_fields:
            total_fields += 1
            if field in company_data and company_data[field]:
                completed_fields += 1
        
        # Location data completeness
        for location in location_data:
            total_fields += 3  # name, totalFloorArea, utilities
            if location.get("name"):
                completed_fields += 1
            if location.get("totalFloorArea", 0) > 0:
                completed_fields += 1
            if location.get("utilities"):
                completed_fields += 1
        
        # Task completion
        total_fields += len(tasks)
        completed_fields += len([t for t in tasks if t.get("status") == "completed"])
        
        # Scoping answers completeness
        total_fields += len(scoping_answers)
        completed_fields += len([
            a for a in scoping_answers.values() 
            if a.get("answer") is not None and a.get("answer") != ""
        ])
        
        return (completed_fields / total_fields * 100) if total_fields > 0 else 0
    
    def _get_reporting_period(self) -> str:
        """Get current reporting period string."""
        now = datetime.now()
        return f"Q{(now.month-1)//3 + 1} {now.year}"


class RecommendationEngine:
    """Generates ESG improvement recommendations."""
    
    def generate_recommendations(
        self,
        esg_scores: ESGScores,
        compliance_rates: List[ComplianceRate],
        benchmark_comparison: BenchmarkComparison,
        sector: str
    ) -> List[Dict[str, Any]]:
        """Generate prioritized improvement recommendations."""
        recommendations = []
        
        # Score-based recommendations
        recommendations.extend(self._score_recommendations(esg_scores))
        
        # Compliance-based recommendations
        recommendations.extend(self._compliance_recommendations(compliance_rates))
        
        # Benchmark-based recommendations
        recommendations.extend(self._benchmark_recommendations(benchmark_comparison))
        
        # Sector-specific recommendations
        recommendations.extend(self._sector_recommendations(sector, esg_scores))
        
        # Sort by priority and return top 10
        recommendations.sort(key=lambda x: x["priority_score"], reverse=True)
        return recommendations[:10]
    
    def _score_recommendations(self, scores: ESGScores) -> List[Dict[str, Any]]:
        """Generate recommendations based on ESG scores."""
        recommendations = []
        
        categories = [
            ("environmental", scores.environmental),
            ("social", scores.social),
            ("governance", scores.governance)
        ]
        
        for category, score in categories:
            if score < 60:  # Low score threshold
                recommendations.append({
                    "title": f"Improve {category.title()} Performance",
                    "description": f"Your {category} score of {score:.1f} is below the 60-point threshold. Focus on completing {category} tasks and improving policies.",
                    "category": category,
                    "priority": "high" if score < 40 else "medium",
                    "priority_score": 100 - score,
                    "estimated_impact": "high",
                    "timeframe": "3-6 months"
                })
        
        return recommendations
    
    def _compliance_recommendations(self, compliance_rates: List[ComplianceRate]) -> List[Dict[str, Any]]:
        """Generate recommendations based on compliance rates."""
        recommendations = []
        
        for rate in compliance_rates:
            if rate.rate < 80:  # Low compliance threshold
                remaining = rate.total - rate.completed
                recommendations.append({
                    "title": f"Complete {rate.framework} Tasks",
                    "description": f"Complete {remaining} remaining tasks to improve {rate.framework} compliance from {rate.rate:.1f}% to 100%.",
                    "category": "compliance",
                    "priority": "high" if rate.rate < 50 else "medium",
                    "priority_score": 100 - rate.rate,
                    "estimated_impact": "high",
                    "timeframe": "1-3 months"
                })
        
        return recommendations
    
    def _benchmark_recommendations(self, comparison: BenchmarkComparison) -> List[Dict[str, Any]]:
        """Generate recommendations based on benchmark comparison."""
        recommendations = []
        
        performance_areas = [
            ("electricity", comparison.electricity_performance, "Energy Efficiency"),
            ("water", comparison.water_performance, "Water Conservation"),
            ("carbon", comparison.carbon_performance, "Carbon Reduction")
        ]
        
        for area, performance, title in performance_areas:
            if performance == "inefficient":
                recommendations.append({
                    "title": f"Improve {title}",
                    "description": f"Your {area} performance is below sector benchmarks. Implement efficiency measures to reduce consumption.",
                    "category": "environmental",
                    "priority": "high",
                    "priority_score": 80,
                    "estimated_impact": "medium",
                    "timeframe": "6-12 months"
                })
        
        return recommendations
    
    def _sector_recommendations(self, sector: str, scores: ESGScores) -> List[Dict[str, Any]]:
        """Generate sector-specific recommendations."""
        recommendations = []
        
        sector_advice = {
            BusinessSector.HOSPITALITY: [
                {
                    "title": "Implement Guest Engagement Programs",
                    "description": "Develop towel and linen reuse programs to reduce water and energy consumption.",
                    "category": "environmental",
                    "priority": "medium",
                    "priority_score": 60
                }
            ],
            BusinessSector.MANUFACTURING: [
                {
                    "title": "Optimize Production Efficiency",
                    "description": "Implement lean manufacturing principles to reduce waste and energy consumption.",
                    "category": "environmental", 
                    "priority": "high",
                    "priority_score": 75
                }
            ]
        }
        
        return sector_advice.get(sector, [])