"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ConsultorioLoginResponse = {
  id: number;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  cep?: string | null;
  cnpj?: string | null;
  estado?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  logoMimeType?: string | null;
  logoBase64?: string | null;
};

export type AuthSession = {
  token: string;
  expiresIn: number;        // em segundos (como vem do backend)
  nome: string;
  perfil: "ADMIN" | "DENTISTA" | "ATENDENTE" | string;
  consultorioId?: number | null;
  consultorio?: ConsultorioLoginResponse | null;
};

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  token: string | null;

  // setSession(session, {persist:true}) salva no localStorage
  setSession: (session: AuthSession | null, opts?: { persist?: boolean }) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "odonto.auth.session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);

  // carrega de localStorage ao montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthSession;
        setSessionState(parsed);
      }
    } catch {}
  }, []);

  // mantém abas sincronizadas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        try {
          setSessionState(e.newValue ? (JSON.parse(e.newValue) as AuthSession) : null);
        } catch {
          setSessionState(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setSession = useCallback((s: AuthSession | null, opts?: { persist?: boolean }) => {
    setSessionState(s);
    if (opts?.persist) {
      if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSessionState(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      session,
      isAuthenticated: !!session?.token,
      token: session?.token ?? null,
      setSession,
      signOut,
    };
  }, [session, setSession, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
