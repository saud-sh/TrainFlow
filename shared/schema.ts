import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for the application
export const userRoleEnum = pgEnum('user_role', ['employee', 'foreman', 'manager', 'training_officer', 'administrator']);
export const renewalStatusEnum = pgEnum('renewal_status', ['pending', 'foreman_approved', 'manager_approved', 'rejected', 'completed']);
export const notificationTypeEnum = pgEnum('notification_type', ['expiry_warning', 'renewal_request', 'approval_needed', 'escalation', 'system']);
export const taskStatusEnum = pgEnum('task_status', ['not_started', 'in_progress', 'completed', 'blocked']);
export const auditActionEnum = pgEnum('audit_action', ['create', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'submit']);

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table with role-based access
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('employee').notNull(),
  departmentId: integer("department_id"),
  employeeNumber: varchar("employee_number"),
  jobTitle: varchar("job_title"),
  currentGrade: varchar("current_grade"),
  supervisorId: varchar("supervisor_id"),
  tenantId: varchar("tenant_id").default('default'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Departments table for organizational structure
export const departments = pgTable("departments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name").notNull(),
  code: varchar("code").notNull().unique(),
  managerId: varchar("manager_id"),
  tenantId: varchar("tenant_id").default('default'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Training courses table
export const courses = pgTable("courses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  validityPeriodDays: integer("validity_period_days").notNull(),
  requiredForGrades: text("required_for_grades").array(),
  requiredForRoles: text("required_for_roles").array(),
  isMandatory: boolean("is_mandatory").default(false),
  provider: varchar("provider"),
  duration: varchar("duration"),
  tenantId: varchar("tenant_id").default('default'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employee enrollments - tracks which courses employees are enrolled in
export const enrollments = pgTable("enrollments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at").notNull(),
  status: varchar("status").default('active').notNull(),
  certificateNumber: varchar("certificate_number"),
  score: integer("score"),
  tenantId: varchar("tenant_id").default('default'),
});

// Renewal requests workflow
export const renewalRequests = pgTable("renewal_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollments.id),
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  status: renewalStatusEnum("status").default('pending').notNull(),
  foremanId: varchar("foreman_id").references(() => users.id),
  foremanApprovedAt: timestamp("foreman_approved_at"),
  foremanComments: text("foreman_comments"),
  managerId: varchar("manager_id").references(() => users.id),
  managerApprovedAt: timestamp("manager_approved_at"),
  managerComments: text("manager_comments"),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  urgencyLevel: varchar("urgency_level").default('normal'),
  tenantId: varchar("tenant_id").default('default'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications for alerts
export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  relatedEntityType: varchar("related_entity_type"),
  relatedEntityId: integer("related_entity_id"),
  isRead: boolean("is_read").default(false),
  daysUntilExpiry: integer("days_until_expiry"),
  escalationLevel: integer("escalation_level").default(0),
  tenantId: varchar("tenant_id").default('default'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Progression tasks for employee promotion tracking
export const progressionTasks = pgTable("progression_tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  targetGrade: varchar("target_grade").notNull(),
  requiredCourseId: integer("required_course_id").references(() => courses.id),
  status: taskStatusEnum("status").default('not_started').notNull(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  assignedBy: varchar("assigned_by").references(() => users.id),
  priority: varchar("priority").default('medium'),
  tenantId: varchar("tenant_id").default('default'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit log for tracking all system actions
export const auditLogs = pgTable("audit_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id),
  action: auditActionEnum("action").notNull(),
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  tenantId: varchar("tenant_id").default('default'),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Recommendations for course suggestions
export const aiRecommendations = pgTable("ai_recommendations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  reason: text("reason").notNull(),
  confidence: integer("confidence"),
  isAccepted: boolean("is_accepted"),
  isDismissed: boolean("is_dismissed").default(false),
  tenantId: varchar("tenant_id").default('default'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  supervisor: one(users, {
    fields: [users.supervisorId],
    references: [users.id],
    relationName: "supervisor",
  }),
  enrollments: many(enrollments),
  renewalRequests: many(renewalRequests, { relationName: "requestedBy" }),
  notifications: many(notifications),
  progressionTasks: many(progressionTasks),
  aiRecommendations: many(aiRecommendations),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  manager: one(users, {
    fields: [departments.managerId],
    references: [users.id],
  }),
  employees: many(users),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  enrollments: many(enrollments),
  progressionTasks: many(progressionTasks),
  aiRecommendations: many(aiRecommendations),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
  renewalRequests: many(renewalRequests),
}));

export const renewalRequestsRelations = relations(renewalRequests, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [renewalRequests.enrollmentId],
    references: [enrollments.id],
  }),
  requester: one(users, {
    fields: [renewalRequests.requestedBy],
    references: [users.id],
    relationName: "requestedBy",
  }),
  foreman: one(users, {
    fields: [renewalRequests.foremanId],
    references: [users.id],
    relationName: "foreman",
  }),
  manager: one(users, {
    fields: [renewalRequests.managerId],
    references: [users.id],
    relationName: "manager",
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const progressionTasksRelations = relations(progressionTasks, ({ one }) => ({
  user: one(users, {
    fields: [progressionTasks.userId],
    references: [users.id],
  }),
  requiredCourse: one(courses, {
    fields: [progressionTasks.requiredCourseId],
    references: [courses.id],
  }),
  assigner: one(users, {
    fields: [progressionTasks.assignedBy],
    references: [users.id],
    relationName: "assigner",
  }),
}));

export const aiRecommendationsRelations = relations(aiRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [aiRecommendations.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [aiRecommendations.courseId],
    references: [courses.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
});

export const insertRenewalRequestSchema = createInsertSchema(renewalRequests).omit({
  id: true,
  requestedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertProgressionTaskSchema = createInsertSchema(progressionTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAiRecommendationSchema = createInsertSchema(aiRecommendations).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type RenewalRequest = typeof renewalRequests.$inferSelect;
export type InsertRenewalRequest = z.infer<typeof insertRenewalRequestSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type ProgressionTask = typeof progressionTasks.$inferSelect;
export type InsertProgressionTask = z.infer<typeof insertProgressionTaskSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type AiRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertAiRecommendation = z.infer<typeof insertAiRecommendationSchema>;

// User role type
export type UserRole = 'employee' | 'foreman' | 'manager' | 'training_officer' | 'administrator';
