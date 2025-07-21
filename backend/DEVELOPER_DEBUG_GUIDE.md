# 🔍 Developer Debug Messages Guide

## Overview
I've added comprehensive debug messages to help you understand exactly how the ESG platform generates tasks and processes data for reports. These messages will appear in your console/terminal when the system runs.

## 📋 Task Generation Debug Messages

### When activated:
- When a user completes the ESG scoping wizard
- When tasks are automatically generated for a company

### What you'll see:
```
🚀 [DEVELOPER DEBUG] TASK GENERATION STARTED
================================================================================

📋 Step 1: Fetching company data for ID: a9834db7-cd82-4a24-b7ea-40306b033b81
✅ Company found:
   • Name: Test Company
   • Sector: HOSPITALITY
   • Location: UAE
   • Description: Test company description

📚 Step 2: Loading ESG questions for sector 'HOSPITALITY'
✅ Found 20 ESG questions for HOSPITALITY
   Questions preview:
   1. Do you have energy-efficient lighting systems?
      Frameworks: ['Green Key Global']
      Category: ENVIRONMENTAL
   2. Have you implemented water conservation measures?
      Frameworks: ['Dubai Sustainable Tourism']
      Category: ENVIRONMENTAL
   ... and 18 more questions

🔧 Step 3: Converting questions to tasks
🔨 [DEBUG] Creating tasks from 20 questions

   📝 Processing Question 1/20
      Text: Do you have energy-efficient lighting systems?
      Category: ENVIRONMENTAL
      Frameworks: Green Key Global
      Extracted tags: ['Green Key Global']
      ✅ Task created: Do you have energy-efficient lighting...
         ID: task-uuid-123
         Due: 2025-08-20
         Status: TODO

💾 Saving 20 tasks to database...
   ✅ Successfully saved 20 tasks to database

🎉 TASK GENERATION COMPLETED
   • Total tasks generated: 20
   • Company: Test Company
   • Sector: HOSPITALITY
   • Categories: {'ENVIRONMENTAL': 12, 'SOCIAL': 5, 'GOVERNANCE': 3}
   • Frameworks: {'Green Key Global': 15, 'Dubai Sustainable Tourism': 18}
================================================================================
```

## 📊 Report Generation Debug Messages

### When activated:
- When a user downloads an ESG report (PDF)
- Shows how task data is processed and calculated

