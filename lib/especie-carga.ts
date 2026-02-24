import { api } from "./api"

export type EspecieCargaStatus = "ATIVO" | "INATIVO"

export type EspecieCargaResponse = {
  id: number
  descricao: string
  ativo: boolean
  status: EspecieCargaStatus
  dataCriacao?: string | null
  dataAlteracao?: string | null
}

export type EspecieCargaRequest = {
  descricao: string
  ativo: boolean
}

const BASE = "/v1/especie-carga"

function normalizeStatus(raw: any): EspecieCargaStatus {
  if (raw === true || raw === 1 || raw === "1" || String(raw).toUpperCase() === "ATIVO") return "ATIVO"
  return "INATIVO"
}

function normalizeEspecieCarga(raw: any): EspecieCargaResponse {
  const status = normalizeStatus(raw?.ativo ?? raw?.status)
  return {
    id: Number(raw?.id ?? 0),
    descricao: String(raw?.descricao ?? raw?.nome ?? "").trim(),
    ativo: status === "ATIVO",
    status,
    dataCriacao: raw?.dataCriacao ?? raw?.createdAt ?? null,
    dataAlteracao: raw?.dataAlteracao ?? raw?.updatedAt ?? null,
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

function toPayload(data: Partial<EspecieCargaRequest>) {
  return {
    descricao: String(data.descricao ?? "").trim(),
    ativo: Boolean(data.ativo),
  }
}

export const especieCargaApi = {
  listAll: async (): Promise<EspecieCargaResponse[]> => {
    const data = await api.get(BASE)
    return unwrapArray(data).map(normalizeEspecieCarga)
  },

  getById: async (id: string | number): Promise<EspecieCargaResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeEspecieCarga(await api.get(`${BASE}/${encoded}`))
  },

  create: async (payload: EspecieCargaRequest): Promise<EspecieCargaResponse> => {
    return normalizeEspecieCarga(await api.post(BASE, toPayload(payload)))
  },

  update: async (id: string | number, payload: Partial<EspecieCargaRequest>): Promise<EspecieCargaResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeEspecieCarga(await api.put(`${BASE}/${encoded}`, toPayload(payload)))
  },

  delete: async (id: string | number): Promise<void> => {
    const encoded = encodeURIComponent(String(id))
    await api.delete(`${BASE}/${encoded}`)
  },
}

