import { api } from "./api"

export type CargaRequest = {
  idStatusCarga: number
  idTipoCarga: number
  idTipoVeiculo: number
  idTransportadora: number
  idEspecieCarga: number
  idUsuarioSolicitante?: number
  idUsuarioAprovador?: number
  dataAgendamento: string
}

export type CargaResponse = {
  id: number
  idStatusCarga: number
  statusCargaDescricao?: string | null
  idTipoCarga: number
  tipoCargaDescricao?: string | null
  idTipoVeiculo: number
  tipoVeiculoDescricao?: string | null
  idTransportadora: number
  transportadoraDescricao?: string | null
  idEspecieCarga: number
  especieCargaDescricao?: string | null
  dataAgendamento: string
  dataCriacao?: string | null
  dataAlteracao?: string | null
}

export type CargaProdutoRequest = {
  idProduto: number
  idPedido: number
  quantidadeAlocada: number
  data: string
}

export type CargaProdutoResponse = {
  id: number
  idCarga: number
  idProduto: number
  idPedido: number
  quantidadeAlocada: number
  data: string
  produtoDescricao?: string | null
  pedidoDescricao?: string | null
}

const BASE = "/v1/carga"
const AUTH_SESSION_KEY = "odonto.auth.session"

function toNumber(raw: any): number {
  const n = Number(raw ?? 0)
  return Number.isFinite(n) ? n : 0
}

function getUsuarioLogadoId(): number {
  if (typeof window === "undefined") return 1
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const id = parsed?.user?.id ?? parsed?.idUsuario
      const n = Number(id)
      if (Number.isFinite(n) && n > 0) return n
    }
  } catch {}
  return 1
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

function normalizeCarga(raw: any): CargaResponse {
  return {
    id: toNumber(raw?.id),
    idStatusCarga: toNumber(raw?.idStatusCarga ?? raw?.statusCarga?.id ?? raw?.status?.id),
    statusCargaDescricao: raw?.statusCargaDescricao ?? raw?.statusCarga?.descricao ?? raw?.status?.descricao ?? null,
    idTipoCarga: toNumber(raw?.idTipoCarga ?? raw?.tipoCarga?.id),
    tipoCargaDescricao: raw?.tipoCargaDescricao ?? raw?.tipoCarga?.descricao ?? raw?.tipoCarga?.nome ?? null,
    idTipoVeiculo: toNumber(raw?.idTipoVeiculo ?? raw?.tipoVeiculo?.id),
    tipoVeiculoDescricao: raw?.tipoVeiculoDescricao ?? raw?.tipoVeiculo?.descricao ?? raw?.tipoVeiculo?.nome ?? null,
    idTransportadora: toNumber(raw?.idTransportadora ?? raw?.transportadora?.id),
    transportadoraDescricao: raw?.transportadoraDescricao ?? raw?.transportadora?.descricao ?? raw?.transportadora?.nome ?? null,
    idEspecieCarga: toNumber(raw?.idEspecieCarga ?? raw?.especieCarga?.id),
    especieCargaDescricao: raw?.especieCargaDescricao ?? raw?.especieCarga?.descricao ?? raw?.especieCarga?.nome ?? null,
    dataAgendamento: String(raw?.dataAgendamento ?? raw?.dataAgenda ?? ""),
    dataCriacao: raw?.dataCriacao ?? raw?.createdAt ?? null,
    dataAlteracao: raw?.dataAlteracao ?? raw?.updatedAt ?? null,
  }
}

function toPayload(input: CargaRequest, opts?: { includeAprovador?: boolean }) {
  const usuarioId = getUsuarioLogadoId()
  const idUsuarioSolicitante = toNumber(input.idUsuarioSolicitante ?? usuarioId)
  const payload: Record<string, any> = {
    idStatusCarga: toNumber(input.idStatusCarga),
    idTipoCarga: toNumber(input.idTipoCarga),
    idTipoVeiculo: toNumber(input.idTipoVeiculo),
    idTransportadora: toNumber(input.idTransportadora),
    idEspecieCarga: toNumber(input.idEspecieCarga),
    idUsuarioSolicitante,
    dataAgendamento: input.dataAgendamento,
  }

  if (opts?.includeAprovador) {
    payload.idUsuarioAprovador = toNumber(input.idUsuarioAprovador ?? usuarioId)
  }

  return payload
}

