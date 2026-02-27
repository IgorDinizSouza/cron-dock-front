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
const ROLE_BASE = "/v1/perfil/role"

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
    : roles.map((role: RoleResponse) => role.id).filter((id: number) => Number.isFinite(id))

  return {
    id: Number(raw?.id ?? 0),
    descricao: String(raw?.descricao ?? ""),
    ativo: raw?.ativo ?? raw?.active,
    roles,
    roleIds,
  }
}

function normalizeRolesList(data: any): RoleResponse[] {
  if (Array.isArray(data)) return data.map(normalizeRole)
  if (Array.isArray((data as any)?.content)) return (data as any).content.map(normalizeRole)
  if (Array.isArray((data as any)?.items)) return (data as any).items.map(normalizeRole)
  if (Array.isArray((data as any)?.data)) return (data as any).data.map(normalizeRole)
  if ((data as any)?.data && typeof (data as any).data === "object") {
    const nested = normalizePageOrArray<any>((data as any).data)
    return (nested.content || []).map(normalizeRole)
  }
  return []
}

function toPerfilPayload(data: PerfilRequest) {
  const roleIdsSource = Array.isArray(data.roleIds) ? data.roleIds : Array.isArray(data.roles) ? data.roles : []
  const roleIds = roleIdsSource
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id))

  return {
    descricao: String(data.descricao ?? "").trim(),
    roleIds: Array.from(new Set(roleIds)),
  }
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

  create: async (data: PerfilRequest) => normalizePerfil(await api.post(PERFIL_BASE, toPerfilPayload(data))),

  update: (id: string | number, data: PerfilRequest) =>
    api.put(`${PERFIL_BASE}/${encodeURIComponent(String(id))}`, toPerfilPayload(data)).then((res) => normalizePerfil(res)),

  delete: (id: string | number) => api.delete(`${PERFIL_BASE}/${encodeURIComponent(String(id))}`) as Promise<void>,
}

export const roleApi = {
  list: async (search = "", page = 0, size = 100): Promise<Page<RoleResponse>> => {
    let roles = normalizeRolesList(await api.get(ROLE_BASE))

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

  listAll: async (): Promise<RoleResponse[]> => normalizeRolesList(await api.get(ROLE_BASE)),

  getById: async (id: string | number) => {
    return normalizeRole(await api.get(`${ROLE_BASE}/${encodeURIComponent(String(id))}`))
  },

  create: async (data: RoleRequest) =>
    normalizeRole(
      await api.post(ROLE_BASE, {
        nome: data.nome,
        ...(data.descricao != null ? { descricao: data.descricao } : {}),
      }),
    ),

  update: async (id: string | number, data: RoleRequest) =>
    normalizeRole(
      await api.put(`${ROLE_BASE}/${encodeURIComponent(String(id))}`, {
        nome: data.nome,
        ...(data.descricao != null ? { descricao: data.descricao } : {}),
      }),
    ),

  delete: async (id: string | number) => api.delete(`${ROLE_BASE}/${encodeURIComponent(String(id))}`),
}
