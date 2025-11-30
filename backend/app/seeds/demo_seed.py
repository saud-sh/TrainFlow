"""Demo seed data for TrainFlow - creates realistic demo scenario."""
from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.app.db.models import (
    Tenant, User, Department, Course, Enrollment, RenewalRequest,
    WorkflowStep, ProgressionTask, EmployeeTask, Notification, 
    KPISnapshot, AuditLog
)
from backend.app.core.enums import (
    UserRole, EnrollmentStatus, RenewalStatus, TaskStatus
)
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def run_demo_seed(db: Session) -> dict:
    """
    Create comprehensive demo data. Idempotent - safe to call multiple times.
    Returns summary of created entities.
    """
    summary = {
        "tenant": 0, "departments": 0, "users": 0, "courses": 0,
        "enrollments": 0, "renewals": 0, "tasks": 0, "notifications": 0,
        "kpis": 0, "message": ""
    }

    # 1. Check if demo tenant already exists
    demo_tenant = db.query(Tenant).filter(Tenant.slug == "democorp").first()
    if demo_tenant:
        return {"message": "Demo seed already exists. Skipping.", **summary}

    # Create demo tenant
    tenant = Tenant(
        name="DemoCorp",
        slug="democorp",
        is_active=True
    )
    db.add(tenant)
    db.flush()
    summary["tenant"] = 1

    # 2. Create departments
    departments_data = [
        ("ERTMD", "Emergency Response Training & Maintenance Department"),
        ("TMSD", "Technical Maintenance & Support Department"),
        ("JTMD", "Job Training & Development Department"),
    ]
    departments = []
    for code, name in departments_data:
        dept = Department(
            tenant_id=tenant.id,
            name=name,
            code=code,
            is_active=True
        )
        db.add(dept)
        departments.append(dept)
    db.flush()
    summary["departments"] = len(departments)

    # 3. Create users with different roles
    default_password_hash = pwd_context.hash("TrainFlow123!")
    
    users_data = [
        ("admin@democorp.local", "Admin", "Demo", UserRole.ADMINISTRATOR, 0),
        ("training.officer@democorp.local", "Training", "Officer", UserRole.TRAINING_OFFICER, 1),
        ("manager1@democorp.local", "Manager", "One", UserRole.MANAGER, 1),
        ("manager2@democorp.local", "Manager", "Two", UserRole.MANAGER, 2),
        ("foreman1@democorp.local", "Foreman", "One", UserRole.FOREMAN, 1),
        ("foreman2@democorp.local", "Foreman", "Two", UserRole.FOREMAN, 2),
        ("foreman3@democorp.local", "Foreman", "Three", UserRole.FOREMAN, 1),
        ("employee1@democorp.local", "Employee", "One", UserRole.EMPLOYEE, 1),
        ("employee2@democorp.local", "Employee", "Two", UserRole.EMPLOYEE, 1),
        ("employee3@democorp.local", "Employee", "Three", UserRole.EMPLOYEE, 2),
        ("employee4@democorp.local", "Employee", "Four", UserRole.EMPLOYEE, 2),
        ("employee5@democorp.local", "Employee", "Five", UserRole.EMPLOYEE, 1),
        ("employee6@democorp.local", "Employee", "Six", UserRole.EMPLOYEE, 1),
        ("employee7@democorp.local", "Employee", "Seven", UserRole.EMPLOYEE, 2),
        ("employee8@democorp.local", "Employee", "Eight", UserRole.EMPLOYEE, 2),
    ]
    
    users = []
    for email, fname, lname, role, dept_idx in users_data:
        user = User(
            tenant_id=tenant.id,
            email=email,
            username=email.split("@")[0],
            password_hash=default_password_hash,
            first_name=fname,
            last_name=lname,
            role=role,
            department_id=departments[dept_idx].id if dept_idx < len(departments) else None,
            is_active=True
        )
        db.add(user)
        users.append(user)
    db.flush()
    summary["users"] = len(users)

    # 4. Create courses
    courses_data = [
        ("Basic Safety Orientation", "safety", 365, True, 0),
        ("Electrical Safety Level 2", "safety", 365, True, 0),
        ("First Aid & CPR", "safety", 730, True, 1),
        ("SCADA Fundamentals", "technical", 730, False, 1),
        ("Cyber Security Awareness", "security", 365, True, 0),
        ("Confined Space Entry", "safety", 365, False, 0),
        ("Emergency Response Leadership", "management", 730, False, 1),
    ]
    
    courses = []
    for name, category, validity, mandatory, dept_idx in courses_data:
        course = Course(
            tenant_id=tenant.id,
            name=name,
            code=name[:10].upper(),
            category=category,
            type="mandatory" if mandatory else "optional",
            validity_days=validity,
            is_mandatory=mandatory,
            department_id=departments[dept_idx].id if dept_idx < len(departments) else None
        )
        db.add(course)
        courses.append(course)
    db.flush()
    summary["courses"] = len(courses)

    # 5. Create enrollments with varied statuses - ENHANCED
    enrollments = []
    today = datetime.utcnow()
    
    # For each employee, create 3-5 courses per employee
    employee_users = [u for u in users if u.role == UserRole.EMPLOYEE]
    
    for emp_idx, emp in enumerate(employee_users):
        # Create 4 enrollments per employee to show diversity
        for course_idx in range(min(4, len(courses))):
            course = courses[course_idx]
            
            # Create varied expiry scenarios
            if emp_idx % 5 == 0 and course_idx == 0:
                # Expired enrollment
                status = EnrollmentStatus.COMPLETED
                start = today - timedelta(days=400)
                completion = today - timedelta(days=50)
                expiry = today - timedelta(days=10)
            elif emp_idx % 5 == 1 and course_idx == 1:
                # Expiring in 7 days
                status = EnrollmentStatus.COMPLETED
                start = today - timedelta(days=350)
                completion = today - timedelta(days=100)
                expiry = today + timedelta(days=7)
            elif emp_idx % 5 == 2 and course_idx == 2:
                # Expiring in 14 days
                status = EnrollmentStatus.COMPLETED
                start = today - timedelta(days=340)
                completion = today - timedelta(days=90)
                expiry = today + timedelta(days=14)
            elif emp_idx % 5 == 3 and course_idx == 3:
                # Active/In-progress
                status = EnrollmentStatus.ACTIVE
                start = today - timedelta(days=30)
                completion = None
                expiry = today + timedelta(days=300)
            else:
                # Various future expirations (30, 60, 90 days)
                status = EnrollmentStatus.COMPLETED
                start = today - timedelta(days=365)
                completion = today - timedelta(days=200)
                expiry = today + timedelta(days=30 + (emp_idx % 3) * 30 + course_idx * 10)
            
            enrollment = Enrollment(
                tenant_id=tenant.id,
                user_id=emp.id,
                course_id=course.id,
                status=status,
                start_date=start,
                completion_date=completion,
                expiry_date=expiry
            )
            db.add(enrollment)
            enrollments.append(enrollment)
    
    db.flush()
    summary["enrollments"] = len(enrollments)

    # 6. Create renewal requests for expired/expiring enrollments - ENHANCED
    renewals = []
    # Create renewals for expired and expiring soon enrollments
    for idx, enr in enumerate(enrollments[:15]):  # Expand to 15 renewals for richer data
        renewal_status = [RenewalStatus.PENDING, RenewalStatus.APPROVED, RenewalStatus.REJECTED][idx % 3]
        renewal = RenewalRequest(
            tenant_id=tenant.id,
            user_id=enr.user_id,
            enrollment_id=enr.id,
            status=renewal_status,
            requested_date=today - timedelta(days=10 - (idx % 8)),
            approver_id=None if renewal_status == RenewalStatus.PENDING else users[2].id,  # manager1
            decided_date=None if renewal_status == RenewalStatus.PENDING else today - timedelta(days=3 + (idx % 3)),
            reason="Course expiration renewal - " + ("Mandatory compliance" if idx % 2 == 0 else "Professional development")
        )
        db.add(renewal)
        renewals.append(renewal)
    
    db.flush()
    summary["renewals"] = len(renewals)

    # 7. Create progression tasks
    progression_tasks = []
    for grade in ["G5", "G6", "G7"]:
        tasks_for_grade = [
            f"Complete Advanced Safety Course for {grade}",
            f"Lead Toolbox Talk for {grade}",
            f"Perform Field Audit for {grade}",
            f"Mentor Junior Staff for {grade}",
        ]
        for task_title in tasks_for_grade:
            task = ProgressionTask(
                tenant_id=tenant.id,
                grade_code=grade,
                title=task_title,
                is_mandatory=True
            )
            db.add(task)
            progression_tasks.append(task)
    
    db.flush()
    summary["tasks"] = len(progression_tasks)

    # 8. Create employee tasks
    for i, emp in enumerate(employee_users[:6]):
        for j, ptask in enumerate(progression_tasks[:3]):
            status = TaskStatus.COMPLETED if i % 2 == 0 else (TaskStatus.IN_PROGRESS if j % 2 == 0 else TaskStatus.NOT_STARTED)
            completed = today - timedelta(days=30) if status == TaskStatus.COMPLETED else None
            
            emp_task = EmployeeTask(
                tenant_id=tenant.id,
                user_id=emp.id,
                task_id=ptask.id,
                status=status,
                completed_at=completed
            )
            db.add(emp_task)

    db.flush()

    # 9. Create notifications - ENHANCED
    notifications = []
    for emp_idx, emp in enumerate(employee_users):
        # Create multiple notifications per employee
        notification_types = [
            ("expiry_warning", "Course Expiration Alert", f"Your course expires in {7 + (emp_idx % 7)} days"),
            ("renewal_approved", "Renewal Approved", "Your course renewal request has been approved"),
            ("renewal_pending", "Renewal Pending", "Your renewal request is awaiting manager approval"),
            ("task_reminder", "Task Reminder", "You have pending progression tasks"),
        ]
        
        for not_idx, (notif_type, title, message) in enumerate(notification_types[:2]):  # 2 per employee
            notif = Notification(
                tenant_id=tenant.id,
                user_id=emp.id,
                type=notif_type,
                title=title,
                message=message,
                is_read=not_idx > 0  # Mark some as read for realism
            )
            db.add(notif)
            notifications.append(notif)
    
    db.flush()
    summary["notifications"] = len(notifications)

    # 10. Create KPI snapshots - ENHANCED
    kpis = []
    kpi_metrics = ["training_completion_rate", "expired_course_ratio", "task_completion_rate", "promotion_readiness_score"]
    
    # Create KPIs for all employees AND departments
    for emp in employee_users:
        for metric in kpi_metrics:
            # Vary values by metric type
            if metric == "training_completion_rate":
                value = 80.0 + (hash(emp.id.hex) % 200) / 100
            elif metric == "expired_course_ratio":
                value = (hash(emp.id.hex) % 300) / 100  # 0-30%
            elif metric == "task_completion_rate":
                value = 70.0 + (hash(emp.id.hex) % 300) / 100
            else:  # promotion_readiness_score
                value = 60.0 + (hash(emp.id.hex) % 400) / 100
            
            kpi = KPISnapshot(
                tenant_id=tenant.id,
                user_id=emp.id,
                level="employee",
                metric_name=metric,
                metric_value=min(100.0, max(0.0, value))
            )
            db.add(kpi)
            kpis.append(kpi)
    
    # Add department-level KPIs
    for dept in departments:
        for metric in kpi_metrics:
            kpi = KPISnapshot(
                tenant_id=tenant.id,
                user_id=None,
                level="department",
                metric_name=metric,
                metric_value=75.0 + (hash(dept.id.hex + metric) % 200) / 100
            )
            db.add(kpi)
            kpis.append(kpi)
    
    db.flush()
    summary["kpis"] = len(kpis)

    # Commit all changes
    db.commit()
    summary["message"] = f"Demo seed completed successfully for tenant '{tenant.slug}'"
    return summary
