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
  status?: string | null
  ativo?: boolean
  perfil?: string | PerfilResumo | null
  perfilId?: number | null
  perfilDescricao?: string | null
  perfis?: PerfilResumo[]
  grupoEmpresarialId?: number | null
  grupoEmpresarialDescricao?: string | null
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

export type UsuarioAprovacaoRequest = {
  idUsuarioAprovador: number
  idStatusAprovacaoUsuario: 2 | 3
  motivoRecusa?: string
}

export type UsuarioAprovacaoResponse = {
  id?: number | null
  idUsuarioSolicitante?: number | null
  idUsuarioAprovador?: number | null
  idStatusAprovacaoUsuario?: number | null
  descricaoStatusAprovacaoUsuario?: string | null
  motivoRecusa?: string | null
  dataSolicitacao?: string | null
  dataAprovacao?: string | null
  mensagem?: string | null
}

const V1_BASE = "/v1/usuario"
const AUTH_SESSION_KEY = "odonto.auth.session"

function getGrupoEmpresarialId(): string {
  if (typeof window === "undefined") return "1"

  const fromLs = localStorage.getItem("grupoEmpresarialId")
  if (fromLs) return fromLs

  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const fromSession = parsed?.user?.grupoEmpresarialId ?? parsed?.grupoEmpresarialId
      if (fromSession != null && fromSession !== "") return String(fromSession)
    }
  } catch {}

  return "1"
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
  const perfis = Array.isArray(raw?.perfis) ? raw.perfis : []
  const primeiroPerfil = perfis[0]
  const perfilObj =
    raw?.perfil && typeof raw.perfil === "object"
      ? {
          id: Number(raw.perfil.id ?? raw.perfil.perfilId ?? 0),
          descricao: String(raw.perfil.descricao ?? raw.perfil.nome ?? ""),
          ativo: raw.perfil.ativo,
        }
      : primeiroPerfil && typeof primeiroPerfil === "object"
        ? {
            id: Number(primeiroPerfil.id ?? 0),
            descricao: String(primeiroPerfil.descricao ?? primeiroPerfil.nome ?? ""),
            ativo: primeiroPerfil.ativo,
          }
      : null

  return {
    id: Number(raw?.id ?? raw?.usuarioId ?? 0),
    nome: String(raw?.nome ?? raw?.descricao ?? raw?.name ?? raw?.usuario ?? ""),
    email: String(raw?.email ?? raw?.login ?? ""),
    status: raw?.status != null ? String(raw.status) : null,
    ativo:
      typeof raw?.ativo === "boolean"
        ? raw.ativo
        : typeof raw?.active === "boolean"
          ? raw.active
          : String(raw?.status ?? "").toUpperCase() === "ATIVO",
    perfil: typeof raw?.perfil === "string" ? raw.perfil : perfilObj,
    perfilId: raw?.perfilId ?? raw?.perfil?.id ?? primeiroPerfil?.id ?? null,
    perfilDescricao: raw?.perfilDescricao ?? raw?.perfil?.descricao ?? raw?.perfil?.nome ?? primeiroPerfil?.descricao ?? null,
    perfis: perfis
      .filter((perfil: any) => perfil && typeof perfil === "object")
      .map((perfil: any) => ({
        id: Number(perfil.id ?? 0),
        descricao: String(perfil.descricao ?? perfil.nome ?? ""),
        ativo: typeof perfil.ativo === "boolean" ? perfil.ativo : undefined,
      })),
    grupoEmpresarialId: raw?.grupoEmpresarialId ?? null,
    grupoEmpresarialDescricao: raw?.grupoEmpresarialDescricao ?? null,
    dataCriacao: raw?.dataCriacao ?? raw?.createdAt ?? raw?.created_at ?? null,
    createdAt: raw?.createdAt ?? null,
    created_at: raw?.created_at ?? null,
    ultimoLogin: raw?.ultimoLogin ?? raw?.lastLogin ?? raw?.lastLoginAt ?? null,
    lastLogin: raw?.lastLogin ?? null,
    lastLoginAt: raw?.lastLoginAt ?? null,
  }
}

