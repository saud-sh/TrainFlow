import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Brain,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  BarChart3,
  BookOpen,
  ClipboardList,
  RefreshCw
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface GradeReadinessResult {
  readinessScore: number;
  readinessLevel: string;
  estimatedTimeToReady: string;
  strengths: string[];
  gaps: string[];
  recommendations: {
    action: string;
    priority: string;
    impact: string;
  }[];
  detailedAnalysis: string;
  confidenceLevel: number;
  employeeId: string;
  employeeName: string;
  currentGrade: string;
  targetGrade: string;
  department: string;
  generatedAt: string;
  metrics: {
    totalEnrollments: number;
    completedCourses: number;
    activeCourses: number;
    expiredCourses: number;
    mandatoryCompliance: number;
    totalTasks: number;
    completedTasks: number;
    taskCompletionRate: number;
  };
}

function getReadinessColor(level: string): string {
  switch (level) {
    case 'Exceeds Expectations':
      return 'bg-emerald-500';
    case 'Ready':
      return 'bg-green-500';
    case 'On Track':
      return 'bg-blue-500';
    case 'Developing':
      return 'bg-amber-500';
    case 'Not Ready':
      return 'bg-red-500';
    default:
      return 'bg-muted';
  }
}

function getReadinessBadgeVariant(level: string): "default" | "secondary" | "destructive" | "outline" {
  switch (level) {
    case 'Exceeds Expectations':
    case 'Ready':
      return 'default';
    case 'On Track':
      return 'secondary';
    case 'Developing':
    case 'Not Ready':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getPriorityColor(priority: string): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case 'High':
      return 'destructive';
    case 'Medium':
      return 'secondary';
    case 'Low':
      return 'outline';
    default:
      return 'default';
  }
}

export default function GradeReadiness() {
  const [result, setResult] = useState<GradeReadinessResult | null>(null);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/grade-readiness");
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Analysis Complete",
        description: "Your grade readiness prediction has been generated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate grade readiness prediction.",
        variant: "destructive",
      });
    },
  });

  const handleGeneratePrediction = () => {
    generateMutation.mutate();
  };

  if (!result && !generateMutation.isPending) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Grade Readiness Predictor</h1>
            <p className="text-muted-foreground mt-1">
              AI-powered analysis to forecast your promotion eligibility
            </p>
          </div>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Brain className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Analyze Your Readiness</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Our AI will analyze your training completion, progression tasks, and performance metrics 
              to predict your eligibility for promotion to the next grade level.
            </p>
            <Button 
              size="lg" 
              onClick={handleGeneratePrediction}
              data-testid="button-generate-prediction"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Prediction
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Training Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Evaluates your course completions, active enrollments, and mandatory training compliance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Task Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Reviews your progression tasks, completion rates, and any overdue items.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Gap Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Identifies gaps between your current state and promotion requirements.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (generateMutation.isPending) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grade Readiness Predictor</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered analysis to forecast your promotion eligibility
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
              <Brain className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Analyzing Your Data...</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Our AI is reviewing your training history, progression tasks, and performance metrics.
            </p>
            <div className="w-64 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grade Readiness Predictor</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered analysis to forecast your promotion eligibility
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleGeneratePrediction}
          disabled={generateMutation.isPending}
          data-testid="button-regenerate-prediction"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
          Regenerate
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Readiness Assessment
                </CardTitle>
                <CardDescription>
                  {result.currentGrade} → {result.targetGrade}
                </CardDescription>
              </div>
              <Badge variant={getReadinessBadgeVariant(result.readinessLevel)} data-testid="badge-readiness-level">
                {result.readinessLevel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Readiness Score</span>
                <span className="text-2xl font-bold" data-testid="text-readiness-score">{result.readinessScore}%</span>
              </div>
              <Progress 
                value={result.readinessScore} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Not Ready</span>
                <span>Ready for Promotion</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Estimated Time to Ready</p>
                <p className="text-sm text-muted-foreground" data-testid="text-estimated-time">{result.estimatedTimeToReady}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-3">Detailed Analysis</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line" data-testid="text-detailed-analysis">
                {result.detailedAnalysis}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Training Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Courses Completed</span>
                <span className="font-medium" data-testid="text-completed-courses">{result.metrics.completedCourses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Courses</span>
                <span className="font-medium">{result.metrics.activeCourses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expired Courses</span>
                <span className={`font-medium ${result.metrics.expiredCourses > 0 ? 'text-destructive' : ''}`}>
                  {result.metrics.expiredCourses}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mandatory Compliance</span>
                <span className="font-medium" data-testid="text-mandatory-compliance">{result.metrics.mandatoryCompliance}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Task Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Tasks</span>
                <span className="font-medium">{result.metrics.totalTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="font-medium">{result.metrics.completedTasks}</span>
              </div>
              <Progress value={result.metrics.taskCompletionRate} className="h-2" />
              <p className="text-xs text-muted-foreground text-right" data-testid="text-task-completion">
                {result.metrics.taskCompletionRate}% complete
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Progress value={result.confidenceLevel} className="h-2 flex-1" />
                <span className="text-sm font-medium" data-testid="text-confidence-level">{result.confidenceLevel}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Based on available data quality and completeness
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.strengths.length > 0 ? (
              <ul className="space-y-2">
                {result.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2" data-testid={`text-strength-${index}`}>
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No strengths identified yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.gaps.length > 0 ? (
              <ul className="space-y-2">
                {result.gaps.map((gap, index) => (
                  <li key={index} className="flex items-start gap-2" data-testid={`text-gap-${index}`}>
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{gap}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No improvement areas identified.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Recommended Actions
          </CardTitle>
          <CardDescription>
            Prioritized steps to improve your promotion readiness
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.recommendations.length > 0 ? (
            <div className="space-y-4">
              {result.recommendations.map((rec, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                  data-testid={`card-recommendation-${index}`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-medium">{rec.action}</h4>
                      <Badge variant={getPriorityColor(rec.priority)} className="text-xs">
                        {rec.priority} Priority
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.impact}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No specific recommendations at this time.</p>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground">
        Analysis generated on {new Date(result.generatedAt).toLocaleString()} | 
        Powered by AI
      </div>
    </div>
  );
}
