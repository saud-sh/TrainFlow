import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { DataTable } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Users, 
  Search, 
  Plus,
  Clock,
  BookOpen,
  CalendarIcon,
  Award
} from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import type { Enrollment, Course, User } from "@shared/schema";

interface EnrollmentWithDetails extends Enrollment {
  course: Course;
  user: User;
}

function getEnrollmentStatus(enrollment: EnrollmentWithDetails): "active" | "expiring_soon" | "expired" {
  const daysUntilExpiry = differenceInDays(new Date(enrollment.expiresAt), new Date());
  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry <= 30) return "expiring_soon";
  return "active";
}

export default function Enrollments() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [certificateNumber, setCertificateNumber] = useState("");

  const { data: enrollments = [], isLoading } = useQuery<EnrollmentWithDetails[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      courseId: number;
      expiresAt: Date;
      certificateNumber?: string;
    }) => {
      return apiRequest("POST", "/api/enrollments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      handleClose();
      toast({
        title: "Enrollment Created",
        description: "The employee has been enrolled in the course.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create enrollment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setShowDialog(false);
    setSelectedUser("");
    setSelectedCourse("");
    setExpiryDate(undefined);
    setCertificateNumber("");
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    const course = courses.find((c) => c.id.toString() === courseId);
    if (course) {
      setExpiryDate(addDays(new Date(), course.validityPeriodDays));
    }
  };

  const handleSubmit = () => {
    if (!selectedUser || !selectedCourse || !expiryDate) return;

    createMutation.mutate({
      userId: selectedUser,
      courseId: parseInt(selectedCourse),
      expiresAt: expiryDate,
      certificateNumber: certificateNumber || undefined,
    });
  };

  const filteredEnrollments = enrollments.filter((e) =>
    e.course?.title.toLowerCase().includes(search.toLowerCase()) ||
    `${e.user?.firstName} ${e.user?.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

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
            <Users className="h-6 w-6" />
            Enrollment Management
          </h1>
          <p className="text-muted-foreground">
            Enroll employees in training courses
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-enrollment">
          <Plus className="mr-2 h-4 w-4" />
          New Enrollment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Enrollments</p>
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search enrollments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-enrollments"
        />
      </div>

      {/* Enrollments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "employee",
              header: "Employee",
              cell: (row) => (
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={row.user?.profileImageUrl || undefined}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {row.user?.firstName?.[0]}
                      {row.user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {row.user?.firstName} {row.user?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {row.user?.email}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              key: "course",
              header: "Course",
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.course?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.course?.category}
                  </p>
                </div>
              ),
            },
            {
              key: "expires",
              header: "Expires",
              cell: (row) => (
                <div className="text-sm">
                  <p>{format(new Date(row.expiresAt), "MMM d, yyyy")}</p>
                  <p className="text-muted-foreground">
                    {differenceInDays(new Date(row.expiresAt), new Date())} days
                  </p>
                </div>
              ),
            },
            {
              key: "certificate",
              header: "Certificate",
              cell: (row) => (
                row.certificateNumber ? (
                  <span className="text-sm font-mono">{row.certificateNumber}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )
              ),
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => (
                <StatusBadge status={getEnrollmentStatus(row)} size="sm" />
              ),
            },
          ]}
          data={filteredEnrollments}
          emptyMessage="No enrollments found"
        />
      )}

      {/* New Enrollment Dialog */}
      <Dialog open={showDialog} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Enrollment</DialogTitle>
            <DialogDescription>
              Enroll an employee in a training course
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={user.profileImageUrl || undefined}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-xs">
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={selectedCourse} onValueChange={handleCourseChange}>
                <SelectTrigger data-testid="select-course">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{course.title}</span>
                        <span className="text-xs text-muted-foreground">
                          ({course.validityPeriodDays} days)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expiryDate && "text-muted-foreground"
                    )}
                    data-testid="button-expiry-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Certificate Number (optional)</Label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  placeholder="e.g., CERT-2024-001"
                  className="pl-10"
                  data-testid="input-certificate"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !selectedUser ||
                !selectedCourse ||
                !expiryDate ||
                createMutation.isPending
              }
              data-testid="button-create-enrollment"
            >
              {createMutation.isPending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Enrollment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
