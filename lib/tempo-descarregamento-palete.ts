import { api } from "./api"

export type TempoDescarregamentoPaleteResponse = {
  id: number
  tipoVeiculoId: number
  tipoCargaId: number
  minuto: number
}

export type TempoDescarregamentoPaleteRequest = {
  tipoVeiculoId: number
  tipoCargaId: number
  minuto: number
}

const BASE = "/v1/tempo-descarregamento-palete"

function normalizeItem(raw: any): TempoDescarregamentoPaleteResponse {
  const tipoVeiculoId =
    raw?.tipoVeiculoId ??
    raw?.tipo_veiculo_id ??
    raw?.idTipoVeiculo ??
    raw?.tipoVeiculo?.id ??
    raw?.tipo_veiculo?.id
  const tipoCargaId =
    raw?.tipoCargaId ??
    raw?.tipo_carga_id ??
    raw?.idTipoCarga ??
    raw?.tipoCarga?.id ??
    raw?.tipo_carga?.id
  const minuto = raw?.minuto ?? raw?.minutos ?? raw?.tempo ?? 0
  return {
    id: Number(raw?.id ?? 0),
    tipoVeiculoId: Number(tipoVeiculoId ?? 0),
    tipoCargaId: Number(tipoCargaId ?? 0),
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

function toPayload(data: Partial<TempoDescarregamentoPaleteRequest>) {
  return {
    tipoVeiculoId: Number(data.tipoVeiculoId ?? 0),
    tipoCargaId: Number(data.tipoCargaId ?? 0),
    minuto: Number(data.minuto ?? 0),
  }
}

export const tempoDescarregamentoPaleteApi = {
  listAll: async (): Promise<TempoDescarregamentoPaleteResponse[]> => {
    const data = await api.get(BASE)
    return unwrapArray(data).map(normalizeItem)
  },

  getById: async (id: string | number): Promise<TempoDescarregamentoPaleteResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeItem(await api.get(`${BASE}/${encoded}`))
  },

  create: async (payload: TempoDescarregamentoPaleteRequest): Promise<TempoDescarregamentoPaleteResponse> => {
    return normalizeItem(await api.post(BASE, toPayload(payload)))
  },

  update: async (
    id: string | number,
    payload: TempoDescarregamentoPaleteRequest,
  ): Promise<TempoDescarregamentoPaleteResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeItem(await api.put(`${BASE}/${encoded}`, toPayload(payload)))
  },

  delete: async (id: string | number): Promise<void> => {
    const encoded = encodeURIComponent(String(id))
    await api.delete(`${BASE}/${encoded}`)
  },
}
