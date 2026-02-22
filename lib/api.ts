import { getConsultorioIdFromToken, clearAuth } from "./auth"

export const API_BASE_URL = "http://localhost:8081/api";


function handleUnauthorized(status: number) {
  if (typeof window === "undefined") return
  try {
    const back = window.location.pathname + window.location.search
    sessionStorage.setItem("postLoginRedirect", back)
  } catch {}
  clearAuth()
  window.location.href = "/login"
}

type ApiRequestInit = RequestInit & { skipAuthRedirect?: boolean }

async function apiRequest<T>(endpoint: string, options: ApiRequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
  const fullUrl = `${API_BASE_URL}${endpoint}`

  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
  }

  const method = (options.method || "GET").toString().toUpperCase()

  const config: RequestInit = {
    ...options,
    method,
    headers,
    credentials: options.credentials ?? "include",
  }

  if (method === "GET" && config.cache === undefined) {
    config.cache = "no-store"
  }

  try {
    const response = await fetch(fullUrl, config)
    const isAuthLogin = endpoint.startsWith("/auth/login")

    const readErrorPayload = async () => {
      const ct = response.headers.get("content-type") || ""
      const text = await response.text().catch(() => "")
      let payload: any = null
      if (ct.includes("application/json")) {
        try {
          payload = JSON.parse(text || "{}")
        } catch {}
      }
      return { text, payload }
    }

    if (response.status === 401 || response.status === 403) {
      if (!isAuthLogin && !options.skipAuthRedirect) {
        handleUnauthorized(response.status)
      }
      const { text, payload } = await readErrorPayload()
      const err: any = new Error(payload?.message || text || `${response.status} ${response.statusText}`)
      err.status = response.status
      if (payload) err.payload = payload
      throw err
    }

    if (!response.ok) {
      const { text, payload } = await readErrorPayload()

      if (isAuthLogin) {
        const lower = String(payload?.message || text || "").toLowerCase()
        const looksLikeBadCred =
          lower.includes("bad credentials") ||
          lower.includes("badcredentials") ||
          lower.includes("senha") ||
          lower.includes("credencial")

        if (response.status === 500 || response.status === 400 || looksLikeBadCred) {
          const err: any = new Error("E-mail ou senha inválidos.")
          err.status = 401
          if (payload) err.payload = payload
          throw err
        }
      }

      const msg = payload?.message || text || `${response.status} ${response.statusText} (${fullUrl})`
      const err: any = new Error(msg)
      err.status = response.status
      if (payload) err.payload = payload
      throw err
    }

    if (response.status === 204) {
      return undefined as T
    }

    const ct = response.headers.get("content-type") || ""
    if (ct.includes("application/json")) {
      return (await response.json()) as T
    } else {
      return (await response.text()) as unknown as T
    }
  } catch (error: any) {
    if (error?.name === "TypeError" && String(error?.message || "").includes("fetch")) {
      throw new Error(
        `Erro de conexão com o backend (${API_BASE_URL}). Verifique se o servidor está rodando e acessível.`,
      )
    }
    throw error
  }
}

function getCurrentConsultorioId(): string {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
  const fromJwt = getConsultorioIdFromToken(token)
  return fromJwt || (typeof window !== "undefined" ? localStorage.getItem("consultorioId") || "1" : "1")
}

export type Page<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first?: boolean
  last?: boolean
}

