import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { getDefaultRouteForRole } from "@/utils/roleRoutes";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = await login(email, password);

      toast({
        title: "Welcome",
        description: "You have been logged in successfully",
      });

      // Redirect to role-based default route
      const defaultRoute = getDefaultRouteForRole(user.role as any);
      setLocation(defaultRoute);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setError(message);
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary mb-4">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">TrainFlow</h1>
          <p className="text-slate-400">Enterprise Training Platform</p>
        </div>

        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Sign In
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Enter your credentials to access your training dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                data-testid="input-password"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login-submit"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4">
              Demo credentials:
            </p>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded">
              <div><strong>Admin:</strong> admin@democorp.local</div>
              <div><strong>Manager:</strong> manager1@democorp.local</div>
              <div><strong>Employee:</strong> employee1@democorp.local</div>
              <div><strong>Password:</strong> TrainFlow123!</div>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
            data-testid="button-back-to-landing"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Landing
          </button>
        </div>
      </div>
    </div>
  );
}
