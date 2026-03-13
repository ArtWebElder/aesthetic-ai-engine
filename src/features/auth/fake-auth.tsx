import React, { createContext, useContext, useMemo, useState } from "react";

type User = { email: string; name?: string };

type AuthCtx = {
  isAuthed: boolean;
  user: User | null;
  login: (email: string, password?: string) => void;
  logout: () => void;
};

const KEY = "mi_auth_user_v1";

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Leitura síncrona: evita flash de "não autenticado" no hard refresh
  const [user, setUser] = useState<User | null>(readStoredUser);

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