export type ConsultorioResponse = {
  id: number
  nome: string
  telefone?: string | null
  email?: string | null
  cep?: string | null
  estado?: string | null
  cidade?: string | null
  bairro?: string | null
  rua?: string | null
  numero?: string | null
  complemento?: string | null
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

export const patientsApi = {
  create: (data: any) =>
    apiRequest("/pacientes", {
      method: "POST",
      body: JSON.stringify({ ...data, consultorioId: getCurrentConsultorioId() }),
    }),

  getAll: () => apiRequest(`/pacientes?consultorioId=${getCurrentConsultorioId()}`, { method: "GET" }),

  getById: (id: string) => apiRequest(`/pacientes/${id}`, { method: "GET" }),

  update: (id: string, data: any) =>
    apiRequest(`/pacientes/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...data, consultorioId: getCurrentConsultorioId() }),
    }),

  delete: (id: string) => apiRequest(`/pacientes/${id}`, { method: "DELETE" }),

  search: (query: string) =>
    apiRequest(`/pacientes/buscar?q=${encodeURIComponent(query)}&consultorioId=${getCurrentConsultorioId()}`, {
      method: "GET",
    }),

  export: () => apiRequest(`/pacientes/export?consultorioId=${getCurrentConsultorioId()}`, { method: "GET" }),
}

export const appointmentsApi = {
  create: (data: any) =>
    apiRequest("/agendamentos", {
      method: "POST",
      body: JSON.stringify({ ...data, consultorioId: getCurrentConsultorioId() }),
    }),

  getAll: (page = 0, size = 10) =>
    apiRequest(`/agendamentos?page=${page}&size=${size}&consultorioId=${getCurrentConsultorioId()}`, { method: "GET" }),

  getById: (id: string) =>
    apiRequest(`/agendamentos/${id}?consultorioId=${getCurrentConsultorioId()}`, { method: "GET" }),

  update: (id: string, data: any) =>
    apiRequest(`/agendamentos/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...data, consultorioId: getCurrentConsultorioId() }),
    }),

  delete: (id: string) =>
    apiRequest(`/agendamentos/${id}?consultorioId=${getCurrentConsultorioId()}`, { method: "DELETE" }),

  getByDate: (date: string) =>
    apiRequest(`/agendamentos/data/${date}?consultorioId=${getCurrentConsultorioId()}`, { method: "GET" }),

  updateStatus: (id: string, status: string) =>
    apiRequest(
      `/agendamentos/${id}/status?status=${encodeURIComponent(status)}&consultorioId=${getCurrentConsultorioId()}`,
      { method: "PATCH" },
    ),
}

export const proceduresApi = {
  create: (data: any) =>
    apiRequest("/procedimentos", {
      method: "POST",
      body: JSON.stringify({ ...data, consultorioId: getCurrentConsultorioId() }),
    }),

  getAll: (page = 0, size = 12, search = "") =>
    apiRequest<Page<any>>(
      `/procedimentos?page=${page}&size=${size}${
        search ? `&search=${encodeURIComponent(search)}` : ""
      }&consultorioId=${getCurrentConsultorioId()}`,
      { method: "GET" },
    ),

  listAll: async (maxPages = 20, size = 200, search = "") => {
    let page = 0
    const all: any[] = []
    while (page < maxPages) {
      const resp = await proceduresApi.getAll(page, size, search)
      const items = Array.isArray(resp?.content) ? resp.content : []
      all.push(...items)
      if (resp?.last || page + 1 >= (resp?.totalPages ?? 0)) break
      page += 1
    }
    return all
  },

  getById: (id: string | number) =>
    apiRequest(`/procedimentos/${id}?consultorioId=${getCurrentConsultorioId()}`, { method: "GET" }),

  update: (id: string | number, data: any) =>
    apiRequest(`/procedimentos/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...data, consultorioId: getCurrentConsultorioId() }),
    }),

  delete: (id: string | number) =>
    apiRequest(`/procedimentos/${id}?consultorioId=${getCurrentConsultorioId()}`, { method: "DELETE" }),

  getBySpecialty: (especialidade: string) =>
    apiRequest<any[]>(
      `/procedimentos/especialidade/${encodeURIComponent(especialidade)}?consultorioId=${getCurrentConsultorioId()}`,
      { method: "GET" },
    ),

  getByEspecialidade: (especialidadeId: string) =>
    apiRequest<any[]>(
      `/procedimentos/especialidade/${encodeURIComponent(especialidadeId)}?consultorioId=${getCurrentConsultorioId()}`,
      { method: "GET" },
    ),
}

export const dentistasApi = {
  create: (data: any) =>
    apiRequest("/dentistas", {
      method: "POST",
      body: JSON.stringify({ ...data, consultorioId: getCurrentConsultorioId() }),
    }),

  getAll: (page = 0, size = 10, search = "") =>
    apiRequest<Page<any>>(
      `/dentistas?page=${page}&size=${size}${
        search ? `&search=${encodeURIComponent(search)}` : ""
      }&consultorioId=${getCurrentConsultorioId()}`,
      { method: "GET" },
    ),

  getById: (id: string | number) =>
    apiRequest(`/dentistas/${id}?consultorioId=${getCurrentConsultorioId()}`, { method: "GET" }),

  update: (id: string | number, data: any) =>
    apiRequest(`/dentistas/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...data, consultorioId: getCurrentConsultorioId() }), // <<< FIX
    }),

  delete: (id: string | number) =>
    apiRequest(`/dentistas/${id}?consultorioId=${getCurrentConsultorioId()}`, { method: "DELETE" }),

  toggleStatus: (id: string | number, ativo: boolean) =>
    apiRequest(`/dentistas/${id}/status?ativo=${ativo}&consultorioId=${getCurrentConsultorioId()}`, {
      method: "PATCH",
    }),

  export: () => apiRequest(`/dentistas/export?consultorioId=${getCurrentConsultorioId()}`, { method: "GET" }),
}

