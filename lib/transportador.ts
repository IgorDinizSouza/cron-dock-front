import { api } from "./api"

export type TransportadorStatus = "ATIVO" | "INATIVO"

export type TransportadorResponse = {
  id: number
  descricao: string
  cnpj: string
  status: TransportadorStatus
  grupoEmpresarialId: number
  ativo?: boolean
}

export type TransportadorRequest = {
  descricao: string
  cnpj: string
  status: TransportadorStatus
  grupoEmpresarialId?: number
}

const BASE = "/v1/transportador"
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

function normalizeStatus(raw: any): TransportadorStatus {
  if (raw === 1 || raw === "1") return "ATIVO"
  if (raw === 0 || raw === "0") return "INATIVO"
  const s = String(raw ?? "").toUpperCase()
  return s === "INATIVO" ? "INATIVO" : "ATIVO"
}

function normalizeTransportador(raw: any): TransportadorResponse {
  const status = normalizeStatus(raw?.status ?? raw?.ativo ?? raw?.active)
  return {
    id: Number(raw?.id ?? 0),
    descricao: String(raw?.descricao ?? raw?.nome ?? ""),
    cnpj: String(raw?.cnpj ?? ""),
    status,
    grupoEmpresarialId: Number(raw?.grupoEmpresarialId ?? raw?.grupo_empresarial_id ?? getGrupoEmpresarialId()),
    ativo: status === "ATIVO",
  }
}

function toRequestPayload(data: Partial<TransportadorRequest>) {
  return {
    descricao: String(data.descricao ?? "").trim(),
    cnpj: String(data.cnpj ?? "").trim(),
    grupoEmpresarialId: Number(data.grupoEmpresarialId ?? getGrupoEmpresarialId()),
    status: normalizeStatus(data.status),
  }
}

export const transportadorApi = {
  listByGrupoEmpresarial: async (grupoEmpresarialId?: string | number): Promise<TransportadorResponse[]> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const data = (await api.get(`${BASE}/grupo-empresarial/${gid}`)) as any
    if (Array.isArray(data)) return data.map(normalizeTransportador)
    if (Array.isArray(data?.content)) return data.content.map(normalizeTransportador)
    return []
  },

  getById: async (id: string | number, grupoEmpresarialId?: string | number): Promise<TransportadorResponse> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const encoded = encodeURIComponent(String(id))
    return normalizeTransportador(await api.get(`${BASE}/grupo-empresarial/${gid}/${encoded}`))
  },

  create: async (payload: TransportadorRequest): Promise<TransportadorResponse> => {
    return normalizeTransportador(await api.post(BASE, toRequestPayload(payload)))
  },

  update: async (id: string | number, payload: Partial<TransportadorRequest>): Promise<TransportadorResponse> => {
    const gid = encodeURIComponent(String(payload.grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const encoded = encodeURIComponent(String(id))
    return normalizeTransportador(await api.put(`${BASE}/grupo-empresarial/${gid}/${encoded}`, toRequestPayload(payload)))
  },

  delete: async (id: string | number, grupoEmpresarialId?: string | number): Promise<void> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const encoded = encodeURIComponent(String(id))
    await api.delete(`${BASE}/grupo-empresarial/${gid}/${encoded}`)
  },
}

