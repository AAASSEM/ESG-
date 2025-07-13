# ESG Data Wizard & Task Management System - Claude Code Implementation

## Context
This is an ESG Dashboard application for UAE Small and Medium Enterprises that helps them comply with local sustainability frameworks like Dubai Sustainable Tourism (DST), Al Sa'fat, Estidama, Green Key, and ISO 14001.

## Current Workflow to Implement
```
Data Wizard (ESG Scoping) → Task Generation → Task Management → Evidence Collection → Dashboard Integration
```

## Detailed Requirements

### 1. Data Wizard Implementation

Create a 4-step wizard with sector-specific questions:

- **Step 1: Business Info** 
  - Company name, sector selection from: Hospitality, Construction, Real Estate, Manufacturing, Logistics, Education, Health
- **Step 2: Environmental** 
  - Energy tracking, waste management, water consumption
- **Step 3: Social** 
  - Staff training, diversity, health & safety
- **Step 4: Governance** 
  - Sustainability policies, management structure

### 2. Sector-Specific Question Sets

Implement the exact scoping questions from the uploaded document for each sector:

#### HOSPITALITY (Dubai Sustainable Tourism + Green Key)
- "Do you have a designated person responsible for sustainability efforts?"
- "Do you track monthly electricity consumption from DEWA in kWh?"
- "Do you measure waste sent to landfill each month?"
- "Do you use bulk dispensers for toiletries in guest bathrooms?"
- "Do you have a written sustainability policy signed by senior management?"
- "Do you provide regular training for all staff on sustainability goals?"
- "Do you use any fuel (diesel/petrol) for on-site power generators?"
- "Do you use district cooling services?"
- "Do you use Liquefied Petroleum Gas (LPG) for cooking or heating?"
- "Are at least 75% of your light bulbs energy-efficient models (LED)?"
- "Do you track total monthly water consumption in cubic meters?"
- "Do showers in guest rooms have flow rate of 9 litres per minute or less?"
- "Do you have a program encouraging guests to reuse towels and linens?"
- "Do you separate waste for recycling and track amounts recycled?"
- "Do you have a policy to give preference to local, organic, or fair-trade suppliers?"

#### CONSTRUCTION & REAL ESTATE (Al Sa'fat + Estidama)
- "Are you pursuing green building certification (Al Sa'fat, Estidama, LEED)?"
- "Have you conducted an Environmental Impact Assessment (EIA)?"
- "Does your building design incorporate energy-reducing features?"
- "Does the project plan include installing on-site renewable energy?"
- "Do you have a Construction and Demolition (C&D) Waste Management Plan?"
- "Do you segregate construction waste on-site for recycling?"
- "Do you use locally sourced or recycled materials in construction?"
- "Do you have measures to control dust and air pollution?"
- "Does the building have separate meters for different areas?"
- "Are water-efficient fixtures installed in the building?"
- "Does the building have dedicated recycling bins for occupants?"

#### MANUFACTURING (ISO 14001 + Federal Energy Regulations)
- "Do you have a certified Environmental Management System (ISO 14001)?"
- "Have you conducted an Environmental Impact Assessment for your facility?"
- "Do you track monthly consumption of all energy sources?"
- "Have you implemented energy efficiency improvement projects?"
- "Do you monitor air emissions from your stacks or vents?"
- "Do you track types and quantities of industrial waste generated?"
- "Do you have a licensed contractor for disposing of hazardous waste?"
- "Do you have programs to reduce, reuse, or recycle waste materials?"
- "Do you treat your industrial wastewater before discharging?"

#### LOGISTICS (Green Logistics + UAE Green Agenda 2030)
- "Do you track total fuel consumption by your vehicle fleet monthly?"
- "Does your fleet include any electric or hybrid vehicles?"
- "Do you use software to optimize delivery routes to save fuel?"
- "Do you track monthly electricity consumption of warehouses?"
- "Have you installed energy-saving features in warehouses?"
- "Do you use packaging made from recycled or biodegradable materials?"
- "Do you have a program to take back and reuse packaging materials?"

#### EDUCATION (Sustainable Schools Initiative + ADEK Policy)
- "Does your school have a formal, written sustainability strategy?"
- "Do you have a student-led 'Eco Club' or sustainability committee?"
- "Is sustainability integrated into the curriculum in any subjects?"
- "Does your school track its monthly electricity and water consumption?"
- "Does your school have a program for recycling materials?"
- "Does the school have a program for reusing old uniforms and textbooks?"
- "Do you monitor the indoor air quality in classrooms and facilities?"
- "Does your school cafeteria have a policy to promote healthy/local food?"

#### HEALTH (DoH Sustainability Goals + MOHAP Regulations)
- "Does your facility have a sustainability plan to reduce energy, water, and waste?"
- "Was your facility built according to green building standards?"
- "Do you segregate different types of medical waste at point of generation?"
- "Do you have a contract with a licensed company for biomedical waste disposal?"
- "Have you implemented measures to reduce single-use plastics in non-clinical areas?"
- "Do you track your facility's monthly electricity and water consumption?"
- "Have you installed energy-efficient equipment (LED lighting, efficient HVAC)?"
- "Do you have a program to reduce paper use by transitioning to electronic records?"

