# TrainFlow – Enterprise Training, Renewal & Progression Platform

## Overview

TrainFlow is an enterprise platform designed for managing employee training, certification renewals, and career progression. It aims to streamline HR and L&D processes by providing tools for course management, enrollment tracking, multi-level approval workflows for renewals, and AI-powered recommendations and grade readiness assessments. The platform supports multi-tenancy and robust integration capabilities with external HR, LMS, and database systems. Its core purpose is to ensure workforce compliance, foster continuous learning, and facilitate employee career growth within organizations.

## User Preferences

I prefer an iterative development approach, focusing on delivering functional modules phase by phase. I value clear, concise explanations and prefer to be asked before major architectural or design changes are made. Do not make changes to the folder `ai/` and `common/`.

## System Architecture

TrainFlow is built as a modular monolith using Python (FastAPI) for the backend and React with TypeScript for the frontend. It adheres to Clean Architecture principles, separating concerns into domain, application, infrastructure, and API layers.

**Backend:**
- **Framework:** FastAPI
- **Database:** PostgreSQL (production), SQLite (development)
- **ORM:** SQLAlchemy
- **Architecture:** Modular Monolith with Clean Architecture, multi-tenant design (all business tables include `tenant_id`).
- **Core Modules:** Users, Courses, Enrollments, Renewal Workflow (multi-level approval), Progression Tasks, Notifications, KPI & Analytics, AI Pipeline, Audit, and Integrations.
- **Background Jobs:** Utilizes APScheduler for tasks like enrollment expiration checks, renewal escalations, KPI aggregation, AI computations, and integration syncing.
- **API Design:** RESTful API with `/api/v1` prefix, JSON response envelope, pagination, filtering, and RBAC enforced via middleware. Soft deletes are used for all data.

**Frontend:**
- **Framework:** React with Vite and TypeScript
- **UI Components:** ShadCN UI (built with Radix and Tailwind CSS)
- **State Management:** Zustand (for auth, UI, notifications, filters)
- **Routing:** React Router for navigation, with protected routes for authenticated users.
- **Design:** Focus on a clean, intuitive enterprise-grade interface.

**Key Technical Implementations:**
- **Authentication:** Session-based (HttpOnly + Secure cookies) with optional JWT.
- **Authorization:** Role-Based Access Control (RBAC) enforced via middleware, based on user roles (Employee, Foreman, Manager, Training Officer, Administrator).
- **Tenant Isolation:** Achieved by filtering all database queries by `tenant_id` injected from the authentication token.
- **Security:** Comprehensive security measures including HTTPS, HSTS, CORS, CSP, X-Frame-Options, X-Content-Type-Options, rate limiting, password hashing (bcrypt), and encryption for sensitive integration credentials.
- **Observability:** Structured JSON logging, health endpoints (`/health`, `/health/db`, `/health/jobs`), and Prometheus metrics for monitoring API requests, job statuses, and system performance.

## External Dependencies

- **Database:** PostgreSQL, SQLite
- **AI Services:** OpenAI API (for recommendations, grade readiness, skill gap analysis)
- **Notification Services:** SMTP (for email), Twilio (for SMS)
- **Integration Targets:**
    - SAP (HR module)
    - Oracle (HCM module)
    - Generic LMS (SCORM/xAPI/REST compatible)
    - External Databases (PostgreSQL, MySQL, SQL Server)
    - File-based imports (Excel, CSV)