import { api } from "./api"

export type TransportadoraStatus = "ATIVO" | "INATIVO"

export type TransportadoraResponse = {
  id: number
  descricao: string
  cnpj: string
  status: TransportadoraStatus
  grupoEmpresarialId: number
  dataCriacao?: string | null
  ativo?: boolean
}

const BASE = "/v1/transportadora"
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

function normalizeStatus(raw: any): TransportadoraStatus {
  if (raw === 1 || raw === "1") return "ATIVO"
  if (raw === 0 || raw === "0") return "INATIVO"
  const s = String(raw ?? "").toUpperCase()
  return s === "INATIVO" ? "INATIVO" : "ATIVO"
}

function normalizeTransportadora(raw: any): TransportadoraResponse {
  const status = normalizeStatus(raw?.status ?? raw?.ativo ?? raw?.active)
  return {
    id: Number(raw?.id ?? 0),
    descricao: String(raw?.descricao ?? raw?.nome ?? raw?.razaoSocial ?? "").trim(),
    cnpj: String(raw?.cnpj ?? "").trim(),
    status,
    grupoEmpresarialId: Number(raw?.grupoEmpresarialId ?? raw?.grupo_empresarial_id ?? getGrupoEmpresarialId()),
    dataCriacao: raw?.dataCriacao ?? raw?.data_criacao ?? raw?.createdAt ?? null,
    ativo: status === "ATIVO",
  }
}

function unwrapArray(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

export const transportadoraApi = {
  listByGrupoEmpresarial: async (grupoEmpresarialId?: string | number): Promise<TransportadoraResponse[]> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const data = await api.get(`${BASE}/grupo-empresarial/${gid}`)
    return unwrapArray(data).map(normalizeTransportadora)
  },

  getById: async (id: string | number, grupoEmpresarialId?: string | number): Promise<TransportadoraResponse> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const encoded = encodeURIComponent(String(id))
    return normalizeTransportadora(await api.get(`${BASE}/grupo-empresarial/${gid}/${encoded}`))
  },
}

