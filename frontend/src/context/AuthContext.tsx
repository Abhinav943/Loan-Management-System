"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  api,
  setAccessToken,
  subscribeTokenRefresh,
  registerOnLogout,
} from "@/services/api";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Simple client-side JWT decoder
const decodeToken = (token: string) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(window.atob(payload));
    return decoded; // Expected: { id, role, iat, exp }
  } catch (e) {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Helper to update token in context and service
  const updateToken = (token: string | null) => {
    setAccessTokenState(token);
    setAccessToken(token);
  };

  // Perform logout
  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (e) {
      console.error("Logout request failed", e);
    } finally {
      setUser(null);
      updateToken(null);
      localStorage.removeItem("lms_user_meta");
      router.push("/login");
    }
  };

  // Try to restore session on load (check if HttpOnly refresh token cookie is active)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await api.post("/api/auth/refresh");
        const token = response.data?.data?.accessToken;
        if (token) {
          updateToken(token);
          const decoded = decodeToken(token);
          
          // Restore user profile meta from localStorage if matching
          const localUserMeta = localStorage.getItem("lms_user_meta");
          if (localUserMeta) {
            const parsed = JSON.parse(localUserMeta);
            if (parsed.id === decoded?.id) {
              setUser(parsed);
              setLoading(false);
              return;
            }
          }

          // Fallback: If no metadata exists in localStorage, build it from JWT payload
          setUser({
            id: decoded?.id || "",
            fullName: decoded?.role === "Admin" ? "System Admin" : `${decoded?.role} Executive`,
            email: `${decoded?.role?.toLowerCase()}@lms.com`,
            role: decoded?.role || "",
          });
        }
      } catch (e) {
        console.log("No active session or refresh failed.");
        localStorage.removeItem("lms_user_meta");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Sync token refreshes performed by Axios Interceptor
  useEffect(() => {
    const unsubscribe = subscribeTokenRefresh((token) => {
      updateToken(token);
      const decoded = decodeToken(token);
      
      const localUserMeta = localStorage.getItem("lms_user_meta");
      if (localUserMeta) {
        const parsed = JSON.parse(localUserMeta);
        if (parsed.id === decoded?.id) {
          setUser(parsed);
          return;
        }
      }

      setUser((prev) =>
        prev && prev.id === decoded?.id
          ? prev
          : {
              id: decoded?.id || "",
              fullName: decoded?.role === "Admin" ? "System Admin" : `${decoded?.role} Executive`,
              email: `${decoded?.role?.toLowerCase()}@lms.com`,
              role: decoded?.role || "",
            }
      );
    });

    registerOnLogout(handleLogout);

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post("/api/auth/login", { email, password });
      const { _id, fullName, role, accessToken: token } = response.data.data;

      updateToken(token);
      const loggedUser = { id: _id, fullName, email, role };
      setUser(loggedUser);
      localStorage.setItem("lms_user_meta", JSON.stringify(loggedUser));
    } catch (error) {
      updateToken(null);
      setUser(null);
      localStorage.removeItem("lms_user_meta");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (fullName: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post("/api/auth/signup", {
        fullName,
        email,
        password,
      });
      const { _id, role, accessToken: token } = response.data.data;

      updateToken(token);
      const loggedUser = { id: _id, fullName, email, role };
      setUser(loggedUser);
      localStorage.setItem("lms_user_meta", JSON.stringify(loggedUser));
    } catch (error) {
      updateToken(null);
      setUser(null);
      localStorage.removeItem("lms_user_meta");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = handleLogout;

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Route Guard Component
export const RouteGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const publicRoutes = ["/login", "/unauthorized"];
    const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

    if (!user) {
      if (!isPublic) {
        router.push("/login");
      }
      return;
    }

    // Role-Based Authorization
    const role = user.role;

    // 1. Borrower Guards
    if (role === "Borrower") {
      if (!pathname.startsWith("/borrower") && !pathname.startsWith("/unauthorized")) {
        router.push("/borrower");
      }
      return;
    }

    // 2. Executive Guards (Sales, Sanction, Disbursement, Collection)
    const roleRoutes: Record<string, string> = {
      Sales: "/dashboard/sales",
      Sanction: "/dashboard/sanction",
      Disbursement: "/dashboard/disbursement",
      Collection: "/dashboard/collection",
    };

    if (role in roleRoutes) {
      const allowedPath = roleRoutes[role];
      
      // Prevent executives from accessing borrower page
      if (pathname.startsWith("/borrower")) {
        router.push("/unauthorized");
        return;
      }

      // Prevent executives from accessing modules other than their own (except if they are admin)
      if (pathname.startsWith("/dashboard")) {
        if (!pathname.startsWith(allowedPath) && pathname !== "/dashboard") {
          router.push("/unauthorized");
        }
      } else if (!isPublic) {
        router.push(allowedPath);
      }
      return;
    }

    // 3. Admin Guards
    if (role === "Admin") {
      if (pathname.startsWith("/borrower")) {
        router.push("/unauthorized");
      }
      return;
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500"></div>
          <p className="text-slate-400 font-medium animate-pulse">
            Authenticating Secure Connection...
          </p>
        </div>
      </div>
    );
  }

  // Prevent flash of guarded content before router handles redirection
  const isPublic = ["/login", "/unauthorized"].some((route) =>
    pathname.startsWith(route)
  );

  if (!user && !isPublic) {
    return null;
  }

  if (user) {
    const role = user.role;
    if (role === "Borrower" && !pathname.startsWith("/borrower") && !isPublic) {
      return null;
    }
    if (role !== "Admin" && role !== "Borrower" && pathname.startsWith("/dashboard")) {
      const roleRoutes: Record<string, string> = {
        Sales: "/dashboard/sales",
        Sanction: "/dashboard/sanction",
        Disbursement: "/dashboard/disbursement",
        Collection: "/dashboard/collection",
      };
      const allowedPath = roleRoutes[role];
      if (!pathname.startsWith(allowedPath) && pathname !== "/dashboard") {
        return null;
      }
    }
    if (role !== "Borrower" && pathname.startsWith("/borrower")) {
      return null;
    }
  }

  return <>{children}</>;
};
