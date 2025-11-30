from enum import Enum

class UserRole(str, Enum):
    EMPLOYEE = "employee"
    FOREMAN = "foreman"
    MANAGER = "manager"
    TRAINING_OFFICER = "training_officer"
    ADMINISTRATOR = "administrator"

class EnrollmentStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    EXPIRED = "expired"
    PENDING = "pending"

class RenewalStatus(str, Enum):
    PENDING = "pending"
    FOREMAN_APPROVED = "foreman_approved"
    MANAGER_APPROVED = "manager_approved"
    COMPLETED = "completed"
    REJECTED = "rejected"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"
