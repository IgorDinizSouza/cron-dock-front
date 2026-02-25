"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Factory, Loader2, Plus, Save, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { fornecedorApi, type FornecedorResponse } from "@/lib/fornecedor"
import {
  grupoFornecedorApi,
  type GrupoFornecedorComFornecedoresResponse,
  type GrupoFornecedorStatus,
} from "@/lib/grupo-fornecedor"

const GRUPO_DESCRICAO_MAX = 100

type FormState = {
  descricao: string
  status: GrupoFornecedorStatus
}

type FornecedorVinculadoRow = {
  vinculoId: string
  fornecedorId: number
  fornecedor?: FornecedorResponse
  data?: string | null
  pendente: boolean
}

export default function EditarGrupoFornecedorPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const grupoId = params?.id

  const [loadingData, setLoadingData] = useState(true)
  const [savingPage, setSavingPage] = useState(false)
  const [grupo, setGrupo] = useState<GrupoFornecedorComFornecedoresResponse | null>(null)
  const [fornecedores, setFornecedores] = useState<FornecedorResponse[]>([])

  const [formData, setFormData] = useState<FormState>({ descricao: "", status: "ATIVO" })
  const [original, setOriginal] = useState<FormState | null>(null)

  const [fornecedorSearch, setFornecedorSearch] = useState("")
  const [novoFornecedorId, setNovoFornecedorId] = useState("")
  const [fornecedoresPendentesIds, setFornecedoresPendentesIds] = useState<number[]>([])

  const load = async () => {
    if (!grupoId) return
    try {
      setLoadingData(true)
      const [grupoRes, fornecedoresRes] = await Promise.all([
        grupoFornecedorApi.getByIdComFornecedores(grupoId),
        fornecedorApi.listByGrupoEmpresarial(),
      ])

      setGrupo(grupoRes)
      setFornecedores(fornecedoresRes)
      setFornecedoresPendentesIds([])
      setFornecedorSearch("")
      setNovoFornecedorId("")

      const state: FormState = {
        descricao: grupoRes.descricao || "",
        status: grupoRes.status || "ATIVO",
      }
      setFormData(state)
      setOriginal(state)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar o grupo de fornecedores.",
        variant: "destructive",
      })
      router.push("/configuracoes/grupos/fornecedores")
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

  const fornecedoresVinculadosIds = useMemo(
    () => new Set((grupo?.fornecedores || []).map((f) => Number(f.fornecedorId))),
    [grupo],
  )

  const fornecedoresDisponiveis = useMemo(
    () =>
      fornecedores
        .filter((f) => !fornecedoresVinculadosIds.has(f.id) && !fornecedoresPendentesIds.includes(f.id))
        .sort((a, b) => a.razaoSocial.localeCompare(b.razaoSocial, "pt-BR")),
    [fornecedores, fornecedoresVinculadosIds, fornecedoresPendentesIds],
  )

  const fornecedoresBusca = useMemo(() => {
    const q = fornecedorSearch.trim().toLowerCase()
    if (!q) return []
    return fornecedoresDisponiveis
      .filter((f) => [f.id, f.razaoSocial, f.cnpj, f.cidade, f.uf].join(" ").toLowerCase().includes(q))
      .slice(0, 20)
  }, [fornecedoresDisponiveis, fornecedorSearch])

  const fornecedoresVinculadosDetalhados = useMemo<FornecedorVinculadoRow[]>(() => {
    const byId = new Map(fornecedores.map((f) => [f.id, f]))

    const persistidos: FornecedorVinculadoRow[] = (grupo?.fornecedores || []).map((v) => ({
      vinculoId: String(v.id),
      fornecedorId: Number(v.fornecedorId),
      fornecedor: byId.get(Number(v.fornecedorId)),
      data: v.data,
      pendente: false,
    }))

    const pendentes: FornecedorVinculadoRow[] = fornecedoresPendentesIds.map((fornecedorId) => ({
      vinculoId: `pendente-${fornecedorId}`,
      fornecedorId,
      fornecedor: byId.get(fornecedorId),
      data: null,
      pendente: true,
    }))

    return [...persistidos, ...pendentes]
  }, [grupo, fornecedores, fornecedoresPendentesIds])

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

  const handleAdicionarFornecedor = () => {
    const fornecedorId = Number(novoFornecedorId)
    if (!novoFornecedorId || Number.isNaN(fornecedorId) || fornecedorId <= 0) {
      toast({ title: "Erro", description: "Selecione um fornecedor válido.", variant: "destructive" })
      return
    }
    if (fornecedoresVinculadosIds.has(fornecedorId) || fornecedoresPendentesIds.includes(fornecedorId)) {
      toast({ title: "Erro", description: "Fornecedor já vinculado ou pendente de inclusão.", variant: "destructive" })
      return
    }

    setFornecedoresPendentesIds((prev) => [...prev, fornecedorId])
    setNovoFornecedorId("")
    setFornecedorSearch("")
  }

  const handleSalvarTudo = async () => {
    if (!grupoId) return
    const payload = validateGrupo()
    if (!payload) return

    try {
      setSavingPage(true)

      if (hasChanges) {
        await grupoFornecedorApi.update(grupoId, payload)
      }

      if (fornecedoresPendentesIds.length > 0) {
        await Promise.all(
          fornecedoresPendentesIds.map((fornecedorId) => grupoFornecedorApi.addFornecedor(grupoId, { fornecedorId })),
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

  if (loadingData) return <div className="py-12 text-center text-gray-500">Carregando grupo de fornecedores...</div>
  if (!grupo) return <div className="py-12 text-center text-gray-500">Grupo não encontrado.</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/configuracoes/grupos/fornecedores">
            <Button size="sm" className="btn-primary-custom">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
              <Factory className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Visualizar / Editar grupo de fornecedores</h1>
              <p className="text-gray-600">Edite os dados do grupo e vincule fornecedores</p>
            </div>
          </div>
        </div>
        <Button
          type="button"
          className="btn-primary-custom"
          onClick={handleSalvarTudo}
          disabled={savingPage || (!hasChanges && fornecedoresPendentesIds.length === 0)}
        >
          {savingPage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do grupo de fornecedores</CardTitle>
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
                onValueChange={(value) => setFormData((p) => ({ ...p, status: value as GrupoFornecedorStatus }))}
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
          <CardTitle>Dados dos fornecedores do grupo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <Label htmlFor="fornecedorSearch">Fornecedor</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="fornecedorSearch"
                    value={fornecedorSearch}
                    onChange={(e) => {
                      setFornecedorSearch(e.target.value)
                      if (!e.target.value.trim()) setNovoFornecedorId("")
                    }}
                    placeholder={
                      fornecedoresDisponiveis.length === 0
                        ? "Sem fornecedores disponíveis"
                        : "Pesquisar fornecedor por nome, CNPJ ou ID"
                    }
                    className="h-10 border-orange-200 bg-white pl-9 shadow-sm focus-visible:ring-orange-500"
                    disabled={savingPage || fornecedoresDisponiveis.length === 0}
                  />
                </div>
              </div>
              <Button
                type="button"
                className="btn-primary-custom"
                onClick={handleAdicionarFornecedor}
                disabled={savingPage || !novoFornecedorId}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar fornecedor
              </Button>
            </div>

            {fornecedorSearch.trim() && fornecedoresBusca.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white">
                <div className="max-h-52 overflow-y-auto">
                  {fornecedoresBusca.map((fornecedor) => {
                    const selected = String(fornecedor.id) === novoFornecedorId
                    return (
                      <button
                        key={fornecedor.id}
                        type="button"
                        onClick={() => {
                          setNovoFornecedorId(String(fornecedor.id))
                          setFornecedorSearch(`${fornecedor.id} - ${fornecedor.razaoSocial}`)
                        }}
                        className={`flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                          selected ? "bg-orange-50 text-orange-800" : "hover:bg-gray-50"
                        }`}
                        disabled={savingPage}
                      >
                        <span className="font-medium">
                          {fornecedor.id} - {fornecedor.razaoSocial}
                        </span>
                        <span className="text-xs text-gray-500">
                          {fornecedor.uf || "-"} | {fornecedor.cidade || "-"} | {fornecedor.cnpj || "-"}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900">
              Fornecedores vinculados ({fornecedoresVinculadosDetalhados.length})
            </div>
            {fornecedoresVinculadosDetalhados.length === 0 ? (
              <div className="py-6 text-center text-gray-500">Nenhum fornecedor vinculado a este grupo.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-700">
                      <th className="px-3 py-3 font-semibold">Fornecedor</th>
                      <th className="px-3 py-3 font-semibold">CNPJ</th>
                      <th className="px-3 py-3 font-semibold">Cidade</th>
                      <th className="px-3 py-3 font-semibold">UF</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fornecedoresVinculadosDetalhados.map((row) => (
                      <tr key={`${row.vinculoId}-${row.fornecedorId}`} className="border-b">
                        <td className="px-3 py-3">
                          <div className="font-medium text-gray-900">
                            {row.fornecedor?.razaoSocial || `Fornecedor #${row.fornecedorId}`}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span>ID fornecedor: {row.fornecedorId}</span>
                            {row.pendente && (
                              <Badge className="border-orange-200 bg-orange-100 text-orange-800 hover:bg-orange-100">
                                Pendente
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">{row.fornecedor?.cnpj || "-"}</td>
                        <td className="px-3 py-3">{row.fornecedor?.cidade || "-"}</td>
                        <td className="px-3 py-3">{row.fornecedor?.uf || "-"}</td>
                        <td className="px-3 py-3">
                          {row.fornecedor?.status ? (
                            <Badge
                              className={
                                row.fornecedor.status === "INATIVO"
                                  ? "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
                                  : "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                              }
                            >
                              {row.fornecedor.status === "INATIVO" ? "Inativo" : "Ativo"}
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

