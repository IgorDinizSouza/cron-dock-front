import { api } from "./api"

export type EstadoResponse = {
  id: number
  descricao: string
  uf: string
}

const BASE = "/v1/estado"

function normalizeEstado(raw: any): EstadoResponse {
  return {
    id: Number(raw?.id ?? 0),
    descricao: String(raw?.descricao ?? raw?.nome ?? "").trim(),
    uf: String(raw?.uf ?? "").trim(),
  }
}

function unwrapArray(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  if (data?.data && typeof data.data === "object") {
    if (Array.isArray(data.data.content)) return data.data.content
    if (Array.isArray(data.data.items)) return data.data.items
  }
  return []
}

export const estadoApi = {
  listAll: async (descricao?: string): Promise<EstadoResponse[]> => {
    const qs = descricao?.trim() ? `?descricao=${encodeURIComponent(descricao.trim())}` : ""
    const data = await api.get(`${BASE}${qs}`)
    return unwrapArray(data).map(normalizeEstado)
  },

  getById: async (id: string | number): Promise<EstadoResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeEstado(await api.get(`${BASE}/${encoded}`))
  },

  getByDescricao: async (descricao: string): Promise<EstadoResponse> => {
    const encoded = encodeURIComponent(descricao.trim())
    return normalizeEstado(await api.get(`${BASE}/descricao/${encoded}`))
  },
}

