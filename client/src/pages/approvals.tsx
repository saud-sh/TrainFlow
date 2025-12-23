import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { WorkflowTimeline } from "@/components/workflow-timeline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  BookOpen,
  Calendar,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
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

export default function Approvals() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRenewal, setSelectedRenewal] = useState<RenewalWithDetails | null>(null);
  const [comments, setComments] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const isManager = user?.role === "manager";
  const isForeman = user?.role === "foreman";

  const { data: pendingApprovals = [], isLoading: pendingLoading } = useQuery<RenewalWithDetails[]>({
    queryKey: ["/api/renewals/pending"],
  });

  const { data: allRenewals = [], isLoading: processedLoading } = useQuery<RenewalWithDetails[]>({
    queryKey: ["/api/renewals"],
  });

  const processedApprovals = allRenewals.filter(r =>
    r.status === 'manager_approved' || r.status === 'rejected' || r.status === 'completed'
  );

  const approveMutation = useMutation({
    mutationFn: async (data: { id: number; comments: string }) => {
      return apiRequest("POST", `/api/renewals/${data.id}/approve`, { comments: data.comments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/renewals"] });
      setSelectedRenewal(null);
      setComments("");
      toast({
        title: "Request Approved",
        description: "The renewal request has been approved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve the request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (data: { id: number; reason: string }) => {
      return apiRequest("POST", `/api/renewals/${data.id}/reject`, { reason: data.reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/renewals"] });
      setSelectedRenewal(null);
      setShowRejectDialog(false);
      setRejectionReason("");
      toast({
        title: "Request Rejected",
        description: "The renewal request has been rejected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject the request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filterRenewals = (renewals: RenewalWithDetails[]) => {
    return renewals.filter((r) =>
      r.enrollment?.course?.title.toLowerCase().includes(search.toLowerCase()) ||
      `${r.requester?.firstName} ${r.requester?.lastName}`.toLowerCase().includes(search.toLowerCase())
    );
  };

  const getUrgencyBadge = (level: string | null) => {
    switch (level) {
      case "critical":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Critical</span>;
      case "high":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">High</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6" />
          Approval Queue
        </h1>
        <p className="text-muted-foreground">
          Review and process renewal requests from your team
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by employee or course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-approvals"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="processed" data-testid="tab-processed">
            Processed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : filterRenewals(pendingApprovals).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-chart-2" />
                <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                <p className="text-muted-foreground">
                  No pending approvals at the moment
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filterRenewals(pendingApprovals).map((renewal) => (
                <Card
                  key={renewal.id}
                  className="hover-elevate"
                  data-testid={`approval-card-${renewal.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={renewal.requester?.profileImageUrl || undefined}
                            className="object-cover"
                          />
                          <AvatarFallback>
                            {renewal.requester?.firstName?.[0]}
                            {renewal.requester?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">
                              {renewal.requester?.firstName} {renewal.requester?.lastName}
                            </h3>
                            {getUrgencyBadge(renewal.urgencyLevel)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {renewal.requester?.email}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {renewal.enrollment?.course?.title}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Submitted {renewal.createdAt ? format(new Date(renewal.createdAt), "MMM d") : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={renewal.status} />
                        <Button
                          variant="outline"
                          onClick={() => setLocation(`/approvals/${renewal.id}`)}
                          data-testid={`button-review-${renewal.id}`}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="processed" className="mt-6">
          {processedLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filterRenewals(processedApprovals).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-medium mb-2">No processed requests</h3>
                <p className="text-muted-foreground">
                  Processed requests will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filterRenewals(processedApprovals).map((renewal) => (
                <Card
                  key={renewal.id}
                  data-testid={`processed-card-${renewal.id}`}
                  className="hover-elevate cursor-pointer"
                  onClick={() => setLocation(`/approvals/${renewal.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={renewal.requester?.profileImageUrl || undefined}
                            className="object-cover"
                          />
                          <AvatarFallback>
                            {renewal.requester?.firstName?.[0]}
                            {renewal.requester?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {renewal.requester?.firstName} {renewal.requester?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {renewal.enrollment?.course?.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={renewal.status} />
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!selectedRenewal} onOpenChange={() => setSelectedRenewal(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Renewal Request</DialogTitle>
            <DialogDescription>
              {selectedRenewal?.enrollment?.course?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedRenewal && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Employee</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={selectedRenewal.requester?.profileImageUrl || undefined}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {selectedRenewal.requester?.firstName?.[0]}
                        {selectedRenewal.requester?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {selectedRenewal.requester?.firstName} {selectedRenewal.requester?.lastName}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Course Expiry</Label>
                  <p className="font-medium mt-1">
                    {selectedRenewal.enrollment?.expiresAt
                      ? format(new Date(selectedRenewal.enrollment.expiresAt), "MMM d, yyyy")
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Comments (optional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Add any comments for this approval..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  data-testid="input-approval-comments"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(true);
              }}
              className="text-destructive hover:text-destructive"
              data-testid="button-reject"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              onClick={() => {
                if (selectedRenewal) {
                  approveMutation.mutate({
                    id: selectedRenewal.id,
                    comments,
                  });
                }
              }}
              disabled={approveMutation.isPending}
              data-testid="button-approve"
            >
              {approveMutation.isPending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Renewal Request</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this request. The employee will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              data-testid="input-rejection-reason"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedRenewal && rejectionReason.trim()) {
                  rejectMutation.mutate({
                    id: selectedRenewal.id,
                    reason: rejectionReason,
                  });
                }
              }}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