export const authApi = {
  login: (credentials: { email: string; senha: string }) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      skipAuthRedirect: true, 
    }),

  registerOfficeAndAdmin: (payload: {
    nome: string
    cnpj: string
    telefone?: string
    cep?: string
    estado?: string
    cidade?: string
    bairro?: string
    rua?: string
    numero?: string
    complemento?: string
    adminNome: string
    adminEmail: string
    adminSenha: string
    paymentId?: string
  }) =>
    apiRequest("/auth/novo-consultorio", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  register: (userData: any) =>
    apiRequest("/auth/cadastro-usuario", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  forgotPassword: (email: string) =>
    apiRequest("/auth/esqueci-senha", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
}

export const api = {
  get: (endpoint: string) => apiRequest(endpoint, { method: "GET" }),
  post: (endpoint: string, data?: any) =>
    apiRequest(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: (endpoint: string, data?: any) =>
    apiRequest(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: (endpoint: string) => apiRequest(endpoint, { method: "DELETE" }),
}

export const fichasApi = {
  listByPatient: (pacienteId: string | number, page = 0, size = 10) =>
    apiRequest<Page<any>>(
      `/orcamentos/pacientes/${Number(pacienteId)}?page=${page}&size=${size}&consultorioId=${getCurrentConsultorioId()}`,
      { method: "GET" },
    ),

  createForPatient: (pacienteId: string | number, data: any) =>
    apiRequest(`/pacientes/${pacienteId}/fichas`, {
      method: "POST",
      body: JSON.stringify({
        ...data,
        consultorioId: getCurrentConsultorioId(),
        pacienteId,
      }),
    }),

  getById: (id: string | number) =>
    apiRequest(`/fichas/${id}?consultorioId=${getCurrentConsultorioId()}`, { method: "GET" }),

  update: (id: string | number, data: any) =>
    apiRequest(`/fichas/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...data, consultorioId: getCurrentConsultorioId() }),
    }),

  delete: (id: string | number) =>
    apiRequest(`/fichas/${id}?consultorioId=${getCurrentConsultorioId()}`, { method: "DELETE" }),
}

export const odontogramApi = {
  get: (pacienteId: string | number) =>
    apiRequest(`/pacientes/${pacienteId}/odontograma?consultorioId=${getCurrentConsultorioId()}`, { method: "GET" }),

  save: (pacienteId: string | number, map: any) =>
    apiRequest(`/pacientes/${pacienteId}/odontograma?consultorioId=${getCurrentConsultorioId()}`, {
      method: "PUT",
      body: JSON.stringify(map),
    }),
}

export const patientRecordsApi = {
  create: (pacienteId: string | number, data: any) => fichasApi.createForPatient(pacienteId, data),

  update: (id: string | number, data: any) => fichasApi.update(id, data),

  getById: (id: string | number) => fichasApi.getById(id),

  delete: (id: string | number) => fichasApi.delete(id),

  listByPatient: (pacienteId: string | number, page = 0, size = 20) => fichasApi.listByPatient(pacienteId, page, size),
}

export const paymentsApi = {
  listByPatient: (pacienteId: string | number) =>
    apiRequest<any[]>(`/pacientes/${pacienteId}/pagamentos?consultorioId=${getCurrentConsultorioId()}`, {
      method: "GET",
    }),

  createForPatient: (pacienteId: string | number, data: any) =>
    apiRequest(`/pacientes/${pacienteId}/pagamentos`, {
      method: "POST",
      body: JSON.stringify({ ...data, consultorioId: getCurrentConsultorioId() }),
    }),

  update: (pacienteId: string | number, pagamentoId: string | number, data: any) =>
    apiRequest(`/pacientes/${pacienteId}/pagamentos/${pagamentoId}`, {
      method: "PUT",
      body: JSON.stringify({ ...data, consultorioId: getCurrentConsultorioId() }),
    }),

  updateStatus: (
    pacienteId: string | number,
    pagamentoId: string | number,
    status: "PENDENTE" | "PAGO" | "CANCELADO",
  ) =>
    apiRequest(`/pacientes/${pacienteId}/pagamentos/${pagamentoId}/status?status=${encodeURIComponent(status)}`, {
      method: "PATCH",
    }),

  delete: (pacienteId: string | number, pagamentoId: string | number) =>
    apiRequest(`/pacientes/${pacienteId}/pagamentos/${pagamentoId}`, { method: "DELETE" }),
}

export type BudgetStatus = "DRAFT" | "SENT" | "APPROVED" | "REJECTED"

export const budgetsApi = {
  list: (page = 0, size = 10, q = "", status?: BudgetStatus, pacienteId?: string | number) =>
    apiRequest<Page<any>>(
      `/orcamentos?page=${page}&size=${size}` +
        (q ? `&q=${encodeURIComponent(q)}` : "") +
        (status ? `&status=${status}` : "") +
        (pacienteId != null ? `&pacienteId=${encodeURIComponent(String(pacienteId))}` : "") +
        `&consultorioId=${getCurrentConsultorioId()}`,
      { method: "GET" },
    ),

  listByPatient: (pacienteId: string | number, page = 0, size = 10) =>
    apiRequest<Page<any>>(
      `/orcamentos/pacientes/${pacienteId}?page=${page}&size=${size}&consultorioId=${getCurrentConsultorioId()}`,
      { method: "GET" },
    ),

  getById: (id: string | number) =>
    apiRequest(`/orcamentos/${id}?consultorioId=${getCurrentConsultorioId()}`, { method: "GET" }),

  create: (data: any) =>
    apiRequest("/orcamentos", {
      method: "POST",
      body: JSON.stringify({ ...data, consultorioId: getCurrentConsultorioId() }),
    }),

  update: (id: string | number, data: any) =>
    apiRequest(`/orcamentos/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...data, consultorioId: getCurrentConsultorioId() }),
    }),

  delete: (id: string | number) =>
    apiRequest(`/orcamentos/${id}?consultorioId=${getCurrentConsultorioId()}`, { method: "DELETE" }),

  updateStatus: (id: string | number, status: BudgetStatus) =>
    apiRequest(`/orcamentos/${id}/status?status=${status}`, { method: "PATCH" }),

  updateItemStatus: (budgetId: string | number, itemId: string | number, data: { realizado: boolean }) =>
    apiRequest(`/orcamentos/${budgetId}/itens/${itemId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ ...data, consultorioId: getCurrentConsultorioId() }),
    }),
}

function todayISO() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}
function firstDayOfMonthISO() {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

export const financeApi = {
  getSummary: (start?: string, end?: string) =>
    apiRequest(
      `/financeiro/resumo?consultorioId=${getCurrentConsultorioId()}&start=${encodeURIComponent(
        start || firstDayOfMonthISO(),
      )}&end=${encodeURIComponent(end || todayISO())}`,
      { method: "GET" },
    ),

  getMonthly: (start?: string, end?: string) =>
    apiRequest(
      `/financeiro/mensal?consultorioId=${getCurrentConsultorioId()}&start=${encodeURIComponent(
        start || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
      )}&end=${encodeURIComponent(end || todayISO())}`,
      { method: "GET" },
    ),

  getCashflow: (params: { start?: string; end?: string; status?: string; page?: number; size?: number } = {}) => {
    const start = params.start || firstDayOfMonthISO()
    const end = params.end || todayISO()
    const status = params.status ? `&status=${encodeURIComponent(params.status)}` : ""
    const page = params.page ?? 0
    const size = params.size ?? 20
    return apiRequest(
      `/financeiro/fluxo-caixa?consultorioId=${getCurrentConsultorioId()}&start=${encodeURIComponent(
        start,
      )}&end=${encodeURIComponent(end)}${status}&page=${page}&size=${size}`,
      { method: "GET" },
    )
  },
}

export const especialidadesApi = {
  create: (data: any) =>
    apiRequest("/especialidades", {
      method: "POST",
      body: JSON.stringify({
        nome: data?.nome,
        descricao: data?.descricao,
        ativo: data?.ativo,
        consultorioId: getCurrentConsultorioId(),
      }),
    }),

  getAll: async (page = 0, size = 12, search = ""): Promise<Page<any>> => {
    const qs =
      `?page=${page}&size=${size}&consultorioId=${getCurrentConsultorioId()}` +
      (search ? `&search=${encodeURIComponent(search)}` : "")
    const data = await apiRequest<any>(`/especialidades${qs}`, { method: "GET" })

    if (Array.isArray(data)) {
      return toPage<any>(data)
    }
    if (data && typeof data === "object" && Array.isArray((data as any).content)) {
      return data as Page<any>
    }
    return toPage<any>([])
  },

  getById: (id: string | number) =>
    apiRequest(`/especialidades/${id}?consultorioId=${getCurrentConsultorioId()}`, { method: "GET" }),

  update: (id: string | number, data: any) =>
    apiRequest(`/especialidades/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        nome: data?.nome,
        descricao: data?.descricao,
        ativo: data?.ativo,
        consultorioId: getCurrentConsultorioId(),
      }),
    }),

  delete: (id: string | number) =>
    apiRequest(`/especialidades/${id}?consultorioId=${getCurrentConsultorioId()}`, { method: "DELETE" }),

  listActive: () =>
    apiRequest<any[]>(`/especialidades/ativas?consultorioId=${getCurrentConsultorioId()}`, { method: "GET" }),
}

