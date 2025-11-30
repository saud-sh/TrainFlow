import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import type { UserRole } from "@shared/schema";
import { isRouteAllowedForRole } from "@/utils/roleRoutes";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-lg bg-primary/10 flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 rounded-full bg-primary/30" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Store the current location and redirect to login
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      sessionStorage.setItem("redirectAfterLogin", currentPath);
    }
    setLocation("/login");
    return null;
  }

  // Check role-based access
  if (requiredRoles && user && !requiredRoles.includes(user.role as UserRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Access Denied
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                You don't have permission to access this page. Your role is{" "}
                <strong>{user.role.replace("_", " ")}</strong>.
              </p>
            </div>
            <Button
              onClick={() => setLocation("/")}
              className="w-full mt-4"
              data-testid="button-return-to-dashboard"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
