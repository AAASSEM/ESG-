## FEATURE:
ESG Scoping & Task Management Platform for UAE SMEs
This feature will create a web application that enables Small and Medium Enterprises (SMEs) in the UAE to go through a guided Environmental, Social, and Governance (ESG) scoping process based on their specific business sector. The application will dynamically generate a checklist of actionable tasks, allow for team collaboration, track progress, and culminate in a comprehensive ESG report.
1. User & Company Onboarding
Sign-Up: A new user signs up with their name, email, and password.
Company Profile Creation: Upon first login, the user is prompted to create a company profile with the following information:
Company Name
Main Location (e.g., Dubai, Abu Dhabi)
Business Sector: A mandatory dropdown list containing the sectors from the provided markdown file (Hospitality, Construction, Real Estate, Education, Health, Logistics, Manufacturing, Retail).
Location Management: After initial setup, the user can define a hierarchy of operational locations.
Primary Locations: The user can add multiple business locations (e.g., "Jebel Ali Warehouse," "Downtown Hotel").
Sub-locations: Within each primary location, the user can define specific sub-locations if applicable (e.g., within "Downtown Hotel," add "Guest Floors," "Kitchen," "Lobby"). This allows for more granular task assignment.
2. Dynamic Scoping Wizard
Based on the Business Sector selected during onboarding, the system initiates a dynamic Q&A wizard.
The application will parse the provided markdown file (2jul-Sector-Specific ESG Scoping for UAE SMEs.md) and present the Wizard Question (Plain-English) for the corresponding sector to the user one by one.
The user's answers to these questions will dynamically build a tailored ESG action plan.
3. Checklist & Task Generation
As the user completes the wizard, the system generates a list of "Tasks" (or checklist items).
Each task is created from a row in the sector-specific table in the markdown file. A task will contain:
Title: The Wizard Question (Plain-English).
Description/Rationale: The content from the Rationale / Underlying Metric column.
Compliance Context: The content from the Intersecting Frameworks & Requirements column.
Action Required: The content from the Data Source / Checklist Item column, which serves as the instruction for what the user needs to do or upload (e.g., "Upload monthly utility bills," "Provide photos of in-room signage").
Status: A default status of "To Do". Other statuses will include "In Progress," "Pending Review," and "Completed."
4. Collaborative Task Management
User Invitation & Assignment: The primary user (Admin) can invite other team members to the company's workspace by entering their name, email, and role (e.g., Contributor, Manager).
Task Assignment: The Admin or a Manager can assign any task from the generated checklist to a specific user.
Evidence Upload: For each task, the assigned user can upload evidence to fulfill the Data Source / Checklist Item requirement. The system must support file uploads (e.g., .pdf, .jpg, .png, .docx).
Task View: Clicking on a task opens a detailed view showing its description, rationale, assigned user, status, and a section for uploading/viewing evidence and leaving comments.
5. Dashboards & Reporting
Overall Dashboard: A main dashboard provides a high-level overview of the company's ESG progress. It will feature widgets for:
Overall Completion: A percentage-based progress bar showing the ratio of completed tasks to total tasks.
Task Status Breakdown: A pie or bar chart showing the number of tasks in each status ("To Do," "In Progress," "Completed").
Category-wise Progress: Progress bars broken down by the main categories from the markdown (e.g., Governance, Energy, Water, Waste, Supply Chain).
Overdue Tasks: A list of tasks that have passed their due date.
Task-Specific Dashboard (Task View): The detailed view for an individual task will clearly show its own completeness (e.g., evidence uploaded or not).
Report Generation: Once a significant portion of tasks is completed, the user can generate a formal ESG Scoping Report. This report will be a downloadable PDF summarizing:
The company's profile.
The results from the scoping wizard.
The complete checklist, showing the status of each task.
Links to or thumbnails of the uploaded evidence for completed tasks.
The high-level metrics from the overall dashboard.
## EXAMPLES:
2jul-Sector-Specific ESG Scoping for UAE SMEs.md: This is the core configuration file for the application's logic.
How it should be used: The application must be built to parse this markdown file. When a user selects their "Business Sector," the app reads the corresponding section (e.g., "1. Hospitality Sector"). It then iterates through the table rows to populate the scoping wizard questions and subsequently generate the tasks with their associated details (Rationale, Frameworks, Data Source). The table structure is critical and the parser must be designed to interpret it correctly.
in /examples tere is a /frond.exam use it as a reference for the front-end. and a file climatesage-schema-sql-v3.3-sublocations-new-roles. use it as a reference for the database schema.
and for the other files just review them and Don't copy any of these files directly, it is for a different project entirely. But use this as inspiration and for best practices.
## DOCUMENTATION:
Primary Source Document: The provided 2jul-Sector-Specific ESG Scoping for UAE SMEs.md file itself serves as the primary documentation for the ESG content, frameworks, and requirements.
Markdown Parsing: A robust markdown parser library capable of handling tables will be required. Examples include:
JavaScript: marked or Remark
Python: python-markdown
UAE Regulations: For deeper context, the "Works Cited" section of the markdown provides direct links to official UAE laws and regulations, such as the UAE Legislation Portal.
##OTHER CONSIDERATIONS:
Robust Markdown Parsing: The AI assistant must understand that the application's logic is entirely dependent on the structure of the source markdown file. The parser needs to be resilient to minor formatting changes but strict enough to correctly map table columns (Wizard Question, Rationale, etc.) to the application's data model for a "Task".
User Roles and Permissions: The system needs a simple role-based access control (RBAC) model:
Admin: Can manage company settings, locations, invite users, assign any task, and view all dashboards.
Contributor: Can only view and work on tasks assigned to them, including uploading evidence. They cannot assign tasks or see company-wide settings.
Data Model Hierarchy: The database schema must reflect the logical hierarchy: A Company has many Locations, which can have many Sub-locations. A Task belongs to a Company and can optionally be associated with a specific Location or Sub-location. A Task is assigned to one User.
Extensibility: The design should allow for easily updating the markdown file or adding new sector files in the future without requiring code changes, making the app content-driven.
Data Security: The application will store potentially sensitive company information and documents (e.g., utility bills, policies). It must be built with security best practices in mind, including secure file storage and user authentication.