import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { DataTable } from "@/components/data-table";
import { WorkflowTimeline, ProgressSteps } from "@/components/workflow-timeline";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { 
  ClipboardCheck, 
  Search, 
  Plus,
  Eye,
  Clock,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import type { RenewalRequest, Enrollment, Course, User } from "@shared/schema";

interface EnrollmentWithCourse extends Enrollment {
  course: Course;
}

interface RenewalWithDetails extends RenewalRequest {
  enrollment: EnrollmentWithCourse;
  requester?: User;
  foreman?: User;
  manager?: User;
}

function getApprovalStep(status: RenewalRequest["status"]): number {
  switch (status) {
    case "pending":
      return 1;
    case "foreman_approved":
      return 2;
    case "manager_approved":
    case "completed":
      return 3;
    case "rejected":
      return -1;
    default:
      return 0;
  }
}

export default function MyRenewals() {
  const [search, setSearch] = useState("");
  const [selectedRenewal, setSelectedRenewal] = useState<RenewalWithDetails | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: renewals = [], isLoading } = useQuery<RenewalWithDetails[]>({
    queryKey: ["/api/renewals/my"],
  });

  const { data: eligibleEnrollments = [] } = useQuery<EnrollmentWithCourse[]>({
    queryKey: ["/api/enrollments/renewable"],
  });

  const createRenewalMutation = useMutation({
    mutationFn: async (data: { enrollmentId: number; urgencyLevel: string }) => {
      return apiRequest("POST", "/api/renewals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/renewals/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments/renewable"] });
      setShowNewDialog(false);
      toast({
        title: "Request Submitted",
        description: "Your renewal request has been submitted for approval.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit renewal request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredRenewals = renewals.filter((r) =>
    r.enrollment?.course?.title.toLowerCase().includes(search.toLowerCase())
  );

  const getTimelineSteps = (renewal: RenewalWithDetails) => {
    const steps = [
      {
        id: "submitted",
        title: "Request Submitted",
        description: "Renewal request created by employee",
        status: "completed" as const,
        user: renewal.requester ? {
          name: `${renewal.requester.firstName} ${renewal.requester.lastName}`,
          avatar: renewal.requester.profileImageUrl || undefined,
        } : undefined,
        timestamp: renewal.createdAt,
      },
      {
        id: "foreman",
        title: "Foreman Review",
        description: renewal.status === "rejected" && !renewal.foremanApprovedAt
          ? "Request was rejected"
          : renewal.foremanApprovedAt
          ? "Approved by foreman"
          : "Awaiting foreman approval",
        status: renewal.foremanApprovedAt
          ? "completed" as const
          : renewal.status === "rejected"
          ? "rejected" as const
          : renewal.status === "pending"
          ? "current" as const
          : "pending" as const,
        user: renewal.foreman ? {
          name: `${renewal.foreman.firstName} ${renewal.foreman.lastName}`,
          avatar: renewal.foreman.profileImageUrl || undefined,
        } : undefined,
        timestamp: renewal.foremanApprovedAt,
        comments: renewal.foremanComments || undefined,
      },
      {
        id: "manager",
        title: "Manager Approval",
        description: renewal.status === "rejected" && renewal.foremanApprovedAt
          ? "Request was rejected"
          : renewal.managerApprovedAt
          ? "Approved by manager"
          : "Awaiting manager approval",
        status: renewal.managerApprovedAt
          ? "completed" as const
          : renewal.status === "rejected"
          ? "rejected" as const
          : renewal.status === "foreman_approved"
          ? "current" as const
          : "pending" as const,
        user: renewal.manager ? {
          name: `${renewal.manager.firstName} ${renewal.manager.lastName}`,
          avatar: renewal.manager.profileImageUrl || undefined,
        } : undefined,
        timestamp: renewal.managerApprovedAt,
        comments: renewal.managerComments || undefined,
      },
    ];

    if (renewal.status === "completed" || renewal.status === "manager_approved") {
      steps.push({
        id: "completed",
        title: "Renewal Completed",
        description: "Training renewal has been processed",
        status: "completed" as const,
        timestamp: renewal.updatedAt,
      });
    }

    return steps;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            My Renewal Requests
          </h1>
          <p className="text-muted-foreground">
            Track and manage your training renewal submissions
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} data-testid="button-new-renewal">
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search renewals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-renewals"
        />
      </div>

      {/* Renewals List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredRenewals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium mb-2">No renewal requests</h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? "Try adjusting your search"
                : "You haven't submitted any renewal requests yet"}
            </p>
            <Button onClick={() => setShowNewDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRenewals.map((renewal) => (
            <Card
              key={renewal.id}
              className="hover-elevate cursor-pointer"
              onClick={() => setSelectedRenewal(renewal)}
              data-testid={`renewal-card-${renewal.id}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium">
                      {renewal.enrollment?.course?.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Submitted {renewal.createdAt ? format(new Date(renewal.createdAt), "MMM d, yyyy") : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={renewal.status} />
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <ProgressSteps
                    currentStep={getApprovalStep(renewal.status)}
                    steps={["Submitted", "Foreman", "Manager", "Complete"]}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Request Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Renewal Request</DialogTitle>
            <DialogDescription>
              Select a course to request renewal for
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const enrollmentId = parseInt(formData.get("enrollmentId") as string);
              const urgencyLevel = formData.get("urgencyLevel") as string;
              if (enrollmentId) {
                createRenewalMutation.mutate({ enrollmentId, urgencyLevel });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="enrollmentId">Course</Label>
              <Select name="enrollmentId" required>
                <SelectTrigger data-testid="select-course">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleEnrollments.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No courses eligible for renewal
                    </SelectItem>
                  ) : (
                    eligibleEnrollments.map((enrollment) => (
                      <SelectItem
                        key={enrollment.id}
                        value={enrollment.id.toString()}
                      >
                        {enrollment.course?.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgencyLevel">Urgency Level</Label>
              <Select name="urgencyLevel" defaultValue="normal">
                <SelectTrigger data-testid="select-urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createRenewalMutation.isPending || eligibleEnrollments.length === 0}
                data-testid="button-submit-renewal"
              >
                {createRenewalMutation.isPending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRenewal} onOpenChange={() => setSelectedRenewal(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Renewal Request Details</DialogTitle>
            <DialogDescription>
              {selectedRenewal?.enrollment?.course?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedRenewal && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedRenewal.status} />
                <span className="text-sm text-muted-foreground">
                  Request ID: #{selectedRenewal.id}
                </span>
              </div>
              <WorkflowTimeline steps={getTimelineSteps(selectedRenewal)} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
