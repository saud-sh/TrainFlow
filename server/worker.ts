import { storage } from "./storage";
import { log } from "./index";

const NOTIFICATION_INTERVALS = [30, 14, 7, 1];

interface ExpirationCheck {
  enrollmentId: number;
  userId: string;
  courseTitle: string;
  daysUntilExpiry: number;
  expiresAt: Date;
}

export async function runExpirationCheck(): Promise<void> {
  log("Starting expiration check worker", "worker");
  
  try {
    const tenantId = 'default';
    
    for (const days of NOTIFICATION_INTERVALS) {
      await checkExpiringEnrollments(days, tenantId);
    }
    
    await checkEscalations(tenantId);
    
    log("Expiration check completed successfully", "worker");
  } catch (error) {
    log(`Expiration check failed: ${error}`, "worker");
    console.error("Worker error:", error);
  }
}

async function checkExpiringEnrollments(days: number, tenantId: string): Promise<void> {
  log(`Checking enrollments expiring in ${days} days`, "worker");
  
  const now = new Date();
  const targetDate = new Date();
  targetDate.setDate(now.getDate() + days);
  
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  const expiringEnrollments = await storage.getExpiringEnrollments(days + 1, tenantId);
  
  const enrollmentsExpiringOnDay = expiringEnrollments.filter(e => {
    const expiresAt = new Date(e.expiresAt);
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysRemaining === days;
  });
  
  for (const enrollment of enrollmentsExpiringOnDay) {
    const course = await storage.getCourse(enrollment.courseId);
    if (!course) continue;
    
    const hasExistingNotification = await checkExistingNotification(
      enrollment.userId,
      'expiry_warning',
      enrollment.id,
      days
    );
    
    if (!hasExistingNotification) {
      const urgencyText = days === 1 ? "URGENT: " : days <= 7 ? "Important: " : "";
      
      await storage.createNotification({
        userId: enrollment.userId,
        type: 'expiry_warning',
        title: `${urgencyText}Training Expiring in ${days} Day${days === 1 ? '' : 's'}`,
        message: `Your "${course.title}" certification expires on ${new Date(enrollment.expiresAt).toLocaleDateString()}. Please submit a renewal request.`,
        relatedEntityType: 'enrollment',
        relatedEntityId: enrollment.id,
        tenantId,
      });
      
      log(`Created ${days}-day expiry notification for enrollment ${enrollment.id}`, "worker");
    }
  }
}

async function checkExistingNotification(
  userId: string,
  type: 'expiry_warning' | 'renewal_request' | 'approval_needed' | 'escalation' | 'system',
  entityId: number,
  days: number
): Promise<boolean> {
  const notifications = await storage.getNotificationsByUser(userId, false);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return notifications.some(n => {
    if (n.type !== type) return false;
    if (n.relatedEntityId !== entityId) return false;
    
    const createdAt = n.createdAt;
    if (!createdAt) return false;
    
    const notificationDate = new Date(createdAt);
    notificationDate.setHours(0, 0, 0, 0);
    
    if (notificationDate.getTime() === today.getTime()) {
      return true;
    }
    
    return false;
  });
}

async function checkEscalations(tenantId: string): Promise<void> {
  log("Checking for escalations", "worker");
  
  const expiringEnrollments = await storage.getExpiringEnrollments(14, tenantId);
  
  for (const enrollment of expiringEnrollments) {
    const expiresAt = new Date(enrollment.expiresAt);
    const now = new Date();
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining > 7) continue;
    
    const userNotifications = await storage.getNotificationsByUser(enrollment.userId, false);
    
    const unreadExpiryNotifications = userNotifications.filter(n => 
      n.type === 'expiry_warning' && 
      n.relatedEntityId === enrollment.id && 
      !n.isRead
    );
    
    if (unreadExpiryNotifications.length >= 2) {
      const user = await storage.getUser(enrollment.userId);
      if (!user) continue;
      
      const course = await storage.getCourse(enrollment.courseId);
      if (!course) continue;
      
      const foremen = await storage.getUsersByRole('foreman', tenantId);
      
      for (const foreman of foremen) {
        const existingEscalation = await checkExistingEscalation(
          foreman.id,
          enrollment.id
        );
        
        if (!existingEscalation) {
          await storage.createNotification({
            userId: foreman.id,
            type: 'escalation',
            title: 'Employee Training Renewal Alert',
            message: `${user.firstName} ${user.lastName} has not responded to multiple renewal reminders for "${course.title}" which expires in ${daysRemaining} days.`,
            relatedEntityType: 'enrollment',
            relatedEntityId: enrollment.id,
            tenantId,
          });
          
          log(`Escalated enrollment ${enrollment.id} to foreman ${foreman.id}`, "worker");
        }
      }
    }
  }
}

