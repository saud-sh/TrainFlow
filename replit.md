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