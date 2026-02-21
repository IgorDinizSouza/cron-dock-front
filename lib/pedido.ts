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

const BASE = "/v1/pedido"

export const pedidoApi = {
  listByGrupoEmpresarial: (grupoEmpresarialId: string | number) =>
    api.get(`${BASE}/grupo-empresarial/${encodeURIComponent(String(grupoEmpresarialId))}`) as Promise<
      PedidoResponse[]
    >,
}

export default pedidoApi
