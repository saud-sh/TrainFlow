import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, User, BookOpen, Calendar } from "lucide-react";
import type { Language } from "@/i18n";
import { languages } from "@/i18n";

interface ApprovalData {
  id: string;
  employeeName: string;
  employeeEmail: string;
  courseName: string;
  status: "pending" | "approved" | "rejected";
  requestedDate: string;
  decidedDate?: string;
  reason: string;
  approverName?: string;
  approverRole?: string;
}

const mockApprovals: Record<string, ApprovalData> = {
  "1": {
    id: "1",
    employeeName: "Employee One",
    employeeEmail: "employee1@democorp.local",
    courseName: "Basic Safety Orientation",
    status: "pending",
    requestedDate: "2024-11-25",
    reason: "Course expiration renewal",
  },
  "2": {
    id: "2",
    employeeName: "Employee Two",
    employeeEmail: "employee2@democorp.local",
    courseName: "Electrical Safety Level 2",
    status: "approved",
    requestedDate: "2024-11-20",
    decidedDate: "2024-11-22",
    reason: "Course expiration renewal",
    approverName: "Manager One",
    approverRole: "Manager",
  },
  "3": {
    id: "3",
    employeeName: "Employee Three",
    employeeEmail: "employee3@democorp.local",
    courseName: "First Aid & CPR",
    status: "rejected",
    requestedDate: "2024-11-18",
    decidedDate: "2024-11-19",
    reason: "Recent training completion - renewal not yet due",
    approverName: "Manager Two",
    approverRole: "Manager",
  },
};

export default function ApprovalDetailsPage({ language = "en" }: { language?: Language }) {
  const t = languages[language];
  const { id } = useParams();
  const approval = id ? mockApprovals[id] : null;

  if (!approval) {
    return (
      <div className="p-8">
        <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <p className="text-yellow-800 dark:text-yellow-200">
            Approval request #{id} not found
          </p>
        </Card>
      </div>
    );
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      badgeVariant: "default" as const,
      label: "Pending",
    },
    approved: {
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      badgeVariant: "default" as const,
      label: "Approved",
    },
    rejected: {
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      badgeVariant: "destructive" as const,
      label: "Rejected",
    },
  };

  const config = statusConfig[approval.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Approval Request #{approval.id}
        </h1>
        <Badge className={config.badgeVariant}>
          {config.label}
        </Badge>
      </div>

      {/* Status Card */}
      <Card className={`p-6 ${config.bgColor}`}>
        <div className="flex items-center gap-4">
          <StatusIcon className={`w-10 h-10 ${config.color}`} />
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Status
            </p>
            <p className={`text-xl font-bold ${config.color}`}>
              {config.label}
            </p>
          </div>
        </div>
      </Card>

      {/* Main Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employee Information */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Employee
            </h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Name</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {approval.employeeName}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {approval.employeeEmail}
              </p>
            </div>
          </div>
        </Card>

        {/* Course Information */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Course
            </h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Course Name
              </p>
              <p className="font-medium text-slate-900 dark:text-white">
                {approval.courseName}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Timeline
        </h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full mt-1.5" />
              <div className="w-0.5 h-12 bg-slate-200 dark:bg-slate-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Request Submitted
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {new Date(approval.requestedDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {approval.decidedDate && (
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full ${
                    approval.status === "approved"
                      ? "bg-green-600"
                      : "bg-red-600"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Decision Made
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {new Date(approval.decidedDate).toLocaleDateString()}
                </p>
                {approval.approverName && (
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                    by {approval.approverName} ({approval.approverRole})
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Reason */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Reason
        </h2>
        <p className="text-slate-700 dark:text-slate-300">
          {approval.reason}
        </p>
      </Card>

      {/* Actions */}
      {approval.status === "pending" && (
        <div className="flex gap-4 justify-end pt-4">
          <Button variant="outline" data-testid="button-reject-approval">
            Reject
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" data-testid="button-approve">
            Approve
          </Button>
        </div>
      )}
    </div>
  );
}
