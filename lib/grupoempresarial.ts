import { api } from "./api"

export type Status = "ATIVO" | "INATIVO"

export type GrupoEmpresarialResponse = {
  id: number
  descricao: string
  cnpj: string
  status?: Status
  ativo?: boolean
  dataCriacao?: string
}

export type GrupoEmpresarialRequest = {
  descricao: string
  cnpj: string
  status?: Status
  ativo?: boolean
}

const BASE = "/v1/grupo-empresarial"

export const grupoEmpresarialApi = {
  list: (search = "") =>
    api.get(`${BASE}${search ? `?search=${encodeURIComponent(search)}` : ""}`) as Promise<GrupoEmpresarialResponse[]>,

  getById: (id: string | number) =>
    api.get(`${BASE}/${encodeURIComponent(String(id))}`) as Promise<GrupoEmpresarialResponse>,

  create: (data: GrupoEmpresarialRequest) =>
    api.post(`${BASE}`, data) as Promise<GrupoEmpresarialResponse>,

  update: (id: string | number, data: GrupoEmpresarialRequest) =>
    api.put(`${BASE}/${encodeURIComponent(String(id))}`, data) as Promise<GrupoEmpresarialResponse>,

  updateStatus: (id: string | number, status: Status) =>
    api.put(`${BASE}/${encodeURIComponent(String(id))}/status?status=${encodeURIComponent(status)}`) as Promise<
      GrupoEmpresarialResponse
    >,

  delete: (id: string | number) =>
    api.delete(`${BASE}/${encodeURIComponent(String(id))}`) as Promise<void>,
}
