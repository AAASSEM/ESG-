# PRP: ClimateSage ESG Platform (v3.3)

## Feature File: `csage.md`

This PRP outlines the implementation plan for the ClimateSage ESG Platform (v3.3), a comprehensive SaaS platform for streamlining ESG reporting for SMEs. The core functionality revolves around an end-to-end compliance engine, intelligent data collection, collaborative team management, multi-lens dashboards, and robust auditing.

## Research Process

### 1. Codebase Analysis (Simulated)

To ensure adherence to existing conventions and patterns, the following areas of the codebase would be thoroughly analyzed:

*   **Backend (`backend/`):**
    *   `backend/main.py`: Examine existing FastAPI routes, data models (Pydantic), and business logic for handling API requests and database interactions.
    *   Database integration: Understand how the application connects to PostgreSQL, how migrations are managed, and existing ORM patterns (if any).
    *   Authentication/Authorization: Review existing user authentication and authorization mechanisms to integrate the new RBAC system.
    *   Data processing: Analyze how data is currently ingested, transformed, and stored, especially for "Collect Once, Use Many" logic.
    *   Testing patterns: Identify how existing backend tests are structured (e.g., `tests/` directory, `pytest` usage) to ensure new tests follow suit.
*   **Frontend (`frontend/` - assumed React/TypeScript based on common patterns):**
    *   Component structure: Understand how UI components are organized and how data is passed between them.
    *   State management: Identify the state management solution in use (e.g., Redux, Context API, Zustand) for handling application-wide data.
    *   API integration: Review how the frontend interacts with the backend API.
    *   Styling: Note existing CSS frameworks or styling conventions (e.g., Bootstrap, Material UI, Tailwind CSS).
    *   Dynamic UI rendering: Look for examples of conditional rendering or dynamic component loading based on user roles or data.
    *   Testing patterns: Examine existing frontend tests (e.g., Jest, React Testing Library) for best practices.

### 2. External Research

Key technical areas requiring potential external research and documentation references:

*   **ESG Reporting Standards:**
    *   Dubai Sustainable Tourism (DST) framework documentation (if publicly available).
    *   General ESG reporting guidelines for SMEs.
*   **Role-Based Access Control (RBAC):**
    *   Best practices for implementing granular RBAC in Python (FastAPI) and JavaScript (React).
    *   Database schema design for RBAC (user_permissions table, site_ids mapping).
*   **Dynamic UI Rendering:**
    *   Strategies for dynamic form generation based on backend configurations (Data Wizard).
    *   Techniques for dynamic dashboard widget rendering based on "Stakeholder Lens."
*   **"Collect Once, Use Many" Logic:**
    *   Database design patterns for tagging and associating single data points with multiple frameworks.
    *   Efficient backend query optimization for retrieving data across multiple frameworks.
*   **PostgreSQL Schema Design:**
    *   Refer to the provided "ClimateSage: Comprehensive SQL Schema v3.3" for all table, column, data type, relationship, and constraint definitions.
    *   Best practices for indexing and optimizing queries for large datasets.

### 3. User Clarification (if needed)

*   Confirmation on specific UI/UX patterns to mirror from existing components.
*   Detailed integration requirements for any external services (e.g., payment gateways, email services) if applicable to onboarding.

## PRP Generation

### Critical Context to Include and pass to the AI agent as part of the PRP

*   **Documentation:**
    *   `csage.md` (provided as feature file)
    *   Product Requirements Document (PRD) v3.3 (conceptual, assumed external)
    *   ClimateSage: Comprehensive SQL Schema v3.3 (conceptual, assumed external)
    *   ClimateSage Data Dictionary v3.3 (conceptual, assumed external)
    *   ClimateSage Platform: Complete Site Map & User Flow v3.3 (conceptual, assumed external)
    *   ClimateSage: Detailed Customer Journeys v3.3 (conceptual, assumed external)
*   **Code Examples (Conceptual References):**
    *   Existing FastAPI endpoint examples for CRUD operations.
    *   Existing React component examples for form handling and data display.
    *   Database interaction patterns (e.g., SQLAlchemy models, raw SQL queries).
*   **Gotchas:**
    *   Ensure strict adherence to the "Collect Once, Use Many" backend logic, where `data_records` are tagged for multiple frameworks.
    *   Prioritize dynamic UI rendering for dashboards (Stakeholder Lens) and Data Wizard questions (sector, active frameworks, site).
    *   Implement granular scoped permissions: all database queries must implicitly filter data based on `user_permissions.site_ids`.
    *   Strictly enforce plain language from the Data Dictionary for all user-facing text.
*   **Patterns:**
    *   Follow existing API design principles (RESTful, GraphQL, etc.).
    *   Adhere to established frontend component architecture and state management.
    *   Utilize existing database connection and query patterns.
    *   Mirror existing testing methodologies for both backend and frontend.

### Implementation Blueprint

The implementation will be broken down into logical, sequential tasks, focusing on a full-stack approach.

**Phase 1: Backend Core (Data Model & API)**

1.  **Database Schema Implementation:**
    *   Translate "ClimateSage: Comprehensive SQL Schema v3.3" into actual PostgreSQL schema (or ORM models if applicable).
    *   Implement `organizations`, `sites`, `users`, `user_permissions`, `frameworks`, `organization_frameworks`, `questions`, `question_tags`, `data_records`, `audit_log` tables.
    *   Ensure correct foreign key relationships and constraints.
