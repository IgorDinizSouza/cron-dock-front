"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { tipoCargaApi, type TipoCargaResponse } from "@/lib/tipo-carga"
import { Edit, Package, Plus, Search, Trash2 } from "lucide-react"

export default function TiposCargaPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<TipoCargaResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [descricaoFilter, setDescricaoFilter] = useState("")

  const load = async () => {
    try {
      setLoading(true)
      setItems(await tipoCargaApi.listAll())
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar os tipos de carga.",
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
    return items.filter((item) => (descricao ? item.descricao.toLowerCase().includes(descricao) : true))
  }, [items, descricaoFilter])

  const handleDelete = async (item: TipoCargaResponse) => {
    if (!confirm(`Deseja realmente excluir o tipo de carga "${item.descricao}"?`)) return
    if (!confirm("Deseja realmente excluir o registro?")) return

    try {
      await tipoCargaApi.delete(item.id)
      toast({ title: "Sucesso", description: "Tipo de carga excluído com sucesso." })
      await load()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível excluir o tipo de carga.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipo de carga</h1>
          <p className="text-gray-600">Configuração dos tipos de carga utilizados no sistema</p>
        </div>
        <div />
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Filtros</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-1">
              <Input
                className="h-10 border-gray-200 bg-white pl-3 shadow-sm"
                placeholder="Descrição"
                value={descricaoFilter}
                onChange={(e) => setDescricaoFilter(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={load} disabled={loading} className="btn-primary-custom">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
              <Link href="/tipos-carga/novo">
                <Button className="btn-primary-custom">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Filtre por descrição.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de carga ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando tipos de carga...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Nenhum tipo de carga encontrado.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.descricao}</p>
                      <p className="text-xs text-gray-500">
                        ID: {item.id} | Min SKU: {item.minSku ?? "-"} | Max SKU: {item.maxSku ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/tipos-carga/${item.id}/editar`}>
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

