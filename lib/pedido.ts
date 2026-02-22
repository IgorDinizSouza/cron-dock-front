import { api } from "./api"

export type PedidoResponse = {
  id: number
  filial: string
  pedido: string
  fornecedor: string
  comprador: string
  dataCriacao: string
  status: string
}

export type PedidoItemResponse = {
  id: number
  sequencia?: number | null
  produto?: string
  produtoId?: number | null
  descricao?: string
  quantidade?: number | string | null
  qtdPedida?: number | string | null
  qtdRecebida?: number | string | null
  unidade?: string | null
  embalagem?: string | null
  codigo?: string | number | null
  dataEntrega?: string | null
  cargaPalet?: number | string | null
  abc?: number | string | null
  participacaoItem?: number | string | null
  status?: string | null
  [key: string]: any
}

export type PedidoDetalheResponse = PedidoResponse & {
  observacao?: string | null
  dataPedido?: string | null
  itens: PedidoItemResponse[]
  raw?: any
}

const BASE = "/v1/pedido"

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

function normalizePedido(raw: any): PedidoResponse {
  return {
    id: Number(raw?.id ?? raw?.pedidoId ?? 0),
    filial: String(raw?.filial ?? raw?.filialDescricao ?? raw?.filialNome ?? "-"),
    pedido: String(raw?.pedido ?? raw?.numeroPedido ?? raw?.numero ?? raw?.id ?? "-"),
    fornecedor: String(raw?.fornecedor ?? raw?.fornecedorDescricao ?? raw?.fornecedorNome ?? "-"),
    comprador: String(raw?.comprador ?? raw?.compradorDescricao ?? raw?.compradorNome ?? "-"),
    dataCriacao: String(raw?.dataCriacao ?? raw?.dataPedido ?? raw?.createdAt ?? "-"),
    status: String(raw?.status ?? "-"),
  }
}

function normalizePedidoItem(raw: any): PedidoItemResponse {
  return {
    id: Number(raw?.id ?? raw?.itemId ?? 0),
    sequencia: raw?.sequencia != null ? Number(raw.sequencia) : null,
    produtoId: raw?.produtoId != null ? Number(raw.produtoId) : null,
    produto: raw?.produto ?? raw?.produtoDescricao ?? raw?.descricaoProduto ?? raw?.descricao ?? null,
    descricao: raw?.descricao ?? raw?.produtoDescricao ?? raw?.produto ?? null,
    quantidade: raw?.quantidade ?? raw?.qtd ?? raw?.qtdPedida ?? raw?.volume ?? null,
    qtdPedida: raw?.qtdPedida ?? raw?.quantidade ?? raw?.qtd ?? null,
    qtdRecebida: raw?.qtdRecebida ?? null,
    unidade: raw?.unidade ?? raw?.sigla ?? null,
    embalagem: raw?.embalagem ?? raw?.embalagemDescricao ?? null,
    codigo: raw?.codigo ?? raw?.codigoProduto ?? raw?.produtoId ?? null,
    dataEntrega: raw?.dataEntrega ?? null,
    cargaPalet: raw?.cargaPalet ?? null,
    abc: raw?.abc ?? null,
    participacaoItem: raw?.participacaoItem ?? null,
    status: raw?.status ?? null,
    ...raw,
  }
}

function extractArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.itens)) return raw.itens
  if (Array.isArray(raw?.items)) return raw.items
  if (Array.isArray(raw?.data)) return raw.data
  if (raw?.data && typeof raw.data === "object") {
    if (Array.isArray(raw.data.itens)) return raw.data.itens
    if (Array.isArray(raw.data.items)) return raw.data.items
    if (Array.isArray(raw.data.content)) return raw.data.content
  }
  return []
}

function normalizePedidoDetalhe(raw: any): PedidoDetalheResponse {
  const baseSource = raw?.pedido && typeof raw.pedido === "object" ? raw.pedido : raw?.data?.pedido && typeof raw.data.pedido === "object" ? raw.data.pedido : raw
  const base = normalizePedido(baseSource)
  const itens = extractArray(raw).map(normalizePedidoItem)

  return {
    ...base,
    observacao: raw?.observacao ?? raw?.obs ?? raw?.pedido?.observacao ?? null,
    dataPedido: raw?.dataPedido ?? raw?.pedido?.dataPedido ?? raw?.dataCriacao ?? null,
    itens,
    raw,
  }
}

export const pedidoApi = {
  listByGrupoEmpresarial: (grupoEmpresarialId: string | number) =>
    api.get(`${BASE}/grupo-empresarial/${encodeURIComponent(String(grupoEmpresarialId))}`) as Promise<
      PedidoResponse[]
    >,

  getByNumeroPedido: async (
    numeroPedido: string | number,
    grupoEmpresarialId?: string | number,
  ): Promise<PedidoDetalheResponse> => {
    const gid = encodeURIComponent(String(grupoEmpresarialId ?? getGrupoEmpresarialId()))
    const numero = encodeURIComponent(String(numeroPedido))
    const data = await api.get(`${BASE}/buscar?grupoEmpresarialId=${gid}&numeroPedido=${numero}`)
    return normalizePedidoDetalhe(data)
  },

  getById: async (id: string | number, grupoEmpresarialId?: string | number): Promise<PedidoDetalheResponse> =>
    pedidoApi.getByNumeroPedido(id, grupoEmpresarialId),
}

export default pedidoApi
