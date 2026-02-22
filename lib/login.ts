import type { LoginPerfil, LoginRole, LoginUser } from "@/contexts/auth-context";
import { API_BASE_URL } from "@/lib/api";

type LoginRequest = {
  usuario: string;
  senha: string;
};

function isObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeRole(raw: unknown): LoginRole {
  if (!isObject(raw)) throw new Error("Resposta de login invalida: role invalida.");
  const id = Number(raw.id);
  const nome = String(raw.nome ?? "").trim();
  if (!Number.isFinite(id) || !nome) {
    throw new Error("Resposta de login invalida: role sem id/nome.");
  }
  return {
    id,
    nome,
    descricao: raw.descricao != null ? String(raw.descricao) : null,
    dataCriacao: raw.dataCriacao != null ? String(raw.dataCriacao) : undefined,
    dataAlteracao: raw.dataAlteracao != null ? String(raw.dataAlteracao) : undefined,
  };
}

function normalizePerfil(raw: unknown): LoginPerfil {
  if (!isObject(raw)) throw new Error("Resposta de login invalida: perfil invalido.");
  const id = Number(raw.id);
  const descricao = String(raw.descricao ?? "").trim();
  if (!Number.isFinite(id) || !descricao) {
    throw new Error("Resposta de login invalida: perfil sem id/descricao.");
  }
  const roles = Array.isArray(raw.roles) ? raw.roles.map(normalizeRole) : [];
  return {
    id,
    descricao,
    dataCriacao: raw.dataCriacao != null ? String(raw.dataCriacao) : undefined,
    dataAlteracao: raw.dataAlteracao != null ? String(raw.dataAlteracao) : undefined,
    roles,
  };
}

export function validateLoginResponse(raw: unknown): LoginUser {
  if (!isObject(raw)) throw new Error("Resposta de login invalida.");

  const id = Number(raw.id);
  const descricao = String(raw.descricao ?? "").trim();
  const email = String(raw.email ?? "").trim();
  const status = String(raw.status ?? "").trim();
  const perfis = Array.isArray(raw.perfis) ? raw.perfis.map(normalizePerfil) : [];

  if (!Number.isFinite(id)) throw new Error("Resposta de login invalida: usuario sem id.");
  if (!descricao) throw new Error("Resposta de login invalida: usuario sem descricao.");
  if (!email) throw new Error("Resposta de login invalida: usuario sem email.");
  if (!status) throw new Error("Resposta de login invalida: usuario sem status.");

  return {
    id,
    descricao,
    email,
    status,
    grupoEmpresarialId:
      raw.grupoEmpresarialId == null || raw.grupoEmpresarialId === ""
        ? null
        : Number(raw.grupoEmpresarialId),
    grupoEmpresarialDescricao:
      raw.grupoEmpresarialDescricao != null ? String(raw.grupoEmpresarialDescricao) : null,
    perfis,
  };
}

export async function login(payload: LoginRequest): Promise<LoginUser> {
  const usuario = String(payload.usuario ?? "").trim();
  const senha = String(payload.senha ?? "");

  if (!usuario) throw new Error("Informe o usuario.");
  if (!senha) throw new Error("Informe a senha.");

  const response = await fetch(`${API_BASE_URL}/v1/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ usuario, senha }),
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text().catch(() => "");
  const data = contentType.includes("application/json") ? (() => {
    try {
      return JSON.parse(text || "{}");
    } catch {
      return null;
    }
  })() : null;

  if (!response.ok) {
    const message =
      (isObject(data) && (data.message || data.mensagem)) ||
      text ||
      `${response.status} ${response.statusText}`;
    const err: any = new Error(String(message));
    err.status = response.status;
    err.payload = data;
    throw err;
  }

  const user = validateLoginResponse(data);
  if (user.status.toUpperCase() !== "ATIVO") {
    throw new Error("Usuario inativo.");
  }
  return user;
}
