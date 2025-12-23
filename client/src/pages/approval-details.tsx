import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { WorkflowTimeline } from "@/components/workflow-timeline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  BookOpen,
  Calendar,
  AlertTriangle,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import type { RenewalRequest, Enrollment, Course, User as UserType } from "@shared/schema";

interface EnrollmentWithCourse extends Enrollment {
  course: Course;
}

interface RenewalWithDetails extends RenewalRequest {
  enrollment: EnrollmentWithCourse;
  requester?: UserType;
  foreman?: UserType;
  manager?: UserType;
}

export default function ApprovalDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [comments, setComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const { data: renewal, isLoading } = useQuery<RenewalWithDetails>({
    queryKey: [`/api/renewals/${id}`],
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: async (data: { id: number; comments: string }) => {
      return apiRequest("POST", `/api/renewals/${data.id}/approve`, { comments: data.comments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/renewals/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/renewals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/renewals/pending"] });
      setComments("");
      toast({
        title: "Request Approved",
        description: "The renewal request has been approved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve the request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (data: { id: number; reason: string }) => {
      return apiRequest("POST", `/api/renewals/${data.id}/reject`, { reason: data.reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/renewals/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/renewals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/renewals/pending"] });
      setIsRejecting(false);
      setRejectionReason("");
      toast({
        title: "Request Rejected",
        description: "The renewal request has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject the request. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!renewal) {
    return (
      <div className="p-8">
        <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
          <p className="text-yellow-800">Approval request #{id} not found</p>
        </Card>
      </div>
    );
  }

  const getTimelineSteps = (renewal: RenewalWithDetails) => {
    const steps: any[] = [
      {
        id: "submitted",
        title: "Request Submitted",
        description: "Renewal request created by employee",
        status: "completed" as const,
        user: renewal.requester ? {
          name: `${renewal.requester.firstName} ${renewal.requester.lastName}`,
          avatar: renewal.requester.profileImageUrl || undefined,
        } : undefined,
        timestamp: renewal.createdAt || undefined,
        comments: undefined,
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
          : renewal.status === "rejected" && !renewal.foremanApprovedAt
            ? "rejected" as const
            : renewal.status === "pending"
              ? "current" as const
              : "pending" as const,
        user: renewal.foreman ? {
          name: `${renewal.foreman.firstName} ${renewal.foreman.lastName}`,
          avatar: renewal.foreman.profileImageUrl || undefined,
        } : undefined,
        timestamp: renewal.foremanApprovedAt || undefined,
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
          : renewal.status === "rejected" && renewal.foremanApprovedAt
            ? "rejected" as const
            : renewal.status === "foreman_approved"
              ? "current" as const
              : "pending" as const,
        user: renewal.manager ? {
          name: `${renewal.manager.firstName} ${renewal.manager.lastName}`,
          avatar: renewal.manager.profileImageUrl || undefined,
        } : undefined,
        timestamp: renewal.managerApprovedAt || undefined,
        comments: renewal.managerComments || undefined,
      },
    ];

    if (renewal.status === "completed" || renewal.status === "manager_approved") {
      steps.push({
        id: "completed",
        title: "Renewal Completed",
        description: "Training renewal has been processed",
        status: "completed" as const,
        timestamp: renewal.updatedAt || undefined,
        user: undefined,
        comments: undefined,
      });
    }

    return steps;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/approvals")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Approval Request #{renewal.id}</h1>
        </div>
        <StatusBadge status={renewal.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Training Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Course Name</Label>
                <p className="font-medium text-lg">{renewal.enrollment?.course?.title}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Current Expiry</Label>
                <p className="font-medium text-lg">
                  {renewal.enrollment?.expiresAt ? format(new Date(renewal.enrollment.expiresAt), "PPP") : "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Category</Label>
                <p className="font-medium">{renewal.enrollment?.course?.category}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Urgency Level</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={renewal.urgencyLevel === 'critical' ? 'destructive' : 'secondary'}>
                    {renewal.urgencyLevel}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={renewal.requester?.profileImageUrl || undefined} className="object-cover" />
                <AvatarFallback className="text-xl">
                  {renewal.requester?.firstName?.[0]}{renewal.requester?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-xl font-bold">{renewal.requester?.firstName} {renewal.requester?.lastName}</p>
                <p className="text-muted-foreground">{renewal.requester?.email}</p>
                <p className="text-sm px-2 py-0.5 rounded-full bg-primary/10 text-primary w-fit font-medium">
                  {renewal.requester?.role}
                </p>
              </div>
            </CardContent>
          </Card>

          {renewal.status === "pending" || renewal.status === "foreman_approved" ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Action Required
                </CardTitle>
                <CardDescription>
                  Review the renewal request and provide your decision.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isRejecting ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="comments">Internal Comments (optional)</Label>
                      <Textarea
                        id="comments"
                        placeholder="Add internal notes for other approvers..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsRejecting(true)}>
                        <XCircle className="mr-2 h-4 w-4 text-destructive" />
                        Reject Request
                      </Button>
                      <Button
                        onClick={() => approveMutation.mutate({ id: renewal.id, comments })}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve Request
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reason" className="text-destructive font-semibold text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Rejection Reason (Required)
                      </Label>
                      <Textarea
                        id="reason"
                        placeholder="Explain why this request is being rejected..."
                        className="border-destructive/50 focus-visible:ring-destructive"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="ghost" onClick={() => setIsRejecting(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => rejectMutation.mutate({ id: renewal.id, reason: rejectionReason })}
                        disabled={!rejectionReason.trim() || rejectMutation.isPending}
                      >
                        {rejectMutation.isPending ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          "Confirm Rejection"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Processing Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowTimeline steps={getTimelineSteps(renewal)} />
            </CardContent>
          </Card>

          {renewal.status === 'rejected' && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-lg text-destructive flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium italic underline decoration-destructive/30 underline-offset-4">
                  "{renewal.rejectionReason}"
                </p>
                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Rejected on {renewal.rejectedAt ? format(new Date(renewal.rejectedAt), "PPP p") : "N/A"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
