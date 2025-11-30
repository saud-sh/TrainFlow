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
import bcrypt from "bcryptjs";
import {
  generateTrainingComplianceData, generateTrainingCompliancePDF, generateTrainingComplianceExcel,
  generateEmployeeProgressData, generateEmployeeProgressPDF, generateEmployeeProgressExcel,
  generateDepartmentStatsData, generateDepartmentStatsPDF, generateDepartmentStatsExcel,
  generateJSONExport, verifyDepartmentTenant
} from "./reports";

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

// Helper function to determine next grade level
function getNextGrade(currentGrade: string): string {
  const gradeProgression: Record<string, string> = {
    'G1': 'G2',
    'G2': 'G3',
    'G3': 'G4',
    'G4': 'G5',
    'G5': 'G6',
    'G6': 'G7',
    'G7': 'G8',
    'G8': 'G9',
    'G9': 'G10',
    'G10': 'G11',
    'G11': 'G12',
    'G12': 'Senior',
    'Senior': 'Principal',
    'Principal': 'Executive',
    'Executive': 'Executive',
  };
  return gradeProgression[currentGrade] || 'G2';
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
  app.post("/api/v1/users/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ detail: "Email and password required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ detail: "Invalid email or password" });
      }
      
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ detail: "Invalid email or password" });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ detail: "User account is inactive" });
      }
      
      // Log the login
      await auditLog(user.id, 'login', 'user', user.id, null, null, req);
      
      // Store user in session
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ detail: "Login failed" });
        }
        
        res.json({
          role: user.role,
          email: user.email,
          user_id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ detail: "Login failed" });
    }
  });

  app.get("/api/v1/users/me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ detail: "Unauthorized" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(401).json({ detail: "User not found" });
      }
      
      res.json({
        id: user.id,
        role: user.role,
        email: user.email,
        user_id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        tenant_id: user.tenantId,
        department_id: user.departmentId,
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ detail: "Failed to fetch user" });
    }
  });

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
  // AI GRADE READINESS PREDICTOR
  // =====================
  
  app.post("/api/ai/grade-readiness", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const tenantId = user.tenantId || 'default';
      
      // Gather comprehensive employee data
      const enrollments = await storage.getEnrollmentsByUser(user.id);
      const progressionTasks = await storage.getProgressionTasksByUser(user.id);
      const allCourses = await storage.getActiveCourses(tenantId);
      const department = user.departmentId ? await storage.getDepartment(user.departmentId) : null;
      
      // Calculate training metrics
      const now = new Date();
      const completedEnrollments = enrollments.filter(e => e.status === 'completed' || 
        (e.status === 'active' && e.completedAt));
      const activeEnrollments = enrollments.filter(e => e.status === 'active' && !e.completedAt);
      const expiredEnrollments = enrollments.filter(e => e.expiresAt && new Date(e.expiresAt) < now);
      
      // Calculate progression metrics
      const completedTasks = progressionTasks.filter(t => t.status === 'completed');
      const inProgressTasks = progressionTasks.filter(t => t.status === 'in_progress');
      const pendingTasks = progressionTasks.filter(t => t.status === 'not_started');
      const overdueTasks = progressionTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
      );
      
      // Get mandatory courses compliance
      const mandatoryCourses = allCourses.filter(c => c.isMandatory);
      const mandatoryCompleted = mandatoryCourses.filter(mc => 
        enrollments.some(e => e.courseId === mc.id && 
          (e.status === 'completed' || (e.status === 'active' && (!e.expiresAt || new Date(e.expiresAt) > now)))
        )
      );
      
      // Determine target grade (from progression tasks or next logical grade)
      const targetGrades = [...new Set(progressionTasks.map(t => t.targetGrade))];
      const primaryTargetGrade = targetGrades[0] || getNextGrade(user.currentGrade || 'G1');
      
      // Build AI prompt
      const openai = new OpenAI();
      
      const prompt = `You are an AI career development analyst for an enterprise training platform. Analyze the following employee data and provide a comprehensive grade readiness prediction.

EMPLOYEE PROFILE:
- Name: ${user.firstName} ${user.lastName}
- Current Grade: ${user.currentGrade || 'Not specified'}
- Target Grade: ${primaryTargetGrade}
- Job Title: ${user.jobTitle || 'Not specified'}
- Department: ${department?.name || 'Not assigned'}
- Role: ${user.role}

TRAINING METRICS:
- Total Courses Enrolled: ${enrollments.length}
- Completed Courses: ${completedEnrollments.length}
- Active (In Progress): ${activeEnrollments.length}
- Expired/Overdue: ${expiredEnrollments.length}
- Mandatory Courses Required: ${mandatoryCourses.length}
- Mandatory Courses Completed: ${mandatoryCompleted.length}

PROGRESSION TASK STATUS:
- Total Tasks Assigned: ${progressionTasks.length}
- Completed: ${completedTasks.length}
- In Progress: ${inProgressTasks.length}
- Not Started: ${pendingTasks.length}
- Overdue: ${overdueTasks.length}

TASK DETAILS:
${progressionTasks.map(t => `- ${t.title}: ${t.status} (Target: ${t.targetGrade}, Priority: ${t.priority}${t.dueDate ? ', Due: ' + new Date(t.dueDate).toLocaleDateString() : ''})`).join('\n') || 'No tasks assigned'}

COURSE COMPLETION DETAILS:
${completedEnrollments.slice(0, 10).map(e => {
  const course = allCourses.find(c => c.id === e.courseId);
  return `- ${course?.title || 'Unknown Course'} (${course?.category || 'N/A'})`;
}).join('\n') || 'No completed courses'}

Based on this data, provide a detailed grade readiness assessment. Consider:
1. Training completion rate and compliance
2. Progression task completion
3. Time-based factors (overdue items)
4. Gap analysis for promotion requirements

Respond in JSON format:
{
  "readinessScore": <0-100>,
  "readinessLevel": "<Not Ready|Developing|On Track|Ready|Exceeds Expectations>",
  "estimatedTimeToReady": "<timeframe or 'Ready Now'>",
  "strengths": ["<strength1>", "<strength2>", ...],
  "gaps": ["<gap1>", "<gap2>", ...],
  "recommendations": [
    {"action": "<specific action>", "priority": "<High|Medium|Low>", "impact": "<expected impact>"}
  ],
  "detailedAnalysis": "<2-3 paragraph analysis of employee readiness>",
  "confidenceLevel": <0-100>
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

      const prediction = JSON.parse(content);
      
      // Add metadata to response
      const result = {
        ...prediction,
        employeeId: user.id,
        employeeName: `${user.firstName} ${user.lastName}`,
        currentGrade: user.currentGrade,
        targetGrade: primaryTargetGrade,
        department: department?.name,
        generatedAt: new Date().toISOString(),
        metrics: {
          totalEnrollments: enrollments.length,
          completedCourses: completedEnrollments.length,
          activeCourses: activeEnrollments.length,
          expiredCourses: expiredEnrollments.length,
          mandatoryCompliance: mandatoryCourses.length > 0 
            ? Math.round((mandatoryCompleted.length / mandatoryCourses.length) * 100) 
            : 100,
          totalTasks: progressionTasks.length,
          completedTasks: completedTasks.length,
          taskCompletionRate: progressionTasks.length > 0 
            ? Math.round((completedTasks.length / progressionTasks.length) * 100) 
            : 0,
        }
      };
      
      // Log the prediction for audit
      await storage.createAuditLog({
        userId: user.id,
        action: 'create',
        entityType: 'grade_prediction',
        entityId: user.id,
        newValues: { readinessScore: prediction.readinessScore, targetGrade: primaryTargetGrade },
        tenantId,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Grade readiness prediction error:", error);
      res.status(500).json({ error: "Failed to generate grade readiness prediction" });
    }
  });
  
  // Get grade readiness for a specific employee (managers/admins only)
  app.get("/api/ai/grade-readiness/:userId", isAuthenticated, requireRole('administrator', 'training_officer', 'manager', 'foreman'), async (req: Request, res: Response) => {
    try {
      const targetUserId = req.params.userId;
      const tenantId = req.user!.tenantId || 'default';
      
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser || targetUser.tenantId !== tenantId) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      // Gather comprehensive employee data
      const enrollments = await storage.getEnrollmentsByUser(targetUserId);
      const progressionTasks = await storage.getProgressionTasksByUser(targetUserId);
      const allCourses = await storage.getActiveCourses(tenantId);
      const department = targetUser.departmentId ? await storage.getDepartment(targetUser.departmentId) : null;
      
      // Calculate metrics (same as self-assessment)
      const now = new Date();
      const completedEnrollments = enrollments.filter(e => e.status === 'completed' || 
        (e.status === 'active' && e.completedAt));
      const activeEnrollments = enrollments.filter(e => e.status === 'active' && !e.completedAt);
      const expiredEnrollments = enrollments.filter(e => e.expiresAt && new Date(e.expiresAt) < now);
      
      const completedTasks = progressionTasks.filter(t => t.status === 'completed');
      const inProgressTasks = progressionTasks.filter(t => t.status === 'in_progress');
      const pendingTasks = progressionTasks.filter(t => t.status === 'not_started');
      const overdueTasks = progressionTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
      );
      
      const mandatoryCourses = allCourses.filter(c => c.isMandatory);
      const mandatoryCompleted = mandatoryCourses.filter(mc => 
        enrollments.some(e => e.courseId === mc.id && 
          (e.status === 'completed' || (e.status === 'active' && (!e.expiresAt || new Date(e.expiresAt) > now)))
        )
      );
      
      const targetGrades = [...new Set(progressionTasks.map(t => t.targetGrade))];
      const primaryTargetGrade = targetGrades[0] || getNextGrade(targetUser.currentGrade || 'G1');
      
      const openai = new OpenAI();
      
      const prompt = `You are an AI career development analyst for an enterprise training platform. Analyze the following employee data and provide a comprehensive grade readiness prediction.

