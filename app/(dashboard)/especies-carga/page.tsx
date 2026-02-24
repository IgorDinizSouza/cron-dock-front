"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { especieCargaApi, type EspecieCargaResponse } from "@/lib/especie-carga"
import { Boxes, Edit, Plus, Search, Trash2 } from "lucide-react"

export default function EspeciesCargaPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<EspecieCargaResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [descricaoFilter, setDescricaoFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const load = async () => {
    try {
      setLoading(true)
      setItems(await especieCargaApi.listAll())
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar as espécies de carga.",
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
    const status = statusFilter.trim().toUpperCase()
    return items.filter((item) => {
      const okDescricao = descricao ? item.descricao.toLowerCase().includes(descricao) : true
      const okStatus = status ? item.status === status : true
      return okDescricao && okStatus
    })
  }, [items, descricaoFilter, statusFilter])

  const handleDelete = async (item: EspecieCargaResponse) => {
    if (!confirm(`Deseja realmente excluir a espécie de carga "${item.descricao}"?`)) return
    if (!confirm("Deseja realmente excluir o registro?")) return

    try {
      await especieCargaApi.delete(item.id)
      toast({ title: "Sucesso", description: "Espécie de carga excluída com sucesso." })
      await load()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível excluir a espécie de carga.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Espécie de carga</h1>
          <p className="text-gray-600">Configuração das espécies de carga utilizadas no sistema</p>
        </div>
        <div />
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Filtros</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                className="h-10 border-gray-200 bg-white pl-3 shadow-sm"
                placeholder="Descrição"
                value={descricaoFilter}
                onChange={(e) => setDescricaoFilter(e.target.value)}
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
              <Button onClick={load} disabled={loading} className="btn-primary-custom">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
              <Link href="/especies-carga/novo">
                <Button className="btn-primary-custom">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Filtre por descrição e status.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Espécies de carga ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando espécies de carga...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Nenhuma espécie de carga encontrada.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
                      <Boxes className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900">{item.descricao}</p>
                        <Badge
                          className={
                            item.status === "INATIVO"
                              ? "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
                              : "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                          }
                        >
                          {item.status === "INATIVO" ? "Inativo" : "Ativo"}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">ID: {item.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/especies-carga/${item.id}/editar`}>
                      <Button size="sm" className="btn-primary-custom">
                        <Edit className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                    </Link>
                    <Button size="sm" className="btn-primary-custom" onClick={() => handleDelete(item)}>
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

