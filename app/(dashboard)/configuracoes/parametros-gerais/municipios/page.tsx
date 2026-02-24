"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { municipioApi, type MunicipioResponse } from "@/lib/municipio"
import { Edit, MapPin, Plus, Search, Trash2 } from "lucide-react"

export default function MunicipiosPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<MunicipioResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const load = async () => {
    try {
      setLoading(true)
      setItems(await municipioApi.listAll())
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar os municípios.",
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
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (!q) return true
      const text = [item.descricao, item.codigoIbge, item.estado?.descricao, item.estado?.sigla].join(" ").toLowerCase()
      return text.includes(q)
    })
  }, [items, search])

  const handleDelete = async (item: MunicipioResponse) => {
    if (!confirm(`Deseja realmente excluir o município "${item.descricao}"?`)) return
    if (!confirm("Deseja realmente excluir o registro?")) return
    try {
      await municipioApi.delete(item.id)
      toast({ title: "Sucesso", description: "Município excluído com sucesso." })
      await load()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível excluir o município.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Município</h1>
          <p className="text-gray-600">Cadastro de municípios</p>
        </div>
        <div />
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Filtros</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid w-full grid-cols-1 gap-2">
              <Input
                className="h-10 border-gray-200 bg-white pl-3 shadow-sm"
                placeholder="Buscar por descrição, código IBGE ou estado"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={load} disabled={loading} className="btn-primary-custom">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
              <Link href="/configuracoes/parametros-gerais/municipios/novo">
                <Button className="btn-primary-custom">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Filtre por descrição, código IBGE ou estado.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Municípios ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando municípios...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Nenhum município encontrado.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.descricao}</p>
                      <p className="text-xs text-gray-500">
                        ID: {item.id} | Código IBGE: {item.codigoIbge || "-"} | Estado: {item.estado?.sigla || item.estado?.descricao || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/configuracoes/parametros-gerais/municipios/${item.id}/editar`}>
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