function resolvePerfilId(user: UsuarioResponse): number | undefined {
  if (typeof user.perfilId === "number" && Number.isFinite(user.perfilId)) return user.perfilId
  if (user.perfil && typeof user.perfil === "object" && Number.isFinite(user.perfil.id)) return user.perfil.id
  return undefined
}

function toRequestPayload(data: Partial<UsuarioRequest>) {
  const grupoEmpresarialId = Number(getGrupoEmpresarialId())
  const payload: Record<string, any> = {
    grupoEmpresarialId,
  }

  if (data.nome != null) payload.descricao = data.nome
  if (data.email != null) payload.email = data.email
  if (data.senha != null && data.senha !== "") payload.senha = data.senha
  if (typeof data.ativo === "boolean") payload.ativo = data.ativo

  if (typeof data.perfilId === "number" && Number.isFinite(data.perfilId)) {
    payload.perfilIds = [data.perfilId]
  }

  return payload
}

export const usuariosApi = {
  list: async (search = "", page = 0, size = 50): Promise<Page<UsuarioResponse>> => {
    const grupoEmpresarialId = encodeURIComponent(getGrupoEmpresarialId())
    const data = await api.get(`${V1_BASE}/grupo-empresarial/${grupoEmpresarialId}`)
    const all = normalizePageOrArray<any>(data).content.map(normalizeUsuario)

    const term = search.trim().toLowerCase()
    const filtered = !term
      ? all
      : all.filter((u) =>
          [u.nome, u.email, u.perfilDescricao ?? "", typeof u.perfil === "string" ? u.perfil : u.perfil?.descricao ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(term),
        )

    const start = page * size
    const end = start + size
    const sliced = filtered.slice(start, end)
    return {
      content: sliced,
      totalElements: filtered.length,
      totalPages: filtered.length === 0 ? 1 : Math.ceil(filtered.length / size),
      size,
      number: page,
      first: page === 0,
      last: end >= filtered.length,
    }
  },

  getById: async (id: string | number): Promise<UsuarioResponse> => {
    const encoded = encodeURIComponent(String(id))
    const grupoEmpresarialId = encodeURIComponent(getGrupoEmpresarialId())
    const data = await api.get(`${V1_BASE}/grupo-empresarial/${grupoEmpresarialId}/${encoded}`)
    return normalizeUsuario(data)
  },

  listPendentesAprovacao: async (): Promise<UsuarioResponse[]> => {
    const data = await api.get(`${V1_BASE}/aprovacao/pendentes`)
    return normalizePageOrArray<any>(data).content.map(normalizeUsuario)
  },

  aprovarOuRecusar: async (
    usuarioSolicitanteId: string | number,
    payload: UsuarioAprovacaoRequest,
  ): Promise<UsuarioAprovacaoResponse> => {
    const encoded = encodeURIComponent(String(usuarioSolicitanteId))
    return (await api.put(`${V1_BASE}/${encoded}/aprovacao`, payload, { skipAuthRedirect: true })) as UsuarioAprovacaoResponse
  },

  create: async (data: UsuarioRequest): Promise<UsuarioResponse> => {
    return normalizeUsuario(await api.post(V1_BASE, toRequestPayload(data)))
  },

  update: async (id: string | number, data: Partial<UsuarioRequest>): Promise<UsuarioResponse> => {
    const encoded = encodeURIComponent(String(id))
    const grupoEmpresarialId = encodeURIComponent(getGrupoEmpresarialId())
    return normalizeUsuario(await api.put(`${V1_BASE}/grupo-empresarial/${grupoEmpresarialId}/${encoded}`, toRequestPayload(data)))
  },

  delete: async (id: string | number): Promise<void> => {
    const encoded = encodeURIComponent(String(id))
    const grupoEmpresarialId = encodeURIComponent(getGrupoEmpresarialId())
    await api.delete(`${V1_BASE}/grupo-empresarial/${grupoEmpresarialId}/${encoded}`)
  },

  toggleStatus: async (id: string | number, ativo: boolean): Promise<UsuarioResponse> => {
    // O controller informado não possui endpoint de status.
    // Reutilizamos o PUT completo, preservando os dados atuais.
    const current = await usuariosApi.getById(id)
    return usuariosApi.update(id, {
      nome: current.nome,
      email: current.email,
      ativo,
      perfilId: resolvePerfilId(current),
    })
  },
}
