import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationBell } from "@/components/notification-bell";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import MyCourses from "@/pages/my-courses";
import MyRenewals from "@/pages/my-renewals";
import Approvals from "@/pages/approvals";
import Courses from "@/pages/courses";
import Enrollments from "@/pages/enrollments";
import Recommendations from "@/pages/recommendations";
import Progression from "@/pages/progression";
import GradeReadiness from "@/pages/grade-readiness";
import KPIDashboard from "@/pages/kpi-dashboard";
import Integrations from "@/pages/integrations";
import Users from "@/pages/users";
import AuditLogs from "@/pages/audit-logs";
import Reports from "@/pages/reports";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import Departments from "@/pages/departments";
import ApprovalDetails from "@/pages/approval-details";

function LoadingScreen() {
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

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 px-4 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return (
    <AuthenticatedLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/my-courses">
          <ProtectedRoute>
            <MyCourses />
          </ProtectedRoute>
        </Route>
        <Route path="/my-renewals">
          <ProtectedRoute>
            <MyRenewals />
          </ProtectedRoute>
        </Route>
        <Route path="/approvals">
          <ProtectedRoute>
            <Approvals />
          </ProtectedRoute>
        </Route>
        <Route path="/approvals/:id">
          <ProtectedRoute>
            <ApprovalDetails />
          </ProtectedRoute>
        </Route>
        <Route path="/courses">
          <ProtectedRoute requiredRoles={["training_officer", "administrator"]}>
            <Courses />
          </ProtectedRoute>
        </Route>
        <Route path="/enrollments">
          <ProtectedRoute requiredRoles={["training_officer", "administrator"]}>
            <Enrollments />
          </ProtectedRoute>
        </Route>
        <Route path="/recommendations">
          <ProtectedRoute>
            <Recommendations />
          </ProtectedRoute>
        </Route>
        <Route path="/progression">
          <ProtectedRoute>
            <Progression />
          </ProtectedRoute>
        </Route>
        <Route path="/grade-readiness">
          <ProtectedRoute>
            <GradeReadiness />
          </ProtectedRoute>
        </Route>
        <Route path="/kpi-dashboard">
          <ProtectedRoute>
            <KPIDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/all-renewals">
          <ProtectedRoute requiredRoles={["training_officer", "manager", "administrator"]}>
            <MyRenewals />
          </ProtectedRoute>
        </Route>
        <Route path="/team">
          <ProtectedRoute requiredRoles={["foreman", "manager", "administrator"]}>
            <Users />
          </ProtectedRoute>
        </Route>
        <Route path="/integrations">
          <ProtectedRoute requiredRoles={["administrator"]}>
            <Integrations />
          </ProtectedRoute>
        </Route>
        <Route path="/users">
          <ProtectedRoute requiredRoles={["administrator"]}>
            <Users />
          </ProtectedRoute>
        </Route>
        <Route path="/audit-logs">
          <ProtectedRoute requiredRoles={["administrator"]}>
            <AuditLogs />
          </ProtectedRoute>
        </Route>
        <Route path="/reports">
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        </Route>
        <Route path="/profile">
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        </Route>
        <Route path="/settings">
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        </Route>
        <Route path="/departments">
          <ProtectedRoute requiredRoles={["administrator"]}>
            <Departments />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light" storageKey="trainflow-theme">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
