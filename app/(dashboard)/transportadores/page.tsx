"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { transportadorApi, type TransportadorResponse } from "@/lib/transportador"
import { Badge } from "@/components/ui/badge"
import { Edit, Eraser, Plus, Search, Trash2, Truck } from "lucide-react"

export default function TransportadoresPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [items, setItems] = useState<TransportadorResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [descricaoFilter, setDescricaoFilter] = useState("")
  const [cnpjFilter, setCnpjFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const load = async () => {
    try {
      setLoading(true)
      setItems(await transportadorApi.listByGrupoEmpresarial())
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar os transportadores.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const descricao = descricaoFilter.trim().toLowerCase()
    const cnpj = cnpjFilter.trim().toLowerCase()
    const status = statusFilter.trim().toUpperCase()

    if (!descricao && !cnpj && !status) return items

    return items.filter((item) => {
      const okDescricao = descricao ? item.descricao.toLowerCase().includes(descricao) : true
      const okCnpj = cnpj ? item.cnpj.toLowerCase().includes(cnpj) : true
      const okStatus = status ? String(item.status || "").toUpperCase() === status : true
      return okDescricao && okCnpj && okStatus
    })
  }, [items, descricaoFilter, cnpjFilter, statusFilter])

  const remove = async (item: TransportadorResponse) => {
    if (!confirm(`Deseja realmente excluir o transportador "${item.descricao}"?`)) return
    if (!confirm("Deseja realmente excluir o registro?")) return

    try {
      await transportadorApi.delete(item.id)
      toast({ title: "Sucesso", description: "Transportador excluído com sucesso." })
      await load()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível excluir o transportador.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transportadores</h1>
          <p className="text-gray-600">Cadastro e gerenciamento por grupo empresarial</p>
        </div>
        <div />
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Filtros</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
              <Input
                className="h-10 border-gray-200 bg-white pl-3 shadow-sm"
                placeholder="Descrição"
                value={descricaoFilter}
                onChange={(e) => setDescricaoFilter(e.target.value)}
                disabled={loading}
              />
              <Input
                className="h-10 border-gray-200 bg-white pl-3 shadow-sm"
                placeholder="CNPJ"
                value={cnpjFilter}
                onChange={(e) => setCnpjFilter(e.target.value)}
                disabled={loading}
              />
              <Select value={statusFilter || "__all__"} onValueChange={(value) => setStatusFilter(value === "__all__" ? "" : value)}>
                <SelectTrigger className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">
                    Todos
                  </SelectItem>
                  <SelectItem value="ATIVO" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">
                    Ativo
                  </SelectItem>
                  <SelectItem value="INATIVO" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">
                    Inativo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => load()} disabled={loading} className="btn-primary-custom">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
              <Button
                onClick={() => {
                  setDescricaoFilter("")
                  setCnpjFilter("")
                  setStatusFilter("")
                }}
                className="btn-primary-custom"
                disabled={loading}
              >
                <Eraser className="mr-2 h-4 w-4" />
                Limpar
              </Button>
              <Link href="/transportadores/novo">
                <Button className="btn-primary-custom">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Filtre por descrição, CNPJ e status.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transportadores ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando transportadores...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Nenhum transportador encontrado.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{item.descricao}</p>
                        <Badge variant={item.status === "INATIVO" ? "outline" : "secondary"}>
                          {item.status === "INATIVO" ? "Inativo" : "Ativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">CNPJ: {item.cnpj || "-"}</p>
                      <p className="text-xs text-gray-500">Grupo empresarial: {item.grupoEmpresarialId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/transportadores/${item.id}/editar`}>
                      <Button size="sm" className="btn-primary-custom">
                        <Edit className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                    </Link>
                    <Button size="sm" className="btn-primary-custom" onClick={() => remove(item)}>
                      <Trash2 className="mr-1 h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