export const usuariosApi = {
  create: (data: any) =>
    apiRequest("/usuarios", {
      method: "POST",
      body: JSON.stringify({ ...data, consultorioId: getCurrentConsultorioId() }),
    }),

  getAll: (page = 0, size = 50, search = "") =>
    apiRequest<Page<any>>(
      `/usuarios?page=${page}&size=${size}${
        search ? `&search=${encodeURIComponent(search)}` : ""
      }&consultorioId=${getCurrentConsultorioId()}`,
      { method: "GET" },
    ),

  getById: (id: string | number) =>
    apiRequest(`/usuarios/${id}?consultorioId=${getCurrentConsultorioId()}`, { method: "GET" }),

  update: (id: string | number, data: any) =>
    apiRequest(`/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...data, consultorioId: getCurrentConsultorioId() }),
    }),

  delete: (id: string | number) =>
    apiRequest(`/usuarios/${id}?consultorioId=${getCurrentConsultorioId()}`, { method: "DELETE" }),

  toggleStatus: (id: string | number, ativo: boolean) =>
    apiRequest(`/usuarios/${id}/status?ativo=${ativo}&consultorioId=${getCurrentConsultorioId()}`, {
      method: "PATCH",
    }),

  resetPassword: (id: string | number, novaSenha: string) =>
    apiRequest(`/usuarios/${id}/reset-senha`, {
      method: "PATCH",
      body: JSON.stringify({ novaSenha, consultorioId: getCurrentConsultorioId() }),
    }),
}

function normalizePageOrArray<T>(data: any): Page<T> {
  if (Array.isArray(data)) return toPage<T>(data)
  if (data && typeof data === "object" && Array.isArray((data as any).content)) {
    return data as Page<T>
  }
  return toPage<T>([])
}

export const perfisApi = {
  list: async (search = "", page = 0, size = 50): Promise<Page<any>> => {
    const qs = `?page=${page}&size=${size}${search ? `&search=${encodeURIComponent(search)}` : ""}`
    const data = await apiRequest<any>(`/v1/perfil${qs}`, { method: "GET" })
    return normalizePageOrArray<any>(data)
  },

  listAll: async (): Promise<any[]> => {
    const data = await apiRequest<any>(`/v1/perfil`, { method: "GET" })
    if (Array.isArray(data)) return data
    return Array.isArray(data?.content) ? data.content : []
  },

  getById: (id: string | number) => apiRequest<any>(`/v1/perfil/${id}`, { method: "GET" }),

  create: (data: { descricao: string; roleIds?: Array<number | string>; roles?: Array<number | string>; ativo?: boolean }) =>
    apiRequest<any>(`/v1/perfil`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string | number,
    data: { descricao: string; roleIds?: Array<number | string>; roles?: Array<number | string>; ativo?: boolean },
  ) =>
    apiRequest<any>(`/v1/perfil/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string | number) => apiRequest<void>(`/v1/perfil/${id}`, { method: "DELETE" }),
}

