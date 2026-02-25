import { api } from "./api"

export type GrupoFilialStatus = "ATIVO" | "INATIVO"

export type GrupoFilialResponse = {
  id: number
  descricao: string
  status: GrupoFilialStatus
  dataCriacao?: string | null
}

export type GrupoFilialFilialVinculo = {
  id: number
  grupoFilialId: number
  filialId: number
  data?: string | null
  filialDescricao?: string | null
  filial?: {
    id: number
    descricao: string
    cnpj: string
    uf: string
    status: GrupoFilialStatus
    grupoEmpresarialId?: number
  } | null
}

export type GrupoFilialComFiliaisResponse = GrupoFilialResponse & {
  filiais: GrupoFilialFilialVinculo[]
}

export type GrupoFilialRequest = {
  descricao: string
  status?: GrupoFilialStatus
}

export type GrupoFilialFilialRequest = {
  filialId: number
}

const BASE = "/v1/grupo-filial"

function normalizeStatus(raw: any): GrupoFilialStatus {
  if (raw === 1 || raw === "1") return "ATIVO"
  if (raw === 0 || raw === "0") return "INATIVO"
  const s = String(raw ?? "").toUpperCase()
  return s === "INATIVO" ? "INATIVO" : "ATIVO"
}

function normalizeGrupo(raw: any): GrupoFilialResponse {
  return {
    id: Number(raw?.id ?? 0),
    descricao: String(raw?.descricao ?? raw?.nome ?? "").trim(),
    status: normalizeStatus(raw?.status ?? raw?.ativo),
    dataCriacao: raw?.dataCriacao ?? raw?.data_criacao ?? raw?.createdAt ?? null,
  }
}

function normalizeVinculo(raw: any): GrupoFilialFilialVinculo {
  const filialObj = raw?.filial && typeof raw.filial === "object" ? raw.filial : null
  return {
    id: Number(raw?.id ?? raw?.grupoFilialFilialId ?? 0),
    grupoFilialId: Number(raw?.grupoFilialId ?? raw?.grupo_filial_id ?? raw?.grupoFilial?.id ?? 0),
    filialId: Number(raw?.filialId ?? raw?.filial_id ?? filialObj?.id ?? 0),
    data: raw?.data ?? raw?.dataCriacao ?? raw?.data_criacao ?? raw?.createdAt ?? null,
    filialDescricao: filialObj ? String(filialObj?.descricao ?? "").trim() : null,
    filial: filialObj
      ? {
          id: Number(filialObj?.id ?? 0),
          descricao: String(filialObj?.descricao ?? "").trim(),
          cnpj: String(filialObj?.cnpj ?? "").trim(),
          uf: String(filialObj?.uf ?? "").trim(),
          status: normalizeStatus(filialObj?.status ?? filialObj?.ativo),
          grupoEmpresarialId:
            filialObj?.grupoEmpresarialId != null ? Number(filialObj.grupoEmpresarialId) : undefined,
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

function toPayload(data: Partial<GrupoFilialRequest>) {
  const payload: any = { descricao: String(data.descricao ?? "").trim() }
  if (data.status != null) payload.status = normalizeStatus(data.status)
  return payload
}

function normalizeComFiliais(raw: any): GrupoFilialComFiliaisResponse {
  const base = normalizeGrupo(raw)
  const source =
    (Array.isArray(raw?.filiais) && raw.filiais) ||
    (Array.isArray(raw?.grupoFiliaisFiliais) && raw.grupoFiliaisFiliais) ||
    (Array.isArray(raw?.grupoFilialFiliais) && raw.grupoFilialFiliais) ||
    (Array.isArray(raw?.vinculos) && raw.vinculos) ||
    (Array.isArray(raw?.data?.filiais) && raw.data.filiais) ||
    []
  return {
    ...base,
    filiais: source.map(normalizeVinculo),
  }
}

export const grupoFilialApi = {
  listAll: async (): Promise<GrupoFilialResponse[]> => {
    const data = await api.get(BASE)
    return unwrapArray(data).map(normalizeGrupo)
  },

  getById: async (id: string | number): Promise<GrupoFilialResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeGrupo(await api.get(`${BASE}/${encoded}`))
  },

  getByIdComFiliais: async (id: string | number): Promise<GrupoFilialComFiliaisResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeComFiliais(await api.get(`${BASE}/${encoded}/com-filiais`))
  },

  listComFiliais: async (): Promise<GrupoFilialComFiliaisResponse[]> => {
    const data = await api.get(`${BASE}/com-filiais`)
    return unwrapArray(data).map(normalizeComFiliais)
  },

  create: async (payload: GrupoFilialRequest): Promise<GrupoFilialResponse> => {
    return normalizeGrupo(await api.post(BASE, toPayload(payload)))
  },

  update: async (id: string | number, payload: GrupoFilialRequest): Promise<GrupoFilialResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeGrupo(await api.put(`${BASE}/${encoded}`, toPayload(payload)))
  },

  delete: async (id: string | number): Promise<void> => {
    const encoded = encodeURIComponent(String(id))
    await api.delete(`${BASE}/${encoded}`)
  },

  addFilial: async (grupoFilialId: string | number, payload: GrupoFilialFilialRequest): Promise<GrupoFilialFilialVinculo> => {
    const encoded = encodeURIComponent(String(grupoFilialId))
    const data = await api.post(`${BASE}/${encoded}/filial`, { filialId: Number(payload.filialId) })
    return normalizeVinculo(data)
  },

  removeFilial: async (grupoFilialId: string | number, vinculoId: string | number): Promise<void> => {
    const grupo = encodeURIComponent(String(grupoFilialId))
    const vinculo = encodeURIComponent(String(vinculoId))
    await api.delete(`${BASE}/${grupo}/filial/${vinculo}`)
  },
}

