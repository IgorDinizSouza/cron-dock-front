"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Plus, Save, Search, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  grupoTransportadoraApi,
  type GrupoTransportadoraComTransportadorasResponse,
  type GrupoTransportadoraStatus,
} from "@/lib/grupo-transportadora"
import { transportadorApi, type TransportadorResponse } from "@/lib/transportador"

const GRUPO_DESCRICAO_MAX = 100

type FormState = {
  descricao: string
  status: GrupoTransportadoraStatus
}

type TransportadoraVinculadaRow = {
  vinculoId: string
  transportadoraId: number
  transportadora?: TransportadorResponse
  dataCriacao?: string | null
  pendente: boolean
}

export default function EditarGrupoTransportadoraPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const grupoId = params?.id

  const [loadingData, setLoadingData] = useState(true)
  const [savingPage, setSavingPage] = useState(false)
  const [grupo, setGrupo] = useState<GrupoTransportadoraComTransportadorasResponse | null>(null)
  const [transportadoras, setTransportadoras] = useState<TransportadorResponse[]>([])

  const [formData, setFormData] = useState<FormState>({ descricao: "", status: "ATIVO" })
  const [original, setOriginal] = useState<FormState | null>(null)

  const [transportadoraSearch, setTransportadoraSearch] = useState("")
  const [novaTransportadoraId, setNovaTransportadoraId] = useState("")
  const [transportadorasPendentesIds, setTransportadorasPendentesIds] = useState<number[]>([])

  const load = async () => {
    if (!grupoId) return
    try {
      setLoadingData(true)
      const grupoRes = await grupoTransportadoraApi.getByIdComTransportadoras(grupoId)
      let transportadorasRes: TransportadorResponse[] = []
      try {
        transportadorasRes = await transportadorApi.listByGrupoEmpresarial()
      } catch {
        transportadorasRes = []
      }

      setGrupo(grupoRes)
      setTransportadoras(transportadorasRes)
      setTransportadorasPendentesIds([])
      setTransportadoraSearch("")
      setNovaTransportadoraId("")

      const state: FormState = {
        descricao: grupoRes.descricao || "",
        status: grupoRes.status || "ATIVO",
      }
      setFormData(state)
      setOriginal(state)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar o grupo de transportadoras.",
        variant: "destructive",
      })
      router.push("/configuracoes/grupos/transportadoras")
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    void load()
  }, [grupoId])

  const hasChanges = useMemo(
    () => (original ? JSON.stringify(formData) !== JSON.stringify(original) : false),
    [formData, original],
  )

  const transportadorasVinculadasIds = useMemo(
    () => new Set((grupo?.transportadoras || []).map((t) => Number(t.transportadoraId))),
    [grupo],
  )

  const transportadorasDisponiveis = useMemo(
    () =>
      transportadoras
        .filter((t) => !transportadorasVinculadasIds.has(t.id) && !transportadorasPendentesIds.includes(t.id))
        .sort((a, b) => a.descricao.localeCompare(b.descricao, "pt-BR")),
    [transportadoras, transportadorasVinculadasIds, transportadorasPendentesIds],
  )

  const transportadorasBusca = useMemo(() => {
    const q = transportadoraSearch.trim().toLowerCase()
    if (!q) return []
    return transportadorasDisponiveis
      .filter((t) => [t.id, t.descricao, t.cnpj].join(" ").toLowerCase().includes(q))
      .slice(0, 20)
  }, [transportadorasDisponiveis, transportadoraSearch])

  const transportadorasVinculadasDetalhadas = useMemo<TransportadoraVinculadaRow[]>(() => {
    const byId = new Map(transportadoras.map((t) => [t.id, t]))

    const persistidas: TransportadoraVinculadaRow[] = (grupo?.transportadoras || []).map((v) => ({
      vinculoId: String(v.id),
      transportadoraId: Number(v.transportadoraId),
      transportadora:
        byId.get(Number(v.transportadoraId)) ||
        (v.transportadora
          ? {
              id: v.transportadora.id,
              descricao: v.transportadora.descricao,
              cnpj: v.transportadora.cnpj,
              status: v.transportadora.status,
              grupoEmpresarialId: Number(v.transportadora.grupoEmpresarialId ?? 1),
              ativo: v.transportadora.status === "ATIVO",
            }
          : undefined),
      dataCriacao: v.dataCriacao,
      pendente: false,
    }))

    const pendentes: TransportadoraVinculadaRow[] = transportadorasPendentesIds.map((transportadoraId) => ({
      vinculoId: `pendente-${transportadoraId}`,
      transportadoraId,
      transportadora: byId.get(transportadoraId),
      dataCriacao: null,
      pendente: true,
    }))

    return [...persistidas, ...pendentes]
  }, [grupo, transportadoras, transportadorasPendentesIds])

  const validateGrupo = () => {
    const descricaoTrim = formData.descricao.trim()
    if (!descricaoTrim) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return null
    }
    if (descricaoTrim.length > GRUPO_DESCRICAO_MAX) {
      toast({
        title: "Erro",
        description: `Descrição deve ter no máximo ${GRUPO_DESCRICAO_MAX} caracteres.`,
        variant: "destructive",
      })
      return null
    }
    return { descricao: descricaoTrim, status: formData.status }
  }

  const handleAdicionarTransportadora = () => {
    const transportadoraId = Number(novaTransportadoraId)
    if (!novaTransportadoraId || Number.isNaN(transportadoraId) || transportadoraId <= 0) {
      toast({ title: "Erro", description: "Selecione uma transportadora válida.", variant: "destructive" })
      return
    }
    if (transportadorasVinculadasIds.has(transportadoraId) || transportadorasPendentesIds.includes(transportadoraId)) {
      toast({
        title: "Erro",
        description: "Transportadora já vinculada ou pendente de inclusão.",
        variant: "destructive",
      })
      return
    }

    setTransportadorasPendentesIds((prev) => [...prev, transportadoraId])
    setNovaTransportadoraId("")
    setTransportadoraSearch("")
  }

  const handleSalvarTudo = async () => {
    if (!grupoId) return
    const payload = validateGrupo()
    if (!payload) return

    try {
      setSavingPage(true)

      if (hasChanges) {
        await grupoTransportadoraApi.update(grupoId, payload)
      }

      if (transportadorasPendentesIds.length > 0) {
        await Promise.all(
          transportadorasPendentesIds.map((transportadoraId) =>
            grupoTransportadoraApi.addTransportadora(grupoId, { transportadoraId }),
          ),
        )
      }

      toast({ title: "Sucesso", description: "Alterações salvas com sucesso." })
      await load()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível salvar as alterações.",
        variant: "destructive",
      })
    } finally {
      setSavingPage(false)
    }
  }

  if (loadingData) return <div className="py-12 text-center text-gray-500">Carregando grupo de transportadoras...</div>
  if (!grupo) return <div className="py-12 text-center text-gray-500">Grupo não encontrado.</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/configuracoes/grupos/transportadoras">
            <Button size="sm" className="btn-primary-custom">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Visualizar / Editar grupo de transportadoras</h1>
              <p className="text-gray-600">Edite os dados do grupo e vincule transportadoras</p>
            </div>
          </div>
        </div>
        <Button
          type="button"
          className="btn-primary-custom"
          onClick={handleSalvarTudo}
          disabled={savingPage || (!hasChanges && transportadorasPendentesIds.length === 0)}
        >
          {savingPage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do grupo de transportadoras</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
                maxLength={GRUPO_DESCRICAO_MAX}
                className="h-10 border-gray-200 bg-white shadow-sm"
                disabled={savingPage}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((p) => ({ ...p, status: value as GrupoTransportadoraStatus }))}
                disabled={savingPage}
              >
                <SelectTrigger id="status" className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">
                    Ativo
                  </SelectItem>
                  <SelectItem value="INATIVO" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">
                    Inativo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados das transportadoras do grupo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <Label htmlFor="transportadoraSearch">Transportadora</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="transportadoraSearch"
                    value={transportadoraSearch}
                    onChange={(e) => {
                      setTransportadoraSearch(e.target.value)
                      if (!e.target.value.trim()) setNovaTransportadoraId("")
                    }}
                    placeholder={
                      transportadorasDisponiveis.length === 0
                        ? "Sem transportadoras disponíveis"
                        : "Pesquisar transportadora por nome, CNPJ ou ID"
                    }
                    className="h-10 border-orange-200 bg-white pl-9 shadow-sm focus-visible:ring-orange-500"
                    disabled={savingPage || transportadorasDisponiveis.length === 0}
                  />
                </div>
              </div>
              <Button
                type="button"
                className="btn-primary-custom"
                onClick={handleAdicionarTransportadora}
                disabled={savingPage || !novaTransportadoraId}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar transportadora
              </Button>
            </div>

            {transportadoraSearch.trim() && transportadorasBusca.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white">
                <div className="max-h-52 overflow-y-auto">
                  {transportadorasBusca.map((transportadora) => {
                    const selected = String(transportadora.id) === novaTransportadoraId
                    return (
                      <button
                        key={transportadora.id}
                        type="button"
                        onClick={() => {
                          setNovaTransportadoraId(String(transportadora.id))
                          setTransportadoraSearch(`${transportadora.id} - ${transportadora.descricao}`)
                        }}
                        className={`flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                          selected ? "bg-orange-50 text-orange-800" : "hover:bg-gray-50"
                        }`}
                        disabled={savingPage}
                      >
                        <span className="font-medium">
                          {transportadora.id} - {transportadora.descricao}
                        </span>
                        <span className="text-xs text-gray-500">{transportadora.cnpj || "-"}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900">
              Transportadoras vinculadas ({transportadorasVinculadasDetalhadas.length})
            </div>
            {transportadorasVinculadasDetalhadas.length === 0 ? (
              <div className="py-6 text-center text-gray-500">Nenhuma transportadora vinculada a este grupo.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-700">
                      <th className="px-3 py-3 font-semibold">Transportadora</th>
                      <th className="px-3 py-3 font-semibold">CNPJ</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transportadorasVinculadasDetalhadas.map((row) => (
                      <tr key={`${row.vinculoId}-${row.transportadoraId}`} className="border-b">
                        <td className="px-3 py-3">
                          <div className="font-medium text-gray-900">
                            {row.transportadora?.descricao || `Transportadora #${row.transportadoraId}`}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span>ID transportadora: {row.transportadoraId}</span>
                            {row.pendente && (
                              <Badge className="border-orange-200 bg-orange-100 text-orange-800 hover:bg-orange-100">
                                Pendente
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">{row.transportadora?.cnpj || "-"}</td>
                        <td className="px-3 py-3">
                          {row.transportadora?.status ? (
                            <Badge
                              className={
                                row.transportadora.status === "INATIVO"
                                  ? "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
                                  : "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                              }
                            >
                              {row.transportadora.status === "INATIVO" ? "Inativo" : "Ativo"}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
