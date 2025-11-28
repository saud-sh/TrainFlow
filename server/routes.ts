import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertCourseSchema, insertEnrollmentSchema, insertRenewalRequestSchema,
  insertProgressionTaskSchema, insertDepartmentSchema, insertNotificationSchema,
  type UserRole, type User
} from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import { runManualExpirationCheck } from "./worker";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Role-based access control middleware
function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// Helper to create audit log
async function auditLog(
  userId: string | null,
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'approve' | 'reject' | 'submit',
  entityType: string,
  entityId: string | null,
  oldValues?: unknown,
  newValues?: unknown,
  req?: Request
) {
  await storage.createAuditLog({
    userId,
    action,
    entityType,
    entityId,
    oldValues: oldValues || null,
    newValues: newValues || null,
    ipAddress: req?.ip || null,
    userAgent: req?.get('user-agent') || null,
    tenantId: 'default',
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // =====================
  // AUTH ROUTES
  // =====================
  app.get("/api/auth/user", isAuthenticated, async (req: Request, res: Response) => {
    res.json(req.user);
  });

  // =====================
  // DASHBOARD ROUTES
  // =====================
  app.get("/api/dashboard/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats(
        req.user!.id,
        req.user!.role,
        req.user!.tenantId || 'default'
      );
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // =====================
  // USER ROUTES
  // =====================
  app.get("/api/users", isAuthenticated, requireRole('administrator', 'training_officer'), async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers(req.user!.tenantId || 'default');
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, requireRole('administrator'), async (req: Request, res: Response) => {
    try {
      const oldUser = await storage.getUser(req.params.id);
      const updated = await storage.updateUser(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      await auditLog(req.user!.id, 'update', 'user', req.params.id, oldUser, updated, req);
      res.json(updated);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // =====================
  // DEPARTMENT ROUTES
  // =====================
  app.get("/api/departments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const departments = await storage.getAllDepartments(req.user!.tenantId || 'default');
      res.json(departments);
    } catch (error) {
      console.error("Get departments error:", error);
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", isAuthenticated, requireRole('administrator'), async (req: Request, res: Response) => {
    try {
      const data = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment({
        ...data,
        tenantId: req.user!.tenantId || 'default',
      });
      await auditLog(req.user!.id, 'create', 'department', String(department.id), null, department, req);
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create department error:", error);
      res.status(500).json({ error: "Failed to create department" });
    }
  });

  // =====================
  // COURSE ROUTES
  // =====================
  app.get("/api/courses", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { category, activeOnly } = req.query;
      let courseList;
      if (category && typeof category === 'string') {
        courseList = await storage.getCoursesByCategory(category, req.user!.tenantId || 'default');
      } else if (activeOnly === 'true') {
        courseList = await storage.getActiveCourses(req.user!.tenantId || 'default');
      } else {
        courseList = await storage.getAllCourses(req.user!.tenantId || 'default');
      }
      res.json(courseList);
    } catch (error) {
      console.error("Get courses error:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const course = await storage.getCourse(parseInt(req.params.id));
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Get course error:", error);
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", isAuthenticated, requireRole('administrator', 'training_officer'), async (req: Request, res: Response) => {
    try {
      const data = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse({
        ...data,
        tenantId: req.user!.tenantId || 'default',
      });
      await auditLog(req.user!.id, 'create', 'course', String(course.id), null, course, req);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create course error:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  app.patch("/api/courses/:id", isAuthenticated, requireRole('administrator', 'training_officer'), async (req: Request, res: Response) => {
    try {
      const oldCourse = await storage.getCourse(parseInt(req.params.id));
      const updated = await storage.updateCourse(parseInt(req.params.id), req.body);
      if (!updated) {
        return res.status(404).json({ error: "Course not found" });
      }
      await auditLog(req.user!.id, 'update', 'course', req.params.id, oldCourse, updated, req);
      res.json(updated);
    } catch (error) {
      console.error("Update course error:", error);
      res.status(500).json({ error: "Failed to update course" });
    }
  });

  // =====================
  // ENROLLMENT ROUTES
  // =====================
  app.get("/api/enrollments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { userId, courseId, expiring } = req.query;
      let enrollmentList;
      
      if (userId && typeof userId === 'string') {
        enrollmentList = await storage.getEnrollmentsByUser(userId);
      } else if (courseId) {
        enrollmentList = await storage.getEnrollmentsByCourse(parseInt(courseId as string));
      } else if (expiring) {
        enrollmentList = await storage.getExpiringEnrollments(parseInt(expiring as string) || 30, req.user!.tenantId || 'default');
      } else if (req.user!.role === 'administrator' || req.user!.role === 'training_officer') {
        enrollmentList = await storage.getAllEnrollments(req.user!.tenantId || 'default');
      } else {
        enrollmentList = await storage.getEnrollmentsByUser(req.user!.id);
      }
      res.json(enrollmentList);
    } catch (error) {
      console.error("Get enrollments error:", error);
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.get("/api/enrollments/my", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const enrollments = await storage.getEnrollmentsByUser(req.user!.id);
      // Join with course data
      const enriched = await Promise.all(enrollments.map(async (e) => {
        const course = await storage.getCourse(e.courseId);
        return { ...e, course };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Get my enrollments error:", error);
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", isAuthenticated, requireRole('administrator', 'training_officer', 'manager'), async (req: Request, res: Response) => {
    try {
      const data = insertEnrollmentSchema.parse(req.body);
      
      // Calculate expiry date based on course validity
      const course = await storage.getCourse(data.courseId);
      if (!course) {
        return res.status(400).json({ error: "Course not found" });
      }
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + course.validityPeriodDays);
      
      const enrollment = await storage.createEnrollment({
        ...data,
        expiresAt,
        tenantId: req.user!.tenantId || 'default',
      });
      await auditLog(req.user!.id, 'create', 'enrollment', String(enrollment.id), null, enrollment, req);
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create enrollment error:", error);
      res.status(500).json({ error: "Failed to create enrollment" });
    }
  });

  app.patch("/api/enrollments/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const oldEnrollment = await storage.getEnrollment(parseInt(req.params.id));
      const updated = await storage.updateEnrollment(parseInt(req.params.id), req.body);
      if (!updated) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      await auditLog(req.user!.id, 'update', 'enrollment', req.params.id, oldEnrollment, updated, req);
      res.json(updated);
    } catch (error) {
      console.error("Update enrollment error:", error);
      res.status(500).json({ error: "Failed to update enrollment" });
    }
  });

  // =====================
  // RENEWAL REQUEST ROUTES
  // =====================
  app.get("/api/renewals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      let renewals;
      
      if (req.user!.role === 'administrator' || req.user!.role === 'training_officer') {
        renewals = await storage.getAllRenewalRequests(req.user!.tenantId || 'default');
      } else {
        renewals = await storage.getRenewalRequestsByUser(req.user!.id);
      }
      
      if (status && typeof status === 'string') {
        renewals = renewals.filter(r => r.status === status);
      }
      
      res.json(renewals);
    } catch (error) {
      console.error("Get renewals error:", error);
      res.status(500).json({ error: "Failed to fetch renewals" });
    }
  });

  app.get("/api/renewals/my", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const renewals = await storage.getRenewalRequestsByUser(req.user!.id);
      // Enrich with enrollment (including course), requester, foreman, manager data
      const enriched = await Promise.all(renewals.map(async (r) => {
        const enrollment = await storage.getEnrollment(r.enrollmentId);
        const course = enrollment ? await storage.getCourse(enrollment.courseId) : null;
        const requester = await storage.getUser(r.requestedBy);
        const foreman = r.foremanId ? await storage.getUser(r.foremanId) : null;
        const manager = r.managerId ? await storage.getUser(r.managerId) : null;
        return { 
          ...r, 
          enrollment: enrollment ? { ...enrollment, course } : null,
          requester,
          foreman,
          manager,
        };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Get my renewals error:", error);
      res.status(500).json({ error: "Failed to fetch renewals" });
    }
  });

  app.get("/api/renewals/pending", isAuthenticated, requireRole('foreman', 'manager'), async (req: Request, res: Response) => {
    try {
      const approvals = await storage.getPendingApprovals(req.user!.id, req.user!.role);
      // Enrich with enrollment (including course), requester, foreman, manager data
      const enriched = await Promise.all(approvals.map(async (r) => {
        const enrollment = await storage.getEnrollment(r.enrollmentId);
        const course = enrollment ? await storage.getCourse(enrollment.courseId) : null;
        const requester = await storage.getUser(r.requestedBy);
        const foreman = r.foremanId ? await storage.getUser(r.foremanId) : null;
        const manager = r.managerId ? await storage.getUser(r.managerId) : null;
        return { 
          ...r, 
          enrollment: enrollment ? { ...enrollment, course } : null,
          requester,
          foreman,
          manager,
        };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Get pending approvals error:", error);
      res.status(500).json({ error: "Failed to fetch pending approvals" });
    }
  });

  app.post("/api/renewals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const data = insertRenewalRequestSchema.parse(req.body);
      const renewal = await storage.createRenewalRequest({
        ...data,
        requestedBy: req.user!.id,
        tenantId: req.user!.tenantId || 'default',
      });
      await auditLog(req.user!.id, 'submit', 'renewal_request', String(renewal.id), null, renewal, req);
      
      // Notify foremen about new renewal request
      const foremen = await storage.getUsersByRole('foreman', req.user!.tenantId || 'default');
      for (const foreman of foremen) {
        await storage.createNotification({
          userId: foreman.id,
          type: 'renewal_request',
          title: 'New Renewal Request',
          message: `${req.user!.firstName} ${req.user!.lastName} submitted a training renewal request`,
          relatedEntityType: 'renewal_request',
          relatedEntityId: renewal.id,
          tenantId: req.user!.tenantId || 'default',
        });
      }
      
      res.status(201).json(renewal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create renewal error:", error);
      res.status(500).json({ error: "Failed to create renewal request" });
    }
  });

  app.post("/api/renewals/:id/approve", isAuthenticated, requireRole('foreman', 'manager'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const renewal = await storage.getRenewalRequest(id);
      if (!renewal) {
        return res.status(404).json({ error: "Renewal request not found" });
      }

      const { comments } = req.body;
      let updates: Partial<typeof renewal> = {};
      let newStatus: string;

      if (req.user!.role === 'foreman' && renewal.status === 'pending') {
        updates = {
          status: 'foreman_approved',
          foremanId: req.user!.id,
          foremanApprovedAt: new Date(),
          foremanComments: comments || null,
        };
        newStatus = 'foreman_approved';
        
        // Notify managers
        const managers = await storage.getUsersByRole('manager', req.user!.tenantId || 'default');
        for (const manager of managers) {
          await storage.createNotification({
            userId: manager.id,
            type: 'approval_needed',
            title: 'Renewal Awaiting Manager Approval',
            message: `A training renewal request has been approved by foreman and needs your review`,
            relatedEntityType: 'renewal_request',
            relatedEntityId: id,
            tenantId: req.user!.tenantId || 'default',
          });
        }
      } else if (req.user!.role === 'manager' && renewal.status === 'foreman_approved') {
        updates = {
          status: 'manager_approved',
          managerId: req.user!.id,
          managerApprovedAt: new Date(),
          managerComments: comments || null,
        };
        newStatus = 'manager_approved';
        
        // Update enrollment status and extend expiry
        const enrollment = await storage.getEnrollment(renewal.enrollmentId);
        if (enrollment) {
          const course = await storage.getCourse(enrollment.courseId);
          const newExpiresAt = new Date();
          newExpiresAt.setDate(newExpiresAt.getDate() + (course?.validityPeriodDays || 365));
          await storage.updateEnrollment(enrollment.id, {
            status: 'active',
            expiresAt: newExpiresAt,
          });
        }
        
        // Notify requester
        await storage.createNotification({
          userId: renewal.requestedBy,
          type: 'system',
          title: 'Renewal Request Approved',
          message: `Your training renewal request has been fully approved`,
          relatedEntityType: 'renewal_request',
          relatedEntityId: id,
          tenantId: req.user!.tenantId || 'default',
        });
      } else {
        return res.status(400).json({ error: "Cannot approve this request in its current state" });
      }

      const updated = await storage.updateRenewalRequest(id, updates as any);
      await auditLog(req.user!.id, 'approve', 'renewal_request', String(id), renewal, updated, req);
      res.json(updated);
    } catch (error) {
      console.error("Approve renewal error:", error);
      res.status(500).json({ error: "Failed to approve renewal" });
    }
  });

  app.post("/api/renewals/:id/reject", isAuthenticated, requireRole('foreman', 'manager'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const renewal = await storage.getRenewalRequest(id);
      if (!renewal) {
        return res.status(404).json({ error: "Renewal request not found" });
      }

      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ error: "Rejection reason is required" });
      }

      const updated = await storage.updateRenewalRequest(id, {
        status: 'rejected',
        rejectedBy: req.user!.id,
        rejectedAt: new Date(),
        rejectionReason: reason,
      });
      await auditLog(req.user!.id, 'reject', 'renewal_request', String(id), renewal, updated, req);
      
      // Notify requester
      await storage.createNotification({
        userId: renewal.requestedBy,
        type: 'system',
        title: 'Renewal Request Rejected',
        message: `Your training renewal request was rejected: ${reason}`,
        relatedEntityType: 'renewal_request',
        relatedEntityId: id,
        tenantId: req.user!.tenantId || 'default',
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Reject renewal error:", error);
      res.status(500).json({ error: "Failed to reject renewal" });
    }
  });

  // =====================
  // NOTIFICATION ROUTES
  // =====================
  app.get("/api/notifications", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { unread } = req.query;
      const notifications = await storage.getNotificationsByUser(req.user!.id, unread === 'true');
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.markNotificationRead(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/read-all", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.markAllNotificationsRead(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // =====================
  // PROGRESSION TASK ROUTES
  // =====================
  app.get("/api/progression", isAuthenticated, async (req: Request, res: Response) => {
    try {
      let tasks;
      if (req.user!.role === 'administrator' || req.user!.role === 'training_officer') {
        tasks = await storage.getAllProgressionTasks(req.user!.tenantId || 'default');
      } else {
        tasks = await storage.getProgressionTasksByUser(req.user!.id);
      }
      
      // Enrich with course data
      const enriched = await Promise.all(tasks.map(async (t) => {
        const course = t.requiredCourseId ? await storage.getCourse(t.requiredCourseId) : null;
        const user = await storage.getUser(t.userId);
        return { ...t, course, user };
      }));
      
      res.json(enriched);
    } catch (error) {
      console.error("Get progression tasks error:", error);
      res.status(500).json({ error: "Failed to fetch progression tasks" });
    }
  });

  app.post("/api/progression", isAuthenticated, requireRole('administrator', 'training_officer', 'manager'), async (req: Request, res: Response) => {
    try {
      const data = insertProgressionTaskSchema.parse(req.body);
      const task = await storage.createProgressionTask({
        ...data,
        assignedBy: req.user!.id,
        tenantId: req.user!.tenantId || 'default',
      });
      await auditLog(req.user!.id, 'create', 'progression_task', String(task.id), null, task, req);
      
      // Notify the employee
      await storage.createNotification({
        userId: task.userId,
        type: 'system',
        title: 'New Progression Task Assigned',
        message: `You have been assigned a new progression task: ${task.title}`,
        relatedEntityType: 'progression_task',
        relatedEntityId: task.id,
        tenantId: req.user!.tenantId || 'default',
      });
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create progression task error:", error);
      res.status(500).json({ error: "Failed to create progression task" });
    }
  });

  app.patch("/api/progression/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const oldTask = await storage.getProgressionTask(parseInt(req.params.id));
      const updated = await storage.updateProgressionTask(parseInt(req.params.id), req.body);
      if (!updated) {
        return res.status(404).json({ error: "Progression task not found" });
      }
      await auditLog(req.user!.id, 'update', 'progression_task', req.params.id, oldTask, updated, req);
      res.json(updated);
    } catch (error) {
      console.error("Update progression task error:", error);
      res.status(500).json({ error: "Failed to update progression task" });
    }
  });

  // =====================
  // AUDIT LOG ROUTES
  // =====================
  app.get("/api/audit-logs", isAuthenticated, requireRole('administrator'), async (req: Request, res: Response) => {
    try {
      const { limit, userId, entityType, entityId } = req.query;
      let logs;
      
      if (userId && typeof userId === 'string') {
        logs = await storage.getAuditLogsByUser(userId, parseInt(limit as string) || 50);
      } else if (entityType && entityId && typeof entityType === 'string' && typeof entityId === 'string') {
        logs = await storage.getAuditLogsByEntity(entityType, entityId);
      } else {
        logs = await storage.getAuditLogs(req.user!.tenantId || 'default', parseInt(limit as string) || 100);
      }
      
      // Enrich with user data
      const enriched = await Promise.all(logs.map(async (log) => {
        const user = log.userId ? await storage.getUser(log.userId) : null;
        return { ...log, user };
      }));
      
      res.json(enriched);
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // =====================
  // AI RECOMMENDATION ROUTES
  // =====================
  app.get("/api/recommendations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { includeProcessed } = req.query;
      const recommendations = await storage.getRecommendationsByUser(
        req.user!.id,
        includeProcessed === 'true'
      );
      
      // Enrich with course data
      const enriched = await Promise.all(recommendations.map(async (r) => {
        const course = await storage.getCourse(r.courseId);
        return { ...r, course };
      }));
      
      res.json(enriched);
    } catch (error) {
      console.error("Get recommendations error:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  app.post("/api/recommendations/generate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get user's current enrollments and progression
      const enrollments = await storage.getEnrollmentsByUser(req.user!.id);
      const progressionTasks = await storage.getProgressionTasksByUser(req.user!.id);
      const allCourses = await storage.getActiveCourses(req.user!.tenantId || 'default');
      
      // Get enrolled course IDs
      const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));
      
      // Filter to courses not yet enrolled
      const availableCourses = allCourses.filter(c => !enrolledCourseIds.has(c.id));
      
      if (availableCourses.length === 0) {
        return res.json({ message: "You are already enrolled in all available courses!" });
      }

      // Use OpenAI to generate personalized recommendations
      const openai = new OpenAI();
      
      const prompt = `You are an AI career development advisor for an enterprise training platform. 
      
      Employee Profile:
      - Name: ${req.user!.firstName} ${req.user!.lastName}
      - Current Role: ${req.user!.role}
      - Current Grade: ${req.user!.currentGrade || 'Not specified'}
      - Job Title: ${req.user!.jobTitle || 'Not specified'}
      
      Current Enrollments: ${enrollments.map(e => e.courseId).join(', ')}
      
      Progression Goals: ${progressionTasks.map(t => t.targetGrade).join(', ') || 'None specified'}
      
      Available Courses:
      ${availableCourses.map(c => `- ID: ${c.id}, Title: ${c.title}, Category: ${c.category}, Mandatory: ${c.isMandatory}, Duration: ${c.duration || 'N/A'}`).join('\n')}
      
      Based on the employee's profile and goals, recommend up to 3 courses that would be most beneficial for their career development. For each recommendation, explain WHY this course is valuable for them.
      
      Respond in JSON format:
      {
        "recommendations": [
          {"courseId": <number>, "reason": "<explanation>", "confidence": <0-100>}
        ]
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const parsed = JSON.parse(content);
      const recommendations = parsed.recommendations || [];
      
      // Save recommendations to database
      const saved = await Promise.all(recommendations.map(async (rec: { courseId: number; reason: string; confidence: number }) => {
        return storage.createRecommendation({
          userId: req.user!.id,
          courseId: rec.courseId,
          reason: rec.reason,
          confidence: rec.confidence,
          tenantId: req.user!.tenantId || 'default',
        });
      }));
      
      // Enrich with course data
      const enriched = await Promise.all(saved.map(async (r) => {
        const course = await storage.getCourse(r.courseId);
        return { ...r, course };
      }));
      
      res.json(enriched);
    } catch (error) {
      console.error("Generate recommendations error:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  app.post("/api/recommendations/:id/accept", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateRecommendation(parseInt(req.params.id), {
        isAccepted: true,
      });
      if (!updated) {
        return res.status(404).json({ error: "Recommendation not found" });
      }
      
      // Create enrollment for the accepted recommendation
      const course = await storage.getCourse(updated.courseId);
      if (course) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + course.validityPeriodDays);
        
        await storage.createEnrollment({
          userId: req.user!.id,
          courseId: course.id,
          expiresAt,
          status: 'active',
          tenantId: req.user!.tenantId || 'default',
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Accept recommendation error:", error);
      res.status(500).json({ error: "Failed to accept recommendation" });
    }
  });

  app.post("/api/recommendations/:id/dismiss", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateRecommendation(parseInt(req.params.id), {
        isDismissed: true,
      });
      if (!updated) {
        return res.status(404).json({ error: "Recommendation not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Dismiss recommendation error:", error);
      res.status(500).json({ error: "Failed to dismiss recommendation" });
    }
  });

  // =====================
  // REPORTS ROUTES
  // =====================
  app.get("/api/reports/stats", isAuthenticated, requireRole('administrator', 'training_officer', 'manager'), async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers(req.user!.tenantId || 'default');
      const courses = await storage.getAllCourses(req.user!.tenantId || 'default');
      const enrollments = await storage.getAllEnrollments(req.user!.tenantId || 'default');
      const renewals = await storage.getAllRenewalRequests(req.user!.tenantId || 'default');
      const departments = await storage.getAllDepartments(req.user!.tenantId || 'default');
      
      const now = new Date();
      const thirtyDaysFromNow = new Date(now);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const activeEnrollments = enrollments.filter(e => 
        e.status === 'active' && e.expiresAt && new Date(e.expiresAt) > now
      );
      const expiringEnrollments = enrollments.filter(e => 
        e.status === 'active' && e.expiresAt && 
        new Date(e.expiresAt) > now && new Date(e.expiresAt) <= thirtyDaysFromNow
      );
      const expiredEnrollments = enrollments.filter(e => 
        e.expiresAt && new Date(e.expiresAt) <= now
      );
      
      // Calculate compliance rate (employees with all mandatory courses active)
      const mandatoryCourses = courses.filter(c => c.isMandatory && c.isActive);
      const employees = users.filter(u => u.role === 'employee');
      let compliantCount = 0;
      
      for (const emp of employees) {
        const empEnrollments = activeEnrollments.filter(e => e.userId === emp.id);
        const hasAllMandatory = mandatoryCourses.every(mc => 
          empEnrollments.some(e => e.courseId === mc.id)
        );
        if (hasAllMandatory || mandatoryCourses.length === 0) compliantCount++;
      }
      
      const complianceRate = employees.length > 0 
        ? Math.round((compliantCount / employees.length) * 100) 
        : 100;
      
      // Calculate pending renewals
      const pendingRenewals = renewals.filter(r => 
        r.status === 'pending' || r.status === 'foreman_approved'
      ).length;
      
      // Approved this month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const approvedThisMonth = renewals.filter(r => 
        (r.status === 'manager_approved' || r.status === 'completed') && 
        r.managerApprovedAt && new Date(r.managerApprovedAt) >= startOfMonth
      ).length;
      
      // Department stats
      const departmentStats = await Promise.all(departments.map(async (dept) => {
        const deptUsers = users.filter(u => u.departmentId === dept.id);
        const deptEnrollments = activeEnrollments.filter(e => 
          deptUsers.some(u => u.id === e.userId)
        );
        
        let deptCompliant = 0;
        for (const u of deptUsers) {
          const uEnrollments = activeEnrollments.filter(e => e.userId === u.id);
          const hasAllMandatory = mandatoryCourses.every(mc => 
            uEnrollments.some(e => e.courseId === mc.id)
          );
          if (hasAllMandatory || mandatoryCourses.length === 0) deptCompliant++;
        }
        
        return {
          name: dept.name,
          employees: deptUsers.length,
          compliance: deptUsers.length > 0 
            ? Math.round((deptCompliant / deptUsers.length) * 100) 
            : 100,
        };
      }));
      
      res.json({
        totalEmployees: employees.length,
        totalCourses: courses.filter(c => c.isActive).length,
        totalEnrollments: enrollments.length,
        activeEnrollments: activeEnrollments.length,
        expiringEnrollments: expiringEnrollments.length,
        expiredEnrollments: expiredEnrollments.length,
        complianceRate,
        pendingRenewals,
        approvedThisMonth,
        departmentStats,
      });
    } catch (error) {
      console.error("Get report stats error:", error);
      res.status(500).json({ error: "Failed to generate report stats" });
    }
  });

  app.get("/api/reports/expiring-courses", isAuthenticated, requireRole('administrator', 'training_officer', 'manager'), async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const expiring = await storage.getExpiringEnrollments(days, req.user!.tenantId || 'default');
      
      // Enrich with user and course data
      const enriched = await Promise.all(expiring.map(async (e) => {
        const user = await storage.getUser(e.userId);
        const course = await storage.getCourse(e.courseId);
        return { ...e, user, course };
      }));
      
      res.json(enriched);
    } catch (error) {
      console.error("Get expiring courses report error:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get("/api/reports/compliance", isAuthenticated, requireRole('administrator', 'training_officer'), async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers(req.user!.tenantId || 'default');
      const allEnrollments = await storage.getAllEnrollments(req.user!.tenantId || 'default');
      const mandatoryCourses = (await storage.getAllCourses(req.user!.tenantId || 'default'))
        .filter(c => c.isMandatory && c.isActive);
      
      const now = new Date();
      
      const compliance = users.map(user => {
        const userEnrollments = allEnrollments.filter(e => e.userId === user.id);
        const activeEnrollments = userEnrollments.filter(e => 
          e.status === 'active' && e.expiresAt && e.expiresAt > now
        );
        const completedMandatory = mandatoryCourses.filter(mc => 
          activeEnrollments.some(e => e.courseId === mc.id)
        );
        
        return {
          user,
          totalMandatory: mandatoryCourses.length,
          completedMandatory: completedMandatory.length,
          complianceRate: mandatoryCourses.length > 0 
            ? Math.round((completedMandatory.length / mandatoryCourses.length) * 100) 
            : 100,
          activeEnrollments: activeEnrollments.length,
        };
      });
      
      res.json(compliance);
    } catch (error) {
      console.error("Get compliance report error:", error);
      res.status(500).json({ error: "Failed to generate compliance report" });
    }
  });

  app.get("/api/reports/renewal-stats", isAuthenticated, requireRole('administrator', 'training_officer'), async (req: Request, res: Response) => {
    try {
      const renewals = await storage.getAllRenewalRequests(req.user!.tenantId || 'default');
      
      const stats = {
        total: renewals.length,
        pending: renewals.filter(r => r.status === 'pending').length,
        foremanApproved: renewals.filter(r => r.status === 'foreman_approved').length,
        managerApproved: renewals.filter(r => r.status === 'manager_approved').length,
        rejected: renewals.filter(r => r.status === 'rejected').length,
        completed: renewals.filter(r => r.status === 'completed').length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Get renewal stats error:", error);
      res.status(500).json({ error: "Failed to generate renewal stats" });
    }
  });

  // =====================
  // ADMIN WORKER ROUTES
  // =====================
  app.post("/api/admin/run-expiration-check", isAuthenticated, requireRole('administrator'), async (req: Request, res: Response) => {
    try {
      const result = await runManualExpirationCheck();
      await auditLog(req.user!.id, 'create', 'expiration_check', 'manual', null, result, req);
      res.json({
        success: true,
        message: 'Expiration check completed',
        ...result,
      });
    } catch (error) {
      console.error("Manual expiration check error:", error);
      res.status(500).json({ error: "Failed to run expiration check" });
    }
  });

  // =====================
  // SEED DATA ROUTE (for development)
  // =====================
  app.post("/api/seed", isAuthenticated, requireRole('administrator'), async (req: Request, res: Response) => {
    try {
      // Create departments
      const engineering = await storage.createDepartment({
        name: 'Engineering',
        code: 'ENG',
        tenantId: 'default',
      });
      
      const operations = await storage.createDepartment({
        name: 'Operations',
        code: 'OPS',
        tenantId: 'default',
      });
      
      // Create courses
      const courses = [
        { title: 'Workplace Safety Fundamentals', category: 'Safety', validityPeriodDays: 365, isMandatory: true, duration: '4 hours', provider: 'Internal' },
        { title: 'Fire Safety & Emergency Response', category: 'Safety', validityPeriodDays: 365, isMandatory: true, duration: '2 hours', provider: 'Internal' },
        { title: 'First Aid & CPR', category: 'Safety', validityPeriodDays: 730, isMandatory: false, duration: '8 hours', provider: 'Red Cross' },
        { title: 'Forklift Operation Certification', category: 'Equipment', validityPeriodDays: 1095, isMandatory: false, duration: '16 hours', provider: 'OSHA' },
        { title: 'Leadership Development', category: 'Professional', validityPeriodDays: 730, isMandatory: false, duration: '24 hours', provider: 'Internal' },
        { title: 'Project Management Basics', category: 'Professional', validityPeriodDays: 1095, isMandatory: false, duration: '40 hours', provider: 'PMI' },
        { title: 'Data Privacy & Security', category: 'Compliance', validityPeriodDays: 365, isMandatory: true, duration: '3 hours', provider: 'Internal' },
        { title: 'Anti-Harassment Training', category: 'Compliance', validityPeriodDays: 365, isMandatory: true, duration: '2 hours', provider: 'HR' },
      ];
      
      for (const course of courses) {
        await storage.createCourse({
          ...course,
          tenantId: 'default',
          isActive: true,
        });
      }
      
      await auditLog(req.user!.id, 'create', 'seed_data', 'all', null, { departments: 2, courses: courses.length }, req);
      
      res.json({ 
        success: true, 
        message: 'Seed data created successfully',
        departments: 2,
        courses: courses.length,
      });
    } catch (error) {
      console.error("Seed data error:", error);
      res.status(500).json({ error: "Failed to seed data" });
    }
  });

  return httpServer;
}
