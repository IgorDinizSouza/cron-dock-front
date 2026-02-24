import { api } from "./api"

export type TempoDescarregamentoEspecieCargaResponse = {
  id: number
  especieCargaId: number
  minuto: number
}

export type TempoDescarregamentoEspecieCargaRequest = {
  especieCargaId: number
  minuto: number
}

const BASE = "/v1/tempo-descarregamento-especie-carga"

function normalizeItem(raw: any): TempoDescarregamentoEspecieCargaResponse {
  const especieCargaId =
    raw?.especieCargaId ??
    raw?.especie_carga_id ??
    raw?.idEspecieCarga ??
    raw?.especieCarga?.id ??
    raw?.especie_carga?.id
  const minuto = raw?.minuto ?? raw?.minutos ?? raw?.tempo ?? 0
  return {
    id: Number(raw?.id ?? 0),
    especieCargaId: Number(especieCargaId ?? 0),
    minuto: Number(minuto ?? 0),
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

function toPayload(data: Partial<TempoDescarregamentoEspecieCargaRequest>) {
  return {
    especieCargaId: Number(data.especieCargaId ?? 0),
    minuto: Number(data.minuto ?? 0),
  }
}

export const tempoDescarregamentoEspecieCargaApi = {
  listAll: async (): Promise<TempoDescarregamentoEspecieCargaResponse[]> => {
    const data = await api.get(BASE)
    return unwrapArray(data).map(normalizeItem)
  },

  getById: async (id: string | number): Promise<TempoDescarregamentoEspecieCargaResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeItem(await api.get(`${BASE}/${encoded}`))
  },

  create: async (payload: TempoDescarregamentoEspecieCargaRequest): Promise<TempoDescarregamentoEspecieCargaResponse> => {
    return normalizeItem(await api.post(BASE, toPayload(payload)))
  },

  update: async (
    id: string | number,
    payload: TempoDescarregamentoEspecieCargaRequest,
  ): Promise<TempoDescarregamentoEspecieCargaResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeItem(await api.put(`${BASE}/${encoded}`, toPayload(payload)))
  },

  delete: async (id: string | number): Promise<void> => {
    const encoded = encodeURIComponent(String(id))
    await api.delete(`${BASE}/${encoded}`)
  },
}
