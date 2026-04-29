"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { createClient } from "@/lib/supabase/client";

type AuthSessionContextValue = {
  email: string | null;
  setEmail: (email: string | null) => void;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }

  return context;
}

export function AuthSessionProvider({
  children,
  initialEmail,
}: {
  children: ReactNode;
  initialEmail: string | null;
}) {
  const [email, setEmail] = useState<string | null>(initialEmail);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({ email, setEmail }), [email]);

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}