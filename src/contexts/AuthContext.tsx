import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export type UserRole = "directora" | "maestro" | "padre" | "pendiente";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, displayName: string, role?: UserRole) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (action: string) => boolean;
}

const PERMISSIONS: Record<string, UserRole[]> = {
  "create-alerts": ["directora"],
  "manage-calendar": ["directora", "maestro"],
  "publish-comunicados": ["directora"],
  "upload-photos": ["directora"],
  "manage-birthdays": ["directora"],
  "manage-payments": ["directora"],
  "view-income": ["directora"],
  "teacher-notes": ["directora", "maestro"],
  "edit-message-day": ["directora"],
  "edit-delete-payments": ["directora"],
  "manage-thanks": ["directora"],
  "manage-students": ["directora"],
  "view-parent-portal": ["padre"],
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("user_id", supabaseUser.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", supabaseUser.id).maybeSingle(),
    ]);

    if (!roleRes.data) return null;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      role: roleRes.data.role as UserRole,
      displayName: profileRes.data?.display_name || supabaseUser.email || "Usuario",
    };
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setTimeout(async () => {
          const profile = await fetchUserProfile(session.user);
          setUser(profile);
          setLoading(false);
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user);
        setUser(profile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signup = useCallback(async (email: string, password: string, displayName: string, role?: UserRole) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        const rpcParams: Record<string, string> = {
          _user_id: data.user.id,
          _display_name: displayName,
        };
        if (role && ["directora", "maestro"].includes(role)) {
          rpcParams._role = role;
        }
        const { error: fnError } = await (supabase.rpc as any)("handle_new_user_registration", rpcParams);
        if (fnError) return { error: fnError.message };
      }
      return {};
    } catch (err: any) {
      return { error: err?.message || "Error inesperado durante el registro" };
    }
  }, []);

  const logout = useCallback(async () => {
    // Clear all cached data before signing out
    localStorage.clear();
    sessionStorage.clear();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }, []);

  const hasPermission = useCallback((action: string) => {
    if (!user) return false;
    const allowed = PERMISSIONS[action];
    return allowed ? allowed.includes(user.role) : false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAuthenticated: !!user, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
