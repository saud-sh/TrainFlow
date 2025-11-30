# TrainFlow - Enterprise Training Platform

## Overview

TrainFlow is a production-grade enterprise training management system designed for large organizations like Aramco and Saudi Electricity Company. The platform automates employee training compliance, renewal workflows, progression tracking, and provides AI-driven insights for career development.

**Core Purpose:**
- Track employee training certifications and validity periods
- Automate renewal workflows with multi-level approvals (Employee → Foreman → Manager)
- Send smart alerts at 30/14/7/1 days before course expiry
- Manage progression tasks required for employee promotions
- Generate AI-based course recommendations and grade readiness predictions
- Provide comprehensive audit logging and workflow timelines
- Support enterprise reporting (PDF, Excel, JSON exports for SAP/Oracle integration)

**Key Capabilities:**
- Role-based access control (Employee, Foreman, Manager, Training Officer, Administrator)
- Multi-tenant architecture using tenant_id
- Real-time notifications (email + in-app)
- Dashboard KPIs for each role
- Complete CRUD audit logging
- Non-destructive database operations

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18+ with TypeScript
- Vite for build tooling and development server
- Wouter for client-side routing
- TanStack Query (React Query) for server state management
- ShadCN UI component library built on Radix UI primitives
- Tailwind CSS for styling with Carbon Design System principles

**Design System:**
- IBM Plex Sans for typography (via Google Fonts CDN)
- Carbon Design System-inspired components for enterprise data-heavy interfaces
- Custom theming with light/dark mode support
- Responsive layouts optimized for desktop workflows

**State Management:**
- TanStack Query for all server-side data fetching and caching
- Query invalidation patterns for real-time updates
- Optimistic updates for improved UX
- No global client-side state management (all state derived from server)

**Key Frontend Patterns:**
- Custom hooks for authentication (`useAuth`), theming, and mobile detection
- Reusable data table component with sorting, filtering, and pagination
- KPI card components for dashboard metrics
- Status badge components with consistent color coding
- Workflow timeline visualization for approval flows

### Backend Architecture

**Technology Stack:**
- Express.js with TypeScript
- Drizzle ORM for database operations
- Neon serverless PostgreSQL driver
- Passport.js for authentication
- Express session management with PostgreSQL store

**Authentication & Authorization:**
- Replit Auth integration using OpenID Connect
- Session-based authentication with HTTP-only cookies
- Role-based access control (RBAC) middleware
- JWT tokens for session management
- 7-day session TTL

**API Design:**
- RESTful API endpoints under `/api` prefix
- Role-based middleware protecting sensitive routes
- Consistent error handling and logging
- Request/response logging middleware with duration tracking
- Audit logging for all CRUD operations

**AI Integration Endpoints:**
- `POST /api/ai/recommendations` - AI-powered course recommendations based on role and career goals
- `POST /api/ai/grade-readiness` - AI grade readiness predictor for promotion assessment
- `GET /api/ai/grade-readiness/:userId` - View grade readiness for specific user (managers/admins)

**KPI Analytics Endpoints:**
- `GET /api/kpi/summary` - Role-based personalized KPI dashboard data
- `GET /api/kpi/trends/:metric` - 30/60/90-day trend analysis for key metrics
- `GET /api/kpi/department-comparison` - Cross-department benchmarking
- `GET /api/kpi/department/:deptId/drill-down` - Detailed department analysis with employee breakdowns

**SAP/Oracle Integration Endpoints:**
- `GET /api/integration/sap/employees` - Export employees in SAP HR Infotype 0001 format
- `GET /api/integration/sap/training` - Export training in SAP TEM format
- `GET /api/integration/oracle/certifications` - Export certifications in Oracle HCM v22A format
- `POST /api/integration/sap/employees/import` - Bidirectional employee sync from SAP
- `POST /api/integration/oracle/training/import` - Import training completions from Oracle HCM
- `GET /api/integration/status` - Integration health check and activity log

**Database Layer:**
- Drizzle ORM with schema-first approach
- Type-safe database queries
- Shared schema definitions between client and server (`@shared/schema`)
- Connection pooling via Neon serverless driver
- Database migrations managed by Drizzle Kit

**Key Backend Patterns:**
- Storage abstraction layer (`server/storage.ts`) for all database operations
- Audit logging wrapper for tracking all system actions
- Background workers for scheduled tasks (course expiry checks)
- Multi-level approval workflow state machine
- Notification engine for alerts and escalations

### Data Storage

**Database:** PostgreSQL (via Neon serverless)

**Schema Design:**
- `users` - User accounts with role-based permissions and department assignment
- `departments` - Organizational structure
- `courses` - Training course catalog with validity periods
- `enrollments` - Employee course assignments with expiration tracking
- `renewal_requests` - Multi-level approval workflow for course renewals
- `notifications` - In-app notification system
- `progression_tasks` - Tasks required for employee promotions
- `audit_logs` - Complete audit trail of all system actions
- `ai_recommendations` - AI-generated course suggestions
- `sessions` - Session storage (required for Replit Auth)

**Multi-tenancy:**
- All tables include `tenant_id` column for multi-tenant isolation
- Default tenant_id: 'default'
- Tenant filtering applied at storage layer

**Database Relationships:**
- Users belong to departments and have supervisors
- Enrollments link users to courses with expiration dates
- Renewal requests reference enrollments and track approval chain
- Progression tasks link to required courses
- Audit logs reference users and entities

### External Dependencies

**Third-party Services:**
- Replit Auth - OpenID Connect authentication provider
- Neon Database - Serverless PostgreSQL hosting
- Google Fonts CDN - IBM Plex Sans and IBM Plex Mono fonts

**Client-side Libraries:**
- Radix UI - Accessible component primitives (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, label, popover, progress, radio-group, scroll-area, select, separator, slider, switch, tabs, toast, tooltip)
- TanStack Query - Server state management
- React Hook Form - Form validation and submission
- Zod - Runtime type validation and schema validation
- date-fns - Date manipulation and formatting
- class-variance-authority - Component variant styling
- cmdk - Command palette component

**Server-side Libraries:**
- OpenAI - AI-powered course recommendations
- Passport - Authentication middleware
- connect-pg-simple - PostgreSQL session store
- Drizzle ORM - Type-safe database queries
- ws - WebSocket support for Neon
- express-rate-limit - API rate limiting
- express-session - Session management
- nanoid - Unique ID generation
- nodemailer - Email notifications
- multer - File upload handling
- stripe - Payment processing (if needed)
- xlsx - Excel report generation

**Development Tools:**
- Vite - Build tool and dev server
- ESBuild - Production builds
- TypeScript - Type safety
- Tailwind CSS - Utility-first styling
- PostCSS - CSS processing

**Replit-specific Integrations:**
- @replit/vite-plugin-runtime-error-modal - Development error overlay
- @replit/vite-plugin-cartographer - Code mapping
- @replit/vite-plugin-dev-banner - Development banner

**Performance Targets:**
- API response time: <150ms
- Code splitting for optimal bundle sizes
- Server-side bundling with allowlist for cold start optimization
- Static asset serving from dist/public