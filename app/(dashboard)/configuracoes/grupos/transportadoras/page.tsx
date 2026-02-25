"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { grupoTransportadoraApi, type GrupoTransportadoraResponse } from "@/lib/grupo-transportadora"
import { Eye, Plus, Search, Truck } from "lucide-react"

export default function GruposTransportadorasPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<GrupoTransportadoraResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const load = async () => {
    try {
      setLoading(true)
      setItems(await grupoTransportadoraApi.listAll())
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar os grupos de transportadoras.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => (q ? item.descricao.toLowerCase().includes(q) : true))
  }, [items, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grupos de transportadoras</h1>
          <p className="text-gray-600">Cadastro de grupos e vínculo de transportadoras</p>
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
                placeholder="Buscar grupo por descrição"
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
              <Link href="/configuracoes/grupos/transportadoras/novo">
                <Button className="btn-primary-custom">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo grupo
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Filtre a tabela por descrição do grupo de transportadoras.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grupos cadastrados ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando grupos de transportadoras...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Nenhum grupo encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-700">
                    <th className="px-3 py-3 font-semibold">Grupo</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Data de criação</th>
                    <th className="px-3 py-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-orange-100 text-orange-700">
                            <Truck className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.descricao}</p>
                            <p className="text-xs text-gray-500">ID: {item.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge
                          className={
                            item.status === "INATIVO"
                              ? "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
                              : "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                          }
                        >
                          {item.status === "INATIVO" ? "Inativo" : "Ativo"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-gray-700">{item.dataCriacao ? String(item.dataCriacao) : "-"}</td>
                      <td className="px-3 py-3">
                        <Link href={`/configuracoes/grupos/transportadoras/${item.id}/editar`}>
                          <Button size="sm" className="btn-primary-custom">
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar / Editar grupo
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

