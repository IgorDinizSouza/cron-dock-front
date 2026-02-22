import { api } from "./api"

export type FilialStatus = "ATIVO" | "INATIVO"

export type FilialResponse = {
  id: number
  descricao: string
  cnpj: string
  endereco: string
  bairro: string
  codigoIbgeCidade: string
  uf: string
  cep: string
  cd: number | null
  wms: number | null
  flagRegional: number | null
  descricaoRegional: string
  status: FilialStatus
  dataCriacao?: string | null
  grupoEmpresarialId: number
  ativo?: boolean
}

export type FilialRequest = {
  id?: number
  descricao: string
  cnpj: string
  endereco?: string
  bairro?: string
  codigoIbgeCidade?: string
  uf?: string
  cep?: string
  cd?: number | null
  wms?: number | null
  flagRegional?: number | null
  descricaoRegional?: string
  grupoEmpresarialId?: number
  status: FilialStatus
}

const BASE = "/v1/filial"
const AUTH_SESSION_KEY = "odonto.auth.session"

function getGrupoEmpresarialId(): number {
  if (typeof window === "undefined") return 1

  const fromLs = localStorage.getItem("grupoEmpresarialId")
  if (fromLs && Number.isFinite(Number(fromLs))) return Number(fromLs)

  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const fromSession = parsed?.user?.grupoEmpresarialId ?? parsed?.grupoEmpresarialId
      if (fromSession != null && Number.isFinite(Number(fromSession))) return Number(fromSession)
    }
  } catch {}

  return 1
}

function normalizeStatus(raw: any): FilialStatus {
  if (raw === 1 || raw === "1") return "ATIVO"
  if (raw === 0 || raw === "0") return "INATIVO"
  const s = String(raw ?? "").toUpperCase()
  return s === "INATIVO" ? "INATIVO" : "ATIVO"
}

function toNullableNumber(value: any): number | null {
  if (value == null || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeFilial(raw: any): FilialResponse {
  const status = normalizeStatus(raw?.status ?? raw?.ativo ?? raw?.active)
  return {
    id: Number(raw?.id ?? 0),
    descricao: String(raw?.descricao ?? "").trim(),
    cnpj: String(raw?.cnpj ?? "").trim(),
    endereco: String(raw?.endereco ?? "").trim(),
    bairro: String(raw?.bairro ?? "").trim(),
    codigoIbgeCidade: String(raw?.codigoIbgeCidade ?? raw?.codigo_ibge_cidade ?? "").trim(),
    uf: String(raw?.uf ?? "").trim(),
    cep: String(raw?.cep ?? "").trim(),
    cd: toNullableNumber(raw?.cd),
    wms: toNullableNumber(raw?.wms),
    flagRegional: toNullableNumber(raw?.flagRegional ?? raw?.flag_regional),
    descricaoRegional: String(raw?.descricaoRegional ?? raw?.descricao_regional ?? "").trim(),
    status,
    dataCriacao: raw?.dataCriacao ?? raw?.data_criacao ?? null,
    grupoEmpresarialId: Number(raw?.grupoEmpresarialId ?? raw?.grupo_empresarial_id ?? getGrupoEmpresarialId()),
    ativo: status === "ATIVO",
  }
}

function toRequestPayload(data: Partial<FilialRequest>) {
  return {
    id: data.id != null ? Number(data.id) : undefined,
    descricao: String(data.descricao ?? "").trim(),
    cnpj: String(data.cnpj ?? "").trim(),
    endereco: String(data.endereco ?? "").trim() || null,
    bairro: String(data.bairro ?? "").trim() || null,
    codigoIbgeCidade: String(data.codigoIbgeCidade ?? "").trim() || null,
    uf:
      String(data.uf ?? "")
        .trim()
        .toUpperCase() || null,
    cep: String(data.cep ?? "").trim() || null,
    cd: toNullableNumber(data.cd),
    wms: toNullableNumber(data.wms),
    flagRegional: toNullableNumber(data.flagRegional),
    descricaoRegional: String(data.descricaoRegional ?? "").trim() || null,
    grupoEmpresarialId: Number(data.grupoEmpresarialId ?? getGrupoEmpresarialId()),
    status: normalizeStatus(data.status),
  }
}

export const filialApi = {
  listByGrupoEmpresarial: async (grupoEmpresarialId?: string | number): Promise<FilialResponse[]> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const data = (await api.get(`${BASE}/grupo-empresarial/${gid}`)) as any
    if (Array.isArray(data)) return data.map(normalizeFilial)
    if (Array.isArray(data?.content)) return data.content.map(normalizeFilial)
    return []
  },

  getById: async (id: string | number, grupoEmpresarialId?: string | number): Promise<FilialResponse> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const encoded = encodeURIComponent(String(id))
    return normalizeFilial(await api.get(`${BASE}/grupo-empresarial/${gid}/${encoded}`))
  },

  create: async (payload: FilialRequest): Promise<FilialResponse> => {
    return normalizeFilial(await api.post(BASE, toRequestPayload(payload)))
  },

  update: async (id: string | number, payload: Partial<FilialRequest>): Promise<FilialResponse> => {
    const gid = encodeURIComponent(String(payload.grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const encoded = encodeURIComponent(String(id))
    return normalizeFilial(await api.put(`${BASE}/grupo-empresarial/${gid}/${encoded}`, toRequestPayload(payload)))
  },

  delete: async (id: string | number, grupoEmpresarialId?: string | number): Promise<void> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const encoded = encodeURIComponent(String(id))
    await api.delete(`${BASE}/grupo-empresarial/${gid}/${encoded}`)
  },
}