### 3. Task Generation Logic

Based on wizard answers, automatically generate tasks with this structure:

```javascript
{
  id: "task_001",
  title: "Track Monthly Energy Consumption", 
  description: "Upload monthly DEWA electricity bills",
  category: "Environmental", // Environmental, Social, Governance
  frameworks: ["DST Carbon Calculator", "Green Key 7.1"], 
  sector: "Hospitality",
  evidenceRequired: ["Monthly utility bills", "kWh consumption data"],
  dueDate: "2025-08-10",
  priority: "High", // High, Medium, Low
  status: "To Do", // To Do, In Progress, Completed
  completionPercentage: 0
}
```

### 4. Framework Mapping

Map each question to specific frameworks:

- **DST (Dubai Sustainable Tourism)** - Mandatory for Dubai hotels
- **Green Key** - Voluntary international certification
- **Al Sa'fat** - Mandatory for Dubai buildings
- **Estidama** - Mandatory for Abu Dhabi buildings
- **ISO 14001** - Environmental Management System
- **Federal Climate Law** - GHG emissions tracking
- **ADEK Policy** - Abu Dhabi school requirements
- **MOHAP Regulations** - Healthcare facility standards
- **Federal Energy Management Regulation** - Industrial facilities

### 5. Evidence Requirements

For each task, specify exactly what documents are needed based on the "Data Source / Checklist Item" column:

#### Governance & Management
- Job descriptions for sustainability roles
- Signed sustainability policy documents
- Committee meeting minutes
- Training records and materials

#### Energy & Emissions
- Monthly utility bills (electricity, water, district cooling)
- Fuel purchase receipts/logs (diesel, petrol, LPG)
- Equipment specifications (LED lighting, generators)
- Building management system (BMS) data

#### Waste Management
- Waste contractor invoices/reports
- Waste transfer notes from recycling facilities
- Photos of waste segregation bins
- C&D Waste Management Plan documents

#### Certifications & Compliance
- ISO 14001 certificates
- Green building certification documents
- Environmental Impact Assessment (EIA) reports
- Contractor licenses and agreements

#### Procurement & Supply Chain
- Purchasing policies
- Sample supplier invoices
- Material procurement records
- Supplier certificates (local, organic, fair-trade)

#### Operational Evidence
- Photos of equipment/facilities
- Technical specifications
- Process flow diagrams
- Monitoring reports

### 6. Dashboard Integration

Generate metrics that populate:

- **Overall ESG Score** (0-100)
- **Compliance Rate** percentage
- **Active Tasks** count
- **Category Scores** (Environmental, Social, Governance)
- **Carbon Reduction** percentage
- **Framework Coverage** tracking

### 7. Key Features to Implement

- Dynamic question flow based on sector selection
- Conditional task generation based on "No" answers (compliance gaps)
- Evidence upload with file type validation
- Task prioritization based on regulatory vs voluntary requirements
- Progress tracking with completion percentages
- Framework tagging for audit trails

### 8. Technical Requirements

- Use React with state management for the wizard
- Implement file upload functionality for evidence
- Create task filtering and sorting capabilities
- Build progress tracking animations
- Ensure mobile-responsive design
- Match the dark theme of the existing dashboard

### 9. Sample Task Generation Examples

#### Example 1: Energy Tracking Gap
**If user answers "No" to "Do you track monthly electricity consumption?":**
```
→ Generate: "Implement Energy Consumption Tracking" task
→ Evidence: "Monthly utility bills, kWh consumption spreadsheet"
→ Framework: "DST Carbon Calculator (Mandatory)"
→ Priority: "High"
→ Due Date: 30 days from wizard completion
```

#### Example 2: Certification Renewal
**If user answers "Yes" to "Do you have ISO 14001 certification?":**
```
→ Generate: "Renew ISO 14001 Certificate" task (if expiring within 6 months)
→ Evidence: "Updated ISO 14001 certificate"
→ Framework: "ISO 14001 Environmental Management"
→ Priority: "Medium"
→ Due Date: 30 days before expiration
```

#### Example 3: Waste Management Implementation
**If user answers "No" to "Do you segregate construction waste for recycling?":**
```
→ Generate: "Implement Construction Waste Segregation Program"
→ Evidence: "Waste transfer notes from recycling facilities", "Photos of segregation areas"
→ Framework: "Al Sa'fat Mandatory Credits", "Dubai Municipality Requirements"
→ Priority: "High"
→ Due Date: 60 days from wizard completion
```

### 10. Task Categories and Priorities

#### High Priority Tasks (Regulatory/Mandatory)
- Climate Law GHG reporting requirements
- Dubai Municipality waste management compliance
- Al Sa'fat/Estidama mandatory requirements
- DST Carbon Calculator for hotels
- MOHAP medical waste regulations

#### Medium Priority Tasks (Framework Compliance)
- Green Key certification requirements
- ISO 14001 implementation
- ADEK sustainability policy compliance
- DoH sustainability goals

