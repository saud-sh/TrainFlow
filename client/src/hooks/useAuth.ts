// Authentication hook - calls backend /api/v1/users/me endpoint
import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  tenant_id: string;
  department_id?: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/v1/users/me"],
    queryFn: async () => {
      const res = await fetch("/api/v1/users/me", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Not authenticated");
      }
      return res.json();
    },
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
