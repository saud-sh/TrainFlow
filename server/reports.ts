import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer';
import { storage } from './storage';
import type { User, Course, Enrollment, Department, RenewalRequest, ProgressionTask } from '@shared/schema';

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', DATE_FORMAT_OPTIONS);
}

export interface TrainingComplianceData {
  summary: {
    totalEmployees: number;
    employeesWithTraining: number;
    employeesWithoutTraining: number;
    compliantEmployees: number;
    atRiskEmployees: number;
    nonCompliantEmployees: number;
    overallComplianceRate: number;
    trainingComplianceRate: number;
  };
  enrollmentStats: {
    total: number;
    active: number;
    completed: number;
    expiringSoon: number;
    expired: number;
  };
  employees: Array<{
    name: string;
    department: string;
    role: string;
    totalCourses: number;
    completedCourses: number;
    expiringCourses: number;
    expiredCourses: number;
    complianceStatus: string;
  }>;
  generatedAt: Date;
  tenantId: string;
}

export interface EmployeeProgressData {
  employee: {
    name: string;
    email: string;
    role: string;
    department: string;
    hireDate: string;
    currentGrade: number;
  };
  enrollments: Array<{
    courseName: string;
    category: string;
    status: string;
    enrolledDate: string;
    completedDate: string | null;
    expirationDate: string;
    score: number | null;
  }>;
  progressionTasks: Array<{
    title: string;
    status: string;
    targetGrade: number;
    dueDate: string | null;
    completedDate: string | null;
  }>;
  renewalRequests: Array<{
    courseName: string;
    status: string;
    submittedDate: string;
    approvedDate: string | null;
  }>;
  generatedAt: Date;
}

export interface DepartmentStatsData {
  department: {
    name: string;
    code: string;
  };
  summary: {
    totalEmployees: number;
    complianceRate: number;
    avgTrainingCompletion: number;
    pendingRenewals: number;
    upcomingExpirations: number;
  };
  employees: Array<{
    name: string;
    role: string;
    completionRate: number;
    expiringCourses: number;
  }>;
  courseBreakdown: Array<{
    courseName: string;
    enrolled: number;
    completed: number;
    expiring: number;
    expired: number;
  }>;
  generatedAt: Date;
}

export async function verifyDepartmentTenant(departmentId: number, tenantId: string): Promise<Department | null> {
  const department = await storage.getDepartment(departmentId);
  if (!department) return null;
  if (department.tenantId !== tenantId) return null;
  return department;
}

