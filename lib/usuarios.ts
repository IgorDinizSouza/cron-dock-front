import { api, type Page } from "./api"

export type PerfilResumo = {
  id: number
  descricao: string
  ativo?: boolean
}

export type UsuarioResponse = {
  id: number
  nome: string
  email: string
  ativo?: boolean
  perfil?: string | PerfilResumo | null
  perfilId?: number | null
  perfilDescricao?: string | null
  dataCriacao?: string | number | null
  createdAt?: string | number | null
  created_at?: string | number | null
  ultimoLogin?: string | number | null
  lastLogin?: string | number | null
  lastLoginAt?: string | number | null
}

export type UsuarioRequest = {
  nome: string
  email: string
  senha?: string
  ativo?: boolean
  perfilId?: number
  perfil?: string
}

const V1_BASE = "/v1/usuario"
const V1_PLURAL_BASE = "/v1/usuarios"
const LEGACY_BASE = "/usuarios"

function getConsultorioId(): string {
  if (typeof window === "undefined") return "1"
  return localStorage.getItem("consultorioId") || "1"
}

function toPage<T>(arr: T[]): Page<T> {
  return {
    content: arr,
    totalElements: arr.length,
    totalPages: 1,
    size: arr.length,
    number: 0,
    first: true,
    last: true,
  }
}

function normalizePageOrArray<T>(data: any): Page<T> {
  if (Array.isArray(data)) return toPage<T>(data)
  if (data && typeof data === "object" && Array.isArray((data as any).content)) {
    return data as Page<T>
  }
  if (data && typeof data === "object" && Array.isArray((data as any).items)) {
    return toPage<T>((data as any).items as T[])
  }
  if (data && typeof data === "object" && Array.isArray((data as any).data)) {
    return toPage<T>((data as any).data as T[])
  }
  if (data && typeof data === "object" && (data as any).data && typeof (data as any).data === "object") {
    return normalizePageOrArray<T>((data as any).data)
  }
  return toPage<T>([])
}

function normalizeUsuario(raw: any): UsuarioResponse {
  const perfilObj =
    raw?.perfil && typeof raw.perfil === "object"
      ? {
          id: Number(raw.perfil.id ?? raw.perfil.perfilId ?? 0),
          descricao: String(raw.perfil.descricao ?? raw.perfil.nome ?? ""),
          ativo: raw.perfil.ativo,
        }
      : null

  return {
    id: Number(raw?.id ?? raw?.usuarioId ?? 0),
    nome: String(raw?.nome ?? raw?.name ?? raw?.usuario ?? ""),
    email: String(raw?.email ?? raw?.login ?? ""),
    ativo: raw?.ativo ?? raw?.active,
    perfil: typeof raw?.perfil === "string" ? raw.perfil : perfilObj,
    perfilId: raw?.perfilId ?? raw?.perfil?.id ?? null,
    perfilDescricao: raw?.perfilDescricao ?? raw?.perfil?.descricao ?? raw?.perfil?.nome ?? null,
    dataCriacao: raw?.dataCriacao ?? raw?.createdAt ?? raw?.created_at ?? null,
    createdAt: raw?.createdAt ?? null,
    created_at: raw?.created_at ?? null,
    ultimoLogin: raw?.ultimoLogin ?? raw?.lastLogin ?? raw?.lastLoginAt ?? null,
    lastLogin: raw?.lastLogin ?? null,
    lastLoginAt: raw?.lastLoginAt ?? null,
  }
}

function isNotFoundError(error: any): boolean {
  return Number(error?.status) === 404
}

async function tryGet<T>(paths: string[]): Promise<T> {
  let lastError: any
  for (const path of paths) {
    try {
      return (await api.get(path)) as T
    } catch (error: any) {
      lastError = error
    }
  }
  throw lastError
}

function buildLegacyQuery(search = "", page = 0, size = 50): string {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("size", String(size))
  params.set("consultorioId", getConsultorioId())
  if (search.trim()) params.set("search", search.trim())
  return `?${params.toString()}`
}

function toPayload(data: UsuarioRequest, legacy = false) {
  if (!legacy) return data
  return {
    ...data,
    consultorioId: getConsultorioId(),
  }
}

export const usuariosApi = {
  list: async (search = "", page = 0, size = 50): Promise<Page<UsuarioResponse>> => {
    const qs = new URLSearchParams()
    qs.set("page", String(page))
    qs.set("size", String(size))
    if (search.trim()) qs.set("search", search.trim())

    const candidates = [
      `${LEGACY_BASE}${buildLegacyQuery(search, page, size)}`,
      `${V1_BASE}?${qs.toString()}`,
      `${V1_PLURAL_BASE}?${qs.toString()}`,
    ]

    let lastError: any
    for (const path of candidates) {
      try {
        const data = await api.get(path)
        const pageData = normalizePageOrArray<any>(data)
        return { ...pageData, content: (pageData.content || []).map(normalizeUsuario) }
      } catch (error: any) {
        lastError = error
      }
    }
    throw lastError
  },

  getById: async (id: string | number): Promise<UsuarioResponse> => {
    const encoded = encodeURIComponent(String(id))
    const withConsultorio = `?consultorioId=${getConsultorioId()}`
    const data = await tryGet<any>([
      `${LEGACY_BASE}/${encoded}${withConsultorio}`,
      `${V1_BASE}/${encoded}`,
      `${V1_PLURAL_BASE}/${encoded}`,
    ])
    return normalizeUsuario(data)
  },

  create: async (data: UsuarioRequest): Promise<UsuarioResponse> => {
    try {
      return normalizeUsuario(await api.post(V1_BASE, toPayload(data)))
    } catch (error) {
      if (!isNotFoundError(error)) throw error
      return normalizeUsuario(await api.post(LEGACY_BASE, toPayload(data, true)))
    }
  },

  update: async (id: string | number, data: Partial<UsuarioRequest>): Promise<UsuarioResponse> => {
    const encoded = encodeURIComponent(String(id))
    const candidates = [
      () => api.put(`${LEGACY_BASE}/${encoded}`, toPayload(data as UsuarioRequest, true)),
      () => api.put(`${V1_BASE}/${encoded}`, toPayload(data as UsuarioRequest)),
      () => api.put(`${V1_PLURAL_BASE}/${encoded}`, toPayload(data as UsuarioRequest)),
    ]
    let lastError: any
    for (const call of candidates) {
      try {
        return normalizeUsuario(await call())
      } catch (error: any) {
        lastError = error
      }
    }
    throw lastError
  },

  delete: async (id: string | number): Promise<void> => {
    const encoded = encodeURIComponent(String(id))
    try {
      await api.delete(`${V1_BASE}/${encoded}`)
    } catch (error) {
      if (!isNotFoundError(error)) throw error
      await api.delete(`${LEGACY_BASE}/${encoded}?consultorioId=${getConsultorioId()}`)
    }
  },

  toggleStatus: async (id: string | number, ativo: boolean): Promise<UsuarioResponse> => {
    const encoded = encodeURIComponent(String(id))
    const candidates = [
      () => api.put(`${LEGACY_BASE}/${encoded}/status?ativo=${ativo}&consultorioId=${getConsultorioId()}`),
      () => api.put(`${V1_BASE}/${encoded}/status?ativo=${ativo}`),
      () => api.put(`${V1_PLURAL_BASE}/${encoded}/status?ativo=${ativo}`),
      () => usuariosApi.update(id, { ativo }),
    ]
    let lastError: any
    for (const call of candidates) {
      try {
        return normalizeUsuario(await call())
      } catch (error: any) {
        lastError = error
      }
    }
    throw lastError
  },
}
