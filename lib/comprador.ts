import { api } from "./api"

export type CompradorStatus = "ATIVO" | "INATIVO"

export type CompradorResponse = {
  id: number
  descricao: string
  status: CompradorStatus
  dataCriacao?: string | null
  grupoEmpresarialId: number
  ativo?: boolean
}

export type CompradorRequest = {
  id?: number
  descricao: string
  status: CompradorStatus
  grupoEmpresarialId?: number
}

const BASE = "/v1/comprador"
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

function normalizeStatus(raw: any): CompradorStatus {
  if (raw === 1 || raw === "1") return "ATIVO"
  if (raw === 0 || raw === "0") return "INATIVO"
  const s = String(raw ?? "").toUpperCase()
  return s === "INATIVO" ? "INATIVO" : "ATIVO"
}

function normalizeComprador(raw: any): CompradorResponse {
  const status = normalizeStatus(raw?.status ?? raw?.ativo ?? raw?.active)
  return {
    id: Number(raw?.id ?? 0),
    descricao: String(raw?.descricao ?? raw?.nome ?? "").trim(),
    status,
    dataCriacao: raw?.dataCriacao ?? raw?.data_criacao ?? null,
    grupoEmpresarialId: Number(raw?.grupoEmpresarialId ?? raw?.grupo_empresarial_id ?? getGrupoEmpresarialId()),
    ativo: status === "ATIVO",
  }
}

function toRequestPayload(data: Partial<CompradorRequest>) {
  return {
    id: data.id != null ? Number(data.id) : undefined,
    descricao: String(data.descricao ?? "").trim(),
    grupoEmpresarialId: Number(data.grupoEmpresarialId ?? getGrupoEmpresarialId()),
    status: normalizeStatus(data.status),
  }
}

export const compradorApi = {
  listByGrupoEmpresarial: async (grupoEmpresarialId?: string | number): Promise<CompradorResponse[]> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const data = (await api.get(`${BASE}/grupo-empresarial/${gid}`)) as any
    if (Array.isArray(data)) return data.map(normalizeComprador)
    if (Array.isArray(data?.content)) return data.content.map(normalizeComprador)
    if (Array.isArray(data?.items)) return data.items.map(normalizeComprador)
    if (Array.isArray(data?.data)) return data.data.map(normalizeComprador)
    if (data?.data && typeof data.data === "object") {
      if (Array.isArray(data.data.content)) return data.data.content.map(normalizeComprador)
      if (Array.isArray(data.data.items)) return data.data.items.map(normalizeComprador)
    }
    return []
  },

  listAll: async (): Promise<CompradorResponse[]> => {
    return compradorApi.listByGrupoEmpresarial()
  },

  getById: async (id: string | number, grupoEmpresarialId?: string | number): Promise<CompradorResponse> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const encoded = encodeURIComponent(String(id))
    return normalizeComprador(await api.get(`${BASE}/grupo-empresarial/${gid}/${encoded}`))
  },

  create: async (payload: CompradorRequest): Promise<CompradorResponse> => {
    return normalizeComprador(await api.post(BASE, toRequestPayload(payload)))
  },

  update: async (id: string | number, payload: Partial<CompradorRequest>): Promise<CompradorResponse> => {
    const gid = encodeURIComponent(String(payload.grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const encoded = encodeURIComponent(String(id))
    return normalizeComprador(await api.put(`${BASE}/grupo-empresarial/${gid}/${encoded}`, toRequestPayload(payload)))
  },

  delete: async (id: string | number, grupoEmpresarialId?: string | number): Promise<void> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const encoded = encodeURIComponent(String(id))
    await api.delete(`${BASE}/grupo-empresarial/${gid}/${encoded}`)
  },
}
