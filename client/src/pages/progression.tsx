import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { 
  TrendingUp, 
  Target,
  CheckCircle2,
  Clock,
  Calendar,
  Award,
  BookOpen,
  AlertTriangle
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { ProgressionTask, Course } from "@shared/schema";

interface TaskWithCourse extends ProgressionTask {
  requiredCourse?: Course;
}

export default function Progression() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");

  const { data: tasks = [], isLoading } = useQuery<TaskWithCourse[]>({
    queryKey: ["/api/progression-tasks"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/progression-tasks/${data.id}`, { status: data.status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progression-tasks"] });
      toast({
        title: "Status Updated",
        description: "Task status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === "all") return true;
    return t.status === activeTab;
  });

  const stats = {
    total: tasks.length,
    notStarted: tasks.filter((t) => t.status === "not_started").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
  };

  const completionPercentage = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high":
        return "text-orange-600 dark:text-orange-400";
      case "critical":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Progression Tasks
        </h1>
        <p className="text-muted-foreground">
          Track tasks required for your career advancement
        </p>
      </div>

      {/* Overall Progress */}
      <Card className="bg-gradient-to-r from-primary/10 to-chart-4/10">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-1">Overall Progress</h3>
              <p className="text-muted-foreground">
                {stats.completed} of {stats.total} tasks completed
              </p>
            </div>
            <div className="flex-1 max-w-md">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Completion</span>
                <span className="font-medium">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-3" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{completionPercentage}%</div>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="hover-elevate">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{stats.notStarted}</div>
            <p className="text-sm text-muted-foreground">Not Started</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate border-l-4 border-l-chart-1">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-chart-1">{stats.inProgress}</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate border-l-4 border-l-chart-2">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-chart-2">{stats.completed}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate border-l-4 border-l-destructive">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-destructive">{stats.blocked}</div>
            <p className="text-sm text-muted-foreground">Blocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            All ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="not_started" data-testid="tab-not-started">
            Not Started ({stats.notStarted})
          </TabsTrigger>
          <TabsTrigger value="in_progress" data-testid="tab-in-progress">
            In Progress ({stats.inProgress})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completed ({stats.completed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                <p className="text-muted-foreground">
                  {activeTab === "all"
                    ? "No progression tasks have been assigned yet"
                    : `No tasks with status "${activeTab.replace("_", " ")}"`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((task) => {
                const daysUntilDue = task.dueDate
                  ? differenceInDays(new Date(task.dueDate), new Date())
                  : null;
                const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

                return (
                  <Card
                    key={task.id}
                    className="hover-elevate"
                    data-testid={`task-card-${task.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base line-clamp-1">
                              {task.title}
                            </CardTitle>
                            {task.priority && task.priority !== "medium" && (
                              <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                              </span>
                            )}
                          </div>
                          <CardDescription className="line-clamp-2">
                            {task.description || "No description provided"}
                          </CardDescription>
                        </div>
                        <StatusBadge status={task.status} size="sm" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Target: <span className="font-medium">{task.targetGrade}</span>
                          </span>
                        </div>
                        {task.dueDate && (
                          <div className={`flex items-center gap-1.5 ${isOverdue ? "text-destructive" : ""}`}>
                            <Calendar className="h-4 w-4" />
                            <span>
                              {isOverdue
                                ? `Overdue by ${Math.abs(daysUntilDue!)} days`
                                : `Due: ${format(new Date(task.dueDate), "MMM d, yyyy")}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {task.requiredCourse && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                          <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              Required: {task.requiredCourse.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {task.requiredCourse.category}
                            </p>
                          </div>
                        </div>
                      )}

                      {task.status !== "completed" && (
                        <div className="flex gap-2">
                          {task.status === "not_started" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: task.id,
                                  status: "in_progress",
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              data-testid={`button-start-${task.id}`}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Start Task
                            </Button>
                          )}
                          {task.status === "in_progress" && (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: task.id,
                                  status: "completed",
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              data-testid={`button-complete-${task.id}`}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Mark Complete
                            </Button>
                          )}
                          {task.status === "blocked" && (
                            <div className="flex-1 flex items-center justify-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-sm">
                              <AlertTriangle className="h-4 w-4" />
                              This task is blocked
                            </div>
                          )}
                        </div>
                      )}

                      {task.status === "completed" && task.completedAt && (
                        <div className="flex items-center gap-2 text-sm text-chart-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Completed on {format(new Date(task.completedAt), "MMM d, yyyy")}
                        </div>
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
