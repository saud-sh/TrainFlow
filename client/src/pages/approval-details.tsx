import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, User, BookOpen, Calendar } from "lucide-react";

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
}

const mockApprovals: Record<string, ApprovalData> = {
  "1": { id: "1", employeeName: "Employee One", employeeEmail: "employee1@democorp.local", courseName: "Basic Safety", status: "pending", requestedDate: "2024-11-25", reason: "Course expiration renewal", },
  "2": { id: "2", employeeName: "Employee Two", employeeEmail: "employee2@democorp.local", courseName: "Electrical Safety", status: "approved", requestedDate: "2024-11-20", decidedDate: "2024-11-22", reason: "Course expiration renewal", approverName: "Manager One", },
  "3": { id: "3", employeeName: "Employee Three", employeeEmail: "employee3@democorp.local", courseName: "First Aid & CPR", status: "rejected", requestedDate: "2024-11-18", decidedDate: "2024-11-19", reason: "Recent training completion", approverName: "Manager Two", },
};

export default function ApprovalDetails() {
  const { id } = useParams();
  const approval = id ? mockApprovals[id] : null;

  if (!approval) {
    return (
      <div className="p-8">
        <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
          <p className="text-yellow-800">Approval request #{id} not found</p>
        </Card>
      </div>
    );
  }

  const statusConfig = {
    pending: { icon: Clock, color: "text-amber-600", label: "Pending", },
    approved: { icon: CheckCircle2, color: "text-green-600", label: "Approved", },
    rejected: { icon: XCircle, color: "text-red-600", label: "Rejected", },
  };

  const config = statusConfig[approval.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Approval Request #{approval.id}</h1>
        <Badge>{config.label}</Badge>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <StatusIcon className={`w-10 h-10 ${config.color}`} />
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Status</p>
            <p className={`text-xl font-bold ${config.color}`}>{config.label}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Employee</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Name</p>
              <p className="font-medium">{approval.employeeName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
              <p className="font-medium">{approval.employeeEmail}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Course</h2>
          </div>
          <p className="font-medium">{approval.courseName}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Timeline
        </h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full mt-1.5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Request Submitted</p>
              <p className="text-sm text-slate-600">{new Date(approval.requestedDate).toLocaleDateString()}</p>
            </div>
          </div>
          {approval.decidedDate && (
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${approval.status === "approved" ? "bg-green-600" : "bg-red-600"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">Decision Made</p>
                <p className="text-sm text-slate-600">{new Date(approval.decidedDate).toLocaleDateString()}</p>
                {approval.approverName && <p className="text-sm text-slate-500">by {approval.approverName}</p>}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Reason</h2>
        <p className="text-slate-700 dark:text-slate-300">{approval.reason}</p>
      </Card>

      {approval.status === "pending" && (
        <div className="flex gap-4 justify-end pt-4">
          <Button variant="outline">Reject</Button>
          <Button className="bg-green-600 hover:bg-green-700">Approve</Button>
        </div>
      )}
    </div>
  );
}
