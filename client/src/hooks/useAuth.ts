// Authentication hook - calls backend /api/v1/users/me endpoint
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  tenant_id: string;
  department_id?: string;
}

const QUERY_KEY = ["/api/v1/users/me"];

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: QUERY_KEY,
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

  const login = async (email: string, password: string): Promise<User> => {
    const res = await fetch("/api/v1/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || "Login failed");
    }

    const userData = await res.json();
    // Invalidate the cache to trigger a refetch of the user
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    return userData;
  };

  const logout = async (): Promise<void> => {
    await fetch("/api/v1/users/logout", {
      method: "POST",
      credentials: "include",
    });
    // Clear the user cache
    queryClient.setQueryData(QUERY_KEY, null);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    logout,
  };
}
