"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { perfilApi, type PerfilResponse } from "@/lib/perfil"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit, Plus, Search, Trash2 } from "lucide-react"

function roleNames(perfil: PerfilResponse): string {
  if (!Array.isArray(perfil.roles) || perfil.roles.length === 0) return "-"
  return perfil.roles.map((role) => role.nome).join(", ")
}

export default function PerfisPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<PerfilResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const load = async () => {
    try {
      setLoading(true)
      const response = await perfilApi.list()
      setItems(response.content || [])
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar os perfis.",
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
    return items.filter((item) => [item.descricao, roleNames(item)].join(" ").toLowerCase().includes(term))
  }, [items, search])

  const remove = async (item: PerfilResponse) => {
    if (!confirm(`Deseja realmente excluir o perfil "${item.descricao}"?`)) return
    try {
      await perfilApi.delete(item.id)
      toast({ title: "Sucesso", description: "Perfil excluído com sucesso." })
      await load()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível excluir o perfil.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfis</h1>
          <p className="text-gray-600">Gerencie os perfis de acesso</p>
        </div>
        <Link href="/perfis/novo">
          <Button className="dental-primary">
            <Plus className="h-4 w-4 mr-2" />
            Novo perfil
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Buscar por descrição ou role..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfis ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando perfis...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Nenhum perfil encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-3 pr-4">Descrição</th>
                    <th className="py-3 pr-4">Roles</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium">{item.descricao}</td>
                      <td className="py-3 pr-4">{roleNames(item)}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={item.ativo === false ? "outline" : "secondary"}>{item.ativo === false ? "Inativo" : "Ativo"}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-2">
                          <Link href={`/perfis/${item.id}/editar`}>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline" onClick={() => remove(item)} className="text-red-600 hover:bg-red-50">
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

