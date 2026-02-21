import { api, type Page } from "./api"

export type RoleResponse = {
  id: number
  nome: string
  descricao?: string | null
  ativo?: boolean
}

export type PerfilResponse = {
  id: number
  descricao: string
  ativo?: boolean
  roles?: RoleResponse[]
  roleIds?: Array<number>
}

export type PerfilRequest = {
  descricao: string
  ativo?: boolean
  roleIds?: Array<number>
  roles?: Array<number>
}

export type RoleRequest = {
  nome: string
  descricao?: string
  ativo?: boolean
}

const PERFIL_BASE = "/v1/perfil"

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

function normalizeRole(raw: any): RoleResponse {
  return {
    id: Number(raw?.id ?? raw?.roleId ?? 0),
    nome: String(raw?.nome ?? raw?.name ?? raw?.descricao ?? ""),
    descricao: raw?.descricao ?? raw?.description ?? null,
    ativo: raw?.ativo ?? raw?.active,
  }
}

function normalizePerfil(raw: any): PerfilResponse {
  const roles = Array.isArray(raw?.roles) ? raw.roles.map(normalizeRole) : []
  const roleIds = Array.isArray(raw?.roleIds)
    ? raw.roleIds.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id))
    : roles.map((role) => role.id).filter((id) => Number.isFinite(id))

  return {
    id: Number(raw?.id ?? 0),
    descricao: String(raw?.descricao ?? ""),
    ativo: raw?.ativo ?? raw?.active,
    roles,
    roleIds,
  }
}

function extractRolesFromPerfis(perfis: PerfilResponse[]): RoleResponse[] {
  const byKey = new Map<string, RoleResponse>()

  for (const perfil of perfis) {
    for (const role of perfil.roles || []) {
      const normalized = normalizeRole(role)
      const key = normalized.id > 0 ? `id:${normalized.id}` : `nome:${normalized.nome.toLowerCase()}`
      if (!byKey.has(key)) byKey.set(key, normalized)
    }
  }

  return Array.from(byKey.values())
}

export const perfilApi = {
  list: async (search = "", page = 0, size = 50): Promise<Page<PerfilResponse>> => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("size", String(size))
    if (search.trim()) params.set("search", search.trim())
    const data = await api.get(`${PERFIL_BASE}?${params.toString()}`)
    const pageData = normalizePageOrArray<any>(data)
    return { ...pageData, content: (pageData.content || []).map(normalizePerfil) }
  },

  listAll: async (): Promise<PerfilResponse[]> => {
    const data = await api.get(PERFIL_BASE)
    if (Array.isArray(data)) return data.map(normalizePerfil)
    if (Array.isArray((data as any)?.content)) return (data as any).content.map(normalizePerfil)
    if (Array.isArray((data as any)?.items)) return (data as any).items.map(normalizePerfil)
    if (Array.isArray((data as any)?.data)) return (data as any).data.map(normalizePerfil)
    if ((data as any)?.data && typeof (data as any).data === "object") {
      const nested = normalizePageOrArray<any>((data as any).data)
      return (nested.content || []).map(normalizePerfil)
    }
    return []
  },

  getById: async (id: string | number) => normalizePerfil(await api.get(`${PERFIL_BASE}/${encodeURIComponent(String(id))}`)),

  create: async (data: PerfilRequest) => normalizePerfil(await api.post(PERFIL_BASE, data)),

  update: (id: string | number, data: PerfilRequest) =>
    api.put(`${PERFIL_BASE}/${encodeURIComponent(String(id))}`, data).then((res) => normalizePerfil(res)),

  delete: (id: string | number) => api.delete(`${PERFIL_BASE}/${encodeURIComponent(String(id))}`) as Promise<void>,
}

export const roleApi = {
  list: async (search = "", page = 0, size = 100): Promise<Page<RoleResponse>> => {
    const perfis = await perfilApi.listAll()
    let roles = extractRolesFromPerfis(perfis)

    const term = search.trim().toLowerCase()
    if (term) {
      roles = roles.filter((role) => [role.nome, role.descricao || ""].join(" ").toLowerCase().includes(term))
    }

    const start = page * size
    const end = start + size
    const sliced = roles.slice(start, end)

    return {
      content: sliced,
      totalElements: roles.length,
      totalPages: roles.length === 0 ? 1 : Math.ceil(roles.length / size),
      size,
      number: page,
      first: page === 0,
      last: end >= roles.length,
    }
  },

  listAll: async (): Promise<RoleResponse[]> => extractRolesFromPerfis(await perfilApi.listAll()),

  getById: async (id: string | number) => {
    const roleId = Number(id)
    const all = await roleApi.listAll()
    const found = all.find((role) => role.id === roleId || role.nome === String(id))
    if (!found) throw new Error("Role nao encontrada.")
    return found
  },

  create: async (_data: RoleRequest) => {
    throw new Error("Criacao de role nao disponivel neste endpoint. Use o fluxo de perfil.")
  },

  update: async (_id: string | number, _data: RoleRequest) => {
    throw new Error("Atualizacao de role nao disponivel neste endpoint. Use o fluxo de perfil.")
  },

  delete: async (_id: string | number) => {
    throw new Error("Exclusao de role nao disponivel neste endpoint. Use o fluxo de perfil.")
  },
}
