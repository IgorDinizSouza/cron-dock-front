"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Calculator, Eye, Printer, Calendar } from "lucide-react"
import { budgetsApi, type Page, consultoriosApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { printBudgetWithPDF } from "../orcamentos/BudgetHistoryPDFDoc"

/** ====> Dispare após criar/atualizar um orçamento para o histórico recarregar */
export const emitBudgetChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("budget:changed"))
  }
}

/** ---- Tipos para dados do consultório (preenchidos automaticamente do back) ---- */
export type ClinicInfo = {
  id?: number
  name: string
  email?: string
  phone?: string
  cep?: string
  estado?: string
  cidade?: string
  bairro?: string
  rua?: string
  numero?: string
  complemento?: string
  address?: string
  logoDataUrl?: string | null
}

type Budget = {
  id: number
  pacienteId: number
  pacienteNome: string
  dataEmissao: string
  status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED"
  valorTotal: number
  observacoes?: string
  itens: Array<{
    id: number
    dente?: string
    procedimentoNome: string
    especialidade?: string
    quantidade: number
    valorUnitario: number
    valorTotal: number
    realizado?: boolean
  }>
}

export function BudgetHistorySection({
  pacienteId,
  patientName,
}: {
  pacienteId: string
  patientName: string
}) {
  const { toast } = useToast()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null)
  const [loadingDetailsId, setLoadingDetailsId] = useState<number | null>(null)

  // ===== clinic info carregada do back =====
  const [clinic, setClinic] = useState<ClinicInfo | null>(null)

  const mapBudget = (b: any): Budget => ({
    id: Number(b.id),
    pacienteId: Number(b.pacienteId ?? 0),
    pacienteNome: b.pacienteNome ?? "",
    dataEmissao: b.criadoEm ?? b.dataEmissao ?? b.data ?? new Date().toISOString(),
    status: (b.status as Budget["status"]) ?? "DRAFT",
    valorTotal: Number(b.total ?? b.valorTotal ?? 0),
    observacoes: b.observacoes ?? undefined,
    itens: Array.isArray(b.itens)
      ? b.itens.map((it: any, idx: number) => ({
          id: Number(it.id ?? idx + 1),
          dente: it.dente ?? it.toothNumber ?? it.tooth ?? undefined,
          procedimentoNome: it.nomeProcedimento ?? it.procedimentoNome ?? "",
          especialidade: it.categoria ?? it.especialidade ?? undefined,
          quantidade: Number(it.quantidade ?? 1),
          valorUnitario: Number(it.precoUnit ?? it.precoUnitario ?? it.valorUnitario ?? 0),
          valorTotal: Number(
            it.totalItem ??
              Number(it.quantidade ?? 1) *
                Number(it.precoUnit ?? it.precoUnitario ?? it.valorUnitario ?? 0) *
                (1 - Number(it.descontoPercent ?? 0) / 100),
          ),
          realizado: Boolean(it.realizado ?? false),
        }))
      : [],
  })

  /** carrega a lista (memoizado) */
  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true)
      const page: Page<any> = await budgetsApi.listByPatient(Number(pacienteId), 0, 50)
      const content = Array.isArray(page?.content) ? page.content : []
      const mapped = content.map(mapBudget)
      // Ordena por dataEmissao desc
      mapped.sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime())
      setBudgets(mapped)
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de orçamentos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [pacienteId, toast])

  /** carregamento inicial */
  useEffect(() => {
    loadBudgets()
  }, [loadBudgets])

  /** carrega dados do consultório + logo uma vez */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const me = await consultoriosApi.me()
        if (!me || cancelled) return

        let logoDataUrl: string | null = null
        try {
          logoDataUrl = await consultoriosApi.getLogoDataUrl(me.id)
        } catch {
          logoDataUrl = null
        }

        const clinicInfo: ClinicInfo = {
          id: me.id,
          name: me.nome ?? "Cron Dock",
          email: me.email ?? undefined,
          phone: me.telefone ?? undefined,
          cep: me.cep ?? undefined,
          estado: me.estado ?? undefined,
          cidade: me.cidade ?? undefined,
          bairro: me.bairro ?? undefined,
          rua: me.rua ?? undefined,
          numero: me.numero ?? undefined,
          complemento: me.complemento ?? undefined,
          address: undefined, // montaremos
          logoDataUrl,
        }
        if (!cancelled) setClinic(clinicInfo)
      } catch (e) {
        // segue sem clinic
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  /** escuta eventos para auto-refresh (criado/concluído, foco da janela, visibilidade) */
  useEffect(() => {
    const onBudgetChanged = () => loadBudgets()
    const onFocus = () => loadBudgets()
    const onVisibility = () => {
      if (document.visibilityState === "visible") loadBudgets()
    }

    window.addEventListener("budget:changed", onBudgetChanged)
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      window.removeEventListener("budget:changed", onBudgetChanged)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [loadBudgets])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800"
      case "SENT":
        return "bg-blue-100 text-blue-800"
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "Rascunho"
      case "SENT":
        return "Enviado"
      case "APPROVED":
        return "Aprovado"
      case "REJECTED":
        return "Rejeitado"
      default:
        return status
    }
  }

  const ensureFullBudget = async (id: number): Promise<Budget | null> => {
    try {
      setLoadingDetailsId(id)
      const full = await budgetsApi.getById(String(id))
      return full ? mapBudget(full) : null
    } catch (e) {
      console.error(e)
      toast({ title: "Erro", description: "Falha ao carregar detalhes do orçamento.", variant: "destructive" })
      return null
    } finally {
      setLoadingDetailsId(null)
    }
  }

  const toggleDetails = async (b: Budget) => {
    if (selectedBudgetId === b.id) {
      setSelectedBudgetId(null)
      return
    }
    if (!b.itens?.length) {
      const full = await ensureFullBudget(b.id)
      if (full) {
        setBudgets((prev) => prev.map((x) => (x.id === b.id ? full : x)))
      }
    }
    setSelectedBudgetId(b.id)
  }

  /** Monta o endereço a partir das partes do clinic */
  const buildAddressLines = (c?: ClinicInfo | null) => {
    if (!c) return { line1: "", line2: "", line3: "" }
    if (c.address && c.address.trim()) {
      return {
        line1: c.address,
        line2: [c.cidade, c.estado].filter(Boolean).join(" - "),
        line3: c.cep ? `CEP: ${c.cep}` : "",
      }
    }
    const line1 = [c.rua, c.numero].filter(Boolean).join(", ")
    const line2 = [c.bairro, c.cidade, c.estado].filter(Boolean).join(" • ")
    const line3 = [c.cep ? `CEP: ${c.cep}` : "", c.complemento].filter(Boolean).join(" • ")
    return { line1, line2, line3 }
  }

  // >>>>>>>>>>>>>>> ALTERAÇÃO: imprime via PDF <<<<<<<<<<<<<<<
  const printBudget = async (b: Budget) => {
    const full = b.itens?.length ? b : (await ensureFullBudget(b.id)) || b
    await printBudgetWithPDF(full, clinic, patientName)
  }

  const updateItemStatus = async (budgetId: number, itemId: number, realizado: boolean) => {
    try {
      await budgetsApi.updateItemStatus(budgetId, itemId, { realizado })
      setBudgets((prev) =>
        prev.map((budget) =>
          budget.id === budgetId
            ? {
                ...budget,
                itens: budget.itens.map((item) => (item.id === itemId ? { ...item, realizado } : item)),
              }
            : budget,
        ),
      )
      toast({
        title: "Sucesso",
        description: `Item marcado como ${realizado ? "realizado" : "não realizado"}`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do item",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">Carregando histórico de orçamentos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {budgets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhum orçamento encontrado para este paciente</div>
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => {
            const isOpen = selectedBudgetId === b.id
            const itemsCount = b.itens?.length ?? 0
            return (
              <Card key={b.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      Orçamento #{b.id}
                      <Badge className={`ml-2 ${getStatusColor(b.status)}`}>{getStatusLabel(b.status)}</Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => printBudget(b)}>
                        <Printer className="h-4 w-4 mr-1" />
                        Imprimir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleDetails(b)}
                        disabled={loadingDetailsId === b.id}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {isOpen ? "Ocultar" : loadingDetailsId === b.id ? "Carregando..." : "Ver Detalhes"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(b.dataEmissao).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calculator className="h-4 w-4" />
                        {itemsCount} item{itemsCount > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="font-semibold text-lg text-cyan-600">
                      R$ {Number(b.valorTotal || 0).toFixed(2)}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-medium mb-3">Itens do Orçamento:</h4>
                      {b.itens?.length ? (
                        <div className="w-full overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-600">
                                <th className="py-2 pr-3 w-16">Feito</th>
                                <th className="py-2 pr-3">Dente</th>
                                <th className="py-2 pr-3">Especialidade</th>
                                <th className="py-2 pr-3">Procedimento</th>
                                <th className="py-2 pr-3 text-right">Qtd</th>
                                <th className="py-2 pr-3 text-right">Valor unit.</th>
                                <th className="py-2 pr-3 text-right">Desconto (R$)</th>
                                <th className="py-2 pr-0 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {b.itens.map((it) => {
                                const qtd = it.quantidade || 1
                                const unit = it.valorUnitario || 0
                                const total = it.valorTotal || unit * qtd
                                const desconto = Math.max(0, unit * qtd - total)
                                return (
                                  <tr key={it.id} className="border-t">
                                    <td className="py-2 pr-3">
                                      <Checkbox
                                        checked={it.realizado || false}
                                        onCheckedChange={(checked) => updateItemStatus(b.id, it.id, Boolean(checked))}
                                      />
                                    </td>
                                    <td className="py-2 pr-3">{it.dente || "-"}</td>
                                    <td className="py-2 pr-3">{it.especialidade || "-"}</td>
                                    <td className="py-2 pr-3">{it.procedimentoNome}</td>
                                    <td className="py-2 pr-3 text-right">{qtd}</td>
                                    <td className="py-2 pr-3 text-right">R$ {Number(unit).toFixed(2)}</td>
                                    <td className="py-2 pr-3 text-right">R$ {Number(desconto).toFixed(2)}</td>
                                    <td className="py-2 pr-0 text-right font-medium">R$ {Number(total).toFixed(2)}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Nenhum item neste orçamento.</div>
                      )}

                      {b.observacoes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <h5 className="font-medium text-blue-900 mb-1">Observações:</h5>
                          <p className="text-blue-800 text-sm">{b.observacoes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
