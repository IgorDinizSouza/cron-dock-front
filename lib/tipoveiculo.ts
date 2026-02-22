import { api } from "./api"

export type TipoVeiculoStatus = "ATIVO" | "INATIVO"

export type TipoVeiculoResponse = {
  id: number
  nome: string
  quantidadeMaximaPaletes: number | null
  status: TipoVeiculoStatus
  ativo?: boolean
}

export type TipoVeiculoRequest = {
  nome: string
  quantidadeMaximaPaletes?: number | null
  status: TipoVeiculoStatus
}

const BASE = "/v1/tipo-veiculo"

function normalizeStatus(raw: any): TipoVeiculoStatus {
  if (raw === 1 || raw === "1") return "ATIVO"
  if (raw === 0 || raw === "0") return "INATIVO"
  const s = String(raw ?? "").toUpperCase()
  return s === "INATIVO" ? "INATIVO" : "ATIVO"
}

function normalizeTipoVeiculo(raw: any): TipoVeiculoResponse {
  const status = normalizeStatus(raw?.status ?? raw?.ativo ?? raw?.active)
  const q = raw?.quantidadeMaximaPaletes ?? raw?.qtdMaximaPaletes ?? raw?.quantidade_maxima_paletes
  return {
    id: Number(raw?.id ?? 0),
    nome: String(raw?.nome ?? raw?.descricao ?? "").trim(),
    quantidadeMaximaPaletes: q == null || q === "" ? null : Number(q),
    status,
    ativo: status === "ATIVO",
  }
}

function toRequestPayload(data: Partial<TipoVeiculoRequest>) {
  const payload: Record<string, any> = {
    nome: String(data.nome ?? "").trim(),
    status: normalizeStatus(data.status),
  }
  if (data.quantidadeMaximaPaletes != null && data.quantidadeMaximaPaletes !== ("" as any)) {
    payload.quantidadeMaximaPaletes = Number(data.quantidadeMaximaPaletes)
  } else {
    payload.quantidadeMaximaPaletes = null
  }
  return payload
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

export const tipoVeiculoApi = {
  listAll: async (): Promise<TipoVeiculoResponse[]> => {
    const data = await api.get(BASE)
    return unwrapArray(data).map(normalizeTipoVeiculo)
  },

  getById: async (id: string | number): Promise<TipoVeiculoResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeTipoVeiculo(await api.get(`${BASE}/${encoded}`))
  },

  create: async (payload: TipoVeiculoRequest): Promise<TipoVeiculoResponse> => {
    return normalizeTipoVeiculo(await api.post(BASE, toRequestPayload(payload)))
  },

  update: async (id: string | number, payload: Partial<TipoVeiculoRequest>): Promise<TipoVeiculoResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeTipoVeiculo(await api.put(`${BASE}/${encoded}`, toRequestPayload(payload)))
  },

  delete: async (id: string | number): Promise<void> => {
    const encoded = encodeURIComponent(String(id))
    await api.delete(`${BASE}/${encoded}`)
  },
}
