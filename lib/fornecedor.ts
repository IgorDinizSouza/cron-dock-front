import { api } from "./api"

export type FornecedorStatus = "ATIVO" | "INATIVO"

export type FornecedorResponse = {
  id: number
  cnpj: string
  razaoSocial: string
  cidade: string
  uf: string
  dataCadastro: string | null
  status: FornecedorStatus
  dataCriacao?: string | null
  grupoEmpresarialId: number
  ativo?: boolean
}

export type FornecedorRequest = {
  cnpj: string
  razaoSocial: string
  cidade?: string
  uf?: string
  dataCadastro?: string | null
  status: FornecedorStatus
  grupoEmpresarialId?: number
}

const BASE = "/v1/fornecedor"
const AUTH_SESSION_KEY = "odonto.auth.session"

function getGrupoEmpresarialId(): number {
  if (typeof window === "undefined") return 1

  const fromLs = localStorage.getItem("grupoEmpresarialId")
  if (fromLs && Number.isFinite(Number(fromLs))) return Number(fromLs)

  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const fromSession = parsed?.user?.grupoEmpresarialId ?? parsed?.grupoEmpresarialId
      if (fromSession != null && Number.isFinite(Number(fromSession))) return Number(fromSession)
    }
  } catch {}

  return 1
}

function normalizeStatus(raw: any): FornecedorStatus {
  if (raw === 1 || raw === "1") return "ATIVO"
  if (raw === 0 || raw === "0") return "INATIVO"
  const s = String(raw ?? "").toUpperCase()
  return s === "INATIVO" ? "INATIVO" : "ATIVO"
}

function normalizeFornecedor(raw: any): FornecedorResponse {
  const status = normalizeStatus(raw?.status ?? raw?.ativo ?? raw?.active)
  return {
    id: Number(raw?.id ?? 0),
    cnpj: String(raw?.cnpj ?? "").trim(),
    razaoSocial: String(raw?.razaoSocial ?? raw?.razao_social ?? raw?.descricao ?? "").trim(),
    cidade: String(raw?.cidade ?? "").trim(),
    uf: String(raw?.uf ?? "").trim(),
    dataCadastro: raw?.dataCadastro ?? raw?.data_cadastro ?? null,
    status,
    dataCriacao: raw?.dataCriacao ?? raw?.data_criacao ?? null,
    grupoEmpresarialId: Number(raw?.grupoEmpresarialId ?? raw?.grupo_empresarial_id ?? getGrupoEmpresarialId()),
    ativo: status === "ATIVO",
  }
}

function toRequestPayload(data: Partial<FornecedorRequest>) {
  return {
    cnpj: String(data.cnpj ?? "").trim(),
    razaoSocial: String(data.razaoSocial ?? "").trim(),
    cidade: String(data.cidade ?? "").trim() || null,
    uf:
      String(data.uf ?? "")
        .trim()
        .toUpperCase() || null,
    dataCadastro: data.dataCadastro ? String(data.dataCadastro) : null,
    grupoEmpresarialId: Number(data.grupoEmpresarialId ?? getGrupoEmpresarialId()),
    status: normalizeStatus(data.status),
  }
}

export const fornecedorApi = {
  listByGrupoEmpresarial: async (grupoEmpresarialId?: string | number): Promise<FornecedorResponse[]> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const data = (await api.get(`${BASE}/grupo-empresarial/${gid}`)) as any
    if (Array.isArray(data)) return data.map(normalizeFornecedor)
    if (Array.isArray(data?.content)) return data.content.map(normalizeFornecedor)
    return []
  },

  getById: async (id: string | number, grupoEmpresarialId?: string | number): Promise<FornecedorResponse> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const encoded = encodeURIComponent(String(id))
    return normalizeFornecedor(await api.get(`${BASE}/grupo-empresarial/${gid}/${encoded}`))
  },

  create: async (payload: FornecedorRequest): Promise<FornecedorResponse> => {
    return normalizeFornecedor(await api.post(BASE, toRequestPayload(payload)))
  },

  update: async (id: string | number, payload: Partial<FornecedorRequest>): Promise<FornecedorResponse> => {
    const gid = encodeURIComponent(String(payload.grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const encoded = encodeURIComponent(String(id))
    return normalizeFornecedor(await api.put(`${BASE}/grupo-empresarial/${gid}/${encoded}`, toRequestPayload(payload)))
  },

  delete: async (id: string | number, grupoEmpresarialId?: string | number): Promise<void> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const encoded = encodeURIComponent(String(id))
    await api.delete(`${BASE}/grupo-empresarial/${gid}/${encoded}`)
  },
}

