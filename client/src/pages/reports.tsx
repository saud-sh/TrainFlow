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
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download,
  BarChart3,
  Users,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileSpreadsheet,
  FileJson,
  Building2
} from "lucide-react";
import type { Department } from "@shared/schema";

interface ReportStats {
  totalEmployees: number;
  employeesWithTraining: number;
  employeesWithoutTraining: number;
  compliantEmployees: number;
  totalCourses: number;
  totalEnrollments: number;
  activeEnrollments: number;
  expiringEnrollments: number;
  expiredEnrollments: number;
  complianceRate: number;
  trainingComplianceRate: number;
  overallComplianceRate: number;
  pendingRenewals: number;
  approvedThisMonth: number;
  departmentStats: {
    name: string;
    employees: number;
    compliance: number;
  }[];
}

type ExportFormat = "pdf" | "excel" | "json";

export default function Reports() {
  const [complianceFormat, setComplianceFormat] = useState<ExportFormat>("excel");
  const [departmentFormat, setDepartmentFormat] = useState<ExportFormat>("excel");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [isExportingCompliance, setIsExportingCompliance] = useState(false);
  const [isExportingDepartment, setIsExportingDepartment] = useState(false);
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery<ReportStats>({
    queryKey: ["/api/reports/stats"],
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const getFileExtension = (format: ExportFormat): string => {
    switch (format) {
      case "excel": return "xlsx";
      case "pdf": return "pdf";
      case "json": return "json";
    }
  };

  const handleExportTrainingCompliance = async () => {
    setIsExportingCompliance(true);
    try {
      const response = await fetch(`/api/reports/export/training-compliance/${complianceFormat}`);
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `training-compliance-report.${getFileExtension(complianceFormat)}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `Training compliance report exported as ${complianceFormat.toUpperCase()}.`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExportingCompliance(false);
    }
  };

  const handleExportDepartment = async () => {
    if (!selectedDepartment) {
      toast({
        title: "Select Department",
        description: "Please select a department to export.",
        variant: "destructive",
      });
      return;
    }
    
    setIsExportingDepartment(true);
    try {
      const response = await fetch(`/api/reports/export/department/${selectedDepartment}/${departmentFormat}`);
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `department-report-${selectedDepartment}.${getFileExtension(departmentFormat)}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `Department report exported as ${departmentFormat.toUpperCase()}.`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExportingDepartment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" data-testid="skeleton-header" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" data-testid={`skeleton-stat-${i}`} />
          ))}
        </div>
        <Skeleton className="h-96 w-full" data-testid="skeleton-content" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <FileText className="h-6 w-6" />
            Reports
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Generate and export enterprise reports
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover-elevate" data-testid="card-stat-employees">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold" data-testid="text-total-employees">{stats?.totalEmployees || 0}</p>
              </div>
              <Users className="h-8 w-8 text-chart-1/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate" data-testid="card-stat-courses">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold" data-testid="text-total-courses">{stats?.totalCourses || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-chart-2/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate" data-testid="card-stat-active">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Enrollments</p>
                <p className="text-2xl font-bold" data-testid="text-active-enrollments">{stats?.activeEnrollments || 0}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-chart-4/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate" data-testid="card-stat-compliance">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
                <p className="text-2xl font-bold text-chart-2" data-testid="text-compliance-rate">
                  {stats?.complianceRate || 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-chart-2/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training Compliance Export */}
        <Card data-testid="card-export-compliance">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-chart-1" />
              Training Compliance Report
            </CardTitle>
            <CardDescription>
              Export comprehensive training compliance data for all employees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Export Format</label>
                <Select 
                  value={complianceFormat} 
                  onValueChange={(v) => setComplianceFormat(v as ExportFormat)}
                >
                  <SelectTrigger data-testid="select-compliance-format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel" data-testid="option-compliance-excel">
                      <span className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel Spreadsheet
                      </span>
                    </SelectItem>
                    <SelectItem value="pdf" data-testid="option-compliance-pdf">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        PDF Report
                      </span>
                    </SelectItem>
                    <SelectItem value="json" data-testid="option-compliance-json">
                      <span className="flex items-center gap-2">
                        <FileJson className="h-4 w-4" />
                        JSON Data
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-6">
                <Button 
                  onClick={handleExportTrainingCompliance}
                  disabled={isExportingCompliance}
                  data-testid="button-export-compliance"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isExportingCompliance ? "Exporting..." : "Export"}
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>This report includes:</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>Employee training completion status</li>
                <li>Expiring and expired certifications</li>
                <li>Compliance rate by employee</li>
                <li>Summary statistics</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Department Report Export */}
        <Card data-testid="card-export-department">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-chart-3" />
              Department Report
            </CardTitle>
            <CardDescription>
              Export department-specific training statistics and metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Department</label>
                <Select 
                  value={selectedDepartment} 
                  onValueChange={setSelectedDepartment}
                >
                  <SelectTrigger data-testid="select-department">
                    <SelectValue placeholder="Choose a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem 
                        key={dept.id} 
                        value={dept.id.toString()}
                        data-testid={`option-department-${dept.id}`}
                      >
                        {dept.name} {dept.code ? `(${dept.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Export Format</label>
                  <Select 
                    value={departmentFormat} 
                    onValueChange={(v) => setDepartmentFormat(v as ExportFormat)}
                  >
                    <SelectTrigger data-testid="select-department-format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel" data-testid="option-dept-excel">
                        <span className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          Excel Spreadsheet
                        </span>
                      </SelectItem>
                      <SelectItem value="pdf" data-testid="option-dept-pdf">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          PDF Report
                        </span>
                      </SelectItem>
                      <SelectItem value="json" data-testid="option-dept-json">
                        <span className="flex items-center gap-2">
                          <FileJson className="h-4 w-4" />
                          JSON Data
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-6">
                  <Button 
                    onClick={handleExportDepartment}
                    disabled={isExportingDepartment || !selectedDepartment}
                    data-testid="button-export-department"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isExportingDepartment ? "Exporting..." : "Export"}
                  </Button>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>This report includes:</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>Department summary metrics</li>
                <li>Employee completion rates</li>
                <li>Course breakdown statistics</li>
                <li>Pending renewals and expirations</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Overview */}
        <Card data-testid="card-compliance-overview">
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
                  <span className="font-medium" data-testid="text-overview-active">{stats?.activeEnrollments || 0}</span>
                </div>
                <Progress
                  value={
                    stats?.totalEnrollments
                      ? (stats.activeEnrollments / stats.totalEnrollments) * 100
                      : 0
                  }
                  className="h-2"
                  data-testid="progress-active"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    Expiring Soon
                  </span>
                  <span className="font-medium" data-testid="text-overview-expiring">{stats?.expiringEnrollments || 0}</span>
                </div>
                <Progress
                  value={
                    stats?.totalEnrollments
                      ? (stats.expiringEnrollments / stats.totalEnrollments) * 100
                      : 0
                  }
                  className="h-2 [&>div]:bg-yellow-500"
                  data-testid="progress-expiring"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Expired
                  </span>
                  <span className="font-medium" data-testid="text-overview-expired">{stats?.expiredEnrollments || 0}</span>
                </div>
                <Progress
                  value={
                    stats?.totalEnrollments
                      ? (stats.expiredEnrollments / stats.totalEnrollments) * 100
                      : 0
                  }
                  className="h-2 [&>div]:bg-destructive"
                  data-testid="progress-expired"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Renewal Statistics */}
        <Card data-testid="card-renewal-stats">
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
                  <p className="text-3xl font-bold" data-testid="text-pending-renewals">{stats?.pendingRenewals || 0}</p>
                  <p className="text-sm text-muted-foreground">Pending Renewals</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-chart-2" data-testid="text-approved-month">
                    {stats?.approvedThisMonth || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Approved This Month</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Breakdown */}
        <Card className="lg:col-span-2" data-testid="card-department-breakdown">
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
                  <div key={index} className="space-y-2" data-testid={`row-department-${index}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium" data-testid={`text-dept-name-${index}`}>{dept.name}</p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-dept-employees-${index}`}>
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
                        data-testid={`text-dept-compliance-${index}`}
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
                      data-testid={`progress-dept-${index}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center" data-testid="empty-departments">
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
