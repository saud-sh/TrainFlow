import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  GraduationCap, 
  Shield, 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-lg tracking-tight" data-testid="text-logo">
                  TrainFlow
                </h1>
                <p className="text-xs text-muted-foreground">Enterprise Training Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a href="/api/login">
                <Button data-testid="button-login">
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered Training Management
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Enterprise Training
            <br />
            <span className="text-primary">Renewal & Progression</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            A production-grade corporate system designed for organizations like Aramco and Saudi Electricity Company. 
            Manage employee training validity, renewal workflows, promotion tasks, and AI-driven insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/api/login">
              <Button size="lg" className="w-full sm:w-auto" data-testid="button-get-started">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-learn-more">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Core Capabilities</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage training compliance, employee progression, and organizational development.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-elevate">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-chart-1/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-chart-1" />
                </div>
                <CardTitle className="text-xl">Expiry Tracking</CardTitle>
                <CardDescription>
                  Detect upcoming course expirations with smart alerts at 30/14/7/1 days before expiry.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-chart-2" />
                </div>
                <CardTitle className="text-xl">Approval Workflows</CardTitle>
                <CardDescription>
                  Multi-level approval workflow: Employee to Foreman to Manager with complete tracking.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-chart-3" />
                </div>
                <CardTitle className="text-xl">KPI Dashboards</CardTitle>
                <CardDescription>
                  Role-based dashboards showing key metrics, pending tasks, and course status.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-chart-4/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-chart-4" />
                </div>
                <CardTitle className="text-xl">User Roles</CardTitle>
                <CardDescription>
                  Support for Employee, Foreman, Manager, Training Officer, and Administrator roles.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-chart-5/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-chart-5" />
                </div>
                <CardTitle className="text-xl">AI Recommendations</CardTitle>
                <CardDescription>
                  AI-driven course suggestions based on role, certifications, and career progression.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Full Audit Logging</CardTitle>
                <CardDescription>
                  Complete workflow timeline with all CRUD operations, login events, and approvals.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Designed for Every Role</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Each user role has a tailored dashboard and set of capabilities.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { role: "Employee", desc: "Track courses & submit renewals" },
              { role: "Foreman", desc: "Approve team requests" },
              { role: "Manager", desc: "Final approvals & oversight" },
              { role: "Training Officer", desc: "Manage courses & enroll staff" },
              { role: "Administrator", desc: "Full system access" },
            ].map((item, index) => (
              <Card key={item.role} className="text-center hover-elevate">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-3">
                    <span className="text-primary font-bold text-lg">{index + 1}</span>
                  </div>
                  <CardTitle className="text-base">{item.role}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Training Management?
          </h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Join enterprises worldwide in automating training renewals and ensuring compliance.
          </p>
          <a href="/api/login">
            <Button size="lg" variant="secondary" data-testid="button-start-now">
              Start Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold">TrainFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Enterprise Training Renewal & Employee Progression Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
