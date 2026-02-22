"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { perfilApi, roleApi, type PerfilResponse, type RoleResponse } from "@/lib/perfil"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Eraser, Plus, Search, Trash2 } from "lucide-react"

function roleNames(perfil: PerfilResponse): string {
  if (!Array.isArray(perfil.roles) || perfil.roles.length === 0) return "-"
  return perfil.roles.map((role) => role.nome).join(", ")
}

export default function PerfisPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<PerfilResponse[]>([])
  const [roles, setRoles] = useState<RoleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [descricaoFilter, setDescricaoFilter] = useState("")
  const [roleFilter, setRoleFilter] = useState("")

  const load = async () => {
    try {
      setLoading(true)
      const response = await perfilApi.list()
      setItems(response.content || [])
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Nao foi possivel carregar os perfis.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    ;(async () => {
      try {
        setRoles(await roleApi.listAll())
      } catch {
        setRoles([])
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const descricao = descricaoFilter.trim().toLowerCase()
    const role = roleFilter.trim().toLowerCase()

    if (!descricao && !role) return items

    return items.filter((item) => {
      const descOk = descricao ? String(item.descricao || "").toLowerCase().includes(descricao) : true
      const roleOk = role
        ? (item.roles || []).some((r) => String(r.nome || "").toLowerCase() === role)
        : true
      return descOk && roleOk
    })
  }, [items, descricaoFilter, roleFilter])

  const remove = async (item: PerfilResponse) => {
    if (!confirm(`Deseja realmente excluir o perfil "${item.descricao}"?`)) return
    try {
      await perfilApi.delete(item.id)
      toast({ title: "Sucesso", description: "Perfil excluido com sucesso." })
      await load()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Nao foi possivel excluir o perfil.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfis</h1>
          <p className="text-gray-600">Gerencie os perfis de acesso</p>
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
                placeholder="Descricao"
                value={descricaoFilter}
                onChange={(e) => setDescricaoFilter(e.target.value)}
                disabled={loading}
              />

              <Select value={roleFilter || "__all__"} onValueChange={(value) => setRoleFilter(value === "__all__" ? "" : value)}>
                <SelectTrigger className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                  <SelectValue placeholder="Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="__all__"
                    className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700"
                  >
                    Todas as roles
                  </SelectItem>
                  {roles.map((role) => (
                    <SelectItem
                      key={role.id}
                      value={role.nome.toLowerCase()}
                      className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700"
                    >
                      {role.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => load()} disabled={loading} className="btn-primary-custom">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
              <Link href="/perfis/novo">
                <Button className="btn-primary-custom">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo perfil
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Filtre por descrição e role.</div>
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
                  <tr className="border-b text-left">
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
                        <Badge variant={item.ativo === false ? "outline" : "secondary"}>
                          {item.ativo === false ? "Inativo" : "Ativo"}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-2">
                          <Link href={`/perfis/${item.id}/editar`}>
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
