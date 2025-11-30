# TrainFlow – Enterprise Training, Talent Intelligence & Progression Platform

## Overview

TrainFlow is an enterprise **Training, Talent Intelligence & Progression Platform** designed for large organizations. Its primary purpose is to manage compliance-based training, track employee progression, and leverage AI for talent development.

**Key Capabilities:**
*   **Training Management:** Compliance tracking, multi-level renewal workflows, SCORM & LMS integration.
*   **Talent Intelligence:** AI-powered course recommendations, grade readiness prediction, Skill Graph Engine, Career Path AI, AI Coaching Engine.
*   **Progression Tracking:** Task-based readiness for promotions.
*   **Security Awareness:** Phishing simulation campaigns and cyber readiness assessment.
*   **Enterprise Features:** Multi-tenant architecture, comprehensive audit trails, reporting, and analytics.

The project aims to provide a robust, scalable solution for workforce development and compliance within large corporate environments.

## User Preferences

*   I prefer simple language.
*   I want iterative development.
*   Ask before making major changes.
*   Do not make changes to the folder Z.
*   Do not make changes to the file Y.

## Recent Completions (Latest Session)

### Phase 1: Enterprise Landing Page (COMPLETED)
- Bilingual i18n system (English/Arabic) with language toggle
- 10 landing page components (Hero, Features, Workflow, AI, Security, KPIs, Integrations, Enterprise, FAQ, Footer)
- Full RTL/LTR layout switching via LanguageProvider
- Landing page accessible at `/` for unauthenticated users

### Phase 2: Email + Password Authentication (COMPLETED)
- Login page with email/password form (`client/src/pages/login.tsx`)
- Updated useAuth hook to call backend `/api/v1/users/me` endpoint
- HttpOnly cookie-based JWT sessions
- Demo credentials displayed on login page for easy testing
- Auth flow: Landing → Login → Dashboard

### Phase 3: Role-Based Routing & Navigation Guards (COMPLETED - THIS SESSION)
**Files Created:**
- `client/src/utils/roleRoutes.ts` - Role-to-route mapping and validation
- `client/src/components/routing/ProtectedRoute.tsx` - Route protection wrapper with 403 handling

**Files Updated:**
- `client/src/hooks/useAuth.ts` - Enhanced with login/logout methods and cache management
- `client/src/pages/login.tsx` - Redirects to role-based default route post-login
- `client/src/App.tsx` - All routes wrapped with ProtectedRoute; proper role-based access control
- `client/src/components/app-sidebar.tsx` - Fixed property names (first_name/last_name), logout functionality

**Role-Based Default Routes (Post-Login):**
- Administrator → `/users` (User Management)
- Training Officer → `/courses` (Course Management)
- Manager → `/kpi-dashboard` (Analytics)
- Foreman → `/approvals` (Team Approvals)
- Employee → `/dashboard` (Personal Dashboard)

**Access Control:**
- Employees can access: dashboard, my courses, my renewals, progression, recommendations, grade readiness, KPI dashboard
- Foremen get employee routes + approvals, team overview, reports
- Managers get foreman routes + all renewals
- Training Officers get: courses, enrollments, all renewals, reports, KPI dashboard
- Administrators get all routes

**Acceptance Criteria - ALL MET:**
✅ Login redirects by role to correct dashboard
✅ All sidebar menu routes work without 404
✅ Unauthenticated users redirected to /login
✅ Authenticated users cannot access /login
✅ Landing page remains public
✅ Protected routes blocked without authorization
✅ 403 error page shown for unauthorized access
✅ Logout clears session and returns to landing page
✅ No backend breaking changes (uses existing endpoints)

## System Architecture

TrainFlow is built as a **Modular Monolith** using **Clean Architecture** principles. It features a **multi-tenant design** with `tenant_id` on all business tables and middleware-enforced isolation. The system is divided into 18 distinct Bounded Contexts.

**Technology Stack:**
*   **Backend:** Python 3.11+, FastAPI, SQLAlchemy ORM, PostgreSQL (production), SQLite (development).
*   **Frontend:** React, Vite, TypeScript, Zustand for state management, ShadCN UI for components.
*   **Background Jobs:** APScheduler for all asynchronous processing.

