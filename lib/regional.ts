import { api } from "./api"

export type RegionalStatus = "ATIVO" | "INATIVO"

export type RegionalResponse = {
  id: number
  descricao: string
  status: RegionalStatus
  dataCriacao?: string | null
}

export type RegionalFilialVinculo = {
  id: number
  regionalId: number
  filialId: number
  dataCriacao?: string | null
  filialDescricao?: string | null
}

export type RegionalComFiliaisResponse = RegionalResponse & {
  filiais: RegionalFilialVinculo[]
}

export type RegionalRequest = {
  descricao: string
  status: RegionalStatus
}

export type RegionalFilialRequest = {
  filialId: number
}

const BASE = "/v1/regional"

function normalizeStatus(raw: any): RegionalStatus {
  if (raw === 1 || raw === "1") return "ATIVO"
  if (raw === 0 || raw === "0") return "INATIVO"
  const s = String(raw ?? "").toUpperCase()
  return s === "INATIVO" ? "INATIVO" : "ATIVO"
}

function normalizeRegional(raw: any): RegionalResponse {
  return {
    id: Number(raw?.id ?? 0),
    descricao: String(raw?.descricao ?? raw?.nome ?? "").trim(),
    status: normalizeStatus(raw?.status ?? raw?.ativo),
    dataCriacao: raw?.dataCriacao ?? raw?.data_criacao ?? raw?.createdAt ?? null,
  }
}

function normalizeRegionalFilial(raw: any): RegionalFilialVinculo {
  const filialObj = raw?.filial && typeof raw.filial === "object" ? raw.filial : null
  return {
    id: Number(raw?.id ?? raw?.regionalFilialId ?? 0),
    regionalId: Number(raw?.regionalId ?? raw?.regional_id ?? raw?.regional?.id ?? 0),
    filialId: Number(raw?.filialId ?? raw?.filial_id ?? filialObj?.id ?? 0),
    dataCriacao: raw?.dataCriacao ?? raw?.data_criacao ?? raw?.createdAt ?? null,
    filialDescricao: filialObj ? String(filialObj?.descricao ?? filialObj?.nome ?? "").trim() : null,
  }
}

function unwrapArray(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.filiais)) return data.filiais
  if (data?.data && typeof data.data === "object") {
    if (Array.isArray(data.data.content)) return data.data.content
    if (Array.isArray(data.data.items)) return data.data.items
    if (Array.isArray(data.data.filiais)) return data.data.filiais
  }
  return []
}

function toRegionalPayload(data: Partial<RegionalRequest>) {
  return {
    descricao: String(data.descricao ?? "").trim(),
    status: normalizeStatus(data.status),
  }
}

function normalizeRegionalComFiliais(raw: any): RegionalComFiliaisResponse {
  const base = normalizeRegional(raw)
  const filiaisSource =
    (Array.isArray(raw?.filiais) && raw.filiais) ||
    (Array.isArray(raw?.regionaisFiliais) && raw.regionaisFiliais) ||
    (Array.isArray(raw?.regionalFiliais) && raw.regionalFiliais) ||
    (Array.isArray(raw?.vinculos) && raw.vinculos) ||
    (Array.isArray(raw?.data?.filiais) && raw.data.filiais) ||
    []
  return {
    ...base,
    filiais: filiaisSource.map(normalizeRegionalFilial),
  }
}

export const regionalApi = {
  listAll: async (): Promise<RegionalResponse[]> => {
    const data = await api.get(BASE)
    return unwrapArray(data).map(normalizeRegional)
  },

  listComFiliais: async (): Promise<RegionalComFiliaisResponse[]> => {
    const data = await api.get(`${BASE}/com-filiais`)
    return unwrapArray(data).map(normalizeRegionalComFiliais)
  },

  getById: async (id: string | number): Promise<RegionalResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeRegional(await api.get(`${BASE}/${encoded}`))
  },

  getByIdComFiliais: async (id: string | number): Promise<RegionalComFiliaisResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeRegionalComFiliais(await api.get(`${BASE}/${encoded}/com-filiais`))
  },

  create: async (payload: RegionalRequest): Promise<RegionalResponse> => {
    return normalizeRegional(await api.post(BASE, toRegionalPayload(payload)))
  },

  update: async (id: string | number, payload: RegionalRequest): Promise<RegionalResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeRegional(await api.put(`${BASE}/${encoded}`, toRegionalPayload(payload)))
  },

  delete: async (id: string | number): Promise<void> => {
    const encoded = encodeURIComponent(String(id))
    await api.delete(`${BASE}/${encoded}`)
  },

  addFilial: async (regionalId: string | number, payload: RegionalFilialRequest): Promise<RegionalFilialVinculo> => {
    const encoded = encodeURIComponent(String(regionalId))
    const data = await api.post(`${BASE}/${encoded}/filial`, { filialId: Number(payload.filialId) })
    return normalizeRegionalFilial(data)
  },
}
