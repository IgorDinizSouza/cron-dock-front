import { api } from "./api"

export type GrupoFornecedorStatus = "ATIVO" | "INATIVO"

export type GrupoFornecedorResponse = {
  id: number
  descricao: string
  status: GrupoFornecedorStatus
  dataCriacao?: string | null
}

export type GrupoFornecedorFornecedorVinculo = {
  id: number
  grupoFornecedorId: number
  fornecedorId: number
  data?: string | null
  fornecedorRazaoSocial?: string | null
}

export type GrupoFornecedorComFornecedoresResponse = GrupoFornecedorResponse & {
  fornecedores: GrupoFornecedorFornecedorVinculo[]
}

export type GrupoFornecedorRequest = {
  descricao: string
  status: GrupoFornecedorStatus
}

export type GrupoFornecedorFornecedorRequest = {
  fornecedorId: number
}

const BASE = "/v1/grupo-fornecedor"

function normalizeStatus(raw: any): GrupoFornecedorStatus {
  if (raw === 1 || raw === "1") return "ATIVO"
  if (raw === 0 || raw === "0") return "INATIVO"
  const s = String(raw ?? "").toUpperCase()
  return s === "INATIVO" ? "INATIVO" : "ATIVO"
}

function normalizeGrupoFornecedor(raw: any): GrupoFornecedorResponse {
  return {
    id: Number(raw?.id ?? 0),
    descricao: String(raw?.descricao ?? raw?.nome ?? "").trim(),
    status: normalizeStatus(raw?.status ?? raw?.ativo),
    dataCriacao: raw?.dataCriacao ?? raw?.data_criacao ?? raw?.createdAt ?? null,
  }
}

function normalizeGrupoFornecedorFornecedor(raw: any): GrupoFornecedorFornecedorVinculo {
  const fornecedorObj = raw?.fornecedor && typeof raw.fornecedor === "object" ? raw.fornecedor : null
  return {
    id: Number(raw?.id ?? raw?.grupoFornecedorFornecedorId ?? 0),
    grupoFornecedorId: Number(raw?.grupoFornecedorId ?? raw?.grupo_fornecedor_id ?? raw?.grupoFornecedor?.id ?? 0),
    fornecedorId: Number(raw?.fornecedorId ?? raw?.fornecedor_id ?? fornecedorObj?.id ?? 0),
    data: raw?.data ?? raw?.dataCriacao ?? raw?.data_criacao ?? raw?.createdAt ?? null,
    fornecedorRazaoSocial: fornecedorObj
      ? String(fornecedorObj?.razaoSocial ?? fornecedorObj?.razao_social ?? fornecedorObj?.descricao ?? "").trim()
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

function toGrupoFornecedorPayload(data: Partial<GrupoFornecedorRequest>) {
  return {
    descricao: String(data.descricao ?? "").trim(),
    status: normalizeStatus(data.status),
  }
}

function normalizeGrupoFornecedorComFornecedores(raw: any): GrupoFornecedorComFornecedoresResponse {
  const base = normalizeGrupoFornecedor(raw)
  const fornecedoresSource =
    (Array.isArray(raw?.fornecedores) && raw.fornecedores) ||
    (Array.isArray(raw?.grupoFornecedorFornecedores) && raw.grupoFornecedorFornecedores) ||
    (Array.isArray(raw?.gruposFornecedores) && raw.gruposFornecedores) ||
    (Array.isArray(raw?.gruposFornecedoresFornecedores) && raw.gruposFornecedoresFornecedores) ||
    (Array.isArray(raw?.vinculos) && raw.vinculos) ||
    (Array.isArray(raw?.data?.fornecedores) && raw.data.fornecedores) ||
    []

  return {
    ...base,
    fornecedores: fornecedoresSource.map(normalizeGrupoFornecedorFornecedor),
  }
}

export const grupoFornecedorApi = {
  listAll: async (): Promise<GrupoFornecedorResponse[]> => {
    const data = await api.get(BASE)
    return unwrapArray(data).map(normalizeGrupoFornecedor)
  },

  listComFornecedores: async (): Promise<GrupoFornecedorComFornecedoresResponse[]> => {
    const data = await api.get(`${BASE}/com-fornecedores`)
    return unwrapArray(data).map(normalizeGrupoFornecedorComFornecedores)
  },

  getById: async (id: string | number): Promise<GrupoFornecedorResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeGrupoFornecedor(await api.get(`${BASE}/${encoded}`))
  },

  getByIdComFornecedores: async (id: string | number): Promise<GrupoFornecedorComFornecedoresResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeGrupoFornecedorComFornecedores(await api.get(`${BASE}/${encoded}/com-fornecedores`))
  },

  create: async (payload: GrupoFornecedorRequest): Promise<GrupoFornecedorResponse> => {
    return normalizeGrupoFornecedor(await api.post(BASE, toGrupoFornecedorPayload(payload)))
  },

  update: async (id: string | number, payload: GrupoFornecedorRequest): Promise<GrupoFornecedorResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeGrupoFornecedor(await api.put(`${BASE}/${encoded}`, toGrupoFornecedorPayload(payload)))
  },

  delete: async (id: string | number): Promise<void> => {
    const encoded = encodeURIComponent(String(id))
    await api.delete(`${BASE}/${encoded}`)
  },

  addFornecedor: async (
    grupoFornecedorId: string | number,
    payload: GrupoFornecedorFornecedorRequest,
  ): Promise<GrupoFornecedorFornecedorVinculo> => {
    const encoded = encodeURIComponent(String(grupoFornecedorId))
    const data = await api.post(`${BASE}/${encoded}/fornecedor`, { fornecedorId: Number(payload.fornecedorId) })
    return normalizeGrupoFornecedorFornecedor(data)
  },
}