2.  **Core API Endpoints:**
    *   **Onboarding:**
        *   `POST /api/organizations`: Create new organization, initial `org_admin` user, and activate default frameworks.
        *   `POST /api/users/onboard`: Endpoint for initial user setup.
    *   **User & Permissions Management:**
        *   `POST /api/users`: Create new users.
        *   `PUT /api/users/{user_id}/permissions`: Update user roles and assigned `site_ids`.
        *   `GET /api/users`: List users (scoped by `org_admin` permissions).
    *   **Site Management:**
        *   `POST /api/sites`: Create new sites/sub-locations.
        *   `GET /api/sites`: List sites (scoped by user permissions).
    *   **Framework Management:**
        *   `POST /api/organizations/{org_id}/frameworks`: Activate/deactivate frameworks for an organization.
3.  **"Collect Once, Use Many" Logic (Backend):**
    *   Design `questions` and `question_tags` tables to support tagging questions to multiple frameworks.
    *   Implement backend query logic to fetch `data_records` and associate them with relevant frameworks based on `question_tags`.
    *   Example pseudocode for data collection:
        ```python
        # In data_records API endpoint
        @app.post("/api/data_records")
        async def create_data_record(record: DataRecordCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
            # Validate user permissions for the site
            if not has_site_permission(current_user, record.site_id, "contributor"):
                raise HTTPException(status_code=403, detail="Not authorized for this site.")

            # Fetch question tags to determine associated frameworks
            question_tags = db.query(QuestionTag).filter(QuestionTag.question_id == record.question_id).all()
            framework_ids = [tag.framework_id for tag in question_tags]

            # Create data record
            new_record = DataRecord(
                question_id=record.question_id,
                value=record.value,
                site_id=record.site_id,
                user_id=current_user.id,
                # Store framework associations if needed, or derive at query time
            )
            db.add(new_record)
            db.commit()
            db.refresh(new_record)
            return new_record
        ```
4.  **Auditing & Traceability:**
    *   Implement `audit_log` table.
    *   Add middleware or decorators to log significant user actions (create, update, delete) to the `audit_log`.
    *   Ensure `data_records` link directly to supporting evidence files (e.g., file paths or IDs in a separate storage service).
5.  **Error Handling:**
    *   Implement comprehensive error handling for all API endpoints (e.g., 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error).
    *   Use FastAPI's `HTTPException` for API errors.

**Phase 2: Frontend Development**

1.  **Guided Onboarding Wizard:**
    *   Create multi-step React components for organization setup and initial user onboarding.
    *   Integrate with backend API endpoints for organization and user creation.
    *   Implement logic for automatic framework activation based on industry/location input.
2.  **Intelligent Data Collection (Data Wizard):**
    *   Develop dynamic form rendering logic based on backend-provided question configurations.
    *   Filter questions based on organization's sector, active frameworks, and selected site.
    *   Implement input validation and submission to the backend `data_records` API.
3.  **Collaborative Team & Site Management UI:**
    *   Create UI for `org_admin` to manage company profile, sites, and sub-locations.
    *   Develop user invitation and permission management interfaces, allowing assignment of roles and `site_ids`.
    *   Ensure UI reflects scoped permissions for users.
4.  **Multi-Lens Dashboards & Targeted Reporting UI:**
    *   Develop interactive dashboards with dynamic widget rendering based on selected "Stakeholder Lens."
    *   Integrate with backend APIs to fetch aggregated ESG data.
    *   Implement PDF report generation (either client-side or by calling a backend reporting service).
5.  **Auditing & Traceability UI:**
    *   Display audit logs in a user-friendly format.
    *   Provide links to supporting evidence files for data points.
6.  **Plain Language Enforcement:**
    *   Ensure all user-facing text strictly adheres to the Data Dictionary. Implement a mechanism (e.g., a translation layer or direct mapping) to use plain language strings instead of technical field names.

**Phase 3: Testing & Verification**

1.  **Unit Tests:**
    *   Write unit tests for all backend API endpoints, data models, and business logic (e.g., RBAC checks, "Collect Once, Use Many" logic).
    *   Write unit tests for frontend components, ensuring correct rendering, state updates, and API interactions.
2.  **Integration Tests:**
    *   Develop integration tests to verify the interaction between frontend and backend, and between different backend services (e.g., database interactions).
3.  **End-to-End Tests:**
    *   Implement end-to-end tests to simulate full user journeys (e.g., Omar's Simple Path, Fatima's Complex Path) to ensure the entire system functions as expected.

### Validation Gates (Must be Executable)

Assuming a Python backend and a JavaScript/TypeScript frontend (common for web apps):

```bash
# Backend (Python)
# Syntax/Style
ruff check --fix backend/ && mypy backend/

# Unit Tests
uv run pytest backend/tests/ -v

# Frontend (JavaScript/TypeScript - assuming npm/yarn)
# Syntax/Style
npm run lint -- --fix # or yarn lint --fix
npm run typecheck # (e.g., tsc --noEmit)

# Unit Tests
npm test # or yarn test
```

## Output

Save as: `PRPs/ClimateSage_ESG_Platform_v3.3.md`

## Quality Checklist

- [x] All necessary context included
- [x] Validation gates are executable by AI
- [x] References existing patterns (conceptual, as no codebase provided)
- [x] Clear implementation path
- [x] Error handling documented (conceptual)

Score the PRP on a scale of 1-10 (confidence level to succeed in one-pass implementation using claude codes): **8/10** (A 10/10 would require actual codebase analysis and specific file references.)
