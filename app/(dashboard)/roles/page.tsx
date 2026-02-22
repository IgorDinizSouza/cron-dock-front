"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { roleApi, type RoleResponse } from "@/lib/perfil"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Edit, Eraser, Plus, Search, Trash2 } from "lucide-react"

export default function RolesPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<RoleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const load = async (term = "") => {
    try {
      setLoading(true)
      const response = await roleApi.list(term)
      setItems(response.content || [])
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar as roles.",
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
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((item) => [item.nome, item.descricao || ""].join(" ").toLowerCase().includes(term))
  }, [items, search])

  const remove = async (item: RoleResponse) => {
    if (!confirm(`Deseja realmente excluir a role "${item.nome}"?`)) return
    try {
      await roleApi.delete(item.id)
      toast({ title: "Sucesso", description: "Role excluída com sucesso." })
      await load()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível excluir a role.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="text-gray-600">Gerencie as permissões do sistema</p>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 shadow-sm border-gray-200 bg-white h-10"
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => load(search)} disabled={loading} className="btn-primary-custom">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Link href="/roles/novo">
                <Button className="btn-primary-custom">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando roles...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Nenhuma role encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-3 pr-4">Nome</th>
                    <th className="py-3 pr-4">Descrição</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium">{item.nome}</td>
                      <td className="py-3 pr-4">{item.descricao || "-"}</td>
                      <td className="py-3 pr-4">
                        <Badge
                          className={
                            item.ativo === false
                              ? "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
                              : "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                          }
                        >
                          {item.ativo === false ? "Inativo" : "Ativo"}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-2">
                          <Link href={`/roles/${item.id}/editar`}>
                            <Button size="sm" className="btn-primary-custom">
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </Link>
                          <Button size="sm" className="btn-primary-custom" onClick={() => remove(item)}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
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
