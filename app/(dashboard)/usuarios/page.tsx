"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { usuariosApi, type UsuarioResponse } from "@/lib/usuarios"
import { perfilApi, type PerfilResponse } from "@/lib/perfil"
import { Edit, Eraser, Plus, Search, Trash2 } from "lucide-react"

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
  const [perfis, setPerfis] = useState<PerfilResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [nomeFilter, setNomeFilter] = useState("")
  const [emailFilter, setEmailFilter] = useState("")
  const [perfilFilter, setPerfilFilter] = useState("")

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
    ;(async () => {
      try {
        setPerfis(await perfilApi.listAll())
      } catch {
        setPerfis([])
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const nome = nomeFilter.trim().toLowerCase()
    const email = emailFilter.trim().toLowerCase()
    const perfil = perfilFilter.trim().toLowerCase()

    if (!nome && !email && !perfil) return items

    return items.filter((user) => {
      const nomeOk = nome ? String(user.nome || "").toLowerCase().includes(nome) : true
      const emailOk = email ? String(user.email || "").toLowerCase().includes(email) : true
      const perfilOk = perfil ? getPerfilLabel(user).toLowerCase() === perfil : true
      return nomeOk && emailOk && perfilOk
    })
  }, [items, nomeFilter, emailFilter, perfilFilter])

  const remove = async (user: UsuarioResponse) => {
    if (!confirm(`Deseja realmente excluir o usuário "${user.nome}"?`)) return
    if (!confirm("Deseja realmente excluir o registro?")) return

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
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de usuários</h1>
          <p className="text-gray-600">Cadastro, status e manutenção de usuários</p>
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
                placeholder="Nome"
                value={nomeFilter}
                onChange={(e) => setNomeFilter(e.target.value)}
                disabled={loading}
              />
              <Input
                className="h-10 border-gray-200 bg-white pl-3 shadow-sm"
                placeholder="E-mail"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                disabled={loading}
              />
              <Select value={perfilFilter || "__all__"} onValueChange={(value) => setPerfilFilter(value === "__all__" ? "" : value)}>
                <SelectTrigger className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                  <SelectValue placeholder="Perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="__all__"
                    className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700"
                  >
                    Todos os perfis
                  </SelectItem>
                  {perfis.map((perfil) => (
                    <SelectItem
                      key={perfil.id}
                      value={perfil.descricao.toLowerCase()}
                      className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700"
                    >
                      {perfil.descricao}
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
              <Button
                onClick={() => {
                  setNomeFilter("")
                  setEmailFilter("")
                  setPerfilFilter("")
                }}
                disabled={loading}
                className="btn-primary-custom"
              >
                <Eraser className="mr-2 h-4 w-4" />
                Limpar
              </Button>
              <Link href="/usuarios/novo">
                <Button className="btn-primary-custom">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Filtre por nome, e-mail e perfil.</div>
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
                  <div key={user.id} className="flex items-center justify-between gap-4 rounded-lg border p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-cyan-100 font-semibold text-cyan-700">
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
                        <Button size="sm" className="btn-primary-custom">
                          <Edit className="mr-1 h-4 w-4" />
                          Editar
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        className="btn-primary-custom"
                        onClick={() => remove(user)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
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