#### Low Priority Tasks (Best Practices)
- Voluntary sustainability initiatives
- Advanced green building features
- Enhanced staff training programs
- Community engagement activities

### 11. Data Structure Examples

#### Wizard State Management
```javascript
const wizardState = {
  step: 1,
  businessInfo: {
    companyName: "",
    sector: "",
    size: "",
    establishedYear: ""
  },
  environmental: {
    energyTracking: null,
    wasteManagement: null,
    waterConservation: null
  },
  social: {
    staffTraining: null,
    diversity: null,
    healthSafety: null
  },
  governance: {
    sustainabilityPolicy: null,
    managementStructure: null,
    reporting: null
  }
}
```

#### Generated Tasks Array
```javascript
const generatedTasks = [
  {
    id: "env_001",
    title: "Implement Energy Monitoring System",
    description: "Set up monthly tracking of electricity consumption from DEWA",
    category: "Environmental",
    frameworks: ["DST Carbon Calculator", "Federal Climate Law"],
    sector: "Hospitality",
    evidenceRequired: [
      "Monthly DEWA electricity bills",
      "Energy consumption tracking spreadsheet",
      "Meter reading logs"
    ],
    priority: "High",
    dueDate: "2025-08-15",
    estimatedHours: 8,
    status: "To Do",
    completionPercentage: 0,
    createdFromQuestion: "Do you track monthly electricity consumption?"
  }
]
```

## Implementation Instructions

Please implement this complete system with all the sector-specific questions, task generation logic, and dashboard integration. Focus on making it production-ready with:

1. **Proper error handling and validation**
2. **Intuitive user experience with progress indicators**
3. **Mobile-responsive design matching existing dashboard theme**
4. **Efficient state management for complex wizard flow**
5. **File upload functionality with progress tracking**
6. **Search and filter capabilities for tasks**
7. **Export functionality for compliance reports**
8. **Integration with existing dashboard metrics**

The system should transform static ESG requirements into a dynamic, guided experience that generates actionable tasks and maintains comprehensive compliance documentation for UAE SMEs.


<!-- ✅ Complete ESG Data Wizard Implementation

  🎯 Core Features Implemented:

  1. ✅ Sector-Specific Question Sets (All 6 Sectors)
    - Hospitality: 15+ DST & Green Key compliance questions
    - Construction: 12+ Al Sa'fat & Estidama requirements
    - Manufacturing: 12+ ISO 14001 & industrial compliance
    - Logistics: 11+ fleet management & green logistics
    - Education: 9+ Sustainable Schools Initiative
    - Health: 12+ DoH & MOHAP regulatory requirements
  2. ✅ Intelligent Task Generation Logic
    - Compliance Tasks: Generated for "No" answers to required questions
    - Monitoring Tasks: Generated for "Yes" answers requiring ongoing tracking
    - Improvement Tasks: Generated for optional requirements
    - Smart Prioritization: High/Medium/Low based on regulatory requirements
  3. ✅ Comprehensive Evidence Requirements Mapping
    - 15+ Evidence Categories: Energy, waste, water, certifications, policies, training
    - Sector-Specific Documentation: Tailored to each industry's requirements
    - Framework-Specific Evidence: DST, Green Key, Al Sa'fat, ISO 14001 standards
  4. ✅ Advanced Framework Tagging System
    - 12+ Framework Tags: DST, Green Key, Al Sa'fat, Estidama, ISO 14001, MOHAP, ADEK, etc.
    - Regulatory Classification: Mandatory vs. voluntary requirements
    - Authority Mapping: Links to specific UAE government departments
  5. ✅ Dashboard Integration & Analytics
    - ESG Performance Scores: Overall + category-specific scoring
    - Compliance Metrics: Response rates, completion percentages
    - Resource Planning: Estimated hours, completion timelines
    - Framework Coverage Analysis: Active vs. total frameworks
    - Carbon Tracking Readiness: Preparedness for emissions reporting

  🔧 Technical Implementation:

  - React TypeScript: Modern, type-safe frontend implementation
  - Dark Dashboard Theme: Consistent with existing application design
  - Real-time Analytics: Comprehensive metrics calculation
  - Audit Trail: Complete tracking of question responses and task generation
  - Mobile Responsive: Optimized for all screen sizes

  📊 Generated Task Structure:

  {
    id: "task_001",
    title: "Implement Energy Consumption Tracking",
    description: "Address compliance gap...",
    category: "Environmental",
    frameworks: ["DST Carbon Calculator", "Green Key 7.1"],
    sector: "Hospitality",
    evidenceRequired: ["Monthly DEWA bills", "Energy tracking spreadsheet"],
    priority: "High",
    estimatedHours: 8,
    complianceLevel: "Regulatory - Mandatory",
    frameworkTags: [...],
    auditTrail: {...}
  }

  🎯 Key Benefits:

  - Regulatory Compliance: Ensures UAE SME compliance with local frameworks
  - Actionable Intelligence: Converts assessments into specific tasks
  - Evidence-Based: Clear documentation requirements for audits
  - Scalable: Works across all business sectors
  - Analytics-Ready: Generates comprehensive performance metrics -->