EMPLOYEE PROFILE:
- Name: ${targetUser.firstName} ${targetUser.lastName}
- Current Grade: ${targetUser.currentGrade || 'Not specified'}
- Target Grade: ${primaryTargetGrade}
- Job Title: ${targetUser.jobTitle || 'Not specified'}
- Department: ${department?.name || 'Not assigned'}
- Role: ${targetUser.role}

TRAINING METRICS:
- Total Courses Enrolled: ${enrollments.length}
- Completed Courses: ${completedEnrollments.length}
- Active (In Progress): ${activeEnrollments.length}
- Expired/Overdue: ${expiredEnrollments.length}
- Mandatory Courses Required: ${mandatoryCourses.length}
- Mandatory Courses Completed: ${mandatoryCompleted.length}

PROGRESSION TASK STATUS:
- Total Tasks Assigned: ${progressionTasks.length}
- Completed: ${completedTasks.length}
- In Progress: ${inProgressTasks.length}
- Not Started: ${pendingTasks.length}
- Overdue: ${overdueTasks.length}

TASK DETAILS:
${progressionTasks.map(t => `- ${t.title}: ${t.status} (Target: ${t.targetGrade}, Priority: ${t.priority}${t.dueDate ? ', Due: ' + new Date(t.dueDate).toLocaleDateString() : ''})`).join('\n') || 'No tasks assigned'}

Based on this data, provide a detailed grade readiness assessment.

