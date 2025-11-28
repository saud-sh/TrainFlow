import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { KPICard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  Users,
  FileText,
  ArrowRight,
  Sparkles,
  ClipboardCheck
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { UserRole, Enrollment, RenewalRequest, ProgressionTask, Course, User } from "@shared/schema";

interface DashboardStats {
  totalCourses: number;
  activeCourses: number;
  expiringCourses: number;
  expiredCourses: number;
  pendingRenewals: number;
  completedTasks: number;
  totalTasks: number;
  pendingApprovals?: number;
  teamSize?: number;
}

interface EnrollmentWithCourse extends Enrollment {
  course: Course;
}

interface RenewalWithDetails extends RenewalRequest {
  enrollment: EnrollmentWithCourse;
  requester?: User;
}

function EmployeeDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: expiringEnrollments = [], isLoading: enrollmentsLoading } = useQuery<EnrollmentWithCourse[]>({
    queryKey: ["/api/enrollments/expiring"],
  });

  const { data: pendingRenewals = [], isLoading: renewalsLoading } = useQuery<RenewalWithDetails[]>({
    queryKey: ["/api/renewals/my"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<ProgressionTask[]>({
    queryKey: ["/api/progression-tasks"],
  });

  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Courses"
          value={stats?.activeCourses || 0}
          subtitle={`of ${stats?.totalCourses || 0} total`}
          icon={<BookOpen className="h-5 w-5" />}
          variant="success"
        />
        <KPICard
          title="Expiring Soon"
          value={stats?.expiringCourses || 0}
          subtitle="Within 30 days"
          icon={<Clock className="h-5 w-5" />}
          variant={stats?.expiringCourses ? "warning" : "default"}
        />
        <KPICard
          title="Pending Renewals"
          value={stats?.pendingRenewals || 0}
          subtitle="Awaiting approval"
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <KPICard
          title="Progression Tasks"
          value={`${stats?.completedTasks || 0}/${stats?.totalTasks || 0}`}
          subtitle="Completed"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Courses Expiring Soon
              </CardTitle>
              <CardDescription>
                Training that needs renewal
              </CardDescription>
            </div>
            <Link href="/my-courses">
              <Button variant="ghost" size="sm" data-testid="button-view-all-courses">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {enrollmentsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : expiringEnrollments.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-chart-2" />
                <p className="text-muted-foreground">All courses are up to date!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiringEnrollments.slice(0, 5).map((enrollment) => {
                  const daysUntilExpiry = differenceInDays(
                    new Date(enrollment.expiresAt),
                    new Date()
                  );
                  return (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate"
                      data-testid={`expiring-course-${enrollment.id}`}
                    >
                      <div>
                        <p className="font-medium">{enrollment.course?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Expires {format(new Date(enrollment.expiresAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <StatusBadge
                        status={daysUntilExpiry <= 7 ? "expired" : "expiring_soon"}
                        size="sm"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Renewal Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-chart-1" />
                My Renewal Requests
              </CardTitle>
              <CardDescription>
                Track your renewal submissions
              </CardDescription>
            </div>
            <Link href="/my-renewals">
              <Button variant="ghost" size="sm" data-testid="button-view-all-renewals">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {renewalsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : pendingRenewals.length === 0 ? (
              <div className="py-8 text-center">
                <ClipboardCheck className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No renewal requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRenewals.slice(0, 5).map((renewal) => (
                  <div
                    key={renewal.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate"
                    data-testid={`renewal-request-${renewal.id}`}
                  >
                    <div>
                      <p className="font-medium">
                        {renewal.enrollment?.course?.title || "Course"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Submitted {renewal.createdAt ? format(new Date(renewal.createdAt), "MMM d, yyyy") : ""}
                      </p>
                    </div>
                    <StatusBadge status={renewal.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progression Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-chart-4" />
              Progression Tasks
            </CardTitle>
            <CardDescription>
              Tasks required for your next promotion
            </CardDescription>
          </div>
          <Link href="/progression">
            <Button variant="ghost" size="sm" data-testid="button-view-progression">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-8 text-center">
              <Sparkles className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No progression tasks assigned</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.slice(0, 6).map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg border hover-elevate"
                  data-testid={`task-${task.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium line-clamp-1">{task.title}</h4>
                    <StatusBadge status={task.status} size="sm" showIcon={false} />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {task.description || "No description"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Target: <span className="font-medium">{task.targetGrade}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SupervisorDashboard() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: pendingApprovals = [], isLoading: approvalsLoading } = useQuery<RenewalWithDetails[]>({
    queryKey: ["/api/renewals/pending-approval"],
  });

  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Pending Approvals"
          value={stats?.pendingApprovals || 0}
          subtitle="Awaiting your review"
          icon={<ClipboardCheck className="h-5 w-5" />}
          variant={stats?.pendingApprovals ? "warning" : "default"}
        />
        <KPICard
          title="Team Size"
          value={stats?.teamSize || 0}
          subtitle="Direct reports"
          icon={<Users className="h-5 w-5" />}
        />
        <KPICard
          title="Expiring Courses"
          value={stats?.expiringCourses || 0}
          subtitle="Team members affected"
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={stats?.expiringCourses ? "warning" : "default"}
        />
        <KPICard
          title="Completion Rate"
          value={`${stats?.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%`}
          subtitle="Team training compliance"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-chart-3" />
              Pending Approvals
            </CardTitle>
            <CardDescription>
              Renewal requests requiring your approval
            </CardDescription>
          </div>
          <Link href="/approvals">
            <Button variant="ghost" size="sm" data-testid="button-view-approvals">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {approvalsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-chart-2" />
              <p className="text-muted-foreground">No pending approvals</p>
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  key: "employee",
                  header: "Employee",
                  cell: (row) => (
                    <div>
                      <p className="font-medium">
                        {row.requester?.firstName} {row.requester?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {row.requester?.email}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "course",
                  header: "Course",
                  cell: (row) => row.enrollment?.course?.title || "N/A",
                },
                {
                  key: "status",
                  header: "Status",
                  cell: (row) => <StatusBadge status={row.status} size="sm" />,
                },
                {
                  key: "submitted",
                  header: "Submitted",
                  cell: (row) =>
                    row.createdAt
                      ? format(new Date(row.createdAt), "MMM d, yyyy")
                      : "N/A",
                },
                {
                  key: "actions",
                  header: "",
                  cell: (row) => (
                    <Link href={`/approvals/${row.id}`}>
                      <Button size="sm" data-testid={`button-review-${row.id}`}>
                        Review
                      </Button>
                    </Link>
                  ),
                  className: "text-right",
                },
              ]}
              data={pendingApprovals.slice(0, 5)}
              emptyMessage="No pending approvals"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TrainingOfficerDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Courses"
          value={stats?.totalCourses || 0}
          subtitle="In the system"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <KPICard
          title="Active Enrollments"
          value={stats?.activeCourses || 0}
          subtitle="Across all employees"
          icon={<Users className="h-5 w-5" />}
        />
        <KPICard
          title="Expiring Soon"
          value={stats?.expiringCourses || 0}
          subtitle="Within 30 days"
          icon={<Clock className="h-5 w-5" />}
          variant={stats?.expiringCourses ? "warning" : "default"}
        />
        <KPICard
          title="Pending Renewals"
          value={stats?.pendingRenewals || 0}
          subtitle="Awaiting processing"
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/courses">
          <Card className="hover-elevate cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-chart-1" />
                Manage Courses
              </CardTitle>
              <CardDescription>
                Create, edit, and organize training courses
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/enrollments">
          <Card className="hover-elevate cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-chart-2" />
                Manage Enrollments
              </CardTitle>
              <CardDescription>
                Enroll employees in training courses
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/reports">
          <Card className="hover-elevate cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-chart-3" />
                Generate Reports
              </CardTitle>
              <CardDescription>
                Export training compliance reports
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Recent Courses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Recent Courses</CardTitle>
            <CardDescription>
              Recently added or updated training courses
            </CardDescription>
          </div>
          <Link href="/courses">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {coursesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  key: "title",
                  header: "Course Title",
                  cell: (row) => (
                    <div>
                      <p className="font-medium">{row.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {row.category}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "validity",
                  header: "Validity",
                  cell: (row) => `${row.validityPeriodDays} days`,
                },
                {
                  key: "mandatory",
                  header: "Type",
                  cell: (row) => (
                    <StatusBadge
                      status={row.isMandatory ? "completed" : "pending"}
                      size="sm"
                    />
                  ),
                },
              ]}
              data={courses.slice(0, 5)}
              emptyMessage="No courses available"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Users"
          value={stats?.teamSize || 0}
          subtitle="Active accounts"
          icon={<Users className="h-5 w-5" />}
        />
        <KPICard
          title="Total Courses"
          value={stats?.totalCourses || 0}
          subtitle="In the system"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <KPICard
          title="Active Enrollments"
          value={stats?.activeCourses || 0}
          subtitle="Across all users"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <KPICard
          title="Pending Actions"
          value={(stats?.pendingRenewals || 0) + (stats?.pendingApprovals || 0)}
          subtitle="Renewals & approvals"
          icon={<ClipboardCheck className="h-5 w-5" />}
          variant="warning"
        />
      </div>

      {/* Admin Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/users">
          <Card className="hover-elevate cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-chart-1" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts and roles
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/departments">
          <Card className="hover-elevate cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-chart-2" />
                Departments
              </CardTitle>
              <CardDescription>
                Manage organizational structure
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/audit-logs">
          <Card className="hover-elevate cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-chart-3" />
                Audit Logs
              </CardTitle>
              <CardDescription>
                View system activity logs
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/reports">
          <Card className="hover-elevate cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-chart-4" />
                Reports
              </CardTitle>
              <CardDescription>
                Generate enterprise reports
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const role = (user?.role as UserRole) || "employee";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getRoleDashboard = () => {
    switch (role) {
      case "foreman":
      case "manager":
        return <SupervisorDashboard />;
      case "training_officer":
        return <TrainingOfficerDashboard />;
      case "administrator":
        return <AdminDashboard />;
      default:
        return <EmployeeDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">
          {getGreeting()}, {user?.firstName || "User"}
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your training and progression status.
        </p>
      </div>

      {getRoleDashboard()}
    </div>
  );
}
