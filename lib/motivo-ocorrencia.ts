import { api } from "./api"

export type MotivoOcorrenciaResponse = {
  id: number
  descricao: string
}

export type MotivoOcorrenciaRequest = {
  descricao: string
}

const BASE = "/v1/motivo-ocorrencia"

function normalizeItem(raw: any): MotivoOcorrenciaResponse {
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

export const motivoOcorrenciaApi = {
  listAll: async (): Promise<MotivoOcorrenciaResponse[]> => unwrapArray(await api.get(BASE)).map(normalizeItem),
  getById: async (id: string | number): Promise<MotivoOcorrenciaResponse> => normalizeItem(await api.get(`${BASE}/${encodeURIComponent(String(id))}`)),
  create: async (payload: MotivoOcorrenciaRequest): Promise<MotivoOcorrenciaResponse> => normalizeItem(await api.post(BASE, { descricao: String(payload.descricao ?? "").trim() })),
  update: async (id: string | number, payload: MotivoOcorrenciaRequest): Promise<MotivoOcorrenciaResponse> =>
    normalizeItem(await api.put(`${BASE}/${encodeURIComponent(String(id))}`, { descricao: String(payload.descricao ?? "").trim() })),
  delete: async (id: string | number): Promise<void> => {
    await api.delete(`${BASE}/${encodeURIComponent(String(id))}`)
  },
}

