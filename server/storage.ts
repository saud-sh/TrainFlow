import { db } from "./db";
import { eq, and, or, gte, lte, desc, asc, sql, isNull, lt } from "drizzle-orm";
import {
  users, departments, courses, enrollments, renewalRequests,
  notifications, progressionTasks, auditLogs, aiRecommendations,
  type User, type InsertUser, type UpsertUser, type Department, type InsertDepartment,
  type Course, type InsertCourse, type Enrollment, type InsertEnrollment,
  type RenewalRequest, type InsertRenewalRequest, type Notification, type InsertNotification,
  type ProgressionTask, type InsertProgressionTask, type AuditLog, type InsertAuditLog,
  type AiRecommendation, type InsertAiRecommendation, type UserRole
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(tenantId?: string): Promise<User[]>;
  getUsersByRole(role: UserRole, tenantId?: string): Promise<User[]>;
  getUsersByDepartment(departmentId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Departments
  getDepartment(id: number): Promise<Department | undefined>;
  getAllDepartments(tenantId?: string): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, updates: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<void>;

  // Courses
  getCourse(id: number): Promise<Course | undefined>;
  getAllCourses(tenantId?: string): Promise<Course[]>;
  getActiveCourses(tenantId?: string): Promise<Course[]>;
  getCoursesByCategory(category: string, tenantId?: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, updates: Partial<InsertCourse>): Promise<Course | undefined>;

  // Enrollments
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByUser(userId: string): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  getExpiringEnrollments(daysAhead: number, tenantId?: string): Promise<Enrollment[]>;
  getAllEnrollments(tenantId?: string): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, updates: Partial<InsertEnrollment>): Promise<Enrollment | undefined>;

  // Renewal Requests
  getRenewalRequest(id: number): Promise<RenewalRequest | undefined>;
  getRenewalRequestsByUser(userId: string): Promise<RenewalRequest[]>;
  getPendingApprovals(approverId: string, role: UserRole): Promise<RenewalRequest[]>;
  getAllRenewalRequests(tenantId?: string): Promise<RenewalRequest[]>;
  createRenewalRequest(request: InsertRenewalRequest): Promise<RenewalRequest>;
  updateRenewalRequest(id: number, updates: Partial<InsertRenewalRequest>): Promise<RenewalRequest | undefined>;

  // Notifications
  getNotificationsByUser(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  // Progression Tasks
  getProgressionTask(id: number): Promise<ProgressionTask | undefined>;
  getProgressionTasksByUser(userId: string): Promise<ProgressionTask[]>;
  getAllProgressionTasks(tenantId?: string): Promise<ProgressionTask[]>;
  createProgressionTask(task: InsertProgressionTask): Promise<ProgressionTask>;
  updateProgressionTask(id: number, updates: Partial<InsertProgressionTask>): Promise<ProgressionTask | undefined>;

  // Audit Logs
  getAuditLogs(tenantId?: string, limit?: number): Promise<AuditLog[]>;
  getAuditLogsByUser(userId: string, limit?: number): Promise<AuditLog[]>;
  getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // AI Recommendations
  getRecommendationsByUser(userId: string, includeProcessed?: boolean): Promise<AiRecommendation[]>;
  createRecommendation(rec: InsertAiRecommendation): Promise<AiRecommendation>;
  updateRecommendation(id: number, updates: Partial<InsertAiRecommendation>): Promise<AiRecommendation | undefined>;

  // Dashboard Stats
  getDashboardStats(userId: string, role: UserRole, tenantId?: string): Promise<DashboardStats>;
}

export interface DashboardStats {
  totalCourses: number;
  completedCourses: number;
  expiringCourses: number;
  pendingRenewals: number;
  pendingApprovals: number;
  unreadNotifications: number;
  progressionTasks: number;
  completedProgressionTasks: number;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.id, id), eq(users.isActive, true)));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.email, email), eq(users.isActive, true)));
    return user;
  }

  async getAllUsers(tenantId: string = 'default'): Promise<User[]> {
    return db.select().from(users).where(and(eq(users.tenantId, tenantId), eq(users.isActive, true))).orderBy(asc(users.lastName));
  }

  async getUsersByRole(role: UserRole, tenantId: string = 'default'): Promise<User[]> {
    return db.select().from(users)
      .where(and(eq(users.role, role), eq(users.tenantId, tenantId), eq(users.isActive, true)))
      .orderBy(asc(users.lastName));
  }

  async getUsersByDepartment(departmentId: number): Promise<User[]> {
    return db.select().from(users).where(and(eq(users.departmentId, departmentId), eq(users.isActive, true)));
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const [upserted] = await db.insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          updatedAt: new Date(),
        }
      })
      .returning();
    return upserted;
  }

  async deleteUser(id: string): Promise<void> {
    await db.update(users).set({ isActive: false }).where(eq(users.id, id));
  }

  // Departments
  async getDepartment(id: number): Promise<Department | undefined> {
    const [dept] = await db.select().from(departments).where(eq(departments.id, id));
    return dept;
  }

  async getAllDepartments(tenantId: string = 'default'): Promise<Department[]> {
    return db.select().from(departments).where(eq(departments.tenantId, tenantId));
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDept] = await db.insert(departments).values(department).returning();
    return newDept;
  }

  async updateDepartment(id: number, updates: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [updated] = await db.update(departments)
      .set(updates)
      .where(eq(departments.id, id))
      .returning();
    return updated;
  }

  async deleteDepartment(id: number): Promise<void> {
    await db.delete(departments).where(eq(departments.id, id));
  }

  // Courses
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getAllCourses(tenantId: string = 'default'): Promise<Course[]> {
    return db.select().from(courses).where(eq(courses.tenantId, tenantId)).orderBy(asc(courses.title));
  }

  async getActiveCourses(tenantId: string = 'default'): Promise<Course[]> {
    return db.select().from(courses)
      .where(and(eq(courses.tenantId, tenantId), eq(courses.isActive, true)))
      .orderBy(asc(courses.title));
  }

  async getCoursesByCategory(category: string, tenantId: string = 'default'): Promise<Course[]> {
    return db.select().from(courses)
      .where(and(eq(courses.category, category), eq(courses.tenantId, tenantId)))
      .orderBy(asc(courses.title));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, updates: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updated] = await db.update(courses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updated;
  }

  // Enrollments
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment;
  }

  async getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
    return db.select().from(enrollments)
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.expiresAt));
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async getExpiringEnrollments(daysAhead: number, tenantId: string = 'default'): Promise<Enrollment[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysAhead);

    return db.select().from(enrollments)
      .where(and(
        eq(enrollments.tenantId, tenantId),
        eq(enrollments.status, 'active'),
        gte(enrollments.expiresAt, now),
        lte(enrollments.expiresAt, futureDate)
      ))
      .orderBy(asc(enrollments.expiresAt));
  }

  async getAllEnrollments(tenantId: string = 'default'): Promise<Enrollment[]> {
    return db.select().from(enrollments)
      .where(eq(enrollments.tenantId, tenantId))
      .orderBy(desc(enrollments.enrolledAt));
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async updateEnrollment(id: number, updates: Partial<InsertEnrollment>): Promise<Enrollment | undefined> {
    const [updated] = await db.update(enrollments)
      .set(updates)
      .where(eq(enrollments.id, id))
      .returning();
    return updated;
  }

  // Renewal Requests
  async getRenewalRequest(id: number): Promise<RenewalRequest | undefined> {
    const [request] = await db.select().from(renewalRequests).where(eq(renewalRequests.id, id));
    return request;
  }

  async getRenewalRequestsByUser(userId: string): Promise<RenewalRequest[]> {
    return db.select().from(renewalRequests)
      .where(eq(renewalRequests.requestedBy, userId))
      .orderBy(desc(renewalRequests.createdAt));
  }

  async getPendingApprovals(approverId: string, role: UserRole): Promise<RenewalRequest[]> {
    if (role === 'foreman') {
      return db.select().from(renewalRequests)
        .where(and(
          eq(renewalRequests.status, 'pending'),
          or(isNull(renewalRequests.foremanId), eq(renewalRequests.foremanId, approverId))
        ))
        .orderBy(asc(renewalRequests.createdAt));
    } else if (role === 'manager') {
      return db.select().from(renewalRequests)
        .where(eq(renewalRequests.status, 'foreman_approved'))
        .orderBy(asc(renewalRequests.createdAt));
    }
    return [];
  }

  async getAllRenewalRequests(tenantId: string = 'default'): Promise<RenewalRequest[]> {
    return db.select().from(renewalRequests)
      .where(eq(renewalRequests.tenantId, tenantId))
      .orderBy(desc(renewalRequests.createdAt));
  }

  async createRenewalRequest(request: InsertRenewalRequest): Promise<RenewalRequest> {
    const [newRequest] = await db.insert(renewalRequests).values(request).returning();
    return newRequest;
  }

  async updateRenewalRequest(id: number, updates: Partial<InsertRenewalRequest>): Promise<RenewalRequest | undefined> {
    const [updated] = await db.update(renewalRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(renewalRequests.id, id))
      .returning();
    return updated;
  }

  // Notifications
  async getNotificationsByUser(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    if (unreadOnly) {
      return db.select().from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
        .orderBy(desc(notifications.createdAt));
    }
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  // Progression Tasks
  async getProgressionTask(id: number): Promise<ProgressionTask | undefined> {
    const [task] = await db.select().from(progressionTasks).where(eq(progressionTasks.id, id));
    return task;
  }

  async getProgressionTasksByUser(userId: string): Promise<ProgressionTask[]> {
    return db.select().from(progressionTasks)
      .where(eq(progressionTasks.userId, userId))
      .orderBy(asc(progressionTasks.dueDate));
  }

  async getAllProgressionTasks(tenantId: string = 'default'): Promise<ProgressionTask[]> {
    return db.select().from(progressionTasks)
      .where(eq(progressionTasks.tenantId, tenantId))
      .orderBy(asc(progressionTasks.dueDate));
  }

  async createProgressionTask(task: InsertProgressionTask): Promise<ProgressionTask> {
    const [newTask] = await db.insert(progressionTasks).values(task).returning();
    return newTask;
  }

  async updateProgressionTask(id: number, updates: Partial<InsertProgressionTask>): Promise<ProgressionTask | undefined> {
    const [updated] = await db.update(progressionTasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(progressionTasks.id, id))
      .returning();
    return updated;
  }

  // Audit Logs
  async getAuditLogs(tenantId: string = 'default', limit: number = 100): Promise<AuditLog[]> {
    return db.select().from(auditLogs)
      .where(eq(auditLogs.tenantId, tenantId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async getAuditLogsByUser(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return db.select().from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return db.select().from(auditLogs)
      .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
      .orderBy(desc(auditLogs.createdAt));
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  // AI Recommendations
  async getRecommendationsByUser(userId: string, includeProcessed: boolean = false): Promise<AiRecommendation[]> {
    if (includeProcessed) {
      return db.select().from(aiRecommendations)
        .where(eq(aiRecommendations.userId, userId))
        .orderBy(desc(aiRecommendations.createdAt));
    }
    return db.select().from(aiRecommendations)
      .where(and(
        eq(aiRecommendations.userId, userId),
        eq(aiRecommendations.isDismissed, false),
        isNull(aiRecommendations.isAccepted)
      ))
      .orderBy(desc(aiRecommendations.confidence));
  }

  async createRecommendation(rec: InsertAiRecommendation): Promise<AiRecommendation> {
    const [newRec] = await db.insert(aiRecommendations).values(rec).returning();
    return newRec;
  }

  async updateRecommendation(id: number, updates: Partial<InsertAiRecommendation>): Promise<AiRecommendation | undefined> {
    const [updated] = await db.update(aiRecommendations)
      .set(updates)
      .where(eq(aiRecommendations.id, id))
      .returning();
    return updated;
  }

  // Dashboard Stats
  async getDashboardStats(userId: string, role: UserRole, tenantId: string = 'default'): Promise<DashboardStats> {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // Get user's enrollments
    const userEnrollments = await this.getEnrollmentsByUser(userId);
    const activeEnrollments = userEnrollments.filter(e => e.status === 'active');
    const completedEnrollments = userEnrollments.filter(e => e.status === 'completed' || e.completedAt);
    const expiringEnrollments = activeEnrollments.filter(e =>
      e.expiresAt && e.expiresAt <= thirtyDaysFromNow && e.expiresAt >= now
    );

    // Get user's renewal requests
    const userRenewals = await this.getRenewalRequestsByUser(userId);
    const pendingRenewals = userRenewals.filter(r =>
      r.status === 'pending' || r.status === 'foreman_approved'
    );

    // Get pending approvals if user is foreman or manager
    let pendingApprovals = 0;
    if (role === 'foreman' || role === 'manager') {
      const approvals = await this.getPendingApprovals(userId, role);
      pendingApprovals = approvals.length;
    }

    // Get unread notifications
    const unreadNotifs = await this.getNotificationsByUser(userId, true);

    // Get progression tasks
    const tasks = await this.getProgressionTasksByUser(userId);
    const completedTasks = tasks.filter(t => t.status === 'completed');

    return {
      totalCourses: activeEnrollments.length,
      completedCourses: completedEnrollments.length,
      expiringCourses: expiringEnrollments.length,
      pendingRenewals: pendingRenewals.length,
      pendingApprovals,
      unreadNotifications: unreadNotifs.length,
      progressionTasks: tasks.length,
      completedProgressionTasks: completedTasks.length,
    };
  }
}

export const storage = new DatabaseStorage();
