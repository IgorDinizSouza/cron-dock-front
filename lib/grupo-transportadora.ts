import { api } from "./api"

export type GrupoTransportadoraStatus = "ATIVO" | "INATIVO"

export type GrupoTransportadoraResponse = {
  id: number
  descricao: string
  status: GrupoTransportadoraStatus
  dataCriacao?: string | null
}

export type GrupoTransportadoraTransportadoraVinculo = {
  id: number
  grupoTransportadoraId: number
  transportadoraId: number
  dataCriacao?: string | null
  transportadoraDescricao?: string | null
  transportadora?: {
    id: number
    descricao: string
    cnpj: string
    status: GrupoTransportadoraStatus
    grupoEmpresarialId?: number
  } | null
}

export type GrupoTransportadoraComTransportadorasResponse = GrupoTransportadoraResponse & {
  transportadoras: GrupoTransportadoraTransportadoraVinculo[]
}

export type GrupoTransportadoraRequest = {
  descricao: string
  status?: GrupoTransportadoraStatus
}

export type GrupoTransportadoraTransportadoraRequest = {
  transportadoraId: number
}

const BASE = "/v1/grupo-transportadora"

function normalizeStatus(raw: any): GrupoTransportadoraStatus {
  if (raw === 1 || raw === "1") return "ATIVO"
  if (raw === 0 || raw === "0") return "INATIVO"
  const s = String(raw ?? "").toUpperCase()
  return s === "INATIVO" ? "INATIVO" : "ATIVO"
}

function normalizeGrupoTransportadora(raw: any): GrupoTransportadoraResponse {
  return {
    id: Number(raw?.id ?? 0),
    descricao: String(raw?.descricao ?? raw?.nome ?? "").trim(),
    status: normalizeStatus(raw?.status ?? raw?.ativo),
    dataCriacao: raw?.dataCriacao ?? raw?.data_criacao ?? raw?.createdAt ?? null,
  }
}

function normalizeVinculo(raw: any): GrupoTransportadoraTransportadoraVinculo {
  const transportadoraObj = raw?.transportadora && typeof raw.transportadora === "object" ? raw.transportadora : null
  return {
    id: Number(raw?.id ?? raw?.grupoTransportadoraTransportadoraId ?? 0),
    grupoTransportadoraId: Number(
      raw?.grupoTransportadoraId ?? raw?.grupo_transportadora_id ?? raw?.grupoTransportadora?.id ?? 0,
    ),
    transportadoraId: Number(raw?.transportadoraId ?? raw?.transportadora_id ?? transportadoraObj?.id ?? 0),
    dataCriacao: raw?.dataCriacao ?? raw?.data_criacao ?? raw?.data ?? raw?.createdAt ?? null,
    transportadoraDescricao: transportadoraObj
      ? String(transportadoraObj?.descricao ?? transportadoraObj?.nome ?? "").trim()
      : null,
    transportadora: transportadoraObj
      ? {
          id: Number(transportadoraObj?.id ?? 0),
          descricao: String(transportadoraObj?.descricao ?? transportadoraObj?.nome ?? "").trim(),
          cnpj: String(transportadoraObj?.cnpj ?? "").trim(),
          status: normalizeStatus(transportadoraObj?.status ?? transportadoraObj?.ativo),
          grupoEmpresarialId:
            transportadoraObj?.grupoEmpresarialId != null
              ? Number(transportadoraObj.grupoEmpresarialId)
              : undefined,
        }
      : null,
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

function toPayload(data: Partial<GrupoTransportadoraRequest>) {
  const payload: any = {
    descricao: String(data.descricao ?? "").trim(),
  }
  if (data.status != null) payload.status = normalizeStatus(data.status)
  return payload
}

function normalizeComTransportadoras(raw: any): GrupoTransportadoraComTransportadorasResponse {
  const base = normalizeGrupoTransportadora(raw)
  const source =
    (Array.isArray(raw?.transportadoras) && raw.transportadoras) ||
    (Array.isArray(raw?.grupoTransportadoraTransportadoras) && raw.grupoTransportadoraTransportadoras) ||
    (Array.isArray(raw?.gruposTransportadoras) && raw.gruposTransportadoras) ||
    (Array.isArray(raw?.vinculos) && raw.vinculos) ||
    (Array.isArray(raw?.data?.transportadoras) && raw.data.transportadoras) ||
    []
  return {
    ...base,
    transportadoras: source.map(normalizeVinculo),
  }
}

export const grupoTransportadoraApi = {
  listAll: async (): Promise<GrupoTransportadoraResponse[]> => {
    const data = await api.get(BASE)
    return unwrapArray(data).map(normalizeGrupoTransportadora)
  },

  listComTransportadoras: async (): Promise<GrupoTransportadoraComTransportadorasResponse[]> => {
    const data = await api.get(`${BASE}/com-transportadoras`)
    return unwrapArray(data).map(normalizeComTransportadoras)
  },

  getById: async (id: string | number): Promise<GrupoTransportadoraResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeGrupoTransportadora(await api.get(`${BASE}/${encoded}`))
  },

  getByIdComTransportadoras: async (id: string | number): Promise<GrupoTransportadoraComTransportadorasResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeComTransportadoras(await api.get(`${BASE}/${encoded}/com-transportadoras`))
  },

  create: async (payload: GrupoTransportadoraRequest): Promise<GrupoTransportadoraResponse> => {
    return normalizeGrupoTransportadora(await api.post(BASE, toPayload(payload)))
  },

  update: async (id: string | number, payload: GrupoTransportadoraRequest): Promise<GrupoTransportadoraResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeGrupoTransportadora(await api.put(`${BASE}/${encoded}`, toPayload(payload)))
  },

  delete: async (id: string | number): Promise<void> => {
    const encoded = encodeURIComponent(String(id))
    await api.delete(`${BASE}/${encoded}`)
  },

  addTransportadora: async (
    grupoTransportadoraId: string | number,
    payload: GrupoTransportadoraTransportadoraRequest,
  ): Promise<GrupoTransportadoraTransportadoraVinculo> => {
    const encoded = encodeURIComponent(String(grupoTransportadoraId))
    const data = await api.post(`${BASE}/${encoded}/transportadora`, {
      transportadoraId: Number(payload.transportadoraId),
    })
    return normalizeVinculo(data)
  },
}
