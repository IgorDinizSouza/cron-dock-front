import { api } from "./api"

export type MotivoPriorizacaoResponse = {
  id: number
  descricao: string
}

export type MotivoPriorizacaoRequest = {
  descricao: string
}

const BASE = "/v1/motivo-priorizacao"

function normalizeItem(raw: any): MotivoPriorizacaoResponse {
  return {
    id: Number(raw?.id ?? 0),
    descricao: String(raw?.descricao ?? "").trim(),
  }
}

function unwrapArray(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

export const motivoPriorizacaoApi = {
  listAll: async (): Promise<MotivoPriorizacaoResponse[]> => unwrapArray(await api.get(BASE)).map(normalizeItem),
  getById: async (id: string | number): Promise<MotivoPriorizacaoResponse> => normalizeItem(await api.get(`${BASE}/${encodeURIComponent(String(id))}`)),
  create: async (payload: MotivoPriorizacaoRequest): Promise<MotivoPriorizacaoResponse> => normalizeItem(await api.post(BASE, { descricao: String(payload.descricao ?? "").trim() })),
  update: async (id: string | number, payload: MotivoPriorizacaoRequest): Promise<MotivoPriorizacaoResponse> =>
    normalizeItem(await api.put(`${BASE}/${encodeURIComponent(String(id))}`, { descricao: String(payload.descricao ?? "").trim() })),
  delete: async (id: string | number): Promise<void> => {
    await api.delete(`${BASE}/${encodeURIComponent(String(id))}`)
  },
}