export async function generateTrainingComplianceData(tenantId: string): Promise<TrainingComplianceData> {
  const allUsers = await storage.getAllUsers(tenantId);
  const allEnrollments = await storage.getAllEnrollments(tenantId);
  const allDepartments = await storage.getAllDepartments(tenantId);
  
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  
  const deptMap = new Map<number, Department>(allDepartments.map((d: Department) => [d.id, d]));
  
  const employees = allUsers.filter((u: User) => u.role === 'employee' || u.role === 'foreman');
  
  const activeEnrollments = allEnrollments.filter((e: Enrollment) => e.status === 'active').length;
  const completedEnrollments = allEnrollments.filter((e: Enrollment) => e.status === 'completed').length;
  const expiringSoonEnrollments = allEnrollments.filter((e: Enrollment) => {
    if (!e.expiresAt) return false;
    const expDate = new Date(e.expiresAt);
    return expDate > now && expDate <= thirtyDaysFromNow && e.status !== 'expired';
  }).length;
  const expiredEnrollments = allEnrollments.filter((e: Enrollment) => {
    if (!e.expiresAt) return false;
    return new Date(e.expiresAt) < now;
  }).length;
  
  const employeeData = employees.map((user: User) => {
    const userEnrollments = allEnrollments.filter((e: Enrollment) => e.userId === user.id);
    const completed = userEnrollments.filter((e: Enrollment) => e.status === 'completed');
    
    const expiring = userEnrollments.filter((e: Enrollment) => {
      if (!e.expiresAt) return false;
      const expDate = new Date(e.expiresAt);
      return expDate > now && expDate <= thirtyDaysFromNow;
    });
    
    const expired = userEnrollments.filter((e: Enrollment) => {
      if (!e.expiresAt) return false;
      return new Date(e.expiresAt) < now;
    });
    
    let complianceStatus: string;
    if (userEnrollments.length === 0) {
      complianceStatus = 'No Training';
    } else if (expired.length > 0) {
      complianceStatus = 'Non-Compliant';
    } else if (expiring.length > 0) {
      complianceStatus = 'At Risk';
    } else {
      complianceStatus = 'Compliant';
    }
    
    const dept = user.departmentId ? deptMap.get(user.departmentId) : null;
    
    return {
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
      department: dept?.name || 'Unassigned',
      role: user.role,
      totalCourses: userEnrollments.length,
      completedCourses: completed.length,
      expiringCourses: expiring.length,
      expiredCourses: expired.length,
      complianceStatus,
    };
  });
  
  const employeesWithTraining = employeeData.filter(e => e.complianceStatus !== 'No Training');
  const employeesWithoutTraining = employeeData.filter(e => e.complianceStatus === 'No Training');
  const compliantEmployees = employeeData.filter(e => e.complianceStatus === 'Compliant');
  const atRiskEmployees = employeeData.filter(e => e.complianceStatus === 'At Risk');
  const nonCompliantEmployees = employeeData.filter(e => e.complianceStatus === 'Non-Compliant');
  
  const overallComplianceRate = employees.length > 0 
    ? Math.round((compliantEmployees.length / employees.length) * 100) 
    : 0;
  
  const trainingComplianceRate = employeesWithTraining.length > 0
    ? Math.round((compliantEmployees.length / employeesWithTraining.length) * 100)
    : 0;
  
  return {
    summary: {
      totalEmployees: employees.length,
      employeesWithTraining: employeesWithTraining.length,
      employeesWithoutTraining: employeesWithoutTraining.length,
      compliantEmployees: compliantEmployees.length,
      atRiskEmployees: atRiskEmployees.length,
      nonCompliantEmployees: nonCompliantEmployees.length,
      overallComplianceRate,
      trainingComplianceRate,
    },
    enrollmentStats: {
      total: allEnrollments.length,
      active: activeEnrollments,
      completed: completedEnrollments,
      expiringSoon: expiringSoonEnrollments,
      expired: expiredEnrollments,
    },
    employees: employeeData,
    generatedAt: now,
    tenantId,
  };
}

export async function generateEmployeeProgressData(userId: string, tenantId: string): Promise<EmployeeProgressData | null> {
  const user = await storage.getUser(userId);
  if (!user) return null;
  if (user.tenantId !== tenantId) return null;
  
  const userEnrollments = await storage.getEnrollmentsByUser(userId);
  const userProgressionTasks = await storage.getProgressionTasksByUser(userId);
  const userRenewalRequests = await storage.getRenewalRequestsByUser(userId);
  const allCourses = await storage.getAllCourses(tenantId);
  const allDepartments = await storage.getAllDepartments(tenantId);
  
  const courseMap = new Map<number, Course>(allCourses.map((c: Course) => [c.id, c]));
  const deptMap = new Map<number, Department>(allDepartments.map((d: Department) => [d.id, d]));
  
  const dept = user.departmentId ? deptMap.get(user.departmentId) : null;
  
  return {
    employee: {
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
      email: user.email || '',
      role: user.role,
      department: dept?.name || 'Unassigned',
      hireDate: formatDate(user.createdAt),
      currentGrade: typeof user.currentGrade === 'number' ? user.currentGrade : parseInt(user.currentGrade || '1', 10),
    },
    enrollments: userEnrollments.map((e: Enrollment) => {
      const course = e.courseId ? courseMap.get(e.courseId) : null;
      return {
        courseName: course?.title || 'Unknown Course',
        category: course?.category || 'General',
        status: e.status,
        enrolledDate: formatDate(e.enrolledAt),
        completedDate: e.completedAt ? formatDate(e.completedAt) : null,
        expirationDate: formatDate(e.expiresAt),
        score: e.score,
      };
    }),
    progressionTasks: userProgressionTasks.map((t: ProgressionTask) => ({
      title: t.title,
      status: t.status,
      targetGrade: typeof t.targetGrade === 'number' ? t.targetGrade : parseInt(t.targetGrade || '1', 10),
      dueDate: t.dueDate ? formatDate(t.dueDate) : null,
      completedDate: t.completedAt ? formatDate(t.completedAt) : null,
    })),
    renewalRequests: userRenewalRequests.map((r: RenewalRequest) => {
      const enrollment = userEnrollments.find((e: Enrollment) => e.id === r.enrollmentId);
      const course = enrollment?.courseId ? courseMap.get(enrollment.courseId) : null;
      return {
        courseName: course?.title || 'Unknown Course',
        status: r.status,
        submittedDate: formatDate(r.createdAt),
        approvedDate: r.managerApprovedAt ? formatDate(r.managerApprovedAt) : null,
      };
    }),
    generatedAt: new Date(),
  };
}

