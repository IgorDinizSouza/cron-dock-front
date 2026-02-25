"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Building, Loader2, Plus, Save, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { filialApi, type FilialResponse } from "@/lib/filial"
import { regionalApi, type RegionalComFiliaisResponse, type RegionalStatus } from "@/lib/regional"

const REGIONAL_DESCRICAO_MAX = 100

type FormState = {
  descricao: string
  status: RegionalStatus
}

type FilialVinculadaRow = {
  vinculoId: string
  filialId: number
  filial?: FilialResponse
  dataCriacao?: string | null
  pendente: boolean
}

export default function EditarRegionalPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const regionalId = params?.id

  const [loadingData, setLoadingData] = useState(true)
  const [savingPage, setSavingPage] = useState(false)
  const [regional, setRegional] = useState<RegionalComFiliaisResponse | null>(null)
  const [filiais, setFiliais] = useState<FilialResponse[]>([])

  const [formData, setFormData] = useState<FormState>({ descricao: "", status: "ATIVO" })
  const [original, setOriginal] = useState<FormState | null>(null)

  const [filialSearch, setFilialSearch] = useState("")
  const [novaFilialId, setNovaFilialId] = useState("")
  const [filiaisPendentesIds, setFiliaisPendentesIds] = useState<number[]>([])

  const load = async () => {
    if (!regionalId) return
    try {
      setLoadingData(true)
      const [regionalRes, filiaisRes] = await Promise.all([
        regionalApi.getByIdComFiliais(regionalId),
        filialApi.listByGrupoEmpresarial(),
      ])

      setRegional(regionalRes)
      setFiliais(filiaisRes)
      setFiliaisPendentesIds([])
      setFilialSearch("")
      setNovaFilialId("")

      const state: FormState = {
        descricao: regionalRes.descricao || "",
        status: regionalRes.status || "ATIVO",
      }
      setFormData(state)
      setOriginal(state)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar a regional.",
        variant: "destructive",
      })
      router.push("/configuracoes/grupos/regionais")
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    void load()
  }, [regionalId])

  const hasChanges = useMemo(
    () => (original ? JSON.stringify(formData) !== JSON.stringify(original) : false),
    [formData, original],
  )

  const filiaisVinculadasIds = useMemo(
    () => new Set((regional?.filiais || []).map((f) => Number(f.filialId))),
    [regional],
  )

  const filiaisDisponiveis = useMemo(
    () =>
      filiais
        .filter((f) => !filiaisVinculadasIds.has(f.id) && !filiaisPendentesIds.includes(f.id))
        .sort((a, b) => a.descricao.localeCompare(b.descricao, "pt-BR")),
    [filiais, filiaisVinculadasIds, filiaisPendentesIds],
  )

  const filiaisBusca = useMemo(() => {
    const q = filialSearch.trim().toLowerCase()
    if (!q) return []
    return filiaisDisponiveis
      .filter((f) => [f.id, f.descricao, f.cnpj, f.uf].join(" ").toLowerCase().includes(q))
      .slice(0, 20)
  }, [filiaisDisponiveis, filialSearch])

  const filiaisVinculadasDetalhadas = useMemo<FilialVinculadaRow[]>(() => {
    const byId = new Map(filiais.map((f) => [f.id, f]))

    const persistidas: FilialVinculadaRow[] = (regional?.filiais || []).map((v) => ({
      vinculoId: String(v.id),
      filialId: Number(v.filialId),
      filial: byId.get(Number(v.filialId)),
      dataCriacao: v.dataCriacao,
      pendente: false,
    }))

    const pendentes: FilialVinculadaRow[] = filiaisPendentesIds.map((filialId) => ({
      vinculoId: `pendente-${filialId}`,
      filialId,
      filial: byId.get(filialId),
      dataCriacao: null,
      pendente: true,
    }))

    return [...persistidas, ...pendentes]
  }, [regional, filiais, filiaisPendentesIds])

  const validateRegional = () => {
    const descricaoTrim = formData.descricao.trim()
    if (!descricaoTrim) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return null
    }
    if (descricaoTrim.length > REGIONAL_DESCRICAO_MAX) {
      toast({
        title: "Erro",
        description: `Descrição deve ter no máximo ${REGIONAL_DESCRICAO_MAX} caracteres.`,
        variant: "destructive",
      })
      return null
    }
    return { descricao: descricaoTrim, status: formData.status }
  }

  const handleAdicionarFilial = () => {
    const filialId = Number(novaFilialId)
    if (!novaFilialId || Number.isNaN(filialId) || filialId <= 0) {
      toast({ title: "Erro", description: "Selecione uma filial válida.", variant: "destructive" })
      return
    }
    if (filiaisVinculadasIds.has(filialId) || filiaisPendentesIds.includes(filialId)) {
      toast({ title: "Erro", description: "Filial já vinculada ou pendente de inclusão.", variant: "destructive" })
      return
    }

    setFiliaisPendentesIds((prev) => [...prev, filialId])
    setNovaFilialId("")
    setFilialSearch("")
  }

  const handleSalvarTudo = async () => {
    if (!regionalId) return
    const payload = validateRegional()
    if (!payload) return

    try {
      setSavingPage(true)

      if (hasChanges) {
        await regionalApi.update(regionalId, payload)
      }

      if (filiaisPendentesIds.length > 0) {
        await Promise.all(filiaisPendentesIds.map((filialId) => regionalApi.addFilial(regionalId, { filialId })))
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

  if (loadingData) return <div className="py-12 text-center text-gray-500">Carregando regional...</div>
  if (!regional) return <div className="py-12 text-center text-gray-500">Regional não encontrada.</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/configuracoes/grupos/regionais">
            <Button size="sm" className="btn-primary-custom">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Visualizar / Editar regional</h1>
              <p className="text-gray-600">Edite os dados da regional e vincule filiais</p>
            </div>
          </div>
        </div>
        <Button
          type="button"
          className="btn-primary-custom"
          onClick={handleSalvarTudo}
          disabled={savingPage || (!hasChanges && filiaisPendentesIds.length === 0)}
        >
          {savingPage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da regional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
                maxLength={REGIONAL_DESCRICAO_MAX}
                className="h-10 border-gray-200 bg-white shadow-sm"
                disabled={savingPage}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((p) => ({ ...p, status: value as RegionalStatus }))}
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
          <CardTitle>Dados das filiais regionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <Label htmlFor="filialSearch">Filial</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="filialSearch"
                    value={filialSearch}
                    onChange={(e) => {
                      setFilialSearch(e.target.value)
                      if (!e.target.value.trim()) setNovaFilialId("")
                    }}
                    placeholder={filiaisDisponiveis.length === 0 ? "Sem filiais disponíveis" : "Pesquisar filial por nome ou ID"}
                    className="h-10 border-orange-200 bg-white pl-9 shadow-sm focus-visible:ring-orange-500"
                    disabled={savingPage || filiaisDisponiveis.length === 0}
                  />
                </div>
              </div>
              <Button type="button" className="btn-primary-custom" onClick={handleAdicionarFilial} disabled={savingPage || !novaFilialId}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar filial
              </Button>
            </div>

            {filialSearch.trim() && filiaisBusca.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white">
                <div className="max-h-52 overflow-y-auto">
                  {filiaisBusca.map((filial) => {
                    const selected = String(filial.id) === novaFilialId
                    return (
                      <button
                        key={filial.id}
                        type="button"
                        onClick={() => {
                          setNovaFilialId(String(filial.id))
                          setFilialSearch(`${filial.id} - ${filial.descricao}`)
                        }}
                        className={`flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                          selected ? "bg-orange-50 text-orange-800" : "hover:bg-gray-50"
                        }`}
                        disabled={savingPage}
                      >
                        <span className="font-medium">{filial.id} - {filial.descricao}</span>
                        <span className="text-xs text-gray-500">{filial.uf || "-"} | {filial.cnpj || "-"}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900">Filiais vinculadas ({filiaisVinculadasDetalhadas.length})</div>
            {filiaisVinculadasDetalhadas.length === 0 ? (
              <div className="py-6 text-center text-gray-500">Nenhuma filial vinculada a esta regional.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-700">
                      <th className="px-3 py-3 font-semibold">Filial</th>
                      <th className="px-3 py-3 font-semibold">CNPJ</th>
                      <th className="px-3 py-3 font-semibold">UF</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filiaisVinculadasDetalhadas.map((row) => (
                      <tr key={`${row.vinculoId}-${row.filialId}`} className="border-b">
                        <td className="px-3 py-3">
                          <div className="font-medium text-gray-900">{row.filial?.descricao || `Filial #${row.filialId}`}</div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span>ID filial: {row.filialId}</span>
                            {row.pendente && (
                              <Badge className="border-orange-200 bg-orange-100 text-orange-800 hover:bg-orange-100">
                                Pendente
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">{row.filial?.cnpj || "-"}</td>
                        <td className="px-3 py-3">{row.filial?.uf || "-"}</td>
                        <td className="px-3 py-3">
                          {row.filial?.status ? (
                            <Badge
                              className={
                                row.filial.status === "INATIVO"
                                  ? "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
                                  : "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                              }
                            >
                              {row.filial.status === "INATIVO" ? "Inativo" : "Ativo"}
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