export const rolesApi = {
  list: async (search = "", page = 0, size = 100): Promise<Page<any>> => {
    const qs = `?page=${page}&size=${size}${search ? `&search=${encodeURIComponent(search)}` : ""}`
    const data = await apiRequest<any>(`/v1/role${qs}`, { method: "GET" })
    return normalizePageOrArray<any>(data)
  },

  listAll: async (): Promise<any[]> => {
    const data = await apiRequest<any>(`/v1/role`, { method: "GET" })
    if (Array.isArray(data)) return data
    return Array.isArray(data?.content) ? data.content : []
  },

  getById: (id: string | number) => apiRequest<any>(`/v1/role/${id}`, { method: "GET" }),

  create: (data: { nome: string; descricao?: string; ativo?: boolean }) =>
    apiRequest<any>(`/v1/role`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string | number, data: { nome: string; descricao?: string; ativo?: boolean }) =>
    apiRequest<any>(`/v1/role/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string | number) => apiRequest<void>(`/v1/role/${id}`, { method: "DELETE" }),
}

export const prescriptionsApi = {
  create: (
    pacienteId: string | number,
    data: {
      dataEmissao: string
      dentistaNome: string
      dentistaCro: string
      clinicaNome?: string
      orientacoes?: string
      observacoes?: string
      medicamentos: Array<{
        nome: string
        dosagem?: string
        frequencia?: string
        duracao?: string
        observacoes?: string
      }>
    },
  ) =>
    apiRequest("/receitas", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        consultorioId: getCurrentConsultorioId(),
        pacienteId,
      }),
    }),

  listByPatient: (pacienteId: string | number, page = 0, size = 20) =>
    apiRequest<Page<any>>(
      `/receitas?consultorioId=${getCurrentConsultorioId()}&pacienteId=${pacienteId}&page=${page}&size=${size}`,
      { method: "GET" },
    ),

  getById: (id: string | number) =>
    apiRequest(`/receitas/${id}?consultorioId=${getCurrentConsultorioId()}`, { method: "GET" }),

  update: (id: string | number, pacienteId: string | number, data: any) =>
    apiRequest(`/receitas/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...data,
        consultorioId: getCurrentConsultorioId(),
        pacienteId,
      }),
    }),

  delete: (id: string | number) =>
    apiRequest(`/receitas/${id}?consultorioId=${getCurrentConsultorioId()}`, { method: "DELETE" }),
}

