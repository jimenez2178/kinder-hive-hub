import React, { createContext, useContext, useState, useCallback } from "react";

export type UserRole = "directora" | "asistente" | "maestro";

export interface User {
  username: string;
  role: UserRole;
  displayName: string;
}

const USERS: Record<string, { password: string; role: UserRole; displayName: string }> = {
  directora: { password: "1234", role: "directora", displayName: "Directora" },
  asistente: { password: "1234", role: "asistente", displayName: "Asistente" },
  maestro: { password: "1234", role: "maestro", displayName: "Maestro/a" },
};

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (action: string) => boolean;
}

const PERMISSIONS: Record<string, UserRole[]> = {
  "create-alerts": ["directora", "asistente"],
  "manage-calendar": ["directora", "asistente"],
  "publish-comunicados": ["directora", "asistente"],
  "upload-photos": ["directora", "asistente"],
  "manage-birthdays": ["directora", "asistente"],
  "manage-payments": ["directora", "asistente"],
  "view-income": ["directora"],
  "teacher-notes": ["directora", "asistente", "maestro"],
  "edit-message-day": ["directora", "asistente"],
  "edit-delete-payments": ["directora"],
  "manage-thanks": ["directora", "asistente"],
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("edu-dashboard-user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((username: string, password: string) => {
    const u = USERS[username.toLowerCase()];
    if (u && u.password === password) {
      const userData: User = { username: username.toLowerCase(), role: u.role, displayName: u.displayName };
      setUser(userData);
      localStorage.setItem("edu-dashboard-user", JSON.stringify(userData));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("edu-dashboard-user");
  }, []);

  const hasPermission = useCallback((action: string) => {
    if (!user) return false;
    const allowed = PERMISSIONS[action];
    return allowed ? allowed.includes(user.role) : false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
