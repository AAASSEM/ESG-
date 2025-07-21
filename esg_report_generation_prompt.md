# ESG Report Generation System - Implementation Prompt

## Overview
Build a comprehensive ESG report generation system for a UAE SME SaaS platform that converts collected ESG data, completed tasks, and uploaded evidence into professional, sector-specific compliance reports.

## Context
The system already has:
- ✅ Business information collection (company details, sector)
- ✅ Locations and facilities data (utilities, meters, consumption)
- ✅ Sector-specific ESG scoping questions and answers
- ✅ Task management system with evidence uploads
- ✅ UAE-specific framework mapping (Dubai Sustainable Tourism, Al Sa'fat, Estidama, etc.)

## Required Report Types

### 1. Executive Summary Report (All Sectors)
**Purpose:** High-level ESG performance overview for executives and stakeholders

**Content:**
- Company ESG score (0-100)
- Compliance rate across all frameworks
- Key achievements and gaps
- Recommended priority actions
- Sector benchmark comparison
- Carbon footprint summary

### 2. Regulatory Compliance Reports (Sector-Specific)

#### **Hospitality Sector:**
- **Dubai Sustainable Tourism (DST) Report**
- **Green Key Certification Assessment**
- Carbon Calculator compliance (9 mandatory inputs)
- 19 Sustainability Requirements status

#### **Construction & Real Estate:**
- **Al Sa'fat Green Building Report** (Dubai)
- **Estidama Pearl Rating Report** (Abu Dhabi)
- Construction & Demolition waste management
- Energy efficiency compliance

#### **Manufacturing:**
- **ISO 14001 Environmental Management Report**
- **Federal Energy Management Compliance**
- Industrial waste tracking and disposal
- Air emissions monitoring

#### **Education:**
- **ADEK Sustainability Policy Compliance** (Abu Dhabi schools)
- **Sustainable Schools Initiative Report**
- Curriculum integration assessment
- Resource management performance

#### **Healthcare:**
- **Department of Health Sustainability Report** (Abu Dhabi)
- **MOHAP Hospital Regulation Compliance**
- Medical waste management assessment
- Energy and water conservation performance

#### **Logistics:**
- **Green Logistics Performance Report**
- **UAE Green Agenda 2030 Alignment**
- Fleet emissions tracking
- Sustainable packaging assessment

### 3. Framework-Specific Reports
- **GRI Standards Sustainability Report**
- **Carbon Footprint Assessment Report**
- **Waste Management Performance Report**
- **Energy Efficiency Analysis Report**

## Data Sources Integration

### **Input Data Structure:**
```javascript
const reportData = {
  // From Business Info Step
  company: {
    name: string,
    sector: 'hospitality' | 'manufacturing' | 'education' | 'healthcare' | 'construction' | 'logistics',
    employees: number,
    establishedYear: number,
    businessActivities: string[]
  },
  
  // From Locations Step
  locations: [{
    id: string,
    name: string,
    emirate: string,
    totalFloorArea: number,
    locationType: string,
    utilities: {
      electricity: { monthlyConsumption: number, provider: string },
      water: { monthlyConsumption: number, provider: string },
      districtCooling?: { monthlyConsumption: number },
      naturalGas?: { monthlyConsumption: number },
      lpg?: { monthlyConsumption: number }
    },
    subBuildings: SubBuildingData[]
  }],
  
  // From ESG Scoping Questions
  scopingAnswers: {
    [questionId: string]: {
      question: string,
      answer: boolean | string,
      framework: string[],
      category: 'environmental' | 'social' | 'governance'
    }
  },
  
  // From Task Management System
  tasks: [{
    id: string,
    title: string,
    category: 'environmental' | 'social' | 'governance',
    frameworks: string[],
    status: 'completed' | 'in_progress' | 'to_do',
    evidenceRequired: string[],
    uploadedEvidence: FileData[],
    completionDate?: Date,
    priority: 'high' | 'medium' | 'low'
  }],
  
  // Calculated Metrics
  calculatedMetrics: {
    carbonFootprint: {
      totalAnnualEmissions: number, // tonnes CO2e
      scope1: number, // Direct emissions
      scope2: number, // Electricity consumption
      emissionsPerSqm: number,
      emissionsPerEmployee: number
    },
    resourceConsumption: {
      totalElectricity: number, // kWh/year
      totalWater: number, // m³/year
      electricityIntensity: number, // kWh/sqm/year
      waterIntensity: number // L/sqm/year
    },
    wasteManagement: {
      totalWaste: number, // tonnes/year
      recyclingRate: number, // percentage
      wasteToLandfill: number // tonnes/year
    }
  }
}
```

## Required Calculation Engines

### **1. ESG Scoring Algorithm**
```javascript
const calculateESGScore = (scopingAnswers, completedTasks, sectorBenchmarks) => {
  // Environmental Score (0-100)
  const environmentalScore = calculateCategoryScore('environmental');
  
  // Social Score (0-100)
  const socialScore = calculateCategoryScore('social');
  
  // Governance Score (0-100)
  const governanceScore = calculateCategoryScore('governance');
  
  // Weighted overall score
  const overallScore = (environmentalScore * 0.4) + (socialScore * 0.3) + (governanceScore * 0.3);
  
  return {
    overall: overallScore,
    environmental: environmentalScore,
    social: socialScore,
    governance: governanceScore
  };
}
```

### **2. Carbon Footprint Calculator**
```javascript
const calculateCarbonFootprint = (locationData) => {
  // Scope 1: Direct emissions (LPG, natural gas, fleet fuel)
  const scope1 = calculateDirectEmissions(locationData.utilities);
  
  // Scope 2: Indirect emissions (electricity, district cooling)
  const scope2 = calculateIndirectEmissions(locationData.utilities);
  
  // UAE-specific emission factors
  const emissionFactors = {
    electricity: 0.469, // kg CO2e/kWh (UAE grid average)
    naturalGas: 2.75, // kg CO2e/kg
    lpg: 3.03, // kg CO2e/kg
    districtCooling: 0.385 // kg CO2e/kWh
  };
  
  return {
    totalAnnual: scope1 + scope2,
    scope1,
    scope2,
    intensity: (scope1 + scope2) / locationData.totalFloorArea
  };
}
```

### **3. Compliance Rate Calculator**
```javascript
const calculateComplianceRate = (tasks, frameworks) => {
  const frameworkCompliance = {};
  
  frameworks.forEach(framework => {
    const frameworkTasks = tasks.filter(task => task.frameworks.includes(framework));
    const completedTasks = frameworkTasks.filter(task => task.status === 'completed');
    
    frameworkCompliance[framework] = {
      rate: (completedTasks.length / frameworkTasks.length) * 100,
      completed: completedTasks.length,
      total: frameworkTasks.length
    };
  });
  
  return frameworkCompliance;
}
```

### **4. Sector Benchmark Comparison**
```javascript
// UAE SME Benchmarks by Sector
const sectorBenchmarks = {
  hospitality: {
    electricityIntensity: { efficient: 100, average: 150, inefficient: 200 }, // kWh/sqm/year
    waterIntensity: { efficient: 300, average: 500, inefficient: 700 }, // L/sqm/year
    carbonIntensity: { efficient: 50, average: 75, inefficient: 100 } // kg CO2e/sqm/year
  },
  manufacturing: {
    electricityIntensity: { efficient: 200, average: 300, inefficient: 400 },
    waterIntensity: { efficient: 100, average: 200, inefficient: 300 },
    carbonIntensity: { efficient: 100, average: 150, inefficient: 200 }
  },
  // ... other sectors
};
```

## Report Template Structure

### **Executive Summary Template**
```markdown
# ESG Performance Report
## {Company Name} | {Reporting Period}

### Executive Summary
- **Overall ESG Score:** {score}/100
- **Compliance Rate:** {rate}% across {frameworkCount} frameworks
- **Carbon Footprint:** {emissions} tonnes CO2e/year
- **Key Achievement:** {topAchievement}
- **Priority Action:** {topRecommendation}

### Performance Dashboard
[Visual charts showing scores, trends, benchmarks]

### Compliance Status
[Framework-by-framework compliance breakdown]

### Recommendations
[Prioritized action items with cost-benefit analysis]
```

### **Sector-Specific Report Templates**

#### **Hospitality DST Report Template**
```markdown
# Dubai Sustainable Tourism Compliance Report
## {Hotel Name} | {Assessment Date}

### Carbon Calculator Compliance
**Status:** {9/9 inputs completed}
- Monthly Electricity: ✅ {kWh} kWh
- Monthly Water: ✅ {m³} m³
- District Cooling: ✅ {kWh} kWh
- LPG Consumption: ✅ {kg} kg
- [... all 9 mandatory inputs]

### 19 Sustainability Requirements
**Overall Compliance:** {completedRequirements}/19

#### Governance & Management
- 1.3 Sustainability Committee: ✅ Established
- 1.4 Staff Training: ⚠️ In Progress

#### Energy Efficiency  
- 2.1 Energy Efficiency Plan: ✅ Implemented
- 7.3 LED Lighting: ✅ 85% LED bulbs

[Continue for all 19 requirements]

### Recommendations
1. **High Priority:** Complete staff sustainability training
2. **Medium Priority:** Install remaining LED lighting
3. **Low Priority:** Enhance guest engagement programs
```

## Visual Components Required

### **Charts and Graphs**
1. **ESG Score Gauge** (0-100 with color coding)
2. **Compliance Rate by Framework** (horizontal bar chart)
3. **Carbon Footprint Trend** (line chart over time)
4. **Resource Consumption Comparison** (vs. sector benchmarks)
5. **Task Completion Timeline** (Gantt chart)
6. **Evidence Upload Status** (progress indicators)

### **Dashboard Widgets**
1. **Key Metrics Cards** (score, compliance rate, emissions)
2. **Traffic Light Status** (red/yellow/green indicators)
3. **Progress Bars** (framework completion percentages)
4. **Benchmark Comparison** (company vs. sector average)

## Implementation Requirements

### **Report Generation Engine**
```javascript
class ESGReportGenerator {
  constructor(reportData, sector, reportType) {
    this.data = reportData;
    this.sector = sector;
    this.type = reportType;
  }
  
  async generateReport() {
    // 1. Calculate all metrics
    const metrics = this.calculateMetrics();
    
    // 2. Generate visual components
    const charts = await this.generateCharts(metrics);
    
    // 3. Apply sector-specific template
    const template = this.getTemplate(this.sector, this.type);
    
    // 4. Populate template with data
    const populatedReport = this.populateTemplate(template, metrics, charts);
    
    // 5. Generate output (PDF, HTML, Excel)
    return this.generateOutput(populatedReport);
  }
  
  calculateMetrics() {
    return {
      esgScores: calculateESGScore(this.data),
      carbonFootprint: calculateCarbonFootprint(this.data),
      complianceRates: calculateComplianceRate(this.data),
      benchmarkComparison: compareToBenchmarks(this.data, this.sector)
    };
  }
}
```

### **Output Formats**
1. **PDF Report** (for printing, official submissions)
2. **Interactive HTML Report** (for web viewing, sharing)
3. **Excel Workbook** (for data analysis, further processing)
4. **PowerPoint Summary** (for executive presentations)

### **Export Features**
- **Automated Scheduling** (monthly/quarterly report generation)
- **Email Distribution** (send reports to stakeholders)
- **API Access** (for integration with other systems)
- **White-label Branding** (custom logos, colors, headers)

## Validation and Quality Assurance

### **Data Validation Rules**
```javascript
const validateReportData = (data) => {
  const errors = [];
  
  // Check required data completeness
  if (!data.company.name) errors.push('Company name required');
  if (data.locations.length === 0) errors.push('At least one location required');
  
  // Validate calculation inputs
  data.locations.forEach(location => {
    if (!location.utilities.electricity.monthlyConsumption) {
      errors.push(`Electricity consumption missing for ${location.name}`);
    }
  });
  
  // Check evidence requirements
  const highPriorityTasks = data.tasks.filter(t => t.priority === 'high');
  const incompleteHighPriority = highPriorityTasks.filter(t => t.status !== 'completed');
  
  if (incompleteHighPriority.length > 0) {
    errors.push(`${incompleteHighPriority.length} high-priority tasks incomplete`);
  }
  
  return { isValid: errors.length === 0, errors };
};
```

### **Report Quality Checks**
- **Completeness Score** (percentage of available data included)
- **Evidence Coverage** (percentage of requirements with supporting documents)
- **Data Freshness** (age of most recent data inputs)
- **Calculation Accuracy** (cross-validation of computed metrics)

## Success Metrics

### **System Performance**
- Report generation time: < 30 seconds for standard reports
- Data accuracy: 99.9% calculation precision
- Export success rate: 99.5% successful PDF/Excel generation

### **User Experience**
- Report customization options (executive vs. detailed views)
- Progress tracking during generation
- Error handling with clear guidance
- Preview functionality before final export

### **Compliance Value**
- Regulatory acceptance rate: 100% for submissions
- Audit preparation time: Reduced by 80%
- Stakeholder satisfaction: Measured via feedback surveys

## Next Steps

1. **Choose Starting Point:** Executive Summary Report (universally applicable)
2. **Implement Core Engine:** ESG scoring and carbon footprint calculations
3. **Build Template System:** Modular, sector-agnostic base with sector extensions
4. **Add Visual Components:** Charts, graphs, and dashboard widgets
5. **Integrate with Existing System:** Connect to current task and data collection workflows
6. **Test with Real Data:** Validate calculations and templates with sample companies
7. **Expand Sector Coverage:** Add remaining sector-specific templates
8. **Advanced Features:** Scheduling, API access, multi-language support

This implementation will transform your ESG SaaS from a data collection tool into a comprehensive compliance and reporting platform that delivers real business value to UAE SMEs.