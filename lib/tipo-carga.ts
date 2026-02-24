import { api } from "./api"

export type TipoCargaResponse = {
  id: number
  descricao: string
  minSku: number | null
  maxSku: number | null
}

export type TipoCargaRequest = {
  descricao: string
  minSku?: number | null
  maxSku?: number | null
}

const BASE = "/v1/tipo-carga"

function normalizeTipoCarga(raw: any): TipoCargaResponse {
  const minSku = raw?.minSku ?? raw?.min_sku
  const maxSku = raw?.maxSku ?? raw?.max_sku
  return {
    id: Number(raw?.id ?? 0),
    descricao: String(raw?.descricao ?? raw?.nome ?? "").trim(),
    minSku: minSku == null || minSku === "" ? null : Number(minSku),
    maxSku: maxSku == null || maxSku === "" ? null : Number(maxSku),
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

function toPayload(data: Partial<TipoCargaRequest>) {
  return {
    descricao: String(data.descricao ?? "").trim(),
    minSku: data.minSku == null || data.minSku === ("" as any) ? null : Number(data.minSku),
    maxSku: data.maxSku == null || data.maxSku === ("" as any) ? null : Number(data.maxSku),
  }
}

export const tipoCargaApi = {
  listAll: async (): Promise<TipoCargaResponse[]> => {
    const data = await api.get(BASE)
    return unwrapArray(data).map(normalizeTipoCarga)
  },

  getById: async (id: string | number): Promise<TipoCargaResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeTipoCarga(await api.get(`${BASE}/${encoded}`))
  },

  create: async (payload: TipoCargaRequest): Promise<TipoCargaResponse> => {
    return normalizeTipoCarga(await api.post(BASE, toPayload(payload)))
  },

  update: async (id: string | number, payload: Partial<TipoCargaRequest>): Promise<TipoCargaResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeTipoCarga(await api.put(`${BASE}/${encoded}`, toPayload(payload)))
  },

  delete: async (id: string | number): Promise<void> => {
    const encoded = encodeURIComponent(String(id))
    await api.delete(`${BASE}/${encoded}`)
  },
}

