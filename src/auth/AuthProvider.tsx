import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, setUnauthorizedHandler } from "../lib/api";
import type { CurrentStaff, Permission } from "../lib/types";

interface AuthValue {
  staff: CurrentStaff | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<CurrentStaff>;
  logout: () => Promise<void>;
  setStaff: (staff: CurrentStaff) => void;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);
const ME_KEY = ["auth", "me"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const me = useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return (await api.get<{ staff: CurrentStaff }>("/auth/me")).staff;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

  const signedOut = useCallback(() => {
    qc.setQueryData(ME_KEY, null);
    // Drop cached admin data so the next person to sign in on this browser sees nothing stale.
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
  }, [qc]);

  useEffect(() => {
    setUnauthorizedHandler(signedOut);
    return () => setUnauthorizedHandler(null);
  }, [signedOut]);

  const value: AuthValue = {
    staff: me.data ?? null,
    loading: me.isPending,
    login: async (email, password) => {
      const { staff } = await api.post<{ staff: CurrentStaff }>("/auth/login", { email, password });
      qc.setQueryData(ME_KEY, staff);
      return staff;
    },
    logout: async () => {
      try {
        await api.post("/auth/logout");
      } finally {
        signedOut();
      }
    },
    setStaff: (staff) => qc.setQueryData(ME_KEY, staff),
    can: (permission) => !!me.data?.permissions.includes(permission),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
