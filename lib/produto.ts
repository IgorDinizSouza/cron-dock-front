import { api } from "./api"

export type ProdutoStatus = "ATIVO" | "INATIVO"
export type EmbalagemStatus = "ATIVO" | "INATIVO"

export type EmbalagemResponse = {
  id: number
  produtoId: number | null
  digito: number | null
  codigoBarra: string
  sigla: string
  multiplicador1: number | null
  multiplicador2: number | null
  status: EmbalagemStatus
  dataCriacao?: string | null
  grupoEmpresarialId: number
}

export type EmbalagemRequest = {
  id?: number
  produtoId?: number | null
  digito?: number | null
  codigoBarra?: string
  sigla?: string
  multiplicador1?: number | null
  multiplicador2?: number | null
  status?: EmbalagemStatus
}

export type ProdutoResponse = {
  id: number
  descricao: string
  compradorId: number | null
  compradorDescricao: string
  complemento: string
  lastro: number | null
  altura: number | null
  peso: string
  pesoLiquido: string
  composicao: number | null
  dataCadastro: string | null
  embalagens: EmbalagemResponse[]
  status: ProdutoStatus
  dataCriacao?: string | null
  grupoEmpresarialId: number
  ativo?: boolean
  raw?: any
}

export type ProdutoRequest = {
  id?: number
  descricao: string
  compradorId?: number | null
  complemento?: string
  lastro?: number | null
  altura?: number | null
  peso?: string
  pesoLiquido?: string
  composicao?: number | null
  dataCadastro?: string | null
  embalagens?: EmbalagemRequest[]
  grupoEmpresarialId?: number
  status: ProdutoStatus
}

const BASE = "/v1/produto"
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

function normalizeStatus(raw: any): ProdutoStatus {
  if (raw === 1 || raw === "1") return "ATIVO"
  if (raw === 0 || raw === "0") return "INATIVO"
  const s = String(raw ?? "").toUpperCase()
  return s === "INATIVO" ? "INATIVO" : "ATIVO"
}

function normalizeEmbalagemStatus(raw: any): EmbalagemStatus {
  return normalizeStatus(raw)
}

function toNullableNumber(value: any): number | null {
  if (value == null || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeProduto(raw: any): ProdutoResponse {
  const status = normalizeStatus(raw?.status ?? raw?.ativo ?? raw?.active)
  const compradorObj = raw?.comprador && typeof raw.comprador === "object" ? raw.comprador : null
  const embalagensRaw = Array.isArray(raw?.embalagens) ? raw.embalagens : []
  return {
    id: Number(raw?.id ?? 0),
    descricao: String(raw?.descricao ?? raw?.nome ?? raw?.produto ?? "").trim(),
    compradorId: toNullableNumber(raw?.compradorId ?? raw?.comprador_id ?? compradorObj?.id),
    compradorDescricao: String(raw?.compradorDescricao ?? raw?.comprador_descricao ?? compradorObj?.descricao ?? raw?.compradorNome ?? "").trim(),
    complemento: String(raw?.complemento ?? "").trim(),
    lastro: toNullableNumber(raw?.lastro),
    altura: toNullableNumber(raw?.altura),
    peso: String(raw?.peso ?? "").trim(),
    pesoLiquido: String(raw?.pesoLiquido ?? raw?.peso_liquido ?? "").trim(),
    composicao: toNullableNumber(raw?.composicao),
    dataCadastro: raw?.dataCadastro ?? raw?.data_cadastro ?? null,
    embalagens: embalagensRaw.map((emb: any) => ({
      id: Number(emb?.id ?? 0),
      produtoId: toNullableNumber(emb?.produtoId ?? emb?.produto_id),
      digito: toNullableNumber(emb?.digito),
      codigoBarra: String(emb?.codigoBarra ?? emb?.codigo_barra ?? "").trim(),
      sigla: String(emb?.sigla ?? "").trim(),
      multiplicador1: toNullableNumber(emb?.multiplicador1),
      multiplicador2: toNullableNumber(emb?.multiplicador2),
      status: normalizeEmbalagemStatus(emb?.status),
      dataCriacao: emb?.dataCriacao ?? emb?.data_criacao ?? null,
      grupoEmpresarialId: Number(emb?.grupoEmpresarialId ?? emb?.grupo_empresarial_id ?? getGrupoEmpresarialId()),
    })),
    status,
    dataCriacao: raw?.dataCriacao ?? raw?.data_criacao ?? null,
    grupoEmpresarialId: Number(raw?.grupoEmpresarialId ?? raw?.grupo_empresarial_id ?? getGrupoEmpresarialId()),
    ativo: status === "ATIVO",
    raw,
  }
}

function toRequestPayload(data: Partial<ProdutoRequest>) {
  return {
    id: data.id != null ? Number(data.id) : undefined,
    descricao: String(data.descricao ?? "").trim(),
    compradorId: toNullableNumber(data.compradorId),
    complemento: String(data.complemento ?? "").trim() || null,
    lastro: toNullableNumber(data.lastro),
    altura: toNullableNumber(data.altura),
    peso: String(data.peso ?? "").trim() || null,
    pesoLiquido: String(data.pesoLiquido ?? "").trim() || null,
    composicao: toNullableNumber(data.composicao),
    dataCadastro: data.dataCadastro ? String(data.dataCadastro) : null,
    embalagens: Array.isArray(data.embalagens)
      ? data.embalagens.map((emb) => ({
          id: emb.id != null ? Number(emb.id) : undefined,
          produtoId: toNullableNumber(emb.produtoId),
          digito: toNullableNumber(emb.digito),
          codigoBarra: String(emb.codigoBarra ?? "").trim() || null,
          sigla: String(emb.sigla ?? "").trim() || null,
          multiplicador1: toNullableNumber(emb.multiplicador1),
          multiplicador2: toNullableNumber(emb.multiplicador2),
          status: normalizeEmbalagemStatus(emb.status),
        }))
      : undefined,
    grupoEmpresarialId: Number(data.grupoEmpresarialId ?? getGrupoEmpresarialId()),
    status: normalizeStatus(data.status),
  }
}

export const produtoApi = {
  listByGrupoEmpresarial: async (grupoEmpresarialId?: string | number): Promise<ProdutoResponse[]> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const data = (await api.get(`${BASE}/grupo-empresarial/${gid}`)) as any
    if (Array.isArray(data)) return data.map(normalizeProduto)
    if (Array.isArray(data?.content)) return data.content.map(normalizeProduto)
    return []
  },

  getById: async (id: string | number, grupoEmpresarialId?: string | number): Promise<ProdutoResponse> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const encoded = encodeURIComponent(String(id))
    return normalizeProduto(await api.get(`${BASE}/grupo-empresarial/${gid}/${encoded}`))
  },

  create: async (payload: ProdutoRequest): Promise<ProdutoResponse> => {
    return normalizeProduto(await api.post(BASE, toRequestPayload(payload)))
  },

  update: async (id: string | number, payload: Partial<ProdutoRequest>): Promise<ProdutoResponse> => {
    const gid = encodeURIComponent(String(payload.grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const encoded = encodeURIComponent(String(id))
    return normalizeProduto(await api.put(`${BASE}/grupo-empresarial/${gid}/${encoded}`, toRequestPayload(payload)))
  },

  delete: async (id: string | number, grupoEmpresarialId?: string | number): Promise<void> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const encoded = encodeURIComponent(String(id))
    await api.delete(`${BASE}/grupo-empresarial/${gid}/${encoded}`)
  },
}
