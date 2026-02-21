"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { usuariosApi, type UsuarioResponse } from "@/lib/usuarios"
import { Edit, Plus, Search, Trash2, UserCheck, UserX } from "lucide-react"

function formatDateBR(input?: string | number | null): string {
  if (input == null || input === "") return "-"
  const d = new Date(input)
  if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("pt-BR")
  const d2 = new Date(`${input}Z`)
  return Number.isNaN(d2.getTime()) ? "-" : d2.toLocaleDateString("pt-BR")
}

function getPerfilLabel(user: UsuarioResponse): string {
  if (typeof user.perfil === "string" && user.perfil.trim()) return user.perfil
  if (user.perfil && typeof user.perfil === "object" && user.perfil.descricao) return user.perfil.descricao
  if (user.perfilDescricao) return user.perfilDescricao
  return "Sem perfil"
}

export default function UsuariosPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<UsuarioResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const load = async () => {
    try {
      setLoading(true)
      const response = await usuariosApi.list()
      setItems(response.content || [])
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar os usuários.",
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
    return items.filter((user) => {
      return [user.nome, user.email, getPerfilLabel(user)].join(" ").toLowerCase().includes(term)
    })
  }, [items, search])

  const toggleStatus = async (user: UsuarioResponse) => {
    try {
      await usuariosApi.toggleStatus(user.id, !Boolean(user.ativo))
      toast({
        title: "Sucesso",
        description: !user.ativo ? "Usuário ativado com sucesso." : "Usuário inativado com sucesso.",
      })
      await load()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível alterar o status do usuário.",
        variant: "destructive",
      })
    }
  }

  const remove = async (user: UsuarioResponse) => {
    if (!confirm(`Deseja realmente excluir o usuário "${user.nome}"?`)) return
    try {
      await usuariosApi.delete(user.id)
      toast({ title: "Sucesso", description: "Usuário excluído com sucesso." })
      await load()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível excluir o usuário.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de usuários</h1>
          <p className="text-gray-600">Cadastro, status e manutenção de usuários</p>
        </div>
        <Link href="/usuarios/novo">
          <Button className="dental-primary">
            <Plus className="h-4 w-4 mr-2" />
            Novo usuário
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
            <Input
              className="pl-10"
              placeholder="Buscar por nome, email ou perfil..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando usuários...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Nenhum usuário encontrado.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((user) => {
                const initials = user.nome
                  ?.split(" ")
                  .map((p) => p[0] || "")
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
                return (
                  <div key={user.id} className="flex items-center justify-between gap-4 border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 grid place-items-center font-semibold">
                        {initials || "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{user.nome}</p>
                          <Badge variant="secondary">{getPerfilLabel(user)}</Badge>
                          {!user.ativo && <Badge variant="outline">Inativo</Badge>}
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Criado em {formatDateBR(user.dataCriacao ?? user.createdAt ?? user.created_at)}
                          {user.ultimoLogin || user.lastLogin || user.lastLoginAt
                            ? ` | Ultimo login: ${formatDateBR(user.ultimoLogin ?? user.lastLogin ?? user.lastLoginAt)}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/usuarios/${user.id}/editar`}>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatus(user)}
                        className={user.ativo ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}
                      >
                        {user.ativo ? (
                          <>
                            <UserX className="h-4 w-4 mr-1" />
                            Inativar
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => remove(user)} className="text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

