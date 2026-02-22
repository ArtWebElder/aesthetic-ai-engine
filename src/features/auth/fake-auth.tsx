import React, { createContext, useContext, useMemo, useState } from "react";

type AuthUser = { email: string } | null;

type AuthCtx = {
  user: AuthUser;
  signIn: (email: string) => void;
  signOut: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>({ email: "demo@local" });

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      signIn: (email: string) => setUser({ email }),
      signOut: () => setUser(null),
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