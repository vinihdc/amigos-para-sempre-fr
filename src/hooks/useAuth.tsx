import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { AuthSession, AuthStatus } from "../types";
import {
  loadCurrentSession,
  signInWithPhoneAndPin,
  signUpWithPhoneAndPin,
  signOut as signOutService,
} from "../services/authService";

interface AuthContextValue {
  status: AuthStatus;
  session: AuthSession | null;
  signIn: (phone: string, pin: string) => Promise<void>;
  signUp: (name: string, phone: string, pin: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);

  async function refresh() {
    const current = await loadCurrentSession();
    setSession(current);
    setStatus(current ? "authenticated" : "unauthenticated");
  }

  useEffect(() => {
    refresh();

    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(phone: string, pin: string) {
    await signInWithPhoneAndPin(phone, pin);
    await refresh();
  }

  async function signUp(name: string, phone: string, pin: string) {
    await signUpWithPhoneAndPin(name, phone, pin);
    await refresh();
  }

  async function signOut() {
    await signOutService();
    setSession(null);
    setStatus("unauthenticated");
  }

  return (
    <AuthContext.Provider value={{ status, session, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
