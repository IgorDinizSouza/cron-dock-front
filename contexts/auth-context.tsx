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
  token?: string | null;
  expiresIn?: number | null; // em segundos (quando existir no backend)
  nome?: string;
  perfil?: "ADMIN" | "DENTISTA" | "ATENDENTE" | string;
  consultorioId?: number | null;
  consultorio?: ConsultorioLoginResponse | null;
  user?: LoginUser | null;
  perfis?: LoginPerfil[];
  roles?: LoginRole[];
  perfilNames?: string[];
  roleNames?: string[];
  authenticatedAt?: string;
};

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isReady: boolean;
  token: string | null;
  user: LoginUser | null;
  perfis: LoginPerfil[];
  roles: LoginRole[];
  hasRole: (roleName: string) => boolean;
  hasPerfil: (perfilName: string) => boolean;

  // setSession(session, {persist:true}) salva no localStorage
  setSession: (session: AuthSession | null, opts?: { persist?: boolean }) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "odonto.auth.session";

export type LoginRole = {
  id: number;
  nome: string;
  descricao?: string | null;
  dataCriacao?: string;
  dataAlteracao?: string;
};

export type LoginPerfil = {
  id: number;
  descricao: string;
  dataCriacao?: string;
  dataAlteracao?: string;
  roles: LoginRole[];
};

export type LoginUser = {
  id: number;
  descricao: string;
  email: string;
  status: string;
  grupoEmpresarialId?: number | null;
  grupoEmpresarialDescricao?: string | null;
  perfis: LoginPerfil[];
};

function uniqueById<T extends { id: number }>(items: T[]): T[] {
  const map = new Map<number, T>();
  for (const item of items) {
    if (!Number.isFinite(item.id)) continue;
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return Array.from(map.values());
}

function normalizeSession(input: AuthSession | null): AuthSession | null {
  if (!input) return null;

  const perfisFromUser = Array.isArray(input.user?.perfis) ? input.user!.perfis : [];
  const perfis = uniqueById<LoginPerfil>(Array.isArray(input.perfis) && input.perfis.length > 0 ? input.perfis : perfisFromUser);

  const rolesFromPerfis = perfis.flatMap((perfil) => (Array.isArray(perfil.roles) ? perfil.roles : []));
  const roles = uniqueById<LoginRole>(Array.isArray(input.roles) && input.roles.length > 0 ? input.roles : rolesFromPerfis);

  const perfilNames =
    Array.isArray(input.perfilNames) && input.perfilNames.length > 0
      ? input.perfilNames
      : perfis.map((perfil) => perfil.descricao).filter(Boolean);
  const roleNames =
    Array.isArray(input.roleNames) && input.roleNames.length > 0
      ? input.roleNames
      : roles.map((role) => role.nome).filter(Boolean);

  const nome = input.nome ?? input.user?.descricao ?? undefined;
  const perfil = input.perfil ?? perfilNames[0] ?? undefined;

  return {
    ...input,
    nome,
    perfil,
    token: input.token ?? null,
    expiresIn: input.expiresIn ?? null,
    perfis,
    roles,
    perfilNames,
    roleNames,
    authenticatedAt: input.authenticatedAt ?? new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  // carrega de localStorage ao montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthSession;
        setSessionState(normalizeSession(parsed));
      }
    } catch {
      setSessionState(null);
    } finally {
      setIsReady(true);
    }
  }, []);

  // mantém abas sincronizadas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        try {
          setSessionState(e.newValue ? normalizeSession(JSON.parse(e.newValue) as AuthSession) : null);
        } catch {
          setSessionState(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setSession = useCallback((s: AuthSession | null, opts?: { persist?: boolean }) => {
    const normalized = normalizeSession(s);
    setSessionState(normalized);
    if (opts?.persist) {
      if (normalized) localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("authToken");
    localStorage.removeItem("consultorioId");
    localStorage.removeItem("grupoEmpresarialId");
    setSessionState(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const perfis = session?.perfis ?? [];
    const roles = session?.roles ?? [];
    const isAuthenticated = !!session && (!!session.user || !!session.token || perfis.length > 0 || !!session.nome);
    const normalizedRoleSet = new Set(roles.map((r) => String(r.nome || "").trim().toUpperCase()).filter(Boolean));
    const normalizedPerfilSet = new Set(perfis.map((p) => String(p.descricao || "").trim().toUpperCase()).filter(Boolean));

    return {
      session,
      isAuthenticated,
      isReady,
      token: session?.token ?? null,
      user: session?.user ?? null,
      perfis,
      roles,
      hasRole: (roleName: string) => normalizedRoleSet.has(String(roleName || "").trim().toUpperCase()),
      hasPerfil: (perfilName: string) => normalizedPerfilSet.has(String(perfilName || "").trim().toUpperCase()),
      setSession,
      signOut,
    };
  }, [session, isReady, setSession, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
