import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type User = { email: string };

type AuthCtx = {
  isAuthed: boolean;
  user: User | null;
  login: (email: string, password?: string) => void;
  logout: () => void;
};

const KEY = "mi_auth_user_v1";

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // ✅ rehidrata do localStorage quando o app abre
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const login = (email: string) => {
    const next: User = { email: (email || "").trim() || "demo@local" };
    setUser(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  };

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      isAuthed: !!user,
      login,
      logout,
    }),
    [user]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}