export async function generateDepartmentStatsData(departmentId: number, tenantId: string): Promise<DepartmentStatsData | null> {
  const department = await verifyDepartmentTenant(departmentId, tenantId);
  if (!department) return null;
  
  const allUsers = await storage.getAllUsers(tenantId);
  const allEnrollments = await storage.getAllEnrollments(tenantId);
  const allCourses = await storage.getAllCourses(tenantId);
  const allRenewalRequests = await storage.getAllRenewalRequests(tenantId);
  
  const deptUsers = allUsers.filter((u: User) => u.departmentId === departmentId);
  const deptUserIds = new Set(deptUsers.map((u: User) => u.id));
  const deptEnrollments = allEnrollments.filter((e: Enrollment) => deptUserIds.has(e.userId));
  const deptRenewals = allRenewalRequests.filter((r: RenewalRequest) => {
    const enrollment = allEnrollments.find((e: Enrollment) => e.id === r.enrollmentId);
    return enrollment && deptUserIds.has(enrollment.userId);
  });
  
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  
  const courseMap = new Map<number, Course>(allCourses.map((c: Course) => [c.id, c]));
  
  const completedEnrollments = deptEnrollments.filter((e: Enrollment) => e.status === 'completed').length;
  const expiringEnrollments = deptEnrollments.filter((e: Enrollment) => {
    if (!e.expiresAt) return false;
    const expDate = new Date(e.expiresAt);
    return expDate > now && expDate <= thirtyDaysFromNow;
  }).length;
  const expiredEnrollments = deptEnrollments.filter((e: Enrollment) => {
    if (!e.expiresAt) return false;
    return new Date(e.expiresAt) < now;
  }).length;
  
  const pendingRenewals = deptRenewals.filter((r: RenewalRequest) => 
    r.status === 'pending' || r.status === 'foreman_approved'
  ).length;
  
  const complianceRate = deptEnrollments.length > 0 
    ? Math.round(((deptEnrollments.length - expiredEnrollments) / deptEnrollments.length) * 100)
    : 100;
  
  const avgCompletion = deptEnrollments.length > 0
    ? Math.round((completedEnrollments / deptEnrollments.length) * 100)
    : 0;
  
  const employeeStats = deptUsers.map((user: User) => {
    const userEnrollments = deptEnrollments.filter((e: Enrollment) => e.userId === user.id);
    const completed = userEnrollments.filter((e: Enrollment) => e.status === 'completed').length;
    const expiring = userEnrollments.filter((e: Enrollment) => {
      if (!e.expiresAt) return false;
      const expDate = new Date(e.expiresAt);
      return expDate > now && expDate <= thirtyDaysFromNow;
    }).length;
    
    return {
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
      role: user.role,
      completionRate: userEnrollments.length > 0 ? Math.round((completed / userEnrollments.length) * 100) : 0,
      expiringCourses: expiring,
    };
  });
  
  const courseStats = new Map<number, { enrolled: number; completed: number; expiring: number; expired: number }>();
  deptEnrollments.forEach((e: Enrollment) => {
    if (!e.courseId) return;
    if (!courseStats.has(e.courseId)) {
      courseStats.set(e.courseId, { enrolled: 0, completed: 0, expiring: 0, expired: 0 });
    }
    const stats = courseStats.get(e.courseId)!;
    stats.enrolled++;
    if (e.status === 'completed') stats.completed++;
    if (e.expiresAt) {
      const expDate = new Date(e.expiresAt);
      if (expDate < now) stats.expired++;
      else if (expDate <= thirtyDaysFromNow) stats.expiring++;
    }
  });
  
  const courseBreakdown = Array.from(courseStats.entries()).map(([courseId, stats]) => {
    const course = courseMap.get(courseId);
    return {
      courseName: course?.title || 'Unknown Course',
      ...stats,
    };
  });
  
  return {
    department: {
      name: department.name,
      code: department.code || '',
    },
    summary: {
      totalEmployees: deptUsers.length,
      complianceRate,
      avgTrainingCompletion: avgCompletion,
      pendingRenewals,
      upcomingExpirations: expiringEnrollments,
    },
    employees: employeeStats,
    courseBreakdown,
    generatedAt: new Date(),
  };
}