### What you'll see:
```
📊 [DEVELOPER DEBUG] REPORT GENERATION STARTED
================================================================================

🏢 Step 1: Fetching company data for ID: a9834db7-cd82-4a24-b7ea-40306b033b81
✅ Company found:
   • Name: Test Company
   • Sector: HOSPITALITY
   • Description: Test company description
   • ESG Scoping Completed: True

📋 Step 2: Fetching tasks for company
✅ Found 20 tasks:
   • By Status: {'TODO': 15, 'IN_PROGRESS': 3, 'COMPLETED': 2}
   • By Category: {'ENVIRONMENTAL': 12, 'SOCIAL': 5, 'GOVERNANCE': 3}
   • By Framework: {'Green Key Global': 15, 'Dubai Sustainable Tourism': 18}
   • Sample tasks:
     1. Install LED lighting throughout facility
        Status: COMPLETED
        Category: ENVIRONMENTAL
     2. Implement water recycling system
        Status: IN_PROGRESS
        Category: ENVIRONMENTAL

🎯 Step 3: Processing ESG scoping data
✅ Scoping data overview:
   • Has scoping data: Yes
   • Answers count: 15
   • Location data: 2 locations
   • Sample answers: {'11': 'yes', '12': 'no', '13': 'yes'}

🧮 Step 4: Calculating ESG metrics
   📝 Formatting scoping answers...
   ✅ Formatted 15 scoping answers

   📋 Formatting 20 tasks for calculations...
      Task 1: Install LED lighting throughout facility
         Status: COMPLETED
         Category: ENVIRONMENTAL
         Frameworks: ['Green Key Global']
   ✅ Formatted 20 tasks for calculations

   📊 Calculating ESG scores...
   ✅ ESG Scores calculated:
      • Environmental: 72.5/100
      • Social: 78.0/100
      • Governance: 75.0/100
      • Overall: 75.2/100

   🌍 Calculating carbon footprint...
   ✅ Carbon footprint calculated:
      • Total Annual: 125.45 tonnes CO2e
      • Scope 1: 45.20 tonnes CO2e
      • Scope 2: 80.25 tonnes CO2e
      • Per Employee: 2.51 tonnes CO2e

   📋 Calculating compliance rates...
   • Frameworks identified: ['Green Key Global', 'Dubai Sustainable Tourism']
   ✅ Compliance rates calculated:
      • Green Key Global: 73.3% (11/15 tasks)
      • Dubai Sustainable Tourism: 66.7% (12/18 tasks)

📄 Step 5: Preparing data for PDF generation
✅ Data prepared for PDF:
   • Company data: 6 fields
   • ESG scores: 4 categories
   • Tasks data: 20 tasks
   • Carbon data: 6 metrics
   • Compliance data: 2 frameworks
   • Location data: 2 locations

🖨️  Step 6: Generating PDF report...
✅ PDF generated successfully:
   • Size: 45,678 bytes

📁 Step 7: Preparing response
✅ Report ready for download:
   • Filename: ESG_Report_Test_Company_20250721.pdf
   • Content-Type: application/pdf
   • Size: 45,678 bytes

🎉 REPORT GENERATION COMPLETED SUCCESSFULLY
   • Company: Test Company
   • Tasks processed: 20
   • ESG Overall Score: 75.2/100
   • Carbon footprint: 125.45 tonnes CO2e
   • Compliance frameworks: 2
================================================================================
```

## 🎯 How to See These Messages

### 1. **In Your Terminal/Console**
- Look at the terminal window where you run: `python3 -m uvicorn app.main:app`
- The debug messages appear in real-time as users interact with the system

### 2. **When They Appear**
- **Task Generation**: When someone completes the ESG scoping wizard
- **Report Generation**: When someone downloads an ESG report

### 3. **No Extra Setup Needed**
- The debug messages are now built into the system
- They automatically appear when the backend is running

## 🔧 Key Insights You'll Get

### Task Generation Process:
1. **Company Analysis**: How the system identifies the business sector
2. **Question Loading**: Which ESG questions are loaded for that sector
3. **Framework Mapping**: How questions are mapped to compliance frameworks
4. **Task Creation**: Step-by-step task creation from questions
5. **Database Saving**: Confirmation of successful task storage
6. **Summary Statistics**: Total tasks, categories, and frameworks

### Report Generation Process:
1. **Data Fetching**: Company info and task retrieval
2. **Task Analysis**: Status breakdown and categorization
3. **Scoping Data**: How user answers are processed
4. **Metric Calculations**: ESG scores, carbon footprint, compliance rates
5. **PDF Generation**: Report creation and file size information
6. **Final Summary**: Overall scores and key metrics

## 🚀 Development Benefits

- **Debugging**: Quickly identify where issues occur in the workflow
- **Performance**: See how many tasks are generated and processing times
- **Data Flow**: Understand how raw input becomes final reports
- **Quality Control**: Verify calculations and data transformations
- **User Support**: Better understand user issues with detailed logs

## 📁 Files Modified

- `app/core/task_generator.py` - Added task generation debug messages
- `app/routers/reports.py` - Added report generation debug messages
- `debug_demo.py` - Demo script showing what you'll see
- `DEVELOPER_DEBUG_GUIDE.md` - This documentation

## 🔄 Next Steps

1. **Start the backend server**: `python3 -m uvicorn app.main:app`
2. **Complete ESG scoping**: Watch task generation debug messages
3. **Download a report**: Watch report generation debug messages
4. **Monitor the console**: See real-time data processing insights

---
**Note**: These debug messages are designed for development and can be easily disabled in production by removing or commenting out the `print()` statements.