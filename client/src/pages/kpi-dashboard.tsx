import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface TrendData {
  month: string;
  activeEnrollments: number;
  newEnrollments: number;
  expiredEnrollments: number;
  complianceRate: number;
  trainedEmployees: number;
}

interface TrendResponse {
  trends: TrendData[];
  summary: {
    complianceGrowth: number;
    enrollmentGrowth: number;
    averageComplianceRate: number;
    totalNewEnrollments: number;
    totalExpiredEnrollments: number;
  };
  period: string;
  generatedAt: string;
}

interface DepartmentMetrics {
  departmentId: number;
  departmentName: string;
  departmentCode: string;
  employeeCount: number;
  metrics: {
    complianceRate: number;
    trainingRate: number;
    completionRate: number;
    taskCompletionRate: number;
  };
  enrollments: {
    total: number;
    active: number;
    expired: number;
    expiringIn30Days: number;
  };
}

interface DepartmentComparisonResponse {
  departments: DepartmentMetrics[];
  organizationAverages: {
    complianceRate: number;
    trainingRate: number;
    completionRate: number;
    taskCompletionRate: number;
  };
  topPerformers: { name: string; complianceRate: number }[];
  needsAttention: { name: string; complianceRate: number }[];
}

interface KPISummaryResponse {
  personalKPIs?: {
    myCourses: number;
    myActiveCourses: number;
    myCompletedCourses: number;
    myExpiredCourses: number;
    myExpiringIn30Days: number;
    myTasks: number;
    myCompletedTasks: number;
    myTaskProgress: number;
  };
  organizationKPIs?: {
    totalEmployees: number;
    totalEnrollments: number;
    activeEnrollments: number;
    expiredEnrollments: number;
    complianceRate: number;
    trainingCoverage: number;
    pendingRenewals: number;
    completedRenewals: number;
    totalCourses: number;
    mandatoryCourses: number;
  };
  role: string;
}

function GrowthIndicator({ value, label }: { value: number; label: string }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  return (
    <div className="flex items-center gap-2">
      {isNeutral ? (
        <Minus className="h-4 w-4 text-muted-foreground" />
      ) : isPositive ? (
        <ArrowUpRight className="h-4 w-4 text-green-500" />
      ) : (
        <ArrowDownRight className="h-4 w-4 text-red-500" />
      )}
      <span className={`text-sm font-medium ${
        isNeutral ? 'text-muted-foreground' : isPositive ? 'text-green-500' : 'text-red-500'
      }`}>
        {isPositive ? '+' : ''}{value}% {label}
      </span>
    </div>
  );
}

function KPICard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  trend,
  status 
}: { 
  title: string; 
  value: string | number; 
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  status?: 'good' | 'warning' | 'danger';
}) {
  const statusColors = {
    good: 'text-green-500',
    warning: 'text-amber-500',
    danger: 'text-red-500',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${status ? statusColors[status] : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend !== undefined && (
          <GrowthIndicator value={trend} label="vs last period" />
        )}
      </CardContent>
    </Card>
  );
}

