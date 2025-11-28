# Enterprise Training Platform - Design Guidelines

## Design Approach: Carbon Design System

**Justification**: This enterprise training platform requires a design system optimized for data-heavy, information-dense interfaces with complex workflows. Carbon Design System (IBM) is specifically engineered for enterprise applications where clarity, efficiency, and scalability are paramount.

**Key Design Principles**:
- Clarity over decoration: Every element serves a functional purpose
- Consistent information hierarchy across all role-based dashboards
- Efficient task completion with minimal cognitive load
- Professional, trustworthy aesthetic appropriate for corporate environments
- Scalable component patterns that accommodate complex workflows

---

## Typography

**Font Stack**: IBM Plex Sans (via Google Fonts CDN)
- **Display/Headers**: IBM Plex Sans, font-weight: 600, tracking-tight
  - Page titles: text-3xl (Employee Dashboard, Course Management)
  - Section headers: text-xl
  - Card headers: text-lg
- **Body Text**: IBM Plex Sans, font-weight: 400
  - Primary content: text-base, leading-relaxed
  - Secondary/meta text: text-sm, text-gray-600
- **Data Tables**: IBM Plex Mono for numerical data and dates (font-weight: 400, text-sm)
- **CTAs/Buttons**: IBM Plex Sans, font-weight: 500, text-sm uppercase tracking-wide

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Card margins: m-4, gap-4
- Form field spacing: space-y-4
- Dashboard grid gaps: gap-6

**Container Strategy**:
- Main content area: max-w-7xl mx-auto px-4
- Dashboard grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Forms: max-w-2xl for optimal readability
- Data tables: full-width with horizontal scroll on mobile

---

## Component Library

### Navigation
- **Top Navigation Bar**: Fixed header with logo, role indicator, notification bell, user profile dropdown
- **Sidebar Navigation** (for role-based menu items): Collapsible on mobile, persistent on desktop with icon + label pattern
- **Breadcrumbs**: For nested navigation (Course Management > Edit Course > Upload Materials)

### Dashboards
- **KPI Cards**: Grid layout showing key metrics (Courses Expiring Soon, Pending Approvals, Completion Rate)
  - Large numerical value with supporting trend indicator (↑ 12% from last month)
  - Icon in top-right corner for visual association
- **Status Summary Cards**: Display counts by status (Approved, Pending, Expired)
- **Quick Action Panels**: Prominent CTAs for primary tasks (Submit Renewal Request, Enroll Employee)

### Data Display
- **Data Tables**: Sortable columns, row actions menu, pagination
  - Sticky header on scroll
  - Status badges (Approved: green, Pending: yellow, Expired: red)
  - Action buttons: icon-only with tooltips
- **Timeline View**: Vertical timeline for workflow history with timestamps, user avatars, action descriptions
- **Progress Indicators**: Multi-step progress bar for approval workflows (Submitted → Foreman Review → Manager Approval)

### Forms
- **Input Fields**: Consistent height (h-10), clear labels above inputs, helper text below
- **Dropdowns/Selects**: Searchable for long lists (employee selection, course assignment)
- **Date Pickers**: Calendar modal for expiration date selection
- **File Upload**: Drag-and-drop zone with file type/size restrictions displayed
- **Multi-level Approval Form**: Clear status indicators at each approval stage with approve/reject buttons

### Notifications
- **In-App Notification Panel**: Dropdown from header bell icon showing recent alerts with timestamp
- **Alert Banners**: Top-of-page dismissible alerts for urgent system messages (Course expiring in 1 day!)
- **Toast Notifications**: Bottom-right corner for action confirmations (Renewal request submitted successfully)

### Modals & Overlays
- **Confirmation Dialogs**: For critical actions (Approve training request? Reject renewal?)
- **Detail Panels**: Slide-in from right for viewing course details, employee profiles
- **AI Recommendation Modal**: Display AI-suggested courses with rationale and accept/dismiss actions

### Reports
- **Filter Panel**: Collapsible sidebar with date range, role, department filters
- **Export Controls**: Dropdown button offering PDF, Excel, JSON export options
- **Report Preview**: Table or card view with print-friendly formatting

---

## Animations

**Minimal Animation Strategy** (Enterprise Context):
- **Micro-interactions only**: 
  - Button hover: subtle scale (scale-105) and shadow increase (duration-200)
  - Dropdown menus: fade-in with slight translateY (duration-150)
  - Loading states: Simple spinner or skeleton screens (no elaborate animations)
- **NO scroll animations, parallax effects, or decorative transitions**
- **Page transitions**: Instant navigation with loading indicators for async operations

---

## Images

**No Hero Images**: This is a functional enterprise application, not a marketing site. Focus on data visualization and workflow efficiency.

**Image Usage**:
- **User Avatars**: Small circular avatars (32px) in headers, timelines, and approval workflows
- **Empty States**: Simple illustrations for "No courses assigned" or "No pending approvals" screens
- **Icons**: Heroicons (outline style) for navigation, actions, and status indicators via CDN