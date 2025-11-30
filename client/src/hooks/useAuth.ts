// Authentication hook - calls backend /api/v1/users/me endpoint
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  tenant_id?: string;
  department_id?: string;
}

const QUERY_KEY = ["/api/v1/users/me"];

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/v1/users/me", {
        credentials: "include",
      });
      if (!res.ok) {
        // Return null instead of throwing - allows app to render while loading
        return null;
      }
      return res.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
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
    
    // Wait for the refetch to complete so user data is available
    await queryClient.refetchQueries({ queryKey: QUERY_KEY });
    
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
