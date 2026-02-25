import { api } from "./api"

export type MotivoNoShowResponse = {
  id: number
  descricao: string
}

export type MotivoNoShowRequest = {
  descricao: string
}

const BASE = "/v1/motivo-no-show"

function normalizeItem(raw: any): MotivoNoShowResponse {
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

export const motivoNoShowApi = {
  listAll: async (): Promise<MotivoNoShowResponse[]> => unwrapArray(await api.get(BASE)).map(normalizeItem),
  getById: async (id: string | number): Promise<MotivoNoShowResponse> => normalizeItem(await api.get(`${BASE}/${encodeURIComponent(String(id))}`)),
  create: async (payload: MotivoNoShowRequest): Promise<MotivoNoShowResponse> => normalizeItem(await api.post(BASE, { descricao: String(payload.descricao ?? "").trim() })),
  update: async (id: string | number, payload: MotivoNoShowRequest): Promise<MotivoNoShowResponse> =>
    normalizeItem(await api.put(`${BASE}/${encodeURIComponent(String(id))}`, { descricao: String(payload.descricao ?? "").trim() })),
  delete: async (id: string | number): Promise<void> => {
    await api.delete(`${BASE}/${encodeURIComponent(String(id))}`)
  },
}