function generateComplianceHTML(data: TrainingComplianceData): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 8px; }
    h2 { color: #444; font-size: 18px; margin-top: 30px; margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
    .timestamp { color: #666; font-size: 12px; margin-bottom: 24px; }
    .summary-grid { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
    .summary-card { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; padding: 16px; min-width: 180px; }
    .summary-card h3 { margin: 0 0 8px 0; font-size: 14px; color: #666; }
    .summary-card .value { font-size: 28px; font-weight: bold; color: #1a1a1a; }
    .summary-card .value.good { color: #22c55e; }
    .summary-card .value.warning { color: #f59e0b; }
    .summary-card .value.danger { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    th { background-color: #f3f4f6; border: 1px solid #ddd; padding: 10px 8px; text-align: left; font-weight: 600; }
    td { border: 1px solid #ddd; padding: 8px; }
    tr:nth-child(even) { background-color: #fafafa; }
    .status-compliant { color: #22c55e; font-weight: 500; }
    .status-at-risk { color: #f59e0b; font-weight: 500; }
    .status-non-compliant { color: #ef4444; font-weight: 500; }
    .status-no-training { color: #6b7280; font-weight: 500; }
  </style>
</head>
<body>
  <h1>Training Compliance Report</h1>
  <p class="timestamp">Generated: ${formatDate(data.generatedAt)}</p>
  
  <h2>Summary</h2>
  <div class="summary-grid">
    <div class="summary-card">
      <h3>Total Employees</h3>
      <div class="value">${data.summary.totalEmployees}</div>
    </div>
    <div class="summary-card">
      <h3>Overall Compliance Rate</h3>
      <div class="value ${data.summary.overallComplianceRate >= 80 ? 'good' : data.summary.overallComplianceRate >= 60 ? 'warning' : 'danger'}">${data.summary.overallComplianceRate}%</div>
    </div>
    <div class="summary-card">
      <h3>Trained Compliance Rate</h3>
      <div class="value ${data.summary.trainingComplianceRate >= 80 ? 'good' : data.summary.trainingComplianceRate >= 60 ? 'warning' : 'danger'}">${data.summary.trainingComplianceRate}%</div>
    </div>
    <div class="summary-card">
      <h3>Compliant</h3>
      <div class="value good">${data.summary.compliantEmployees}</div>
    </div>
    <div class="summary-card">
      <h3>At Risk</h3>
      <div class="value warning">${data.summary.atRiskEmployees}</div>
    </div>
    <div class="summary-card">
      <h3>Non-Compliant</h3>
      <div class="value danger">${data.summary.nonCompliantEmployees}</div>
    </div>
    <div class="summary-card">
      <h3>No Training</h3>
      <div class="value">${data.summary.employeesWithoutTraining}</div>
    </div>
  </div>
  
  <h2>Enrollment Statistics</h2>
  <div class="summary-grid">
    <div class="summary-card">
      <h3>Total Enrollments</h3>
      <div class="value">${data.enrollmentStats.total}</div>
    </div>
    <div class="summary-card">
      <h3>Active</h3>
      <div class="value good">${data.enrollmentStats.active}</div>
    </div>
    <div class="summary-card">
      <h3>Completed</h3>
      <div class="value good">${data.enrollmentStats.completed}</div>
    </div>
    <div class="summary-card">
      <h3>Expiring Soon</h3>
      <div class="value warning">${data.enrollmentStats.expiringSoon}</div>
    </div>
    <div class="summary-card">
      <h3>Expired</h3>
      <div class="value danger">${data.enrollmentStats.expired}</div>
    </div>
  </div>
  
  <h2>Employee Details</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Department</th>
        <th>Role</th>
        <th>Total</th>
        <th>Completed</th>
        <th>Expiring</th>
        <th>Expired</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${data.employees.map(emp => `
        <tr>
          <td>${emp.name}</td>
          <td>${emp.department}</td>
          <td>${emp.role}</td>
          <td>${emp.totalCourses}</td>
          <td>${emp.completedCourses}</td>
          <td>${emp.expiringCourses}</td>
          <td>${emp.expiredCourses}</td>
          <td class="status-${emp.complianceStatus.toLowerCase().replace(' ', '-')}">${emp.complianceStatus}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
}

function generateEmployeeHTML(data: EmployeeProgressData): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 8px; }
    h2 { color: #444; font-size: 18px; margin-top: 30px; margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
    .timestamp { color: #666; font-size: 12px; margin-bottom: 24px; }
    .info-grid { display: grid; grid-template-columns: 120px 1fr; gap: 8px 16px; margin-bottom: 24px; }
    .info-label { color: #666; font-weight: 500; }
    .info-value { color: #1a1a1a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    th { background-color: #f3f4f6; border: 1px solid #ddd; padding: 10px 8px; text-align: left; font-weight: 600; }
    td { border: 1px solid #ddd; padding: 8px; }
    tr:nth-child(even) { background-color: #fafafa; }
    .empty-message { color: #666; font-style: italic; padding: 16px; text-align: center; background: #f9f9f9; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>Employee Progress Report</h1>
  <p class="timestamp">Generated: ${formatDate(data.generatedAt)}</p>
  
  <h2>Employee Information</h2>
  <div class="info-grid">
    <span class="info-label">Name:</span><span class="info-value">${data.employee.name}</span>
    <span class="info-label">Email:</span><span class="info-value">${data.employee.email}</span>
    <span class="info-label">Role:</span><span class="info-value">${data.employee.role}</span>
    <span class="info-label">Department:</span><span class="info-value">${data.employee.department}</span>
    <span class="info-label">Current Grade:</span><span class="info-value">${data.employee.currentGrade}</span>
    <span class="info-label">Hire Date:</span><span class="info-value">${data.employee.hireDate}</span>
  </div>
  
  <h2>Training Enrollments</h2>
  ${data.enrollments.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Course</th>
          <th>Category</th>
          <th>Status</th>
          <th>Enrolled</th>
          <th>Completed</th>
          <th>Expires</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        ${data.enrollments.map(e => `
          <tr>
            <td>${e.courseName}</td>
            <td>${e.category}</td>
            <td>${e.status}</td>
            <td>${e.enrolledDate}</td>
            <td>${e.completedDate || '-'}</td>
            <td>${e.expirationDate}</td>
            <td>${e.score !== null ? e.score : '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<p class="empty-message">No enrollments found.</p>'}
  
  <h2>Progression Tasks</h2>
  ${data.progressionTasks.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Task</th>
          <th>Target Grade</th>
          <th>Status</th>
          <th>Due Date</th>
          <th>Completed</th>
        </tr>
      </thead>
      <tbody>
        ${data.progressionTasks.map(t => `
          <tr>
            <td>${t.title}</td>
            <td>${t.targetGrade}</td>
            <td>${t.status}</td>
            <td>${t.dueDate || '-'}</td>
            <td>${t.completedDate || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<p class="empty-message">No progression tasks found.</p>'}
  
  <h2>Renewal Requests</h2>
  ${data.renewalRequests.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Course</th>
          <th>Status</th>
          <th>Submitted</th>
          <th>Approved</th>
        </tr>
      </thead>
      <tbody>
        ${data.renewalRequests.map(r => `
          <tr>
            <td>${r.courseName}</td>
            <td>${r.status}</td>
            <td>${r.submittedDate}</td>
            <td>${r.approvedDate || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<p class="empty-message">No renewal requests found.</p>'}
</body>
</html>`;
}

function generateDepartmentHTML(data: DepartmentStatsData): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 8px; }
    h2 { color: #444; font-size: 18px; margin-top: 30px; margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
    .timestamp { color: #666; font-size: 12px; margin-bottom: 24px; }
    .summary-grid { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
    .summary-card { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; padding: 16px; min-width: 160px; }
    .summary-card h3 { margin: 0 0 8px 0; font-size: 14px; color: #666; }
    .summary-card .value { font-size: 28px; font-weight: bold; color: #1a1a1a; }
    .summary-card .value.good { color: #22c55e; }
    .summary-card .value.warning { color: #f59e0b; }
    .summary-card .value.danger { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    th { background-color: #f3f4f6; border: 1px solid #ddd; padding: 10px 8px; text-align: left; font-weight: 600; }
    td { border: 1px solid #ddd; padding: 8px; }
    tr:nth-child(even) { background-color: #fafafa; }
  </style>
</head>
<body>
  <h1>Department Report: ${data.department.name}${data.department.code ? ` (${data.department.code})` : ''}</h1>
  <p class="timestamp">Generated: ${formatDate(data.generatedAt)}</p>
  
  <h2>Summary</h2>
  <div class="summary-grid">
    <div class="summary-card">
      <h3>Total Employees</h3>
      <div class="value">${data.summary.totalEmployees}</div>
    </div>
    <div class="summary-card">
      <h3>Compliance Rate</h3>
      <div class="value ${data.summary.complianceRate >= 80 ? 'good' : data.summary.complianceRate >= 60 ? 'warning' : 'danger'}">${data.summary.complianceRate}%</div>
    </div>
    <div class="summary-card">
      <h3>Avg Completion</h3>
      <div class="value">${data.summary.avgTrainingCompletion}%</div>
    </div>
    <div class="summary-card">
      <h3>Pending Renewals</h3>
      <div class="value warning">${data.summary.pendingRenewals}</div>
    </div>
    <div class="summary-card">
      <h3>Upcoming Expirations</h3>
      <div class="value warning">${data.summary.upcomingExpirations}</div>
    </div>
  </div>
  
  <h2>Employee Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Role</th>
        <th>Completion %</th>
        <th>Expiring Courses</th>
      </tr>
    </thead>
    <tbody>
      ${data.employees.map(e => `
        <tr>
          <td>${e.name}</td>
          <td>${e.role}</td>
          <td>${e.completionRate}%</td>
          <td>${e.expiringCourses}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Course Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Course</th>
        <th>Enrolled</th>
        <th>Completed</th>
        <th>Expiring</th>
        <th>Expired</th>
      </tr>
    </thead>
    <tbody>
      ${data.courseBreakdown.map(c => `
        <tr>
          <td>${c.courseName}</td>
          <td>${c.enrolled}</td>
          <td>${c.completed}</td>
          <td>${c.expiring}</td>
          <td>${c.expired}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
}

export async function generateTrainingCompliancePDF(data: TrainingComplianceData): Promise<Buffer> {
  const html = generateComplianceHTML(data);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export async function generateEmployeeProgressPDF(data: EmployeeProgressData): Promise<Buffer> {
  const html = generateEmployeeHTML(data);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export async function generateDepartmentStatsPDF(data: DepartmentStatsData): Promise<Buffer> {
  const html = generateDepartmentHTML(data);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export function generateTrainingComplianceExcel(data: TrainingComplianceData): Buffer {
  const wb = XLSX.utils.book_new();
  
  const summaryData = [
    ['Training Compliance Report'],
    [`Generated: ${formatDate(data.generatedAt)}`],
    [],
    ['Summary Statistics'],
    ['Total Employees', data.summary.totalEmployees],
    ['Employees With Training', data.summary.employeesWithTraining],
    ['Employees Without Training', data.summary.employeesWithoutTraining],
    ['Compliant Employees', data.summary.compliantEmployees],
    ['At Risk Employees', data.summary.atRiskEmployees],
    ['Non-Compliant Employees', data.summary.nonCompliantEmployees],
    ['Overall Compliance Rate', `${data.summary.overallComplianceRate}%`],
    ['Trained Compliance Rate', `${data.summary.trainingComplianceRate}%`],
    [],
    ['Enrollment Statistics'],
    ['Total Enrollments', data.enrollmentStats.total],
    ['Active', data.enrollmentStats.active],
    ['Completed', data.enrollmentStats.completed],
    ['Expiring Soon', data.enrollmentStats.expiringSoon],
    ['Expired', data.enrollmentStats.expired],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  
  const employeeData = [
    ['Name', 'Department', 'Role', 'Total Courses', 'Completed', 'Expiring', 'Expired', 'Status'],
    ...data.employees.map(e => [
      e.name,
      e.department,
      e.role,
      e.totalCourses,
      e.completedCourses,
      e.expiringCourses,
      e.expiredCourses,
      e.complianceStatus,
    ]),
  ];
  const employeeSheet = XLSX.utils.aoa_to_sheet(employeeData);
  XLSX.utils.book_append_sheet(wb, employeeSheet, 'Employees');
  
  const output = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(output);
}

export function generateEmployeeProgressExcel(data: EmployeeProgressData): Buffer {
  const wb = XLSX.utils.book_new();
  
  const infoData = [
    ['Employee Progress Report'],
    [`Generated: ${formatDate(data.generatedAt)}`],
    [],
    ['Employee Information'],
    ['Name', data.employee.name],
    ['Email', data.employee.email],
    ['Role', data.employee.role],
    ['Department', data.employee.department],
    ['Current Grade', data.employee.currentGrade],
    ['Hire Date', data.employee.hireDate],
  ];
  const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
  XLSX.utils.book_append_sheet(wb, infoSheet, 'Info');
  
  const enrollmentData = [
    ['Course', 'Category', 'Status', 'Enrolled', 'Completed', 'Expires', 'Score'],
    ...data.enrollments.map(e => [
      e.courseName,
      e.category,
      e.status,
      e.enrolledDate,
      e.completedDate || '',
      e.expirationDate,
      e.score !== null ? e.score : '',
    ]),
  ];
  const enrollmentSheet = XLSX.utils.aoa_to_sheet(enrollmentData);
  XLSX.utils.book_append_sheet(wb, enrollmentSheet, 'Enrollments');
  
  const taskData = [
    ['Task', 'Target Grade', 'Status', 'Due Date', 'Completed'],
    ...data.progressionTasks.map(t => [
      t.title,
      t.targetGrade,
      t.status,
      t.dueDate || '',
      t.completedDate || '',
    ]),
  ];
  const taskSheet = XLSX.utils.aoa_to_sheet(taskData);
  XLSX.utils.book_append_sheet(wb, taskSheet, 'Tasks');
  
  const renewalData = [
    ['Course', 'Status', 'Submitted', 'Approved'],
    ...data.renewalRequests.map(r => [
      r.courseName,
      r.status,
      r.submittedDate,
      r.approvedDate || '',
    ]),
  ];
  const renewalSheet = XLSX.utils.aoa_to_sheet(renewalData);
  XLSX.utils.book_append_sheet(wb, renewalSheet, 'Renewals');
  
  const output = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(output);
}

export function generateDepartmentStatsExcel(data: DepartmentStatsData): Buffer {
  const wb = XLSX.utils.book_new();
  
  const summaryData = [
    [`Department Report: ${data.department.name}`],
    [`Generated: ${formatDate(data.generatedAt)}`],
    [],
    ['Summary'],
    ['Total Employees', data.summary.totalEmployees],
    ['Compliance Rate', `${data.summary.complianceRate}%`],
    ['Avg Completion', `${data.summary.avgTrainingCompletion}%`],
    ['Pending Renewals', data.summary.pendingRenewals],
    ['Upcoming Expirations', data.summary.upcomingExpirations],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  
  const employeeData = [
    ['Name', 'Role', 'Completion %', 'Expiring Courses'],
    ...data.employees.map(e => [
      e.name,
      e.role,
      e.completionRate,
      e.expiringCourses,
    ]),
  ];
  const employeeSheet = XLSX.utils.aoa_to_sheet(employeeData);
  XLSX.utils.book_append_sheet(wb, employeeSheet, 'Employees');
  
  const courseData = [
    ['Course', 'Enrolled', 'Completed', 'Expiring', 'Expired'],
    ...data.courseBreakdown.map(c => [
      c.courseName,
      c.enrolled,
      c.completed,
      c.expiring,
      c.expired,
    ]),
  ];
  const courseSheet = XLSX.utils.aoa_to_sheet(courseData);
  XLSX.utils.book_append_sheet(wb, courseSheet, 'Courses');
  
  const output = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(output);
}

export function generateJSONExport(data: TrainingComplianceData | EmployeeProgressData | DepartmentStatsData): string {
  return JSON.stringify(data, null, 2);
}