**Key Architectural Decisions:**
*   **UI/UX:** Utilizes ShadCN UI for a consistent, enterprise-grade look and feel. Frontend pages are organized logically by feature and access level.
*   **Backend Structure:** Follows a layered approach with API, Services, Repositories, and core modules.
*   **Database Design:** Comprehensive ERD with clear relationships and `tenant_id` for every business-critical table. Includes dedicated tables for AI inputs/outputs, skill graphs, career paths, SCORM tracking, and security awareness.
*   **API Design:** RESTful API (`/api/v1`) with distinct endpoints for each bounded context, enforcing RBAC and tenant isolation.
*   **Background Processing:** All intensive tasks (AI computations, integrations, scheduled checks) are offloaded to APScheduler jobs to maintain responsive HTTP handlers.
*   **Security:** Robust authentication (session/JWT with HttpOnly+Secure cookies, bcrypt hashing), RBAC enforced via middleware, tenant isolation at the database level, TLS 1.3, encrypted API keys, comprehensive audit logging, and security headers.
*   **Observability:** Structured logging (JSON format), health endpoints (`/health`, `/health/db`, `/health/jobs`), and Prometheus metrics for monitoring API performance, job status, and key business indicators.

**Core Features & Implementation Details:**
*   **AI Pipeline:** All AI processing (recommendations, grade readiness, coaching) occurs asynchronously via background jobs, leveraging OpenAI API.
*   **Skill Graph Engine:** Manages a knowledge graph of skills, their relationships, and mapping to courses and job requirements. Supports skill gap analysis and inference.
*   **Career Path AI:** Provides intelligent career progression guidance based on historical data and AI predictions, generating personalized coaching plans.
*   **SCORM & LMS Engine:** Supports SCORM 1.2/2004, manifest parsing, real-time tracking, and integration with external LMS platforms for completion imports.
*   **Security Awareness Simulator:** Enables the creation and management of phishing campaigns, tracks user interaction, and calculates cyber readiness scores.
*   **Integration Engine:** A flexible framework for connecting to external systems (ERP, HCM, LMS, databases, files) with staging, mapping, and UPSERT logic for data synchronization.
*   **Renewal Workflow:** Implements a multi-level approval process for course renewals with detailed workflow steps and logs.
*   **KPI Engine:** Aggregates and presents key performance indicators for training, compliance, and talent development through a dedicated dashboard.

## External Dependencies

*   **Database:** PostgreSQL (production), SQLite (development)
*   **AI/ML:** OpenAI API
*   **LMS/HRIS Systems (Integrations):**
    *   SAP HR / SAP TEM
    *   Oracle HCM
    *   Cornerstone OnDemand
    *   SuccessFactors
    *   Generic LMS (via SCORM/xAPI)
*   **Database Connectors (Integrations):** PostgreSQL, MySQL, SQL Server
*   **File-Based Integrations:** Excel, CSV
*   **Background Task Scheduler:** APScheduler

## Demo Mode

To explore TrainFlow with pre-configured data, use the demo tenant:

### Demo Tenant
- **Slug:** `democorp`
- **Name:** DemoCorp

### Demo Login Accounts

All demo users have the password: `TrainFlow123!`

| Email | Role | Department |
|-------|------|-----------|
| admin@democorp.local | Administrator | N/A |
| training.officer@democorp.local | Training Officer | ERTMD |
| manager1@democorp.local | Manager | ERTMD |
| foreman1@democorp.local | Foreman | ERTMD |
| employee1@democorp.local | Employee | ERTMD |

### How to Create Demo Data

1. **Login as Admin:**
   ```
   POST /api/v1/users/login
   {
     "email": "admin@democorp.local",
     "password": "TrainFlow123!"
   }
   ```

2. **Trigger Demo Seed (Admin Only):**
   ```
   POST /api/v1/users/seed-demo
   Authorization: Bearer <JWT_TOKEN>
   ```

3. **Response includes:**
   ```json
   {
     "tenant": 1,
     "departments": 3,
     "users": 15,
     "courses": 7,
     "enrollments": 30+,
     "renewals": 8,
     "tasks": 12,
     "notifications": 5,
     "kpis": 12,
     "message": "Demo seed completed successfully"
   }
   ```

### What the Demo Seed Creates

**Organizational Structure:**
- 3 Departments: ERTMD, TMSD, JTMD
- 15 Users across all roles (Admin, Training Officer, 2 Managers, 3 Foremen, 8 Employees)

**Training Data:**
- 7 Courses with varying validity periods (365-730 days)
- 30+ Enrollments with mixed statuses (completed, active, expired, expiring soon)
- 8 Renewal Requests showing the complete approval workflow
- Enrollments expiring at different intervals (1, 7, 14, 30 days) for testing alerts

**Progression & Development:**
- 12 Progression Tasks across 3 grade levels (G5, G6, G7)
- 18 Employee Tasks with different completion statuses
- 5 Sample Notifications for expiry warnings

**Analytics:**
- 12 KPI Snapshots across employee, team, and department levels
- Sample metrics: training completion rate, expiration ratio, task completion rate, promotion readiness

### Idempotency

The demo seed is **idempotent** — calling it multiple times is safe and will not create duplicates. If the `democorp` tenant already exists, the function returns immediately without creating additional data.