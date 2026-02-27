"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2, Plus, Save, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cargaApi, type CargaProdutoRequest, type CargaRequest } from "@/lib/carga"
import { tipoCargaApi, type TipoCargaResponse } from "@/lib/tipo-carga"
import { tipoVeiculoApi, type TipoVeiculoResponse } from "@/lib/tipoveiculo"
import { transportadorApi, type TransportadorResponse } from "@/lib/transportador"
import { especieCargaApi, type EspecieCargaResponse } from "@/lib/especie-carga"
import { pedidoApi, type PedidoItemResponse } from "@/lib/pedido"

type FormState = {
  idStatusCarga: string
  idTipoCarga: string
  idTipoVeiculo: string
  idTransportadora: string
  idEspecieCarga: string
  dataAgendamento: string
}

type ProdutoCargaRow = {
  key: string
  persistedId?: number
  idProduto: number
  idPedido: number
  produtoDescricao: string
  pedidoDescricao: string
  quantidadeAlocada: string
  quantidadeMaximaPedido: number | null
  data: string
}

const INITIAL_FORM: FormState = {
  idStatusCarga: "1",
  idTipoCarga: "",
  idTipoVeiculo: "",
  idTransportadora: "",
  idEspecieCarga: "",
  dataAgendamento: "",
}

const STATUS_CARGA = [
  { id: "1", label: "Em digitacao" },
  { id: "2", label: "Solicitado" },
  { id: "3", label: "Em andamento" },
  { id: "4", label: "Concluida" },
]

const STATUS_EM_DIGITACAO = 1
const STATUS_SOLICITADO = 2

const itemClass =
  "focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700"