async function checkExistingEscalation(
  foremanId: string,
  enrollmentId: number
): Promise<boolean> {
  const notifications = await storage.getNotificationsByUser(foremanId, false);
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  return notifications.some(n => {
    if (n.type !== 'escalation') return false;
    if (n.relatedEntityId !== enrollmentId) return false;
    if (!n.createdAt) return false;
    return new Date(n.createdAt) > sevenDaysAgo;
  });
}

export function startWorkerSchedule(): void {
  log("Initializing worker schedule", "worker");
  
  setTimeout(() => {
    runExpirationCheck();
  }, 5000);
  
  const INTERVAL_MS = 24 * 60 * 60 * 1000;
  
  setInterval(() => {
    runExpirationCheck();
  }, INTERVAL_MS);
  
  log("Worker scheduled to run daily", "worker");
}

export async function runManualExpirationCheck(): Promise<{ 
  checked: number; 
  notificationsCreated: number;
  escalationsCreated: number;
}> {
  log("Running manual expiration check", "worker");
  
  let notificationsCreated = 0;
  let escalationsCreated = 0;
  let totalChecked = 0;
  
  try {
    const tenantId = 'default';
    
    for (const days of NOTIFICATION_INTERVALS) {
      const expiringEnrollments = await storage.getExpiringEnrollments(days + 1, tenantId);
      const now = new Date();
      
      for (const enrollment of expiringEnrollments) {
        const expiresAt = new Date(enrollment.expiresAt);
        const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining !== days) continue;
        
        totalChecked++;
        
        const course = await storage.getCourse(enrollment.courseId);
        if (!course) continue;
        
        const hasExisting = await checkExistingNotification(
          enrollment.userId,
          'expiry_warning',
          enrollment.id,
          days
        );
        
        if (!hasExisting) {
          const urgencyText = days === 1 ? "URGENT: " : days <= 7 ? "Important: " : "";
          
          await storage.createNotification({
            userId: enrollment.userId,
            type: 'expiry_warning',
            title: `${urgencyText}Training Expiring in ${days} Day${days === 1 ? '' : 's'}`,
            message: `Your "${course.title}" certification expires on ${new Date(enrollment.expiresAt).toLocaleDateString()}. Please submit a renewal request.`,
            relatedEntityType: 'enrollment',
            relatedEntityId: enrollment.id,
            tenantId,
          });
          
          notificationsCreated++;
        }
      }
    }
    
    const expiringForEscalation = await storage.getExpiringEnrollments(14, tenantId);
    const now = new Date();
    
    for (const enrollment of expiringForEscalation) {
      const expiresAt = new Date(enrollment.expiresAt);
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining > 7) continue;
      
      const userNotifications = await storage.getNotificationsByUser(enrollment.userId, false);
      const unreadExpiryNotifications = userNotifications.filter(n => 
        n.type === 'expiry_warning' && 
        n.relatedEntityId === enrollment.id && 
        !n.isRead
      );
      
      if (unreadExpiryNotifications.length >= 2) {
        const user = await storage.getUser(enrollment.userId);
        if (!user) continue;
        
        const course = await storage.getCourse(enrollment.courseId);
        if (!course) continue;
        
        const foremen = await storage.getUsersByRole('foreman', tenantId);
        
        for (const foreman of foremen) {
          const existingEscalation = await checkExistingEscalation(foreman.id, enrollment.id);
          
          if (!existingEscalation) {
            await storage.createNotification({
              userId: foreman.id,
              type: 'escalation',
              title: 'Employee Training Renewal Alert',
              message: `${user.firstName} ${user.lastName} has not responded to multiple renewal reminders for "${course.title}" which expires in ${daysRemaining} days.`,
              relatedEntityType: 'enrollment',
              relatedEntityId: enrollment.id,
              tenantId,
            });
            
            escalationsCreated++;
          }
        }
      }
    }
    
    return { checked: totalChecked, notificationsCreated, escalationsCreated };
  } catch (error) {
    log(`Manual expiration check failed: ${error}`, "worker");
    throw error;
  }
}
