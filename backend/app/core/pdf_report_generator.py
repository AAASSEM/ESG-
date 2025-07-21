"""
Improved ESG Report Generator that creates professional PDF reports.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
from io import BytesIO
import base64
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, 
    PageBreak, Image, KeepTogether, ListFlowable, ListItem
)
from reportlab.graphics.shapes import Drawing, Line
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.lineplots import LinePlot
from reportlab.graphics.widgets.markers import makeMarker
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

# Handle optional matplotlib dependency
try:
    import matplotlib.pyplot as plt
    import matplotlib
    matplotlib.use('Agg')  # Use non-interactive backend
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False
    plt = None

class ESGPDFReportGenerator:
    """Generates professional ESG reports in PDF format."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        self.toc = TableOfContents()
        self.page_number = 1
        
    def _setup_custom_styles(self):
        """Set up custom paragraph styles for the report."""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            textColor=colors.HexColor('#1a472a'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='Subtitle',
            parent=self.styles['Normal'],
            fontSize=16,
            textColor=colors.HexColor('#2d5f3f'),
            spaceBefore=12,
            spaceAfter=12,
            alignment=TA_CENTER
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1a472a'),
            spaceBefore=20,
            spaceAfter=12,
            borderWidth=2,
            borderColor=colors.HexColor('#1a472a'),
            borderPadding=5
        ))
        
        # Subsection header style
        self.styles.add(ParagraphStyle(
            name='SubsectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2d5f3f'),
            spaceBefore=12,
            spaceAfter=8
        ))
        
        # Body text justified
        self.styles.add(ParagraphStyle(
            name='BodyTextJustified',
            parent=self.styles['Normal'],
            fontSize=11,
            alignment=TA_JUSTIFY,
            spaceBefore=6,
            spaceAfter=6,
            leading=14
        ))
        
        # Executive summary style
        self.styles.add(ParagraphStyle(
            name='ExecutiveSummary',
            parent=self.styles['Normal'],
            fontSize=12,
            italic=True,
            textColor=colors.HexColor('#4a4a4a'),
            alignment=TA_JUSTIFY,
            spaceBefore=10,
            spaceAfter=10,
            leftIndent=20,
            rightIndent=20,
            borderWidth=1,
            borderColor=colors.lightgrey,
            borderPadding=10,
            backColor=colors.HexColor('#f5f5f5')
        ))
    
    def generate_report(
        self,
        company_data: Dict[str, Any],
        esg_scores: Dict[str, float],
        tasks_data: List[Dict[str, Any]],
        carbon_data: Optional[Dict[str, Any]] = None,
        compliance_data: Optional[Dict[str, Any]] = None,
        location_data: Optional[List[Dict[str, Any]]] = None
    ) -> bytes:
        """Generate a complete ESG report in PDF format."""
        
        # Create buffer for PDF
        buffer = BytesIO()
        
        # Create document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Build story (content)
        story = []
        
        # Cover page
        story.extend(self._create_cover_page(company_data, datetime.now()))
        story.append(PageBreak())
        
        # Table of contents
        story.append(Paragraph("Table of Contents", self.styles['SectionHeader']))
        story.append(self.toc)
        story.append(PageBreak())
        
        # Executive summary
        story.extend(self._create_executive_summary(company_data, esg_scores, tasks_data))
        story.append(PageBreak())
        
        # ESG Performance Overview
        story.extend(self._create_esg_overview(esg_scores, tasks_data))
        story.append(PageBreak())
        
        # Environmental Performance
        story.extend(self._create_environmental_section(
            esg_scores.get('environmental', 0),
            tasks_data,
            carbon_data
        ))
        story.append(PageBreak())
        
        # Social Performance
        story.extend(self._create_social_section(
            esg_scores.get('social', 0),
            tasks_data
        ))
        story.append(PageBreak())
        
        # Governance Performance
        story.extend(self._create_governance_section(
            esg_scores.get('governance', 0),
            tasks_data,
            compliance_data
        ))
        story.append(PageBreak())
        
        # Task Analysis
        story.extend(self._create_task_analysis(tasks_data))
        story.append(PageBreak())
        
        # Recommendations
        story.extend(self._create_recommendations(esg_scores, tasks_data))
        story.append(PageBreak())
        
        # Appendices
        story.extend(self._create_appendices(location_data))
        
        # Build PDF
        doc.build(story, onFirstPage=self._add_page_number, onLaterPages=self._add_page_number)
        
        # Get PDF bytes
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
    
    def _create_cover_page(self, company_data: Dict[str, Any], report_date: datetime) -> List:
        """Create the cover page of the report."""
        elements = []
        
        # Add some space at the top
        elements.append(Spacer(1, 2*inch))
        
        # Title
        elements.append(Paragraph(
            "ESG Performance Report",
            self.styles['CustomTitle']
        ))
        
        elements.append(Spacer(1, 0.5*inch))
        
        # Company name
        elements.append(Paragraph(
            company_data.get('name', 'Company Name'),
            self.styles['Subtitle']
        ))
        
        elements.append(Spacer(1, 0.3*inch))
        
        # Report period
        elements.append(Paragraph(
            f"Report Date: {report_date.strftime('%B %Y')}",
            self.styles['Normal']
        ))
        
        elements.append(Spacer(1, 2*inch))
        
        # Add a decorative line
        d = Drawing(400, 1)
        d.add(Line(0, 0, 400, 0, strokeColor=colors.HexColor('#1a472a'), strokeWidth=2))
        elements.append(d)
        
        elements.append(Spacer(1, 0.5*inch))
        
        # Sector and location info
        info_text = f"""
        <para align="center">
        <b>Sector:</b> {company_data.get('sector', 'N/A').title()}<br/>
        <b>Location:</b> {company_data.get('main_location', 'Dubai, UAE')}<br/>
        <b>Reporting Standard:</b> GRI, Dubai ESG Standards
        </para>
        """
        elements.append(Paragraph(info_text, self.styles['Normal']))
        
        return elements
    
    def _create_executive_summary(
        self, 
        company_data: Dict[str, Any], 
        esg_scores: Dict[str, float],
        tasks_data: List[Dict[str, Any]]
    ) -> List:
        """Create executive summary section."""
        elements = []
        
        elements.append(Paragraph("Executive Summary", self.styles['SectionHeader']))
        
        # Calculate summary metrics
        overall_score = sum(esg_scores.values()) / len(esg_scores) if esg_scores else 0
        total_tasks = len(tasks_data)
        completed_tasks = len([t for t in tasks_data if t.get('status') == 'completed'])
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        summary_text = f"""
        {company_data.get('name', 'The Company')} has achieved an overall ESG performance score of 
        <b>{overall_score:.1f}%</b>, demonstrating {self._get_performance_descriptor(overall_score)} 
        commitment to sustainable business practices. This comprehensive assessment evaluates performance 
        across Environmental, Social, and Governance dimensions.
        
        <br/><br/>
        
        <b>Key Highlights:</b><br/>
        • Environmental Score: {esg_scores.get('environmental', 0):.1f}% - 
        {self._get_performance_descriptor(esg_scores.get('environmental', 0))} performance in 
        environmental stewardship<br/>
        • Social Score: {esg_scores.get('social', 0):.1f}% - 
        {self._get_performance_descriptor(esg_scores.get('social', 0))} engagement with 
        stakeholders and community<br/>
        • Governance Score: {esg_scores.get('governance', 0):.1f}% - 
        {self._get_performance_descriptor(esg_scores.get('governance', 0))} governance 
        structures and practices<br/>
        <br/>
        
        The company has completed {completed_tasks} out of {total_tasks} ESG tasks 
        ({completion_rate:.1f}% completion rate), with ongoing initiatives focused on 
        {self._get_priority_areas(tasks_data)}.
        """
        
        elements.append(Paragraph(summary_text, self.styles['ExecutiveSummary']))
        
        # Add a visual summary chart
        elements.append(Spacer(1, 0.5*inch))
        elements.append(self._create_esg_score_chart(esg_scores))
        
        return elements
    
    def _create_esg_overview(self, esg_scores: Dict[str, float], tasks_data: List[Dict[str, Any]]) -> List:
        """Create ESG performance overview section."""
        elements = []
        
        elements.append(Paragraph("ESG Performance Overview", self.styles['SectionHeader']))
        
        # Performance table
        data = [
            ['ESG Category', 'Score', 'Performance Level', 'Industry Benchmark'],
            ['Environmental', f"{esg_scores.get('environmental', 0):.1f}%", 
             self._get_performance_descriptor(esg_scores.get('environmental', 0)), '65%'],
            ['Social', f"{esg_scores.get('social', 0):.1f}%", 
             self._get_performance_descriptor(esg_scores.get('social', 0)), '70%'],
            ['Governance', f"{esg_scores.get('governance', 0):.1f}%", 
             self._get_performance_descriptor(esg_scores.get('governance', 0)), '75%'],
            ['Overall', f"{sum(esg_scores.values()) / len(esg_scores):.1f}%", 
             self._get_performance_descriptor(sum(esg_scores.values()) / len(esg_scores)), '70%']
        ]
        
        table = Table(data, colWidths=[2.5*inch, 1.5*inch, 2*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a472a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e8f5e9'))
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 0.5*inch))
        
        # Task completion by category
        elements.append(Paragraph("Task Completion by Category", self.styles['SubsectionHeader']))
        elements.append(self._create_task_completion_chart(tasks_data))
        
        return elements
    
    def _create_environmental_section(
        self, 
        env_score: float, 
        tasks_data: List[Dict[str, Any]],
        carbon_data: Optional[Dict[str, Any]]
    ) -> List:
        """Create environmental performance section."""
        elements = []
        
        elements.append(Paragraph("Environmental Performance", self.styles['SectionHeader']))
        
        env_tasks = [t for t in tasks_data if t.get('category') == 'environmental']
        completed_env_tasks = [t for t in env_tasks if t.get('status') == 'completed']
        
        intro_text = f"""
        The environmental assessment evaluates the company's impact on natural resources, 
        emissions management, and ecological stewardship. With a score of <b>{env_score:.1f}%</b>, 
        the company has completed {len(completed_env_tasks)} out of {len(env_tasks)} 
        environmental initiatives.
        """
        
        elements.append(Paragraph(intro_text, self.styles['BodyTextJustified']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Key metrics
        elements.append(Paragraph("Key Environmental Metrics", self.styles['SubsectionHeader']))
        
        if carbon_data:
            carbon_metrics = [
                ['Metric', 'Value', 'Unit', 'YoY Change'],
                ['Total Carbon Emissions', f"{carbon_data.get('total_emissions', 0):,.0f}", 'tCO2e', '-5.2%'],
                ['Energy Intensity', f"{carbon_data.get('energy_intensity', 0):.1f}", 'kWh/m²', '-8.1%'],
                ['Water Consumption', f"{carbon_data.get('water_consumption', 0):,.0f}", 'm³', '-12.3%'],
                ['Waste Diverted from Landfill', '65%', 'Percentage', '+15.0%']
            ]
            
            carbon_table = Table(carbon_metrics, colWidths=[2.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
            carbon_table.setStyle(self._get_metrics_table_style())
            elements.append(carbon_table)
        
        elements.append(Spacer(1, 0.3*inch))
        
        # Environmental initiatives
        elements.append(Paragraph("Environmental Initiatives", self.styles['SubsectionHeader']))
        
        initiatives = ListFlowable([
            ListItem(Paragraph("Energy efficiency improvements through LED lighting upgrades", 
                             self.styles['Normal'])),
            ListItem(Paragraph("Implementation of comprehensive waste segregation program", 
                             self.styles['Normal'])),
            ListItem(Paragraph("Water conservation measures including low-flow fixtures", 
                             self.styles['Normal'])),
            ListItem(Paragraph("Transition to renewable energy sources for 30% of consumption", 
                             self.styles['Normal']))
        ], bulletType='bullet')
        
        elements.append(initiatives)
        
        return elements
    
    def _create_social_section(self, social_score: float, tasks_data: List[Dict[str, Any]]) -> List:
        """Create social performance section."""
        elements = []
        
        elements.append(Paragraph("Social Performance", self.styles['SectionHeader']))
        
        social_tasks = [t for t in tasks_data if t.get('category') == 'social']
        completed_social_tasks = [t for t in social_tasks if t.get('status') == 'completed']
        
        intro_text = f"""
        The social dimension assesses the company's relationships with employees, suppliers, 
        customers, and communities. With a score of <b>{social_score:.1f}%</b>, 
        the organization demonstrates {self._get_performance_descriptor(social_score)} 
        commitment to social responsibility.
        """
        
        elements.append(Paragraph(intro_text, self.styles['BodyTextJustified']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Employee metrics
        elements.append(Paragraph("Employee & Community Metrics", self.styles['SubsectionHeader']))
        
        social_metrics = [
            ['Metric', 'Current', 'Target', 'Status'],
            ['Employee Satisfaction', '82%', '85%', '✓ On Track'],
            ['Gender Diversity', '45%', '50%', '✓ On Track'],
            ['Training Hours/Employee', '24', '30', '⚠ Needs Improvement'],
            ['Community Investment', 'AED 250K', 'AED 300K', '✓ On Track']
        ]
        
        social_table = Table(social_metrics, colWidths=[2.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        social_table.setStyle(self._get_metrics_table_style())
        elements.append(social_table)
        
        return elements
    
    def _create_governance_section(
        self, 
        gov_score: float, 
        tasks_data: List[Dict[str, Any]],
        compliance_data: Optional[Dict[str, Any]]
    ) -> List:
        """Create governance performance section."""
        elements = []
        
        elements.append(Paragraph("Governance Performance", self.styles['SectionHeader']))
        
        gov_tasks = [t for t in tasks_data if t.get('category') == 'governance']
        completed_gov_tasks = [t for t in gov_tasks if t.get('status') == 'completed']
        
        intro_text = f"""
        Governance encompasses the company's leadership, executive pay, audits, internal controls, 
        and shareholder rights. The governance score of <b>{gov_score:.1f}%</b> reflects 
        {self._get_performance_descriptor(gov_score)} governance practices.
        """
        
        elements.append(Paragraph(intro_text, self.styles['BodyTextJustified']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Compliance status
        elements.append(Paragraph("Regulatory Compliance Status", self.styles['SubsectionHeader']))
        
        compliance_items = [
            ['Framework/Regulation', 'Status', 'Last Review', 'Next Review'],
            ['Dubai ESG Standards', '✓ Compliant', 'Jan 2024', 'Jan 2025'],
            ['GRI Standards', '✓ Compliant', 'Mar 2024', 'Mar 2025'],
            ['ISO 14001', '⚠ In Progress', 'N/A', 'Jun 2024'],
            ['UAE Labor Law', '✓ Compliant', 'Feb 2024', 'Feb 2025']
        ]
        
        compliance_table = Table(compliance_items, colWidths=[2.5*inch, 1.2*inch, 1.5*inch, 1.5*inch])
        compliance_table.setStyle(self._get_metrics_table_style())
        elements.append(compliance_table)
        
        return elements
    
    def _create_task_analysis(self, tasks_data: List[Dict[str, Any]]) -> List:
        """Create detailed task analysis section."""
        elements = []
        
        elements.append(Paragraph("Task Analysis & Progress", self.styles['SectionHeader']))
        
        # Task summary by status
        status_counts = {}
        for task in tasks_data:
            status = task.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Priority distribution
        priority_counts = {}
        for task in tasks_data:
            priority = task.get('priority', 'medium')
            priority_counts[priority] = priority_counts.get(priority, 0) + 1
        
        summary_text = f"""
        The organization is tracking {len(tasks_data)} ESG-related tasks across all categories. 
        Current task distribution shows {priority_counts.get('high', 0)} high-priority items 
        requiring immediate attention.
        """
        
        elements.append(Paragraph(summary_text, self.styles['BodyTextJustified']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Task status chart
        elements.append(self._create_task_status_chart(status_counts))
        
        return elements
    
    def _create_recommendations(self, esg_scores: Dict[str, float], tasks_data: List[Dict[str, Any]]) -> List:
        """Create recommendations section."""
        elements = []
        
        elements.append(Paragraph("Recommendations & Next Steps", self.styles['SectionHeader']))
        
        # Identify areas for improvement
        lowest_score_category = min(esg_scores.items(), key=lambda x: x[1])[0] if esg_scores else 'environmental'
        incomplete_high_priority = [t for t in tasks_data 
                                  if t.get('priority') == 'high' and t.get('status') != 'completed']
        
        recommendations = []
        
        # Category-specific recommendations
        if esg_scores.get('environmental', 0) < 70:
            recommendations.append(
                "Accelerate environmental initiatives, particularly focusing on energy efficiency "
                "and carbon footprint reduction to meet Dubai's sustainability targets."
            )
        
        if esg_scores.get('social', 0) < 70:
            recommendations.append(
                "Enhance employee engagement programs and strengthen community partnerships "
                "to improve social performance metrics."
            )
        
        if esg_scores.get('governance', 0) < 70:
            recommendations.append(
                "Strengthen governance frameworks with enhanced board diversity and "
                "improved transparency in ESG reporting."
            )
        
        # Add high-priority task recommendation
        if incomplete_high_priority:
            recommendations.append(
                f"Prioritize completion of {len(incomplete_high_priority)} high-priority tasks "
                f"to ensure regulatory compliance and stakeholder commitments."
            )
        
        elements.append(Paragraph("Strategic Priorities", self.styles['SubsectionHeader']))
        
        for i, rec in enumerate(recommendations, 1):
            elements.append(Paragraph(f"{i}. {rec}", self.styles['BodyTextJustified']))
            elements.append(Spacer(1, 0.1*inch))
        
        return elements
    
    def _create_appendices(self, location_data: Optional[List[Dict[str, Any]]]) -> List:
        """Create appendices section."""
        elements = []
        
        elements.append(Paragraph("Appendices", self.styles['SectionHeader']))
        
        # Methodology
        elements.append(Paragraph("A. Methodology", self.styles['SubsectionHeader']))
        methodology_text = """
        This ESG assessment follows internationally recognized frameworks including GRI Standards, 
        Dubai ESG reporting guidelines, and industry-specific benchmarks. Scores are calculated 
        based on completed initiatives, policy implementation, and measurable outcomes.
        """
        elements.append(Paragraph(methodology_text, self.styles['BodyTextJustified']))
        
        # Glossary
        elements.append(Spacer(1, 0.3*inch))
        elements.append(Paragraph("B. Glossary of Terms", self.styles['SubsectionHeader']))
        
        glossary_items = [
            ['Term', 'Definition'],
            ['ESG', 'Environmental, Social, and Governance - key factors in measuring sustainability'],
            ['tCO2e', 'Tonnes of CO2 equivalent - standard unit for measuring carbon footprint'],
            ['GRI', 'Global Reporting Initiative - international standards for sustainability reporting'],
            ['KPI', 'Key Performance Indicator - measurable value demonstrating effectiveness']
        ]
        
        glossary_table = Table(glossary_items, colWidths=[2*inch, 4.5*inch])
        glossary_table.setStyle(self._get_glossary_table_style())
        elements.append(glossary_table)
        
        return elements
    
    # Helper methods
    
    def _get_performance_descriptor(self, score: float) -> str:
        """Get performance level descriptor based on score."""
        if score >= 80:
            return "excellent"
        elif score >= 70:
            return "strong"
        elif score >= 60:
            return "good"
        elif score >= 50:
            return "moderate"
        else:
            return "developing"
    
    def _get_priority_areas(self, tasks_data: List[Dict[str, Any]]) -> str:
        """Identify priority areas from tasks."""
        high_priority_categories = {}
        for task in tasks_data:
            if task.get('priority') == 'high' and task.get('status') != 'completed':
                cat = task.get('category', 'other')
                high_priority_categories[cat] = high_priority_categories.get(cat, 0) + 1
        
        if not high_priority_categories:
            return "continuous improvement across all ESG dimensions"
        
        top_category = max(high_priority_categories.items(), key=lambda x: x[1])[0]
        return f"{top_category} initiatives and compliance requirements"
    
    def _create_esg_score_chart(self, esg_scores: Dict[str, float]) -> Drawing:
        """Create a visual chart of ESG scores."""
        drawing = Drawing(400, 200)
        
        # Create bar chart
        bc = VerticalBarChart()
        bc.x = 50
        bc.y = 50
        bc.height = 125
        bc.width = 300
        bc.data = [[
            esg_scores.get('environmental', 0),
            esg_scores.get('social', 0),
            esg_scores.get('governance', 0)
        ]]
        bc.strokeColor = colors.black
        bc.valueAxis.valueMin = 0
        bc.valueAxis.valueMax = 100
        bc.valueAxis.valueStep = 20
        bc.categoryAxis.labels.boxAnchor = 'ne'
        bc.categoryAxis.labels.dx = 8
        bc.categoryAxis.labels.dy = -2
        bc.categoryAxis.categoryNames = ['Environmental', 'Social', 'Governance']
        
        # Color bars based on score
        bc.bars[0].fillColor = colors.HexColor('#2e7d32')  # Green
        
        drawing.add(bc)
        
        return drawing
    
    def _get_metrics_table_style(self) -> TableStyle:
        """Get standard table style for metrics tables."""
        return TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a472a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f5f5f5')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
            ('FONTSIZE', (0, 1), (-1, -1), 10)
        ])
    
    def _get_glossary_table_style(self) -> TableStyle:
        """Get table style for glossary."""
        return TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d5f3f')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')
        ])
    
    def _add_page_number(self, canvas, doc):
        """Add page numbers to the document."""
        canvas.saveState()
        canvas.setFont('Helvetica', 9)
        canvas.setFillColor(colors.grey)
        page_num = canvas.getPageNumber()
        text = f"Page {page_num}"
        canvas.drawRightString(doc.width + doc.rightMargin, 0.5*inch, text)
        canvas.restoreState()
    
    def _create_task_completion_chart(self, tasks_data: List[Dict[str, Any]]) -> Drawing:
        """Create task completion chart by category."""
        drawing = Drawing(400, 200)
        
        # Calculate completion by category
        categories = {}
        for task in tasks_data:
            cat = task.get('category', 'other')
            if cat not in categories:
                categories[cat] = {'total': 0, 'completed': 0}
            categories[cat]['total'] += 1
            if task.get('status') == 'completed':
                categories[cat]['completed'] += 1
        
        # Create pie chart
        pie = Pie()
        pie.x = 150
        pie.y = 50
        pie.width = 100
        pie.height = 100
        pie.data = [cat['completed'] for cat in categories.values()]
        pie.labels = [f"{name}\n({cat['completed']}/{cat['total']})" 
                     for name, cat in categories.items()]
        pie.slices.strokeWidth = 0.5
        pie.slices[0].fillColor = colors.HexColor('#2e7d32')
        pie.slices[1].fillColor = colors.HexColor('#1976d2')
        pie.slices[2].fillColor = colors.HexColor('#f57c00')
        
        drawing.add(pie)
        
        return drawing
    
    def _create_task_status_chart(self, status_counts: Dict[str, int]) -> Drawing:
        """Create task status distribution chart."""
        drawing = Drawing(400, 200)
        
        # Create horizontal bar chart for status
        data = []
        labels = []
        for status, count in status_counts.items():
            data.append(count)
            labels.append(f"{status.title()} ({count})")
        
        # Create pie chart
        pie = Pie()
        pie.x = 150
        pie.y = 50
        pie.width = 100
        pie.height = 100
        pie.data = data
        pie.labels = labels
        pie.slices.strokeWidth = 0.5
        
        # Color based on status
        color_map = {
            'completed': colors.HexColor('#2e7d32'),
            'in_progress': colors.HexColor('#1976d2'),
            'todo': colors.HexColor('#ffa726'),
            'blocked': colors.HexColor('#ef5350')
        }
        
        for i, (status, _) in enumerate(status_counts.items()):
            if i < len(pie.slices):
                pie.slices[i].fillColor = color_map.get(status, colors.grey)
        
        drawing.add(pie)
        
        return drawing