function toDateTimeLocal(value?: string | null): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function nowToDateTimeLocal(): string {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function toIsoFromLocal(value: string): string {
  if (!value) return ""
  const raw = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(raw)) return raw
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return `${raw}:00`

  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  const ss = String(d.getSeconds()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`
}

function formatDateTimeBR(value?: string | null): string {
  if (!value) return "-"
  const d = new Date(value)
  if (!Number.isNaN(d.getTime())) return d.toLocaleString("pt-BR")
  return String(value)
}

function pickQuantidade(item: PedidoItemResponse): number {
  const candidatos = [item.qtdPedida, item.quantidade, item.qtdRecebida]
  for (const c of candidatos) {
    const n = Number(c)
    if (Number.isFinite(n) && n > 0) return n
  }
  return 0
}

export default function CadastroCargaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const cargaIdParam = searchParams.get("cargaId")
  const editingId = useMemo(() => {
    const n = Number(cargaIdParam)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [cargaIdParam])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingProdutoKey, setSavingProdutoKey] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [produtosCarga, setProdutosCarga] = useState<ProdutoCargaRow[]>([])

  const [tiposCarga, setTiposCarga] = useState<TipoCargaResponse[]>([])
  const [tiposVeiculo, setTiposVeiculo] = useState<TipoVeiculoResponse[]>([])
  const [transportadoras, setTransportadoras] = useState<TransportadorResponse[]>([])
  const [especies, setEspecies] = useState<EspecieCargaResponse[]>([])

  const [pedidoDialogOpen, setPedidoDialogOpen] = useState(false)
  const [pedidoBusca, setPedidoBusca] = useState("")
  const [pedidoBuscando, setPedidoBuscando] = useState(false)
  const [pedidoItens, setPedidoItens] = useState<PedidoItemResponse[]>([])
  const [pedidoSelecionadoId, setPedidoSelecionadoId] = useState<number | null>(null)
  const [pedidoSelecionadoLabel, setPedidoSelecionadoLabel] = useState("")
  const [itensSelecionados, setItensSelecionados] = useState<Record<number, boolean>>({})
  const minDataAgendamento = useMemo(() => nowToDateTimeLocal(), [])

  const preencherQuantidadeMaxima = async (rows: ProdutoCargaRow[]): Promise<ProdutoCargaRow[]> => {
    const pedidoIds = Array.from(new Set(rows.map((r) => r.idPedido).filter((id) => Number.isFinite(id) && id > 0)))
    if (pedidoIds.length === 0) return rows

    const resultados = await Promise.allSettled(pedidoIds.map((id) => pedidoApi.getByNumeroPedido(id)))
    const itensPorPedido = new Map<number, PedidoItemResponse[]>()
    resultados.forEach((res, idx) => {
      if (res.status === "fulfilled") {
        const pedidoId = pedidoIds[idx]
        itensPorPedido.set(pedidoId, Array.isArray(res.value?.itens) ? res.value.itens : [])
      }
    })

    return rows.map((row) => {
      if (row.quantidadeMaximaPedido != null && Number.isFinite(row.quantidadeMaximaPedido)) return row
      const itens = itensPorPedido.get(row.idPedido) || []
      const itemMatch = itens.find((it) => Number(it.produtoId) === row.idProduto)
      return {
        ...row,
        quantidadeMaximaPedido: itemMatch ? pickQuantidade(itemMatch) : null,
      }
    })
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [tiposCargaRes, tiposVeiculoRes, transportadorasRes, especiesRes] = await Promise.allSettled([
          tipoCargaApi.listAll(),
          tipoVeiculoApi.listAll(),
          transportadorApi.listByGrupoEmpresarial(),
          especieCargaApi.listAll(),
        ])

        setTiposCarga(tiposCargaRes.status === "fulfilled" ? tiposCargaRes.value : [])
        setTiposVeiculo(tiposVeiculoRes.status === "fulfilled" ? tiposVeiculoRes.value : [])
        setTransportadoras(transportadorasRes.status === "fulfilled" ? transportadorasRes.value : [])
        setEspecies(especiesRes.status === "fulfilled" ? especiesRes.value : [])

        if (editingId) {
          const [carga, itens] = await Promise.all([cargaApi.getById(editingId), cargaApi.listProdutos(editingId)])
          setForm({
            idStatusCarga: String(carga.idStatusCarga || "1"),
            idTipoCarga: String(carga.idTipoCarga || ""),
            idTipoVeiculo: String(carga.idTipoVeiculo || ""),
            idTransportadora: String(carga.idTransportadora || ""),
            idEspecieCarga: String(carga.idEspecieCarga || ""),
            dataAgendamento: toDateTimeLocal(carga.dataAgendamento),
          })
          setProdutosCarga(
            await preencherQuantidadeMaxima(
              itens.map((item) => ({
              key: `persisted-${item.id}`,
              persistedId: item.id,
              idProduto: item.idProduto,
              idPedido: item.idPedido,
              produtoDescricao: item.produtoDescricao || `#${item.idProduto}`,
              pedidoDescricao: item.pedidoDescricao || `#${item.idPedido}`,
              quantidadeAlocada: String(item.quantidadeAlocada ?? ""),
              quantidadeMaximaPedido: null,
              data: item.data || "",
              })),
            ),
          )
        } else {
          setProdutosCarga([])
        }
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Nao foi possivel carregar os dados do cadastro de carga.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [editingId, toast])

  const validateCarga = (): boolean => {
    if (!form.dataAgendamento) {
      toast({ title: "Erro", description: "Data desejada de agendamento e obrigatoria.", variant: "destructive" })
      return false
    }
    if (!form.idTipoCarga || !form.idTipoVeiculo || !form.idTransportadora || !form.idEspecieCarga || !form.idStatusCarga) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatorios da carga.", variant: "destructive" })
      return false
    }

    const dataSelecionada = new Date(form.dataAgendamento)
    if (Number.isNaN(dataSelecionada.getTime())) {
      toast({ title: "Erro", description: "Data desejada de agendamento invalida.", variant: "destructive" })
      return false
    }
    if (dataSelecionada.getTime() < Date.now()) {
      toast({
        title: "Erro",
        description: "Nao e permitido agendar para uma data/hora menor que a data/hora atual.",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const buscarPedido = async () => {
    const termo = pedidoBusca.trim()
    if (!termo) {
      toast({ title: "Erro", description: "Digite um numero de pedido para buscar.", variant: "destructive" })
      return
    }
    try {
      setPedidoBuscando(true)
      const detalhe = await pedidoApi.getByNumeroPedido(termo)
      setPedidoSelecionadoId(Number(detalhe.id))
      setPedidoSelecionadoLabel(String(detalhe.pedido || detalhe.id))
      const itensValidos = (detalhe.itens || []).filter((item) => Number(item.produtoId) > 0)
      setPedidoItens(itensValidos)
      setItensSelecionados({})
      if (itensValidos.length === 0) {
        toast({ title: "Atencao", description: "Pedido encontrado, mas sem itens com produto valido.", variant: "destructive" })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Nao foi possivel buscar o pedido.",
        variant: "destructive",
      })
      setPedidoItens([])
      setPedidoSelecionadoId(null)
      setPedidoSelecionadoLabel("")
    } finally {
      setPedidoBuscando(false)
    }
  }

  const adicionarProdutosSelecionados = () => {
    if (!pedidoSelecionadoId) {
      toast({ title: "Erro", description: "Busque um pedido antes de adicionar produtos.", variant: "destructive" })
      return
    }
    const selecionados = pedidoItens.filter((item) => itensSelecionados[item.id])
    if (selecionados.length === 0) {
      toast({ title: "Erro", description: "Selecione ao menos um produto.", variant: "destructive" })
      return
    }

    setProdutosCarga((prev) => {
      const next = [...prev]
      for (const item of selecionados) {
        const idProduto = Number(item.produtoId)
        const idPedido = Number(pedidoSelecionadoId)
        const existente = next.find((row) => row.idProduto === idProduto && row.idPedido === idPedido)
        if (existente) continue
        next.push({
          key: `draft-${idPedido}-${idProduto}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          idProduto,
          idPedido,
          produtoDescricao: String(item.produto || item.descricao || `#${idProduto}`),
          pedidoDescricao: pedidoSelecionadoLabel || String(idPedido),
          quantidadeAlocada: String(pickQuantidade(item) || ""),
          quantidadeMaximaPedido: pickQuantidade(item) || null,
          data: toIsoFromLocal(form.dataAgendamento || nowToDateTimeLocal()),
        })
      }
      return next
    })

    setPedidoDialogOpen(false)
    setPedidoBusca("")
    setPedidoItens([])
    setPedidoSelecionadoId(null)
    setPedidoSelecionadoLabel("")
    setItensSelecionados({})
  }

  const removerProdutoRow = async (row: ProdutoCargaRow) => {
    if (!confirm("Deseja remover este produto da carga?")) return
    if (row.persistedId && editingId) {
      try {
        setSavingProdutoKey(row.key)
        await cargaApi.deleteProduto(editingId, row.persistedId)
        setProdutosCarga((prev) => prev.filter((p) => p.key !== row.key))
        toast({ title: "Sucesso", description: "Produto removido da carga." })
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Nao foi possivel remover o produto da carga.",
          variant: "destructive",
        })
      } finally {
        setSavingProdutoKey(null)
      }
      return
    }
    setProdutosCarga((prev) => prev.filter((p) => p.key !== row.key))
  }

  const salvarCarga = async () => {
    if (!validateCarga()) return
    const payload: CargaRequest = {
      idStatusCarga: Number(form.idStatusCarga),
      idTipoCarga: Number(form.idTipoCarga),
      idTipoVeiculo: Number(form.idTipoVeiculo),
      idTransportadora: Number(form.idTransportadora),
      idEspecieCarga: Number(form.idEspecieCarga),
      dataAgendamento: toIsoFromLocal(form.dataAgendamento),
    }

    try {
      setSaving(true)
      let cargaId = editingId
      const isCriacao = !cargaId
      const statusBase = isCriacao ? STATUS_EM_DIGITACAO : Number(form.idStatusCarga)
      if (cargaId) {
        await cargaApi.update(cargaId, { ...payload, idStatusCarga: statusBase })
      } else {
        const created = await cargaApi.create({ ...payload, idStatusCarga: statusBase })
        cargaId = created.id
      }

      if (!cargaId) throw new Error("Nao foi possivel identificar a carga para salvar os itens.")

      const ops: Promise<any>[] = []
      for (const row of produtosCarga) {
        const req: CargaProdutoRequest = {
          idProduto: row.idProduto,
          idPedido: row.idPedido,
          quantidadeAlocada: Number(row.quantidadeAlocada),
          data: toIsoFromLocal(row.data || form.dataAgendamento),
        }
        if (!Number.isFinite(req.quantidadeAlocada) || req.quantidadeAlocada <= 0) {
          throw new Error(`Quantidade alocada invalida para o produto ${row.produtoDescricao}.`)
        }
        if (
          row.quantidadeMaximaPedido != null &&
          Number.isFinite(row.quantidadeMaximaPedido) &&
          req.quantidadeAlocada > row.quantidadeMaximaPedido
        ) {
          throw new Error(
            `Quantidade alocada do produto ${row.produtoDescricao} nao pode ser maior que a quantidade do pedido (${row.quantidadeMaximaPedido}).`,
          )
        }
        if (row.persistedId) {
          ops.push(cargaApi.updateProduto(cargaId, row.persistedId, req))
        } else {
          ops.push(cargaApi.addProduto(cargaId, req))
        }
      }

      if (ops.length > 0) await Promise.all(ops)

      if (cargaId) {
        const itensAtualizados = await cargaApi.listProdutos(cargaId)
        setProdutosCarga(
          await preencherQuantidadeMaxima(
            itensAtualizados.map((item) => ({
              key: `persisted-${item.id}`,
              persistedId: item.id,
              idProduto: item.idProduto,
              idPedido: item.idPedido,
              produtoDescricao: item.produtoDescricao || `#${item.idProduto}`,
              pedidoDescricao: item.pedidoDescricao || `#${item.idPedido}`,
              quantidadeAlocada: String(item.quantidadeAlocada ?? ""),
              quantidadeMaximaPedido: null,
              data: item.data || "",
            })),
          ),
        )
      }

      if (isCriacao && cargaId) {
        const solicitarAprovacao = window.confirm("Deseja solicitar aprovação da carga?")
        if (solicitarAprovacao) {
          await cargaApi.update(cargaId, { ...payload, idStatusCarga: STATUS_SOLICITADO })
          toast({ title: "Sucesso", description: "Carga criada e solicitada para aprovacao." })
        } else {
          toast({ title: "Sucesso", description: "Carga criada em status Em digitacao." })
        }
      } else {
        toast({ title: "Sucesso", description: "Carga salva com sucesso." })
      }

      router.push(`/montagem-cargas/montagem-agendamento/cadastro?cargaId=${cargaId}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Nao foi possivel salvar a carga.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/montagem-cargas/montagem-agendamento">
            <Button className="btn-primary-custom" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{editingId ? `Editar carga #${editingId}` : "Cadastro de carga"}</h1>
            <p className="text-gray-600">Monte a carga e inclua os itens antes de salvar.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da carga</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Carregando dados...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="max-w-xs">
                  <Label htmlFor="dataAgendamento">Data desejada de agendamento *</Label>
                  <Input
                    id="dataAgendamento"
                    type="datetime-local"
                    value={form.dataAgendamento}
                    onChange={(e) => setForm((prev) => ({ ...prev, dataAgendamento: e.target.value }))}
                    min={minDataAgendamento}
                    className="h-10 border-gray-200 bg-white shadow-sm"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="idStatusCarga">Status da carga *</Label>
                  <Select
                    value={form.idStatusCarga}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, idStatusCarga: value }))}
                    disabled={saving || !editingId}
                  >
                    <SelectTrigger id="idStatusCarga" className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_CARGA.map((status) => (
                        <SelectItem key={status.id} value={status.id} className={itemClass}>
                          {status.id} - {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <Label htmlFor="idTipoCarga">Tipo de carga *</Label>
                  <Select value={form.idTipoCarga} onValueChange={(value) => setForm((prev) => ({ ...prev, idTipoCarga: value }))} disabled={saving}>
                    <SelectTrigger id="idTipoCarga" className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                      <SelectValue placeholder="Selecione o tipo de carga" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposCarga.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)} className={itemClass}>
                          {item.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="idTipoVeiculo">Tipo de veiculo *</Label>
                  <Select value={form.idTipoVeiculo} onValueChange={(value) => setForm((prev) => ({ ...prev, idTipoVeiculo: value }))} disabled={saving}>
                    <SelectTrigger id="idTipoVeiculo" className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                      <SelectValue placeholder="Selecione o tipo de veiculo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposVeiculo.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)} className={itemClass}>
                          {item.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <Label htmlFor="idEspecieCarga">Especie de carga *</Label>
                  <Select value={form.idEspecieCarga} onValueChange={(value) => setForm((prev) => ({ ...prev, idEspecieCarga: value }))} disabled={saving}>
                    <SelectTrigger id="idEspecieCarga" className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                      <SelectValue placeholder="Selecione a especie da carga" />
                    </SelectTrigger>
                    <SelectContent>
                      {especies.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)} className={itemClass}>
                          {item.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="idTransportadora">Transportador *</Label>
                  <Select value={form.idTransportadora} onValueChange={(value) => setForm((prev) => ({ ...prev, idTransportadora: value }))} disabled={saving}>
                    <SelectTrigger id="idTransportadora" className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                      <SelectValue placeholder="Selecione o transportador" />
                    </SelectTrigger>
                    <SelectContent>
                      {transportadoras.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)} className={itemClass}>
                          {item.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Itens da carga</CardTitle>
          <Button className="btn-primary-custom" onClick={() => setPedidoDialogOpen(true)} disabled={saving || loading}>
            <Search className="mr-2 h-4 w-4" />
            Buscar pedidos
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Pedido</th>
                  <th className="px-4 py-3 font-medium">Qtd. pedido</th>
                  <th className="px-4 py-3 font-medium">Quantidade alocada</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {produtosCarga.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Nenhum item adicionado.
                    </td>
                  </tr>
                ) : (
                  produtosCarga.map((row) => (
                    <tr key={row.key} className="border-t">
                      <td className="px-4 py-3">{row.produtoDescricao}</td>
                      <td className="px-4 py-3">{row.pedidoDescricao}</td>
                      <td className="px-4 py-3">{row.quantidadeMaximaPedido ?? "-"}</td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          step="0.000001"
                          min={0}
                          max={row.quantidadeMaximaPedido ?? undefined}
                          value={row.quantidadeAlocada}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === "") {
                              setProdutosCarga((prev) => prev.map((p) => (p.key === row.key ? { ...p, quantidadeAlocada: value } : p)))
                              return
                            }
                            const n = Number(value)
                            if (!Number.isFinite(n)) return
                            if (n < 0) return
                            if (row.quantidadeMaximaPedido != null && n > row.quantidadeMaximaPedido) return
                            setProdutosCarga((prev) => prev.map((p) => (p.key === row.key ? { ...p, quantidadeAlocada: value } : p)))
                          }}
                          onBlur={() => {
                            const n = Number(row.quantidadeAlocada)
                            if (!Number.isFinite(n)) return
                            if (n < 0) {
                              setProdutosCarga((prev) => prev.map((p) => (p.key === row.key ? { ...p, quantidadeAlocada: "0" } : p)))
                              toast({
                                title: "Erro",
                                description: "Nao e permitido informar quantidade alocada negativa.",
                                variant: "destructive",
                              })
                              return
                            }
                            if (row.quantidadeMaximaPedido != null && n > row.quantidadeMaximaPedido) {
                              setProdutosCarga((prev) =>
                                prev.map((p) =>
                                  p.key === row.key ? { ...p, quantidadeAlocada: String(row.quantidadeMaximaPedido) } : p,
                                ),
                              )
                              toast({
                                title: "Erro",
                                description: `Quantidade alocada nao pode ser maior que a quantidade do pedido (${row.quantidadeMaximaPedido}).`,
                                variant: "destructive",
                              })
                            }
                          }}
                          className="h-9 w-44 border-gray-200 bg-white shadow-sm"
                          disabled={savingProdutoKey === row.key || saving}
                        />
                      </td>
                      <td className="px-4 py-3">{formatDateTimeBR(row.data)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={savingProdutoKey === row.key || saving}
                            onClick={() => void removerProdutoRow(row)}
                          >
                            {savingProdutoKey === row.key ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                            Remover
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href="/montagem-cargas/montagem-agendamento">
          <Button type="button" className="btn-primary-custom" disabled={saving}>
            Cancelar
          </Button>
        </Link>
        <Button className="btn-primary-custom" onClick={() => void salvarCarga()} disabled={saving || loading}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar carga
        </Button>
      </div>

      <Dialog open={pedidoDialogOpen} onOpenChange={setPedidoDialogOpen}>
        <DialogContent className="w-[72vw] !max-w-[72vw] h-[95vh] p-0">
          <div className="flex h-full min-h-0 flex-col gap-4 p-6">
            <DialogHeader>
              <DialogTitle>Buscar pedidos</DialogTitle>
              <DialogDescription>Digite o numero do pedido para listar produtos e quantidades.</DialogDescription>
            </DialogHeader>

            <div className="flex gap-2">
              <Input
                value={pedidoBusca}
                onChange={(e) => setPedidoBusca(e.target.value)}
                placeholder="Digite o numero do pedido"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    void buscarPedido()
                  }
                }}
                className="h-10 border-gray-200 bg-white shadow-sm"
              />
              <Button className="btn-primary-custom" onClick={() => void buscarPedido()} disabled={pedidoBuscando}>
                {pedidoBuscando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Buscar
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="text-left text-gray-600">
                    <th className="px-4 py-3 font-medium">Selecionar</th>
                    <th className="px-4 py-3 font-medium">Produto</th>
                    <th className="px-4 py-3 font-medium">Qtd. pedido</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidoItens.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        Busque um pedido para listar os produtos.
                      </td>
                    </tr>
                  ) : (
                    pedidoItens.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={Boolean(itensSelecionados[item.id])}
                            onCheckedChange={(checked) =>
                              setItensSelecionados((prev) => ({ ...prev, [item.id]: checked === true }))
                            }
                            className="size-5 border-2 border-orange-400 bg-white shadow-sm data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white"
                          />
                        </td>
                        <td className="px-4 py-3">{String(item.produto || item.descricao || `#${item.produtoId || "-"}`)}</td>
                        <td className="px-4 py-3">{pickQuantidade(item)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <DialogFooter>
              <Button type="button" className="btn-primary-custom" onClick={() => setPedidoDialogOpen(false)}>
                Fechar
              </Button>
              <Button type="button" className="btn-primary-custom" onClick={adicionarProdutosSelecionados}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar produtos na carga
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
