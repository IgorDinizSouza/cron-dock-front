"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Search, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { usuariosApi, type UsuarioResponse } from "@/lib/usuarios"

const STATUS_APROVADO = 2 as const
const STATUS_RECUSADO = 3 as const

function formatDateTimeBR(input?: string | number | null): string {
  if (input == null || input === "") return "-"
  const direct = new Date(input)
  if (!Number.isNaN(direct.getTime())) {
    return direct.toLocaleString("pt-BR")
  }

  const normalized = new Date(`${input}Z`)
  return Number.isNaN(normalized.getTime()) ? "-" : normalized.toLocaleString("pt-BR")
}

export default function AprovacaoUsuariosPage() {
  const { toast } = useToast()
  const { user, hasRole, hasPerfil } = useAuth()
  const [items, setItems] = useState<UsuarioResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [emailFilter, setEmailFilter] = useState("")
  const [busyUserId, setBusyUserId] = useState<number | null>(null)

  const aprovadorId = user?.id ?? null
  const podeAprovarUsuarios =
    hasPerfil("ADMINISTRADOR") ||
    hasRole("ADMINISTRADOR") ||
    hasRole("APROVAR_USUARIO") ||
    hasRole("APROVAR USUARIO") ||
    hasRole("ADMIN")

  const load = async () => {
    try {
      setLoading(true)
      const data = await usuariosApi.listPendentesAprovacao()
      setItems(data)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar os usuários pendentes.",
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
    const term = emailFilter.trim().toLowerCase()
    if (!term) return items
    return items.filter((item) => String(item.email || "").toLowerCase().includes(term))
  }, [items, emailFilter])

  const processarAprovacao = async (usuario: UsuarioResponse, status: typeof STATUS_APROVADO | typeof STATUS_RECUSADO) => {
    if (!podeAprovarUsuarios) {
      toast({
        title: "Sem permissao",
        description: "Somente usuarios com role ADMINISTRADOR ou APROVAR_USUARIO podem aprovar/recusar usuarios.",
        variant: "destructive",
      })
      return
    }

    if (!aprovadorId) {
      toast({
        title: "Erro",
        description: "Usuário logado sem identificador para aprovar/recusar.",
        variant: "destructive",
      })
      return
    }

    let motivoRecusa: string | undefined
    if (status === STATUS_RECUSADO) {
      const motivo = window.prompt(`Informe o motivo da recusa para ${usuario.email}:`)
      if (motivo == null) return
      if (!motivo.trim()) {
        toast({
          title: "Motivo obrigatório",
          description: "Informe um motivo para recusar o usuário.",
          variant: "destructive",
        })
        return
      }
      motivoRecusa = motivo.trim()
    } else {
      const ok = window.confirm(`Confirmar aprovação do usuário ${usuario.email}?`)
      if (!ok) return
    }

    try {
      setBusyUserId(usuario.id)
      const resp = await usuariosApi.aprovarOuRecusar(usuario.id, {
        idUsuarioAprovador: aprovadorId,
        idStatusAprovacaoUsuario: status,
        ...(motivoRecusa ? { motivoRecusa } : {}),
      })

      toast({
        title: "Sucesso",
        description:
          resp?.mensagem || (status === STATUS_APROVADO ? "Usuário aprovado com sucesso." : "Usuário recusado com sucesso."),
      })

      setItems((prev) => prev.filter((u) => u.id !== usuario.id))
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível processar a aprovação.",
        variant: "destructive",
      })
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aprovação de usuários</h1>
        <p className="text-gray-600">Usuários com pendencia de aprovação para acesso ao sistema.</p>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Filtros</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                placeholder="Pesquisar por e-mail"
                className="pl-9"
                disabled={loading}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => void load()} disabled={loading} className="btn-primary-custom">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pendentes ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {!aprovadorId && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Não foi possível identificar o usuário aprovador na sessão atual.
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando usuários pendentes...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Nenhum usuário pendente encontrado.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-600">
                    <th className="px-4 py-3 font-medium">Nome</th>
                    <th className="px-4 py-3 font-medium">E-mail</th>
                    <th className="px-4 py-3 font-medium">Grupo</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Criação</th>
                    <th className="px-4 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((usuario) => {
                    const rowBusy = busyUserId === usuario.id
                    return (
                      <tr key={usuario.id} className="border-t">
                        <td className="px-4 py-3 text-gray-900">{usuario.nome || "-"}</td>
                        <td className="px-4 py-3">{usuario.email || "-"}</td>
                        <td className="px-4 py-3">{usuario.grupoEmpresarialDescricao || "-"}</td>
                        <td className="px-4 py-3">{usuario.status || (usuario.ativo ? "ATIVO" : "INATIVO")}</td>
                        <td className="px-4 py-3">{formatDateTimeBR(usuario.dataCriacao ?? usuario.createdAt ?? usuario.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              className="btn-primary-custom"
                              disabled={rowBusy || !aprovadorId || !podeAprovarUsuarios}
                              onClick={() => void processarAprovacao(usuario, STATUS_APROVADO)}
                            >
                              <Check className="mr-1 h-4 w-4" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={rowBusy || !aprovadorId || !podeAprovarUsuarios}
                              onClick={() => void processarAprovacao(usuario, STATUS_RECUSADO)}
                            >
                              <X className="mr-1 h-4 w-4" />
                              Recusar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