function normalizeCargaProduto(raw: any, idCarga?: number): CargaProdutoResponse {
  return {
    id: toNumber(raw?.id ?? raw?.cargaProdutoId),
    idCarga: toNumber(raw?.idCarga ?? raw?.cargaId ?? raw?.carga?.id ?? idCarga),
    idProduto: toNumber(raw?.idProduto ?? raw?.produtoId ?? raw?.produto?.id),
    idPedido: toNumber(raw?.idPedido ?? raw?.pedidoId ?? raw?.pedido?.id),
    quantidadeAlocada: Number(raw?.quantidadeAlocada ?? raw?.quantidade_alocada ?? 0),
    data: String(raw?.data ?? raw?.dataAgendamento ?? raw?.dataCadastro ?? ""),
    produtoDescricao: raw?.produtoDescricao ?? raw?.produto?.descricao ?? raw?.produto?.nome ?? null,
    pedidoDescricao: raw?.pedidoDescricao ?? raw?.pedido?.descricao ?? raw?.pedido?.numero ?? null,
  }
}

function toProdutoPayload(input: CargaProdutoRequest) {
  return {
    idProduto: toNumber(input.idProduto),
    idPedido: toNumber(input.idPedido),
    quantidadeAlocada: Number(input.quantidadeAlocada),
    data: input.data,
  }
}

export const cargaApi = {
  listAll: async (): Promise<CargaResponse[]> => {
    const data = await api.get(BASE)
    return unwrapArray(data).map(normalizeCarga)
  },

  getById: async (id: string | number): Promise<CargaResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeCarga(await api.get(`${BASE}/${encoded}`))
  },

  create: async (payload: CargaRequest): Promise<CargaResponse> => {
    return normalizeCarga(await api.post(BASE, toPayload(payload)))
  },

  update: async (id: string | number, payload: CargaRequest): Promise<CargaResponse> => {
    const encoded = encodeURIComponent(String(id))
    return normalizeCarga(await api.put(`${BASE}/${encoded}`, toPayload(payload, { includeAprovador: true })))
  },

  delete: async (id: string | number): Promise<void> => {
    const encoded = encodeURIComponent(String(id))
    await api.delete(`${BASE}/${encoded}`)
  },

  listProdutos: async (idCarga: string | number): Promise<CargaProdutoResponse[]> => {
    const encoded = encodeURIComponent(String(idCarga))
    const data = await api.get(`${BASE}/${encoded}/produto`)
    return unwrapArray(data).map((item) => normalizeCargaProduto(item, Number(idCarga)))
  },

  addProduto: async (idCarga: string | number, payload: CargaProdutoRequest): Promise<CargaProdutoResponse> => {
    const encoded = encodeURIComponent(String(idCarga))
    return normalizeCargaProduto(await api.post(`${BASE}/${encoded}/produto`, toProdutoPayload(payload)), Number(idCarga))
  },

  updateProduto: async (
    idCarga: string | number,
    idCargaProduto: string | number,
    payload: CargaProdutoRequest,
  ): Promise<CargaProdutoResponse> => {
    const encodedCarga = encodeURIComponent(String(idCarga))
    const encodedItem = encodeURIComponent(String(idCargaProduto))
    return normalizeCargaProduto(
      await api.put(`${BASE}/${encodedCarga}/produto/${encodedItem}`, toProdutoPayload(payload)),
      Number(idCarga),
    )
  },

  deleteProduto: async (idCarga: string | number, idCargaProduto: string | number): Promise<void> => {
    const encodedCarga = encodeURIComponent(String(idCarga))
    const encodedItem = encodeURIComponent(String(idCargaProduto))
    await api.delete(`${BASE}/${encodedCarga}/produto/${encodedItem}`)
  },
}
