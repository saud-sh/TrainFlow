import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { 
  FileText, 
  Download,
  BarChart3,
  Users,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp
} from "lucide-react";

interface ReportStats {
  totalEmployees: number;
  totalCourses: number;
  totalEnrollments: number;
  activeEnrollments: number;
  expiringEnrollments: number;
  expiredEnrollments: number;
  complianceRate: number;
  pendingRenewals: number;
  approvedThisMonth: number;
  departmentStats: {
    name: string;
    employees: number;
    compliance: number;
  }[];
}

export default function Reports() {
  const [reportType, setReportType] = useState("compliance");
  const [exportFormat, setExportFormat] = useState("pdf");

  const { data: stats, isLoading } = useQuery<ReportStats>({
    queryKey: ["/api/reports/stats"],
  });

  const handleExport = () => {
    window.open(`/api/reports/export?type=${reportType}&format=${exportFormat}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Reports
          </h1>
          <p className="text-muted-foreground">
            Generate and export enterprise reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48" data-testid="select-report-type">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compliance">Compliance Report</SelectItem>
              <SelectItem value="training">Training Summary</SelectItem>
              <SelectItem value="renewals">Renewal Status</SelectItem>
              <SelectItem value="department">Department Overview</SelectItem>
            </SelectContent>
          </Select>
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-32" data-testid="select-format">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} data-testid="button-export">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{stats?.totalEmployees || 0}</p>
              </div>
              <Users className="h-8 w-8 text-chart-1/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold">{stats?.totalCourses || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-chart-2/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Enrollments</p>
                <p className="text-2xl font-bold">{stats?.activeEnrollments || 0}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-chart-4/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
                <p className="text-2xl font-bold text-chart-2">
                  {stats?.complianceRate || 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-chart-2/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-chart-1" />
              Training Compliance Overview
            </CardTitle>
            <CardDescription>
              Current status of training across the organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-chart-2" />
                    Active Enrollments
                  </span>
                  <span className="font-medium">{stats?.activeEnrollments || 0}</span>
                </div>
                <Progress
                  value={
                    stats?.totalEnrollments
                      ? (stats.activeEnrollments / stats.totalEnrollments) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    Expiring Soon
                  </span>
                  <span className="font-medium">{stats?.expiringEnrollments || 0}</span>
                </div>
                <Progress
                  value={
                    stats?.totalEnrollments
                      ? (stats.expiringEnrollments / stats.totalEnrollments) * 100
                      : 0
                  }
                  className="h-2 [&>div]:bg-yellow-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Expired
                  </span>
                  <span className="font-medium">{stats?.expiredEnrollments || 0}</span>
                </div>
                <Progress
                  value={
                    stats?.totalEnrollments
                      ? (stats.expiredEnrollments / stats.totalEnrollments) * 100
                      : 0
                  }
                  className="h-2 [&>div]:bg-destructive"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Renewal Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-chart-3" />
              Renewal Statistics
            </CardTitle>
            <CardDescription>
              Monthly renewal request activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold">{stats?.pendingRenewals || 0}</p>
                  <p className="text-sm text-muted-foreground">Pending Renewals</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-chart-2">
                    {stats?.approvedThisMonth || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Approved This Month</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-chart-4" />
              Department Compliance
            </CardTitle>
            <CardDescription>
              Training compliance by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.departmentStats && stats.departmentStats.length > 0 ? (
              <div className="space-y-4">
                {stats.departmentStats.map((dept, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{dept.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {dept.employees} employees
                        </p>
                      </div>
                      <span
                        className={`text-lg font-bold ${
                          dept.compliance >= 90
                            ? "text-chart-2"
                            : dept.compliance >= 70
                            ? "text-yellow-600"
                            : "text-destructive"
                        }`}
                      >
                        {dept.compliance}%
                      </span>
                    </div>
                    <Progress
                      value={dept.compliance}
                      className={`h-2 ${
                        dept.compliance >= 90
                          ? ""
                          : dept.compliance >= 70
                          ? "[&>div]:bg-yellow-500"
                          : "[&>div]:bg-destructive"
                      }`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No department data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