export default function KPIDashboard() {
  const [trendPeriod, setTrendPeriod] = useState<string>('6months');
  const { user } = useAuth();
  
  const canViewOrgKPIs = user && ['manager', 'training_officer', 'administrator'].includes(user.role);

  const { data: summary, isLoading: summaryLoading } = useQuery<KPISummaryResponse>({
    queryKey: ["/api/kpi/summary"],
  });

  const { data: trends, isLoading: trendsLoading } = useQuery<TrendResponse>({
    queryKey: ["/api/kpi/trends", trendPeriod],
    enabled: canViewOrgKPIs,
  });

  const { data: deptComparison, isLoading: deptLoading } = useQuery<DepartmentComparisonResponse>({
    queryKey: ["/api/kpi/department-comparison"],
    enabled: canViewOrgKPIs,
  });

  if (summaryLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KPI Dashboard</h1>
          <p className="text-muted-foreground mt-1">Performance metrics and analytics</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KPI Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Performance metrics and analytics
          </p>
        </div>
      </div>

      {summary?.personalKPIs && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">My Performance</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <KPICard
              title="My Courses"
              value={summary.personalKPIs.myCourses}
              description={`${summary.personalKPIs.myActiveCourses} active`}
              icon={BookOpen}
            />
            <KPICard
              title="Completed"
              value={summary.personalKPIs.myCompletedCourses}
              description="Courses finished"
              icon={CheckCircle2}
              status="good"
            />
            <KPICard
              title="Expiring Soon"
              value={summary.personalKPIs.myExpiringIn30Days}
              description="Within 30 days"
              icon={Clock}
              status={summary.personalKPIs.myExpiringIn30Days > 0 ? 'warning' : 'good'}
            />
            <KPICard
              title="Task Progress"
              value={`${summary.personalKPIs.myTaskProgress}%`}
              description={`${summary.personalKPIs.myCompletedTasks}/${summary.personalKPIs.myTasks} tasks`}
              icon={Target}
            />
          </div>
        </div>
      )}

      {canViewOrgKPIs && summary?.organizationKPIs && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
            <TabsTrigger value="departments" data-testid="tab-departments">Departments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <KPICard
                title="Total Employees"
                value={summary.organizationKPIs.totalEmployees}
                icon={Users}
              />
              <KPICard
                title="Compliance Rate"
                value={`${summary.organizationKPIs.complianceRate}%`}
                icon={CheckCircle2}
                status={summary.organizationKPIs.complianceRate >= 90 ? 'good' : 
                        summary.organizationKPIs.complianceRate >= 70 ? 'warning' : 'danger'}
              />
              <KPICard
                title="Training Coverage"
                value={`${summary.organizationKPIs.trainingCoverage}%`}
                description="Employees with training"
                icon={BookOpen}
              />
              <KPICard
                title="Pending Renewals"
                value={summary.organizationKPIs.pendingRenewals}
                description="Awaiting approval"
                icon={Clock}
                status={summary.organizationKPIs.pendingRenewals > 10 ? 'warning' : 'good'}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Enrollment Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Enrollments</span>
                      <span className="font-medium text-green-500">
                        {summary.organizationKPIs.activeEnrollments}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Expired Enrollments</span>
                      <span className="font-medium text-red-500">
                        {summary.organizationKPIs.expiredEnrollments}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Enrollments</span>
                      <span className="font-medium">
                        {summary.organizationKPIs.totalEnrollments}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Course Catalog</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Active Courses</span>
                      <span className="font-medium">
                        {summary.organizationKPIs.totalCourses}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mandatory Courses</span>
                      <Badge variant="secondary">
                        {summary.organizationKPIs.mandatoryCourses}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completed Renewals</span>
                      <span className="font-medium text-green-500">
                        {summary.organizationKPIs.completedRenewals}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h3 className="text-lg font-semibold">Historical Trends</h3>
              <Select value={trendPeriod} onValueChange={setTrendPeriod}>
                <SelectTrigger className="w-[180px]" data-testid="select-period">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="12months">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {trendsLoading ? (
              <Card>
                <CardContent className="py-8">
                  <div className="flex items-center justify-center">
                    <Skeleton className="h-64 w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : trends && (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <KPICard
                    title="Avg Compliance"
                    value={`${trends.summary.averageComplianceRate}%`}
                    icon={CheckCircle2}
                    trend={trends.summary.complianceGrowth}
                  />
                  <KPICard
                    title="Enrollment Growth"
                    value={`${trends.summary.enrollmentGrowth > 0 ? '+' : ''}${trends.summary.enrollmentGrowth}%`}
                    icon={TrendingUp}
                  />
                  <KPICard
                    title="New Enrollments"
                    value={trends.summary.totalNewEnrollments}
                    description={`Over ${trendPeriod.replace('months', ' months')}`}
                    icon={BookOpen}
                  />
                  <KPICard
                    title="Expired"
                    value={trends.summary.totalExpiredEnrollments}
                    description={`Over ${trendPeriod.replace('months', ' months')}`}
                    icon={AlertTriangle}
                    status={trends.summary.totalExpiredEnrollments > 10 ? 'warning' : 'good'}
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Compliance Rate Over Time</CardTitle>
                    <CardDescription>Monthly compliance percentage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trends.trends}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis domain={[0, 100]} className="text-xs" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="complianceRate" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Enrollment Activity</CardTitle>
                    <CardDescription>New vs expired enrollments per month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trends.trends}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px'
                            }}
                          />
                          <Bar dataKey="newEnrollments" fill="hsl(var(--primary))" name="New" />
                          <Bar dataKey="expiredEnrollments" fill="hsl(var(--destructive))" name="Expired" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            {deptLoading ? (
              <Card>
                <CardContent className="py-8">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ) : deptComparison && (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <KPICard
                    title="Avg Compliance"
                    value={`${deptComparison.organizationAverages.complianceRate}%`}
                    icon={CheckCircle2}
                  />
                  <KPICard
                    title="Avg Training Rate"
                    value={`${deptComparison.organizationAverages.trainingRate}%`}
                    icon={BookOpen}
                  />
                  <KPICard
                    title="Departments"
                    value={deptComparison.departments.length}
                    icon={Building2}
                  />
                  <KPICard
                    title="Need Attention"
                    value={deptComparison.needsAttention.length}
                    description="Below 80% compliance"
                    icon={AlertTriangle}
                    status={deptComparison.needsAttention.length > 0 ? 'warning' : 'good'}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Top Performers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {deptComparison.topPerformers.length > 0 ? (
                        <div className="space-y-3">
                          {deptComparison.topPerformers.map((dept, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{idx + 1}</Badge>
                                <span className="font-medium">{dept.name}</span>
                              </div>
                              <span className="text-green-500 font-medium">
                                {dept.complianceRate}%
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No departments yet</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-amber-500" />
                        Needs Attention
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {deptComparison.needsAttention.length > 0 ? (
                        <div className="space-y-3">
                          {deptComparison.needsAttention.map((dept, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="font-medium">{dept.name}</span>
                              <Badge variant="destructive">
                                {dept.complianceRate}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          All departments above 80% compliance
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Department Comparison</CardTitle>
                    <CardDescription>Compliance rates across all departments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptComparison.departments} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" domain={[0, 100]} className="text-xs" />
                          <YAxis 
                            type="category" 
                            dataKey="departmentName" 
                            className="text-xs" 
                            width={100}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px'
                            }}
                            formatter={(value: number) => [`${value}%`, 'Compliance']}
                          />
                          <Bar dataKey="metrics.complianceRate" fill="hsl(var(--primary))">
                            {deptComparison.departments.map((dept, index) => (
                              <Cell 
                                key={`cell-${index}`}
                                fill={dept.metrics.complianceRate >= 90 
                                  ? 'hsl(142.1 76.2% 36.3%)' 
                                  : dept.metrics.complianceRate >= 70 
                                    ? 'hsl(47.9 95.8% 53.1%)'
                                    : 'hsl(0 84.2% 60.2%)'
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium">Department</th>
                            <th className="text-right py-2 font-medium">Employees</th>
                            <th className="text-right py-2 font-medium">Compliance</th>
                            <th className="text-right py-2 font-medium">Training</th>
                            <th className="text-right py-2 font-medium">Active</th>
                            <th className="text-right py-2 font-medium">Expiring</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deptComparison.departments.map((dept) => (
                            <tr key={dept.departmentId} className="border-b last:border-0">
                              <td className="py-2 font-medium">{dept.departmentName}</td>
                              <td className="text-right py-2">{dept.employeeCount}</td>
                              <td className="text-right py-2">
                                <Badge variant={
                                  dept.metrics.complianceRate >= 90 ? 'default' :
                                  dept.metrics.complianceRate >= 70 ? 'secondary' : 'destructive'
                                }>
                                  {dept.metrics.complianceRate}%
                                </Badge>
                              </td>
                              <td className="text-right py-2">{dept.metrics.trainingRate}%</td>
                              <td className="text-right py-2 text-green-500">{dept.enrollments.active}</td>
                              <td className="text-right py-2 text-amber-500">{dept.enrollments.expiringIn30Days}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {!canViewOrgKPIs && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Organization-wide analytics are available for managers and administrators.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
