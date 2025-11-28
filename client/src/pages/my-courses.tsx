import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { DataTable } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { useState } from "react";
import { 
  BookOpen, 
  Search, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Award,
  ExternalLink,
  Plus
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { Enrollment, Course } from "@shared/schema";

interface EnrollmentWithCourse extends Enrollment {
  course: Course;
}

function getEnrollmentStatus(enrollment: EnrollmentWithCourse): "active" | "expiring_soon" | "expired" {
  const daysUntilExpiry = differenceInDays(new Date(enrollment.expiresAt), new Date());
  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry <= 30) return "expiring_soon";
  return "active";
}

export default function MyCourses() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: enrollments = [], isLoading } = useQuery<EnrollmentWithCourse[]>({
    queryKey: ["/api/enrollments/my"],
  });

  const filteredEnrollments = enrollments.filter((e) => {
    const matchesSearch = e.course?.title.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    const status = getEnrollmentStatus(e);
    if (activeTab === "all") return true;
    if (activeTab === "active") return status === "active";
    if (activeTab === "expiring") return status === "expiring_soon";
    if (activeTab === "expired") return status === "expired";
    return true;
  });

  const stats = {
    total: enrollments.length,
    active: enrollments.filter((e) => getEnrollmentStatus(e) === "active").length,
    expiring: enrollments.filter((e) => getEnrollmentStatus(e) === "expiring_soon").length,
    expired: enrollments.filter((e) => getEnrollmentStatus(e) === "expired").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            My Courses
          </h1>
          <p className="text-muted-foreground">
            View and manage your training enrollments
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Courses</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate border-l-4 border-l-chart-2">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-chart-2">{stats.active}</div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.expiring}</div>
            <p className="text-sm text-muted-foreground">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{stats.expired}</div>
            <p className="text-sm text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-courses"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            All ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active">
            Active ({stats.active})
          </TabsTrigger>
          <TabsTrigger value="expiring" data-testid="tab-expiring">
            Expiring Soon ({stats.expiring})
          </TabsTrigger>
          <TabsTrigger value="expired" data-testid="tab-expired">
            Expired ({stats.expired})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground">
                  {search ? "Try adjusting your search" : "You haven't been enrolled in any courses yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEnrollments.map((enrollment) => {
                const status = getEnrollmentStatus(enrollment);
                const daysUntilExpiry = differenceInDays(
                  new Date(enrollment.expiresAt),
                  new Date()
                );
                const validityProgress = Math.max(
                  0,
                  Math.min(
                    100,
                    ((enrollment.course?.validityPeriodDays || 365) + daysUntilExpiry) /
                      (enrollment.course?.validityPeriodDays || 365) *
                      100
                  )
                );

                return (
                  <Card
                    key={enrollment.id}
                    className="hover-elevate flex flex-col"
                    data-testid={`course-card-${enrollment.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-base line-clamp-2">
                            {enrollment.course?.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {enrollment.course?.category}
                          </CardDescription>
                        </div>
                        <StatusBadge status={status} size="sm" showIcon={false} />
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Expires: {format(new Date(enrollment.expiresAt), "MMM d, yyyy")}
                          </span>
                        </div>
                        {enrollment.certificateNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">
                              Cert: {enrollment.certificateNumber}
                            </span>
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Validity</span>
                            <span className={status === "expired" ? "text-destructive" : ""}>
                              {daysUntilExpiry > 0
                                ? `${daysUntilExpiry} days remaining`
                                : `Expired ${Math.abs(daysUntilExpiry)} days ago`}
                            </span>
                          </div>
                          <Progress
                            value={status === "expired" ? 0 : validityProgress}
                            className="h-2"
                          />
                        </div>
                      </div>
                      {(status === "expiring_soon" || status === "expired") && (
                        <Link href={`/my-renewals/new?enrollmentId=${enrollment.id}`}>
                          <Button className="w-full" data-testid={`button-renew-${enrollment.id}`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Request Renewal
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
