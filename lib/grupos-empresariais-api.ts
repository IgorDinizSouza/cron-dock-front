export type GrupoEmpresa = {
  id: number
  descricao: string
  cnpj: string
  ativo: boolean
  dt?: string
}

type CreateGrupoEmpresaDTO = {
  descricao: string
  cnpj: string
  ativo: boolean
}

type UpdateGrupoEmpresaDTO = {
  descricao: string
  cnpj: string
  ativo: boolean
}

const BASE = "/grupo-empresa" // ajuste se seu backend usar outro path

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = "Erro na requisição"
    try {
      const data = await res.json()
      message = data?.message || data?.error || message
    } catch {}
    throw new Error(message)
  }
  // alguns endpoints podem retornar vazio em PUT; trate se precisar
  return (await res.json()) as T
}

export const grupoEmpresaApi = {
  async list(term?: string): Promise<GrupoEmpresa[]> {
    const qs = term?.trim() ? `?q=${encodeURIComponent(term.trim())}` : ""
    const res = await fetch(`${BASE}${qs}`, { cache: "no-store" })
    return handleResponse<GrupoEmpresa[]>(res)
  },

  async getById(id: string | number): Promise<GrupoEmpresa> {
    const res = await fetch(`${BASE}/${id}`, { cache: "no-store" })
    return handleResponse<GrupoEmpresa>(res)
  },

  async create(dto: CreateGrupoEmpresaDTO): Promise<GrupoEmpresa> {
    const res = await fetch(`${BASE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    })
    return handleResponse<GrupoEmpresa>(res)
  },

  async update(id: string | number, dto: UpdateGrupoEmpresaDTO): Promise<GrupoEmpresa> {
    const res = await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    })
    return handleResponse<GrupoEmpresa>(res)
  },
}
