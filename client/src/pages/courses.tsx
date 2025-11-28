import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { DataTable } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  BookOpen, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import type { Course } from "@shared/schema";

const courseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  validityPeriodDays: z.coerce.number().min(1, "Validity period must be at least 1 day"),
  provider: z.string().optional(),
  duration: z.string().optional(),
  isMandatory: z.boolean().default(false),
});

type CourseFormData = z.infer<typeof courseSchema>;

const categories = [
  "Safety & Compliance",
  "Technical Skills",
  "Leadership & Management",
  "Regulatory",
  "Equipment Operation",
  "Emergency Response",
  "Environmental",
  "Quality Assurance",
  "Other",
];

export default function Courses() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      validityPeriodDays: 365,
      provider: "",
      duration: "",
      isMandatory: false,
    },
  });

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      return apiRequest("POST", "/api/courses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setShowDialog(false);
      form.reset();
      toast({
        title: "Course Created",
        description: "The training course has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CourseFormData & { id: number }) => {
      return apiRequest("PATCH", `/api/courses/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setShowDialog(false);
      setEditingCourse(null);
      form.reset();
      toast({
        title: "Course Updated",
        description: "The training course has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    form.reset({
      title: course.title,
      description: course.description || "",
      category: course.category,
      validityPeriodDays: course.validityPeriodDays,
      provider: course.provider || "",
      duration: course.duration || "",
      isMandatory: course.isMandatory || false,
    });
    setShowDialog(true);
  };

  const handleClose = () => {
    setShowDialog(false);
    setEditingCourse(null);
    form.reset();
  };

  const onSubmit = (data: CourseFormData) => {
    if (editingCourse) {
      updateMutation.mutate({ ...data, id: editingCourse.id });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Course Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage training courses
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-course">
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-sm text-muted-foreground">Total Courses</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {courses.filter((c) => c.isMandatory).length}
            </div>
            <p className="text-sm text-muted-foreground">Mandatory</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {courses.filter((c) => c.isActive).length}
            </div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {new Set(courses.map((c) => c.category)).size}
            </div>
            <p className="text-sm text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-courses"
        />
      </div>

      {/* Courses List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "title",
              header: "Course",
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {row.description || "No description"}
                  </p>
                </div>
              ),
            },
            {
              key: "category",
              header: "Category",
              cell: (row) => (
                <span className="text-sm">{row.category}</span>
              ),
            },
            {
              key: "validity",
              header: "Validity",
              cell: (row) => (
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {row.validityPeriodDays} days
                </div>
              ),
            },
            {
              key: "type",
              header: "Type",
              cell: (row) => (
                <StatusBadge
                  status={row.isMandatory ? "completed" : "pending"}
                  size="sm"
                  showIcon={false}
                />
              ),
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => (
                <StatusBadge
                  status={row.isActive ? "active" : "expired"}
                  size="sm"
                />
              ),
            },
            {
              key: "actions",
              header: "",
              cell: (row) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(row);
                  }}
                  data-testid={`button-edit-${row.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              ),
              className: "text-right",
            },
          ]}
          data={filteredCourses}
          emptyMessage="No courses found"
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? "Edit Course" : "Create New Course"}
            </DialogTitle>
            <DialogDescription>
              {editingCourse
                ? "Update the course details below"
                : "Fill in the details to create a new training course"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Safety Fundamentals"
                        data-testid="input-course-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Course description..."
                        data-testid="input-course-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validityPeriodDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validity (days)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          data-testid="input-validity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Training provider"
                          data-testid="input-provider"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 2 hours"
                          data-testid="input-duration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isMandatory"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Mandatory Course</FormLabel>
                      <FormDescription>
                        All employees must complete this course
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-mandatory"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-course"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingCourse ? (
                    "Update Course"
                  ) : (
                    "Create Course"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
