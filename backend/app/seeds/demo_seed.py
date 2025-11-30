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

    # 5. Create enrollments with varied statuses
    enrollments = []
    today = datetime.utcnow()
    
    # For each employee, create enrollments
    employee_users = [u for u in users if u.role == UserRole.EMPLOYEE]
    
    for emp_idx, emp in enumerate(employee_users):
        for course_idx, course in enumerate(courses[:5]):  # Enroll in first 5 courses
            if emp_idx % 3 == 0 and course_idx == 0:
                # Expired enrollment
                status = EnrollmentStatus.COMPLETED
                start = today - timedelta(days=400)
                completion = today - timedelta(days=50)
                expiry = today - timedelta(days=10)
            elif emp_idx % 3 == 1 and course_idx == 1:
                # Expiring soon (7 days)
                status = EnrollmentStatus.COMPLETED
                start = today - timedelta(days=350)
                completion = today - timedelta(days=100)
                expiry = today + timedelta(days=7)
            elif emp_idx % 3 == 2 and course_idx == 2:
                # Active/In-progress
                status = EnrollmentStatus.ACTIVE
                start = today - timedelta(days=30)
                completion = None
                expiry = today + timedelta(days=300)
            else:
                # Various future expirations
                status = EnrollmentStatus.COMPLETED
                start = today - timedelta(days=365 + (emp_idx * 50))
                completion = today - timedelta(days=200 + (emp_idx * 20))
                expiry = today + timedelta(days=100 + (emp_idx * 50) + course_idx * 30)
            
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

    # 6. Create renewal requests for expired/expiring enrollments
    renewals = []
    for enr in enrollments[:8]:  # Create renewals for first 8
        renewal = RenewalRequest(
            tenant_id=tenant.id,
            user_id=enr.user_id,
            enrollment_id=enr.id,
            status=RenewalStatus.PENDING if enrollments.index(enr) % 3 == 0 else RenewalStatus.APPROVED,
            requested_date=today - timedelta(days=5),
            approver_id=None if enrollments.index(enr) % 3 == 0 else users[2].id,  # manager1
            decided_date=None if enrollments.index(enr) % 3 == 0 else today - timedelta(days=2),
            reason="Course expiration renewal"
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

    # 9. Create notifications
    notifications = []
    for emp in employee_users[:5]:
        notif = Notification(
            tenant_id=tenant.id,
            user_id=emp.id,
            type="expiry_warning",
            title="Course Expiration Alert",
            message="Your 'Basic Safety Orientation' expires in 7 days",
            is_read=False
        )
        db.add(notif)
        notifications.append(notif)
    
    db.flush()
    summary["notifications"] = len(notifications)

    # 10. Create KPI snapshots
    kpis = []
    kpi_metrics = ["training_completion_rate", "expired_course_ratio", "task_completion_rate", "promotion_readiness_score"]
    
    for emp in employee_users[:3]:
        for metric in kpi_metrics:
            kpi = KPISnapshot(
                tenant_id=tenant.id,
                user_id=emp.id,
                level="employee",
                metric_name=metric,
                metric_value=85.0 + (hash(emp.id.hex + metric) % 150) / 100  # Random 85-100
            )
            db.add(kpi)
            kpis.append(kpi)
    
    db.flush()
    summary["kpis"] = len(kpis)

    # Commit all changes
    db.commit()
    summary["message"] = f"Demo seed completed successfully for tenant '{tenant.slug}'"
    return summary
