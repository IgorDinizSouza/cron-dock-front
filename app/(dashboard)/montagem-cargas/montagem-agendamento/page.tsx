"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarClock, Edit, Plus, Search, Trash2, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { cargaApi, type CargaResponse } from "@/lib/carga"

const STATUS_CARGA = [
  { id: "1", label: "Solicitada" },
  { id: "2", label: "Agendada" },
  { id: "3", label: "Em andamento" },
  { id: "4", label: "Concluida" },
]

function toDateTimeLocal(value?: string | null): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function toIsoFromLocal(value: string): string {
  if (!value) return ""
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toISOString().slice(0, 19)
}

function formatDateTimeBR(value?: string | null): string {
  if (!value) return "-"
  const d = new Date(value)
  if (!Number.isNaN(d.getTime())) return d.toLocaleString("pt-BR")
  return String(value)
}

export default function MontagemAgendamentoCargaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [cargas, setCargas] = useState<CargaResponse[]>([])

  const loadCargas = async () => {
    try {
      setLoading(true)
      setCargas(await cargaApi.listAll())
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Nao foi possivel carregar as cargas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCargas()
  }, [])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return cargas
    return cargas.filter((item) =>
      [
        item.id,
        item.statusCargaDescricao ?? item.idStatusCarga,
        item.tipoCargaDescricao ?? item.idTipoCarga,
        item.tipoVeiculoDescricao ?? item.idTipoVeiculo,
        item.transportadoraDescricao ?? item.idTransportadora,
        item.especieCargaDescricao ?? item.idEspecieCarga,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
  }, [cargas, searchTerm])

  const statusMap = useMemo(() => new Map(STATUS_CARGA.map((s) => [s.id, s.label])), [])

  const totalizadores = useMemo(() => {
    return {
      totalCargas: cargas.length,
      agendadas: cargas.filter((c) => c.idStatusCarga === 2).length,
      pendentes: cargas.filter((c) => c.idStatusCarga === 1).length,
      hoje: cargas.filter((c) => {
        const d = new Date(c.dataAgendamento)
        if (Number.isNaN(d.getTime())) return false
        const now = new Date()
        return d.toDateString() === now.toDateString()
      }).length,
    }
  }, [cargas])

  const handleDelete = async (id: number) => {
    if (!confirm(`Deseja realmente excluir a carga #${id}?`)) return
    try {
      setDeletingId(id)
      await cargaApi.delete(id)
      toast({ title: "Sucesso", description: "Carga excluida com sucesso." })
      await loadCargas()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Nao foi possivel excluir a carga.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleBuscarCargas = () => {
    setSearchTerm(searchInput.trim())
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-orange-100 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Montagem e agendamento da carga</h1>
            <p className="text-gray-600">Consulte e gerencie as cargas. O cadastro fica na tela de nova carga.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="btn-primary-custom"
              onClick={() => router.push("/montagem-cargas/montagem-agendamento/cadastro")}
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova carga
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-orange-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Total de cargas</p>
              <p className="text-2xl font-bold text-gray-900">{totalizadores.totalCargas}</p>
            </div>
            <Truck className="h-5 w-5 text-orange-500" />
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Agendadas</p>
              <p className="text-2xl font-bold text-gray-900">{totalizadores.agendadas}</p>
            </div>
            <CalendarClock className="h-5 w-5 text-orange-500" />
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{totalizadores.pendentes}</p>
            </div>
            <ClockIcon />
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Para hoje</p>
              <p className="text-2xl font-bold text-gray-900">{totalizadores.hoje}</p>
            </div>
            <TodayIcon />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Cargas cadastradas ({filtered.length})</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por ID, tipo, status, especie ou transportadora"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleBuscarCargas()
                  }
                }}
                className="h-10 border-gray-200 bg-white pl-9 shadow-sm"
                disabled={loading}
              />
            </div>
            <Button onClick={handleBuscarCargas} disabled={loading} className="btn-primary-custom">
              <Search className="mr-2 h-4 w-4" />
              Buscar cargas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando cargas...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Nenhuma carga encontrada.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-600">
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">Agendamento</th>
                    <th className="px-4 py-3 font-medium">Tipo carga</th>
                    <th className="px-4 py-3 font-medium">Tipo veiculo</th>
                    <th className="px-4 py-3 font-medium">Especie</th>
                    <th className="px-4 py-3 font-medium">Transportadora</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3 font-medium text-gray-900">#{item.id}</td>
                      <td className="px-4 py-3">{formatDateTimeBR(item.dataAgendamento)}</td>
                      <td className="px-4 py-3">{item.tipoCargaDescricao || `#${item.idTipoCarga}`}</td>
                      <td className="px-4 py-3">{item.tipoVeiculoDescricao || `#${item.idTipoVeiculo}`}</td>
                      <td className="px-4 py-3">{item.especieCargaDescricao || `#${item.idEspecieCarga}`}</td>
                      <td className="px-4 py-3">{item.transportadoraDescricao || `#${item.idTransportadora}`}</td>
                      <td className="px-4 py-3">{item.statusCargaDescricao || statusMap.get(String(item.idStatusCarga)) || `#${item.idStatusCarga}`}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="btn-primary-custom"
                            disabled={deletingId != null}
                            onClick={() => router.push(`/montagem-cargas/montagem-agendamento/cadastro?cargaId=${item.id}`)}
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deletingId != null}
                            onClick={() => void handleDelete(item.id)}
                          >
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

function ClockIcon() {
  return <div className="h-5 w-5 rounded-full border-2 border-orange-500" aria-hidden="true" />
}

function TodayIcon() {
  return <div className="h-5 w-5 rounded-md bg-orange-500/15" aria-hidden="true" />
}
