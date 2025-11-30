export const en = {
  nav: {
    login: "Login",
    requestDemo: "Request Demo",
    english: "English",
    arabic: "العربية",
  },
  hero: {
    title: "AI-Powered Training, Renewal & Talent Intelligence Platform",
    subtitle: "Designed for enterprises like Aramco and Saudi Electricity Company to automate training validity, renewal workflows, promotion readiness, skill intelligence, and AI-driven coaching.",
    cta_login: "Login",
    cta_demo: "Request Demo",
  },
  features: {
    title: "Comprehensive Training Management Suite",
    subtitle: "All-in-one platform for compliance, renewals, and talent development",
    modules: [
      {
        title: "Training Validity Management",
        description: "Monitor and manage validity periods for all training courses with automated alerts",
      },
      {
        title: "Renewal Workflows",
        description: "Automated renewal workflows with multi-level approval chains",
      },
      {
        title: "Multi-Level Approvals",
        description: "Foreman → Manager → Training Officer approval cascade with full audit trails",
      },
      {
        title: "Promotion Readiness Engine",
        description: "Task-based progression tracking for career advancement and grade promotions",
      },
      {
        title: "Progression Tasks Tracking",
        description: "Define and monitor tasks required for employee grade progression",
      },
      {
        title: "KPI Dashboards",
        description: "Real-time dashboards for compliance and performance metrics at all levels",
      },
      {
        title: "Skill Graph Intelligence",
        description: "AI-powered knowledge graph mapping skills, relationships, and course requirements",
      },
      {
        title: "Career Path AI",
        description: "Personalized promotion readiness forecasting and career progression intelligence",
      },
      {
        title: "AI Coaching Layer",
        description: "Weekly AI-powered learning recommendations and personalized coaching plans",
      },
      {
        title: "SCORM & LMS Integration",
        description: "Native SCORM 1.2/2004 and external LMS integration with real-time tracking",
      },
      {
        title: "Enterprise ERP Integrations",
        description: "Native connectors for SAP, Oracle, SuccessFactors with data synchronization",
      },
      {
        title: "Security Awareness Simulator",
        description: "Phishing campaigns, cyber readiness assessment, and security training tracking",
      },
    ],
  },
  enterprise: {
    title: "Enterprise-Grade Features",
    subtitle: "Built for large organizations with complex requirements",
    features: [
      {
        title: "Multi-tenant Isolation",
        description: "Strict data isolation with tenant_id on every table",
      },
      {
        title: "RBAC & Security",
        description: "Role-based access control with JWT HttpOnly cookies",
      },
      {
        title: "Audit Logging",
        description: "Comprehensive audit trails for compliance and forensics",
      },
      {
        title: "Background Jobs",
        description: "APScheduler for automated expiration checks and notifications",
      },
      {
        title: "AI Engines",
        description: "OpenAI integration for recommendations and predictions",
      },
      {
        title: "Real-time Notifications",
        description: "Push notifications for renewals, expirations, and milestones",
      },
    ],
  },
  kpis: {
    title: "Real-Time Compliance Metrics",
    completion: "Training Completion Rate",
    expiration: "Course Expiration Alerts",
    readiness: "Promotion Readiness Score",
  },
  workflow: {
    title: "How TrainFlow Works",
    subtitle: "Eight-step intelligent renewal and progression workflow",
    steps: [
      {
        number: "1",
        title: "Course Assigned",
        description: "Training Officer assigns course with validity period to employee",
      },
      {
        number: "2",
        title: "Validity Monitored",
        description: "System continuously tracks and monitors course validity status",
      },
      {
        number: "3",
        title: "Expiry Detected",
        description: "Automated system detects upcoming expiration and generates alert",
      },
      {
        number: "4",
        title: "Notifications Sent",
        description: "Employee receives SMS/email notifications about expiring course",
      },
      {
        number: "5",
        title: "Employee Submits Renewal",
        description: "Employee initiates renewal request in the platform",
      },
      {
        number: "6",
        title: "Foreman/Manager Approval",
        description: "Multi-level approval from foreman and manager with commentary",
      },
      {
        number: "7",
        title: "Training Officer Schedules",
        description: "Training officer confirms and schedules renewal training",
      },
      {
        number: "8",
        title: "KPIs Automatically Updated",
        description: "Dashboard metrics update with completion and compliance data",
      },
    ],
  },
  integrations: {
    title: "Enterprise Integrations",
    subtitle: "Connect with your existing systems seamlessly",
    systems: [
      "SAP HR",
      "SAP TEM",
      "Oracle HCM",
      "Cornerstone LMS",
      "SuccessFactors",
      "Custom Databases",
    ],
  },
  ai: {
    title: "AI-Powered Intelligence",
    subtitle: "Next-generation talent insights and automation",
    features: [
      {
        title: "AI Course Recommendations",
        description: "Machine learning algorithms recommend courses based on role and skill gaps",
      },
      {
        title: "Skill Gap Detection",
        description: "Identify missing skills and recommend upskilling opportunities",
      },
      {
        title: "Promotion Readiness Prediction",
        description: "AI predicts readiness for next grade with personalized action plans",
      },
      {
        title: "Weekly AI Coaching",
        description: "Personalized coaching suggestions delivered weekly to employees",
      },
      {
        title: "Talent Intelligence Insights",
        description: "Workforce analytics and succession planning for strategic planning",
      },
    ],
  },
  security: {
    title: "Security & Compliance",
    subtitle: "Enterprise-grade security for sensitive training data",
    features: [
      "ISO-ready audit structure",
      "RBAC with multi-role support",
      "JWT with HttpOnly + Secure cookies",
      "Comprehensive audit logs",
      "SOC2-ready monitoring",
      "TLS 1.3 encryption",
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        q: "How does TrainFlow integrate with SAP, Oracle, and LMS systems?",
        a: "TrainFlow features native connectors for SAP HR/TEM, Oracle HCM, SuccessFactors, and Cornerstone LMS. Our flexible Integration Engine supports REST APIs, databases, and file imports with field mapping and data synchronization.",
      },
      {
        q: "Can we import existing employee and training data?",
        a: "Yes. TrainFlow supports bulk import from CSV, Excel, JSON, and direct database connections. Historical training records, employee data, and enrollments can be migrated with field mapping.",
      },
      {
        q: "What AI models does TrainFlow use?",
        a: "TrainFlow leverages OpenAI GPT models for course recommendations, skill gap analysis, career path forecasting, and personalized coaching. All AI processing happens asynchronously to ensure system responsiveness.",
      },
      {
        q: "Is TrainFlow secure and multi-tenant?",
        a: "Absolutely. TrainFlow enforces strict multi-tenant isolation with tenant_id on every table, JWT HttpOnly authentication, role-based access control, and comprehensive audit logging for regulatory compliance.",
      },
      {
        q: "Is TrainFlow suitable for government organizations?",
        a: "Yes. TrainFlow is designed for highly regulated enterprises. It includes ISO-ready audit trails, SOC2-ready monitoring, encrypted credentials, and full compliance with security best practices.",
      },
      {
        q: "How long does implementation take?",
        a: "Implementation timeline depends on your organization size and integrations needed. Typical implementations range from 4-12 weeks including system setup, data migration, customization, and user training.",
      },
    ],
  },
  footer: {
    company: "TrainFlow",
    description: "The Intelligent Training, Renewal & Talent Progression Platform",
    contact: "Contact Us",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    rights: "All rights reserved",
    email: "info@trainflow.io",
  },
};