Respond in JSON format:
{
  "readinessScore": <0-100>,
  "readinessLevel": "<Not Ready|Developing|On Track|Ready|Exceeds Expectations>",
  "estimatedTimeToReady": "<timeframe or 'Ready Now'>",
  "strengths": ["<strength1>", "<strength2>", ...],
  "gaps": ["<gap1>", "<gap2>", ...],
  "recommendations": [
    {"action": "<specific action>", "priority": "<High|Medium|Low>", "impact": "<expected impact>"}
  ],
  "detailedAnalysis": "<2-3 paragraph analysis of employee readiness>",
  "confidenceLevel": <0-100>
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

      const prediction = JSON.parse(content);
      
      const result = {
        ...prediction,
        employeeId: targetUser.id,
        employeeName: `${targetUser.firstName} ${targetUser.lastName}`,
        currentGrade: targetUser.currentGrade,
        targetGrade: primaryTargetGrade,
        department: department?.name,
        generatedAt: new Date().toISOString(),
        metrics: {
          totalEnrollments: enrollments.length,
          completedCourses: completedEnrollments.length,
          activeCourses: activeEnrollments.length,
          expiredCourses: expiredEnrollments.length,
          mandatoryCompliance: mandatoryCourses.length > 0 
            ? Math.round((mandatoryCompleted.length / mandatoryCourses.length) * 100) 
            : 100,
          totalTasks: progressionTasks.length,
          completedTasks: completedTasks.length,
          taskCompletionRate: progressionTasks.length > 0 
            ? Math.round((completedTasks.length / progressionTasks.length) * 100) 
            : 0,
        }
      };
      
      res.json(result);
    } catch (error) {
      console.error("Grade readiness prediction error:", error);
      res.status(500).json({ error: "Failed to generate grade readiness prediction" });
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

  app.get("/api/reports/stats", isAuthenticated, requireRole('administrator', 'training_officer', 'manager'), async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId || 'default';
      const users = await storage.getAllUsers(tenantId);
      const enrollments = await storage.getAllEnrollments(tenantId);
      const allCourses = await storage.getAllCourses(tenantId);
      const renewals = await storage.getAllRenewalRequests(tenantId);
      const departments = await storage.getAllDepartments(tenantId);
      
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const employees = users.filter(u => u.role === 'employee' || u.role === 'foreman');
      
      const activeEnrollments = enrollments.filter(e => 
        e.status === 'active' || e.status === 'completed'
      ).length;
      
      const expiringEnrollments = enrollments.filter(e => {
        if (!e.expiresAt) return false;
        const expDate = new Date(e.expiresAt);
        return expDate > now && expDate <= thirtyDaysFromNow;
      }).length;
      
      const expiredEnrollments = enrollments.filter(e => {
        if (!e.expiresAt) return false;
        return new Date(e.expiresAt) < now;
      }).length;
      
      const employeesWithTraining = employees.filter(u => 
        enrollments.some(e => e.userId === u.id)
      );
      
      // Compliant = has training and no expired courses
      const compliantEmployeesCount = employeesWithTraining.filter(u => {
        const userEnrollments = enrollments.filter(e => e.userId === u.id);
        return !userEnrollments.some(e => e.expiresAt && new Date(e.expiresAt) < now);
      }).length;
      
      // Training Compliance Rate: Compliant trained / All trained (excludes untrained employees)
      const trainingComplianceRate = employeesWithTraining.length > 0 
        ? Math.round((compliantEmployeesCount / employeesWithTraining.length) * 100)
        : 0;
      
      // Overall Compliance Rate: Compliant trained / ALL employees (untrained count as non-compliant)
      const overallComplianceRate = employees.length > 0 
        ? Math.round((compliantEmployeesCount / employees.length) * 100)
        : 0;
      
      const pendingRenewals = renewals.filter(r => 
        r.status === 'pending' || r.status === 'foreman_approved'
      ).length;
      
      const approvedThisMonth = renewals.filter(r => {
        if (r.status !== 'manager_approved' && r.status !== 'completed') return false;
        if (!r.managerApprovedAt) return false;
        return new Date(r.managerApprovedAt) >= startOfMonth;
      }).length;
      
      const departmentStats = departments.map(dept => {
        const deptUsers = employees.filter(u => u.departmentId === dept.id);
        const deptEnrollments = enrollments.filter(e => 
          deptUsers.some(u => u.id === e.userId)
        );
        const deptExpired = deptEnrollments.filter(e => 
          e.expiresAt && new Date(e.expiresAt) < now
        ).length;
        const deptCompliance = deptEnrollments.length > 0
          ? Math.round(((deptEnrollments.length - deptExpired) / deptEnrollments.length) * 100)
          : 100;
        
        return {
          name: dept.name,
          employees: deptUsers.length,
          compliance: deptCompliance,
        };
      });
      
      res.json({
        totalEmployees: employees.length,
        employeesWithTraining: employeesWithTraining.length,
        employeesWithoutTraining: employees.length - employeesWithTraining.length,
        compliantEmployees: compliantEmployeesCount,
        totalCourses: allCourses.length,
        totalEnrollments: enrollments.length,
        activeEnrollments,
        expiringEnrollments,
        expiredEnrollments,
        complianceRate: trainingComplianceRate,
        trainingComplianceRate,
        overallComplianceRate,
        pendingRenewals,
        approvedThisMonth,
        departmentStats,
      });
    } catch (error) {
      console.error("Get report stats error:", error);
      res.status(500).json({ error: "Failed to generate report stats" });
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
  // REPORT EXPORT ROUTES
  // =====================
  
  // Training Compliance Report
  app.get("/api/reports/export/training-compliance/:format", isAuthenticated, requireRole('administrator', 'training_officer', 'manager'), async (req: Request, res: Response) => {
    try {
      const { format } = req.params;
      const tenantId = req.user!.tenantId || 'default';
      const data = await generateTrainingComplianceData(tenantId);
      
      await auditLog(req.user!.id, 'create', 'report_export', 'training_compliance', null, { format }, req);
      
      if (format === 'pdf') {
        const buffer = await generateTrainingCompliancePDF(data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=training-compliance-report.pdf');
        res.send(buffer);
      } else if (format === 'excel') {
        const buffer = generateTrainingComplianceExcel(data);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=training-compliance-report.xlsx');
        res.send(buffer);
      } else if (format === 'json') {
        const jsonData = generateJSONExport(data);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=training-compliance-report.json');
        res.send(jsonData);
      } else {
        res.status(400).json({ error: 'Invalid format. Use pdf, excel, or json.' });
      }
    } catch (error) {
      console.error("Training compliance export error:", error);
      res.status(500).json({ error: "Failed to generate training compliance report" });
    }
  });
  
  // Employee Progress Report
  app.get("/api/reports/export/employee-progress/:userId/:format", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { userId, format } = req.params;
      const tenantId = req.user!.tenantId || 'default';
      
      const canView = req.user!.id === userId || 
        ['administrator', 'training_officer', 'manager'].includes(req.user!.role);
      
      if (!canView) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      const data = await generateEmployeeProgressData(userId, tenantId);
      if (!data) {
        return res.status(404).json({ error: "Employee not found or not in your tenant" });
      }
      
      await auditLog(req.user!.id, 'create', 'report_export', 'employee_progress', null, { userId, format }, req);
      
      if (format === 'pdf') {
        const buffer = await generateEmployeeProgressPDF(data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=employee-progress-${userId}.pdf`);
        res.send(buffer);
      } else if (format === 'excel') {
        const buffer = generateEmployeeProgressExcel(data);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=employee-progress-${userId}.xlsx`);
        res.send(buffer);
      } else if (format === 'json') {
        const jsonData = generateJSONExport(data);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=employee-progress-${userId}.json`);
        res.send(jsonData);
      } else {
        res.status(400).json({ error: 'Invalid format. Use pdf, excel, or json.' });
      }
    } catch (error) {
      console.error("Employee progress export error:", error);
      res.status(500).json({ error: "Failed to generate employee progress report" });
    }
  });
  
  // Department Statistics Report
  app.get("/api/reports/export/department/:departmentId/:format", isAuthenticated, requireRole('administrator', 'training_officer', 'manager'), async (req: Request, res: Response) => {
    try {
      const { departmentId, format } = req.params;
      const tenantId = req.user!.tenantId || 'default';
      const deptId = parseInt(departmentId, 10);
      
      // Verify department belongs to tenant before generating any data
      const departmentCheck = await verifyDepartmentTenant(deptId, tenantId);
      if (!departmentCheck) {
        return res.status(404).json({ error: "Department not found" });
      }
      
      const data = await generateDepartmentStatsData(deptId, tenantId);
      if (!data) {
        return res.status(404).json({ error: "Department not found or not in your tenant" });
      }
      
      await auditLog(req.user!.id, 'create', 'report_export', 'department_stats', null, { departmentId, format }, req);
      
      if (format === 'pdf') {
        const buffer = await generateDepartmentStatsPDF(data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=department-report-${departmentId}.pdf`);
        res.send(buffer);
      } else if (format === 'excel') {
        const buffer = generateDepartmentStatsExcel(data);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=department-report-${departmentId}.xlsx`);
        res.send(buffer);
      } else if (format === 'json') {
        const jsonData = generateJSONExport(data);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=department-report-${departmentId}.json`);
        res.send(jsonData);
      } else {
        res.status(400).json({ error: 'Invalid format. Use pdf, excel, or json.' });
      }
    } catch (error) {
      console.error("Department stats export error:", error);
      res.status(500).json({ error: "Failed to generate department report" });
    }
  });

  // =====================
  // ADVANCED KPI ENGINE
  // =====================
  
  // Trend Analysis - Historical compliance data
  app.get("/api/kpi/trends", isAuthenticated, requireRole('administrator', 'training_officer', 'manager'), async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId || 'default';
      const { period = '6months' } = req.query;
      
      const enrollments = await storage.getAllEnrollments(tenantId);
      const users = await storage.getAllUsers(tenantId);
      const auditLogs = await storage.getAuditLogs(tenantId, 1000);
      
      const employees = users.filter(u => u.role === 'employee');
      const now = new Date();
      
      // Generate monthly trend data
      const months: { month: string; date: Date }[] = [];
      const monthCount = period === '12months' ? 12 : period === '3months' ? 3 : 6;
      
      for (let i = monthCount - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
          date,
        });
      }
      
      const trends = months.map(({ month, date }) => {
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        // Count enrollments active at end of that month
        const activeAtMonth = enrollments.filter(e => {
          const createdAt = e.createdAt ? new Date(e.createdAt) : new Date();
          const expiresAt = e.expiresAt ? new Date(e.expiresAt) : null;
          return createdAt <= endOfMonth && (!expiresAt || expiresAt > endOfMonth);
        });
        
        // Count expired enrollments at end of month
        const expiredAtMonth = enrollments.filter(e => {
          const expiresAt = e.expiresAt ? new Date(e.expiresAt) : null;
          return expiresAt && expiresAt <= endOfMonth && expiresAt > date;
        });
        
        // Calculate compliance for that month
        const employeesWithActiveTraining = new Set(activeAtMonth.map(e => e.userId));
        const complianceRate = employees.length > 0
          ? Math.round((employeesWithActiveTraining.size / employees.length) * 100)
          : 100;
        
        return {
          month,
          activeEnrollments: activeAtMonth.length,
          newEnrollments: enrollments.filter(e => {
            const createdAt = e.createdAt ? new Date(e.createdAt) : null;
            return createdAt && createdAt >= date && createdAt <= endOfMonth;
          }).length,
          expiredEnrollments: expiredAtMonth.length,
          complianceRate,
          trainedEmployees: employeesWithActiveTraining.size,
        };
      });
      
      // Calculate growth rates
      const firstMonth = trends[0];
      const lastMonth = trends[trends.length - 1];
      
      const complianceGrowth = firstMonth.complianceRate > 0
        ? Math.round(((lastMonth.complianceRate - firstMonth.complianceRate) / firstMonth.complianceRate) * 100)
        : 0;
      
      const enrollmentGrowth = firstMonth.activeEnrollments > 0
        ? Math.round(((lastMonth.activeEnrollments - firstMonth.activeEnrollments) / firstMonth.activeEnrollments) * 100)
        : 0;
      
      res.json({
        trends,
        summary: {
          complianceGrowth,
          enrollmentGrowth,
          averageComplianceRate: Math.round(trends.reduce((sum, t) => sum + t.complianceRate, 0) / trends.length),
          totalNewEnrollments: trends.reduce((sum, t) => sum + t.newEnrollments, 0),
          totalExpiredEnrollments: trends.reduce((sum, t) => sum + t.expiredEnrollments, 0),
        },
        period,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("KPI trends error:", error);
      res.status(500).json({ error: "Failed to generate KPI trends" });
    }
  });
  
  // Department Comparison with Drill-down
  app.get("/api/kpi/department-comparison", isAuthenticated, requireRole('administrator', 'training_officer', 'manager'), async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId || 'default';
      
      const departments = await storage.getAllDepartments(tenantId);
      const users = await storage.getAllUsers(tenantId);
      const enrollments = await storage.getAllEnrollments(tenantId);
      const courses = await storage.getAllCourses(tenantId);
      const progressionTasks = await storage.getAllProgressionTasks(tenantId);
      
      const now = new Date();
      const mandatoryCourses = courses.filter(c => c.isMandatory && c.isActive);
      
      const departmentMetrics = await Promise.all(departments.map(async (dept) => {
        const deptUsers = users.filter(u => u.departmentId === dept.id);
        const deptEmployees = deptUsers.filter(u => u.role === 'employee');
        const deptEnrollments = enrollments.filter(e => 
          deptUsers.some(u => u.id === e.userId)
        );
        
        // Compliance calculations
        const activeEnrollments = deptEnrollments.filter(e => 
          e.status === 'active' && e.expiresAt && new Date(e.expiresAt) > now
        );
        const expiredEnrollments = deptEnrollments.filter(e => 
          e.expiresAt && new Date(e.expiresAt) <= now
        );
        const expiringIn30Days = deptEnrollments.filter(e => {
          if (!e.expiresAt) return false;
          const expires = new Date(e.expiresAt);
          const thirtyDays = new Date(now);
          thirtyDays.setDate(thirtyDays.getDate() + 30);
          return expires > now && expires <= thirtyDays;
        });
        
        // Mandatory compliance
        let mandatoryCompliant = 0;
        for (const emp of deptEmployees) {
          const empEnrollments = deptEnrollments.filter(e => e.userId === emp.id);
          const hasAllMandatory = mandatoryCourses.every(mc => 
            empEnrollments.some(e => 
              e.courseId === mc.id && 
              (e.status === 'completed' || (e.status === 'active' && (!e.expiresAt || new Date(e.expiresAt) > now)))
            )
          );
          if (hasAllMandatory || mandatoryCourses.length === 0) mandatoryCompliant++;
        }
        
        // Training completion rate
        const completedEnrollments = deptEnrollments.filter(e => 
          e.status === 'completed' || (e.status === 'active' && e.completedAt)
        );
        
        // Progression tasks
        const deptTasks = progressionTasks.filter(t => 
          deptUsers.some(u => u.id === t.userId)
        );
        const completedTasks = deptTasks.filter(t => t.status === 'completed');
        
        // Average courses per employee
        const avgCoursesPerEmployee = deptEmployees.length > 0
          ? Math.round((deptEnrollments.length / deptEmployees.length) * 10) / 10
          : 0;
        
        return {
          departmentId: dept.id,
          departmentName: dept.name,
          departmentCode: dept.code,
          employeeCount: deptEmployees.length,
          totalUsers: deptUsers.length,
          metrics: {
            complianceRate: deptEmployees.length > 0
              ? Math.round((mandatoryCompliant / deptEmployees.length) * 100)
              : 100,
            trainingRate: deptEmployees.length > 0
              ? Math.round((deptEmployees.filter(e => deptEnrollments.some(en => en.userId === e.id)).length / deptEmployees.length) * 100)
              : 0,
            completionRate: deptEnrollments.length > 0
              ? Math.round((completedEnrollments.length / deptEnrollments.length) * 100)
              : 0,
            taskCompletionRate: deptTasks.length > 0
              ? Math.round((completedTasks.length / deptTasks.length) * 100)
              : 0,
          },
          enrollments: {
            total: deptEnrollments.length,
            active: activeEnrollments.length,
            expired: expiredEnrollments.length,
            expiringIn30Days: expiringIn30Days.length,
            completed: completedEnrollments.length,
          },
          tasks: {
            total: deptTasks.length,
            completed: completedTasks.length,
            inProgress: deptTasks.filter(t => t.status === 'in_progress').length,
            notStarted: deptTasks.filter(t => t.status === 'not_started').length,
          },
          avgCoursesPerEmployee,
        };
      }));
      
      // Sort by compliance rate
      departmentMetrics.sort((a, b) => b.metrics.complianceRate - a.metrics.complianceRate);
      
      // Calculate organization-wide averages
      const orgAverages = {
        complianceRate: Math.round(departmentMetrics.reduce((sum, d) => sum + d.metrics.complianceRate, 0) / (departmentMetrics.length || 1)),
        trainingRate: Math.round(departmentMetrics.reduce((sum, d) => sum + d.metrics.trainingRate, 0) / (departmentMetrics.length || 1)),
        completionRate: Math.round(departmentMetrics.reduce((sum, d) => sum + d.metrics.completionRate, 0) / (departmentMetrics.length || 1)),
        taskCompletionRate: Math.round(departmentMetrics.reduce((sum, d) => sum + d.metrics.taskCompletionRate, 0) / (departmentMetrics.length || 1)),
      };
      
      res.json({
        departments: departmentMetrics,
        organizationAverages: orgAverages,
        topPerformers: departmentMetrics.slice(0, 3).map(d => ({ name: d.departmentName, complianceRate: d.metrics.complianceRate })),
        needsAttention: departmentMetrics.filter(d => d.metrics.complianceRate < 80).map(d => ({ name: d.departmentName, complianceRate: d.metrics.complianceRate })),
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Department comparison error:", error);
      res.status(500).json({ error: "Failed to generate department comparison" });
    }
  });
  
  // Department Drill-down
  app.get("/api/kpi/department/:departmentId/details", isAuthenticated, requireRole('administrator', 'training_officer', 'manager'), async (req: Request, res: Response) => {
    try {
      const { departmentId } = req.params;
      const tenantId = req.user!.tenantId || 'default';
      const deptId = parseInt(departmentId);
      
      const department = await storage.getDepartment(deptId);
      if (!department || department.tenantId !== tenantId) {
        return res.status(404).json({ error: "Department not found" });
      }
      
      const users = await storage.getAllUsers(tenantId);
      const enrollments = await storage.getAllEnrollments(tenantId);
      const courses = await storage.getAllCourses(tenantId);
      const progressionTasks = await storage.getAllProgressionTasks(tenantId);
      
      const deptUsers = users.filter(u => u.departmentId === deptId);
      const deptEmployees = deptUsers.filter(u => u.role === 'employee');
      const now = new Date();
      
      // Employee-level details
      const employeeDetails = deptEmployees.map(emp => {
        const empEnrollments = enrollments.filter(e => e.userId === emp.id);
        const empTasks = progressionTasks.filter(t => t.userId === emp.id);
        
        const activeEnrollments = empEnrollments.filter(e => 
          e.status === 'active' && (!e.expiresAt || new Date(e.expiresAt) > now)
        );
        const expiredEnrollments = empEnrollments.filter(e => 
          e.expiresAt && new Date(e.expiresAt) <= now
        );
        const completedEnrollments = empEnrollments.filter(e => 
          e.status === 'completed' || e.completedAt
        );
        
        return {
          id: emp.id,
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
          email: emp.email,
          currentGrade: emp.currentGrade,
          jobTitle: emp.jobTitle,
          enrollments: {
            total: empEnrollments.length,
            active: activeEnrollments.length,
            expired: expiredEnrollments.length,
            completed: completedEnrollments.length,
          },
          tasks: {
            total: empTasks.length,
            completed: empTasks.filter(t => t.status === 'completed').length,
            inProgress: empTasks.filter(t => t.status === 'in_progress').length,
          },
          complianceStatus: expiredEnrollments.length > 0 ? 'Non-Compliant' : 
            (activeEnrollments.length > 0 ? 'Compliant' : 'No Training'),
        };
      });
      
      // Course breakdown
      const courseBreakdown = courses.filter(c => c.isActive).map(course => {
        const courseEnrollments = enrollments.filter(e => 
          e.courseId === course.id && deptUsers.some(u => u.id === e.userId)
        );
        
        return {
          courseId: course.id,
          title: course.title,
          category: course.category,
          isMandatory: course.isMandatory,
          enrolledCount: courseEnrollments.length,
          completedCount: courseEnrollments.filter(e => e.status === 'completed' || e.completedAt).length,
          activeCount: courseEnrollments.filter(e => e.status === 'active' && (!e.expiresAt || new Date(e.expiresAt) > now)).length,
          expiredCount: courseEnrollments.filter(e => e.expiresAt && new Date(e.expiresAt) <= now).length,
          penetrationRate: deptEmployees.length > 0 
            ? Math.round((courseEnrollments.length / deptEmployees.length) * 100)
            : 0,
        };
      }).sort((a, b) => b.enrolledCount - a.enrolledCount);
      
      res.json({
        department: {
          id: department.id,
          name: department.name,
          code: department.code,
        },
        summary: {
          totalEmployees: deptEmployees.length,
          compliantEmployees: employeeDetails.filter(e => e.complianceStatus === 'Compliant').length,
          nonCompliantEmployees: employeeDetails.filter(e => e.complianceStatus === 'Non-Compliant').length,
          untrainedEmployees: employeeDetails.filter(e => e.complianceStatus === 'No Training').length,
        },
        employees: employeeDetails,
        courseBreakdown: courseBreakdown.slice(0, 10), // Top 10 courses
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Department drill-down error:", error);
      res.status(500).json({ error: "Failed to generate department details" });
    }
  });
  
  // Custom KPI Dashboard Configuration
  app.get("/api/kpi/summary", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId || 'default';
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      const users = await storage.getAllUsers(tenantId);
      const enrollments = await storage.getAllEnrollments(tenantId);
      const courses = await storage.getAllCourses(tenantId);
      const renewals = await storage.getAllRenewalRequests(tenantId);
      const progressionTasks = await storage.getAllProgressionTasks(tenantId);
      
      const now = new Date();
      const employees = users.filter(u => u.role === 'employee');
      const mandatoryCourses = courses.filter(c => c.isMandatory && c.isActive);
      
      // User-specific KPIs based on role
      let personalKPIs: Record<string, unknown> = {};
      
      if (['employee', 'foreman', 'manager'].includes(userRole)) {
        const myEnrollments = enrollments.filter(e => e.userId === userId);
        const myTasks = progressionTasks.filter(t => t.userId === userId);
        
        personalKPIs = {
          myCourses: myEnrollments.length,
          myActiveCourses: myEnrollments.filter(e => e.status === 'active' && (!e.expiresAt || new Date(e.expiresAt) > now)).length,
          myCompletedCourses: myEnrollments.filter(e => e.status === 'completed' || e.completedAt).length,
          myExpiredCourses: myEnrollments.filter(e => e.expiresAt && new Date(e.expiresAt) <= now).length,
          myExpiringIn30Days: myEnrollments.filter(e => {
            if (!e.expiresAt) return false;
            const expires = new Date(e.expiresAt);
            const thirtyDays = new Date(now);
            thirtyDays.setDate(thirtyDays.getDate() + 30);
            return expires > now && expires <= thirtyDays;
          }).length,
          myTasks: myTasks.length,
          myCompletedTasks: myTasks.filter(t => t.status === 'completed').length,
          myTaskProgress: myTasks.length > 0 
            ? Math.round((myTasks.filter(t => t.status === 'completed').length / myTasks.length) * 100) 
            : 0,
        };
      }
      
      // Organization-wide KPIs (for managers/admins)
      let orgKPIs: Record<string, unknown> = {};
      
      if (['manager', 'training_officer', 'administrator'].includes(userRole)) {
        const activeEnrollments = enrollments.filter(e => 
          e.status === 'active' && (!e.expiresAt || new Date(e.expiresAt) > now)
        );
        const expiredEnrollments = enrollments.filter(e => 
          e.expiresAt && new Date(e.expiresAt) <= now
        );
        
        // Calculate compliance
        let compliantCount = 0;
        for (const emp of employees) {
          const empEnrollments = enrollments.filter(e => e.userId === emp.id);
          const hasExpired = empEnrollments.some(e => e.expiresAt && new Date(e.expiresAt) <= now);
          if (!hasExpired && empEnrollments.length > 0) compliantCount++;
        }
        
        orgKPIs = {
          totalEmployees: employees.length,
          totalEnrollments: enrollments.length,
          activeEnrollments: activeEnrollments.length,
          expiredEnrollments: expiredEnrollments.length,
          complianceRate: employees.length > 0 ? Math.round((compliantCount / employees.length) * 100) : 100,
          trainingCoverage: employees.length > 0 
            ? Math.round((new Set(enrollments.map(e => e.userId)).size / employees.length) * 100)
            : 0,
          pendingRenewals: renewals.filter(r => r.status === 'pending' || r.status === 'foreman_approved').length,
          completedRenewals: renewals.filter(r => r.status === 'completed').length,
          totalCourses: courses.filter(c => c.isActive).length,
          mandatoryCourses: mandatoryCourses.length,
        };
      }
      
      res.json({
        personalKPIs,
        organizationKPIs: orgKPIs,
        role: userRole,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("KPI summary error:", error);
      res.status(500).json({ error: "Failed to generate KPI summary" });
    }
  });

  // =====================
  // SAP/ORACLE INTEGRATION API
  // =====================
  
  // Export employees in SAP format
  app.get("/api/integration/sap/employees", isAuthenticated, requireRole('administrator'), async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId || 'default';
      const users = await storage.getAllUsers(tenantId);
      const departments = await storage.getAllDepartments(tenantId);
      
      // SAP HR format for employee master data
      const sapEmployees = users.map(user => {
        const dept = departments.find(d => d.id === user.departmentId);
        return {
          PERNR: user.employeeNumber || user.id.substring(0, 8).toUpperCase(),
          NACHN: user.lastName || '',
          VORNA: user.firstName || '',
          EMAIL: user.email || '',
          ORGEH: dept?.code || '',
          ORGTX: dept?.name || '',
          PLANS: user.jobTitle || '',
          GRADE: user.currentGrade || '',
          BEGDA: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0].replace(/-/g, '') : '',
          ENDDA: '99991231',
          STAT2: user.isActive ? '1' : '0',
          WERKS: tenantId,
        };
      });
      
      await auditLog(req.user!.id, 'create', 'integration_export', 'sap_employees', null, { count: sapEmployees.length }, req);
      
      res.json({
        format: 'SAP_HR_INFOTYPE_0001',
        version: '1.0',
        exportDate: new Date().toISOString(),
        recordCount: sapEmployees.length,
        data: sapEmployees,
      });
    } catch (error) {
      console.error("SAP employee export error:", error);
      res.status(500).json({ error: "Failed to export employees in SAP format" });
    }
  });
  
  // Export training records in SAP format
  app.get("/api/integration/sap/training", isAuthenticated, requireRole('administrator'), async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId || 'default';
      const enrollments = await storage.getAllEnrollments(tenantId);
      const courses = await storage.getAllCourses(tenantId);
      const users = await storage.getAllUsers(tenantId);
      
      // SAP Training & Event Management format
      const sapTraining = enrollments.map(enrollment => {
        const course = courses.find(c => c.id === enrollment.courseId);
        const user = users.find(u => u.id === enrollment.userId);
        
        return {
          OBJID: enrollment.id.toString().padStart(8, '0'),
          PERNR: user?.employeeNumber || user?.id.substring(0, 8).toUpperCase() || '',
          SCHED: course?.id.toString().padStart(8, '0') || '',
          EVTYP: 'ET01',
          EVTXT: course?.title || '',
          CATEG: course?.category || '',
          BEGDA: enrollment.createdAt ? new Date(enrollment.createdAt).toISOString().split('T')[0].replace(/-/g, '') : '',
          ENDDA: enrollment.expiresAt ? new Date(enrollment.expiresAt).toISOString().split('T')[0].replace(/-/g, '') : '99991231',
          STATS: enrollment.status === 'completed' ? '3' : enrollment.status === 'active' ? '2' : '1',
          STATU: enrollment.status.toUpperCase(),
          PROV: course?.provider || '',
          DURAT: course?.duration || '',
          VALID: course?.validityPeriodDays?.toString() || '',
        };
      });
      
      await auditLog(req.user!.id, 'create', 'integration_export', 'sap_training', null, { count: sapTraining.length }, req);
      
      res.json({
        format: 'SAP_TEM_TRAINING_RECORDS',
        version: '1.0',
        exportDate: new Date().toISOString(),
        recordCount: sapTraining.length,
        data: sapTraining,
      });
    } catch (error) {
      console.error("SAP training export error:", error);
      res.status(500).json({ error: "Failed to export training in SAP format" });
    }
  });
  
  // Export certifications in Oracle HCM format
  app.get("/api/integration/oracle/certifications", isAuthenticated, requireRole('administrator'), async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId || 'default';
      const enrollments = await storage.getAllEnrollments(tenantId);
      const courses = await storage.getAllCourses(tenantId);
      const users = await storage.getAllUsers(tenantId);
      
      const now = new Date();
      
      // Oracle HCM Cloud Certifications format
      const oracleCerts = enrollments
        .filter(e => e.status === 'completed' || (e.status === 'active' && e.completedAt))
        .map(enrollment => {
          const course = courses.find(c => c.id === enrollment.courseId);
          const user = users.find(u => u.id === enrollment.userId);
          const isExpired = enrollment.expiresAt && new Date(enrollment.expiresAt) <= now;
          
          return {
            CertificationId: `CERT-${enrollment.id.toString().padStart(8, '0')}`,
            PersonId: user?.id || '',
            PersonNumber: user?.employeeNumber || '',
            PersonName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
            CertificationName: course?.title || '',
            CertificationType: course?.category || 'Training',
            IssuingAuthority: course?.provider || 'Internal',
            IssueDate: enrollment.completedAt 
              ? new Date(enrollment.completedAt).toISOString().split('T')[0]
              : enrollment.createdAt 
                ? new Date(enrollment.createdAt).toISOString().split('T')[0]
                : '',
            ExpirationDate: enrollment.expiresAt 
              ? new Date(enrollment.expiresAt).toISOString().split('T')[0]
              : '',
            CertificationStatus: isExpired ? 'EXPIRED' : 'VALID',
            ValidityPeriod: course?.validityPeriodDays || 0,
            MandatoryFlag: course?.isMandatory ? 'Y' : 'N',
          };
        });
      
      await auditLog(req.user!.id, 'create', 'integration_export', 'oracle_certifications', null, { count: oracleCerts.length }, req);
      
      res.json({
        format: 'ORACLE_HCM_CERTIFICATIONS',
        version: '22A',
        exportDate: new Date().toISOString(),
        recordCount: oracleCerts.length,
        data: oracleCerts,
      });
    } catch (error) {
      console.error("Oracle certifications export error:", error);
      res.status(500).json({ error: "Failed to export certifications in Oracle format" });
    }
  });
  
  // Import employees from SAP (bidirectional sync)
  app.post("/api/integration/sap/employees/import", isAuthenticated, requireRole('administrator'), async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId || 'default';
      const { data } = req.body;
      
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: "Invalid data format. Expected array of employee records." });
      }
      
      const results = {
        processed: 0,
        created: 0,
        updated: 0,
        errors: [] as { record: number; error: string }[],
      };
      
      for (let i = 0; i < data.length; i++) {
        const record = data[i];
        try {
          // Find existing user by employee number or email
          const existingUsers = await storage.getAllUsers(tenantId);
          const existing = existingUsers.find(u => 
            u.employeeNumber === record.PERNR || u.email === record.EMAIL
          );
          
          // Find department by code
          const departments = await storage.getAllDepartments(tenantId);
          const dept = departments.find(d => d.code === record.ORGEH);
          
          if (existing) {
            // Update existing user
            await storage.updateUser(existing.id, {
              firstName: record.VORNA || existing.firstName,
              lastName: record.NACHN || existing.lastName,
              jobTitle: record.PLANS || existing.jobTitle,
              currentGrade: record.GRADE || existing.currentGrade,
              departmentId: dept?.id || existing.departmentId,
              isActive: record.STAT2 === '1',
            });
            results.updated++;
          } else if (record.EMAIL) {
            // Create new user
            await storage.createUser({
              email: record.EMAIL,
              firstName: record.VORNA || '',
              lastName: record.NACHN || '',
              employeeNumber: record.PERNR,
              jobTitle: record.PLANS || '',
              currentGrade: record.GRADE || '',
              departmentId: dept?.id,
              role: 'employee',
              tenantId,
              isActive: record.STAT2 === '1',
            });
            results.created++;
          }
          results.processed++;
        } catch (err) {
          results.errors.push({ record: i, error: String(err) });
        }
      }
      
      await auditLog(req.user!.id, 'create', 'integration_import', 'sap_employees', null, results, req);
      
      res.json({
        success: true,
        ...results,
      });
    } catch (error) {
      console.error("SAP employee import error:", error);
      res.status(500).json({ error: "Failed to import employees from SAP format" });
    }
  });
  
  // Import training completions from Oracle HCM (bidirectional sync)
  app.post("/api/integration/oracle/training/import", isAuthenticated, requireRole('administrator'), async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId || 'default';
      const { data } = req.body;
      
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: "Invalid data format. Expected array of training records." });
      }
      
      const results = {
        processed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [] as { record: number; error: string }[],
      };
      
      const users = await storage.getAllUsers(tenantId);
      const courses = await storage.getAllCourses(tenantId);
      
      for (let i = 0; i < data.length; i++) {
        const record = data[i];
        try {
          // Find user by person number or ID
          const user = users.find(u => 
            u.employeeNumber === record.PersonNumber || u.id === record.PersonId
          );
          
          if (!user) {
            results.skipped++;
            results.errors.push({ record: i, error: `User not found: ${record.PersonNumber || record.PersonId}` });
            continue;
          }
          
          // Find course by title
          const course = courses.find(c => 
            c.title.toLowerCase() === record.CertificationName?.toLowerCase()
          );
          
          if (!course) {
            results.skipped++;
            results.errors.push({ record: i, error: `Course not found: ${record.CertificationName}` });
            continue;
          }
          
          // Check for existing enrollment
          const existingEnrollments = await storage.getEnrollmentsByUser(user.id);
          const existing = existingEnrollments.find(e => e.courseId === course.id);
          
          if (existing) {
            // Update existing enrollment
            await storage.updateEnrollment(existing.id, {
              status: record.CertificationStatus === 'VALID' ? 'active' : 'expired',
              completedAt: record.IssueDate ? new Date(record.IssueDate) : existing.completedAt,
              expiresAt: record.ExpirationDate ? new Date(record.ExpirationDate) : existing.expiresAt,
            });
            results.updated++;
          } else {
            // Create new enrollment
            await storage.createEnrollment({
              userId: user.id,
              courseId: course.id,
              status: record.CertificationStatus === 'VALID' ? 'active' : 'expired',
              completedAt: record.IssueDate ? new Date(record.IssueDate) : undefined,
              expiresAt: record.ExpirationDate ? new Date(record.ExpirationDate) : undefined,
              tenantId,
            });
            results.created++;
          }
          results.processed++;
        } catch (err) {
          results.errors.push({ record: i, error: String(err) });
        }
      }
      
      await auditLog(req.user!.id, 'create', 'integration_import', 'oracle_training', null, results, req);
      
      res.json({
        success: true,
        ...results,
      });
    } catch (error) {
      console.error("Oracle training import error:", error);
      res.status(500).json({ error: "Failed to import training from Oracle format" });
    }
  });
  
  // Integration status and health check
  app.get("/api/integration/status", isAuthenticated, requireRole('administrator'), async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId || 'default';
      
      // Get recent audit logs for integration activities
      const auditLogs = await storage.getAuditLogs(tenantId, 100);
      const integrationLogs = auditLogs.filter(log => 
        log.entityType.startsWith('integration_')
      );
      
      const recentExports = integrationLogs
        .filter(log => log.entityType.includes('export'))
        .slice(0, 5)
        .map(log => ({
          type: log.entityId || log.entityType,
          timestamp: log.createdAt,
          recordCount: (log.newValues as Record<string, unknown>)?.count || 0,
        }));
      
      const recentImports = integrationLogs
        .filter(log => log.entityType.includes('import'))
        .slice(0, 5)
        .map(log => ({
          type: log.entityId || log.entityType,
          timestamp: log.createdAt,
          results: log.newValues,
        }));
      
      res.json({
        status: 'healthy',
        supportedFormats: {
          sap: {
            employees: { export: true, import: true },
            training: { export: true, import: false },
          },
          oracle: {
            certifications: { export: true, import: false },
            training: { export: false, import: true },
          },
        },
        recentActivity: {
          exports: recentExports,
          imports: recentImports,
        },
        lastChecked: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Integration status error:", error);
      res.status(500).json({ error: "Failed to get integration status" });
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
