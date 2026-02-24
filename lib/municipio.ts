import { api } from "./api"

export type EstadoResumo = {
  id: number
  descricao?: string | null
  nome?: string | null
  sigla?: string | null
}

export type MunicipioResponse = {
  id: number
  descricao: string
  codigoIbge: string
  estado: EstadoResumo | null
}

export type MunicipioRequest = {
  descricao: string
  codigoIbge: string
  estadoId: number
}

const BASE = "/v1/municipio"

function normalizeMunicipio(raw: any): MunicipioResponse {
  const estadoRaw = raw?.estado && typeof raw.estado === "object" ? raw.estado : null
  return {
    id: Number(raw?.id ?? 0),
    descricao: String(raw?.descricao ?? raw?.nome ?? "").trim(),
    codigoIbge: String(raw?.codigoIbge ?? raw?.codigo_ibge ?? "").trim(),
    estado: estadoRaw
      ? {
          id: Number(estadoRaw?.id ?? 0),
          descricao: estadoRaw?.descricao ?? estadoRaw?.nome ?? null,
          nome: estadoRaw?.nome ?? estadoRaw?.descricao ?? null,
          sigla: estadoRaw?.sigla ?? null,
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

function toPayload(data: Partial<MunicipioRequest>) {
  return {
    descricao: String(data.descricao ?? "").trim(),
    codigoIbge: String(data.codigoIbge ?? "").trim(),
    estadoId: Number(data.estadoId ?? 0),
  }
}

export const municipioApi = {
  listAll: async (): Promise<MunicipioResponse[]> => {
    const data = await api.get(BASE)
    return unwrapArray(data).map(normalizeMunicipio)
  },

  getById: async (id: string | number): Promise<MunicipioResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeMunicipio(await api.get(`${BASE}/${encoded}`))
  },

  create: async (payload: MunicipioRequest): Promise<MunicipioResponse> => {
    return normalizeMunicipio(await api.post(BASE, toPayload(payload)))
  },

  update: async (id: string | number, payload: Partial<MunicipioRequest>): Promise<MunicipioResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeMunicipio(await api.put(`${BASE}/${encoded}`, toPayload(payload)))
  },

  delete: async (id: string | number): Promise<void> => {
    const encoded = encodeURIComponent(String(id))
    await api.delete(`${BASE}/${encoded}`)
  },
}