export const consultoriosApi = {
  me: () => apiRequest<ConsultorioResponse>("/consultorios/me", { method: "GET" }),

  uploadLogo: async (file: File) => {
    const form = new FormData()
    form.append("file", file)
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    const res = await fetch(`${API_BASE_URL}/consultorios/me/logo`, {
      method: "PUT",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: form,
    })
    if (!res.ok) throw new Error(`Falha ao enviar logo: ${res.status}`)
    return true
  },

  deleteLogo: async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    const res = await fetch(`${API_BASE_URL}/consultorios/me/logo`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!res.ok) throw new Error(`Falha ao remover logo: ${res.status}`)
    return true
  },

  getLogoDataUrl: async (consultorioId: string | number): Promise<string | null> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    const res = await fetch(`${API_BASE_URL}/consultorios/${consultorioId}/logo`, {
      method: "GET",
      credentials: "include",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (res.status === 404) return null
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob) 
    })
  },

  update: (id: number | string, data: Partial<ConsultorioResponse>) =>
    apiRequest<ConsultorioResponse>(`/consultorios/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
}

export type GrupoEmpresaResponse = {
  id: number
  descricao: string
  cnpj: string
  ativo: boolean
  dt?: string
}

export const grupoEmpresaApi = {
  list: (search = "") =>
    apiRequest<GrupoEmpresaResponse[]>(
      `/grupo-empresa${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      { method: "GET" },
    ),

  getById: (id: string | number) =>
    apiRequest<GrupoEmpresaResponse>(`/grupo-empresa/${id}`, { method: "GET" }),

  create: (data: { descricao: string; cnpj: string; ativo: boolean }) =>
    apiRequest(`/grupo-empresa`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string | number, data: { descricao: string; cnpj: string; ativo: boolean }) =>
    apiRequest(`/grupo-empresa/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  toggleStatus: (id: string | number, ativo: boolean) =>
    apiRequest(`/grupo-empresa/${id}/status?ativo=${ativo}`, {
      method: "PATCH",
    }),
}

