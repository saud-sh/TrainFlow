import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Sparkles, 
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Zap,
  RefreshCw,
  Award
} from "lucide-react";
import type { AiRecommendation, Course } from "@shared/schema";

interface RecommendationWithCourse extends AiRecommendation {
  course: Course;
}

export default function Recommendations() {
  const { toast } = useToast();

  const { data: recommendations = [], isLoading, refetch, isFetching } = useQuery<RecommendationWithCourse[]>({
    queryKey: ["/api/recommendations"],
  });

  const acceptMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/recommendations/${id}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({
        title: "Course Added",
        description: "The recommended course has been added to your training plan.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept recommendation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/recommendations/${id}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({
        title: "Dismissed",
        description: "The recommendation has been dismissed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to dismiss recommendation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/recommendations/generate");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({
        title: "Recommendations Generated",
        description: "New AI-powered course recommendations are ready.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      });
    },
  });

  const activeRecommendations = recommendations.filter(
    (r) => !r.isAccepted && !r.isDismissed
  );
  const acceptedRecommendations = recommendations.filter((r) => r.isAccepted);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-chart-3" />
            AI Recommendations
          </h1>
          <p className="text-muted-foreground">
            Personalized course suggestions based on your role and career progression
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          data-testid="button-generate-recommendations"
        >
          {generateMutation.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Generate New
            </>
          )}
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-chart-3/10 to-chart-4/10 border-chart-3/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-chart-3/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-chart-3" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Powered by AI</h3>
              <p className="text-sm text-muted-foreground">
                Our AI analyzes your current certifications, job role, and career progression path
                to recommend the most relevant training courses for your development. These
                suggestions are personalized to help you advance in your career.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Recommendations */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-chart-1" />
          Recommended for You
        </h2>

        {isLoading || isFetching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : activeRecommendations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-medium mb-2">No recommendations available</h3>
              <p className="text-muted-foreground mb-4">
                Click "Generate New" to get personalized course recommendations
              </p>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
              >
                <Zap className="mr-2 h-4 w-4" />
                Generate Recommendations
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRecommendations.map((rec) => (
              <Card
                key={rec.id}
                className="hover-elevate flex flex-col"
                data-testid={`recommendation-card-${rec.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-chart-3" />
                    </div>
                    {rec.confidence && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Match</p>
                        <p className="text-sm font-medium text-chart-2">
                          {rec.confidence}%
                        </p>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-base line-clamp-2">
                    {rec.course?.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-1">
                    {rec.course?.category}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {rec.reason}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {rec.course?.duration || "Self-paced"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        {rec.course?.validityPeriodDays} days
                      </span>
                    </div>
                  </div>
                  {rec.confidence && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Relevance Score</span>
                        <span>{rec.confidence}%</span>
                      </div>
                      <Progress value={rec.confidence} className="h-1.5" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => dismissMutation.mutate(rec.id)}
                      disabled={dismissMutation.isPending}
                      data-testid={`button-dismiss-${rec.id}`}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Dismiss
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => acceptMutation.mutate(rec.id)}
                      disabled={acceptMutation.isPending}
                      data-testid={`button-accept-${rec.id}`}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Accepted Recommendations */}
      {acceptedRecommendations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-chart-2" />
            Accepted Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {acceptedRecommendations.map((rec) => (
              <Card
                key={rec.id}
                className="opacity-75"
                data-testid={`accepted-card-${rec.id}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-chart-2" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{rec.course?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Added to training plan
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
