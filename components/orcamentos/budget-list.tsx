"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Edit, Trash2, Download, Calendar, User, DollarSign, Printer } from "lucide-react"
import { budgetsApi, type Page } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type ClinicInfo = {
  name: string
  address?: string
  phone?: string
}

type BudgetRow = {
  id: string
  patientName: string
  patientEmail: string
  total: number
  status: "draft" | "sent" | "approved" | "rejected"
  createdAt: string
  itemsCount: number
}

const mapStatusToUi = (s?: string): BudgetRow["status"] => {
  switch (s) {
    case "SENT": return "sent"
    case "APPROVED": return "approved"
    case "REJECTED": return "rejected"
    default: return "draft"
  }
}

const mapUiToApi = (s: string | "all" | undefined) => {
  if (!s || s === "all") return undefined
  if (s === "draft") return "DRAFT"
  if (s === "sent") return "SENT"
  if (s === "approved") return "APPROVED"
  if (s === "rejected") return "REJECTED"
  return undefined
}

type Props = {
  pacienteId?: string | number
  pageSize?: number
  clinic?: ClinicInfo
}

export function BudgetList({ pacienteId, pageSize = 10, clinic }: Props) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [rows, setRows] = useState<BudgetRow[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const load = async () => {
    try {
      let res: Page<any>
      if (pacienteId != null && pacienteId !== "") {
        const pid = Number(pacienteId)
        res = await budgetsApi.listByPatient(pid, page, pageSize)
      } else {
        res = await budgetsApi.list(page, pageSize, searchTerm.trim(), mapUiToApi(statusFilter) as any)
      }

      setTotalPages(res?.totalPages ?? 0)

      const mapped: BudgetRow[] = (res?.content ?? [])
        .map((b: any) => ({
          id: String(b.id),
          patientName: b.pacienteNome,
          patientEmail: b.pacienteEmail || "",
          total: Number(b.total ?? b.valorTotal ?? 0),
          status: mapStatusToUi(b.status),
          createdAt: b.criadoEm ? new Date(b.criadoEm).toISOString().slice(0, 10) : "",
          itemsCount: Array.isArray(b.itens) ? b.itens.length : 0,
        }))

      setRows(mapped)
    } catch (e) {
      console.error(e)
      toast({ title: "Erro", description: "Falha ao carregar orçamentos", variant: "destructive" })
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, pacienteId])

  const filteredBudgets = useMemo(() => rows, [rows])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800"
      case "sent": return "bg-blue-100 text-blue-800"
      case "approved": return "bg-green-100 text-green-800"
      case "rejected": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const printBudget = async (id: string) => {
    try {
      const full = await budgetsApi.getById(id)
      const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
      const fmt = (n: number) => BRL.format(isFinite(n) ? n : 0)

      const rowsHtml = (full?.itens ?? []).map((it: any) => {
        const qtd = Number(it.quantidade ?? 1)
        const unit = Number(it.precoUnit ?? it.precoUnitario ?? it.valorUnitario ?? 0)
        const total = Number(it.totalItem ?? unit * qtd * (1 - Number(it.descontoPercent ?? 0) / 100))
        const discountBRL = Math.max(0, unit * qtd - total)
        return `
          <tr>
            <td>${it.dente ?? it.toothNumber ?? "-"}</td>
            <td>${it.categoria ?? it.especialidade ?? "-"}</td>
            <td>${it.procedimentoNome}</td>
            <td class="ctr">${qtd}</td>
            <td class="right">${fmt(unit)}</td>
            <td class="right">${fmt(discountBRL)}</td>
            <td class="right"><strong>${fmt(total)}</strong></td>
          </tr>
        `
      }).join("")

      const clinicBlock =
        clinic && (clinic.name || clinic.address || clinic.phone)
          ? `
        <div class="clinic">
          <div class="clinic-name">${clinic.name || ""}</div>
          ${clinic.address ? `<div>${clinic.address}</div>` : ""}
          ${clinic.phone ? `<div>Telefone: ${clinic.phone}</div>` : ""}
        </div>
      `
          : ""

      const w = window.open("", "_blank")
      if (!w) return
      w.document.write(`
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Orçamento ${full?.id}</title>
            <style>
              @page { margin: 18mm; }
              * { box-sizing: border-box; }
              body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 0; }
              .container { max-width: 900px; margin: 0 auto; padding: 24px; }
              .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; border-bottom: 2px solid #06b6d4; padding-bottom: 16px; }
              .title h1 { margin: 0 0 6px; font-size: 22px; color: #0e7490; letter-spacing: .3px; }
              .meta { margin-top: 4px; font-size: 13px; color: #475569; }
              .clinic { text-align: right; }
              .clinic-name { font-size: 16px; font-weight: 700; color: #0e7490; }
              table { width: 100%; border-collapse: collapse; margin-top: 18px; }
              th, td { border: 1px solid #e5e7eb; padding: 10px; font-size: 12px; }
              th { background: #f1f5f9; text-align: left; color: #334155; }
              .ctr { text-align: center; }
              .right { text-align: right; }
              tfoot td { font-weight: 700; background: #ecfeff; }
              .footer { margin-top: 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="title">
                  <div class="meta">
                    <div><b>Paciente:</b> ${full?.pacienteNome ?? ""}</div>
                    <div><b>Data:</b> ${new Date(full?.criadoEm || Date.now()).toLocaleDateString("pt-BR")}</div>
                    <div><b>Orçamento Nº:</b> ${full?.id ?? ""}</div>
                  </div>
                </div>
                ${clinicBlock}
              </div>

              <table>
                <thead>
                  <tr>
                    <th style="width: 70px;">Dente</th>
                    <th style="width: 180px;">Especialidade</th>
                    <th>Procedimento</th>
                    <th style="width: 60px;" class="ctr">Qtd</th>
                    <th style="width: 120px;" class="right">Valor unitário</th>
                    <th style="width: 120px;" class="right">Desconto (R$)</th>
                    <th style="width: 120px;" class="right">Valor total</th>
                  </tr>
                </thead>
                <tbody>${rowsHtml || `<tr><td colspan="7" class="right">Sem itens</td></tr>`}</tbody>
                <tfoot>
                  <tr>
                    <td colspan="6" class="right">TOTAL GERAL</td>
                    <td class="right"><strong>${fmt(Number(full?.total ?? full?.valorTotal ?? 0))}</strong></td>
                  </tr>
                </tfoot>
              </table>

              <div class="footer">Impresso em ${new Date().toLocaleDateString("pt-BR")}</div>
            </div>
          </body>
        </html>
      `)
      w.document.close()
      w.focus()
      w.print()
    } catch (e) {
      console.error(e)
      toast({ title: "Erro", description: "Não foi possível imprimir o orçamento.", variant: "destructive" })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orçamentos</CardTitle>

        {!(pacienteId != null && pacienteId !== "") && (
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (setPage(0), load())}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => (setStatusFilter(e.target.value), setPage(0))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="draft">Rascunho</option>
              <option value="sent">Enviado</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
            </select>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {filteredBudgets.map((budget) => (
            <div key={budget.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-lg">{budget.patientName}</h3>
                    <Badge className={getStatusColor(budget.status)}>
                      {(budget.status === "draft" && "Rascunho")
                        || (budget.status === "sent" && "Enviado")
                        || (budget.status === "approved" && "Aprovado")
                        || (budget.status === "rejected" && "Rejeitado")
                        || budget.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {budget.patientEmail || "—"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(budget.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      {budget.itemsCount} procedimentos
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-primary mb-2">R$ {budget.total.toFixed(2)}</div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => printBudget(budget.id)}>
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                Anterior
              </Button>
              <div className="text-sm px-2">Página {page + 1} de {totalPages}</div>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page + 1 >= totalPages}>
                Próxima
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
