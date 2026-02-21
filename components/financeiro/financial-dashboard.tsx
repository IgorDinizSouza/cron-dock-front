"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { financeApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type Summary = {
  totalPago: number
  totalPendente: number
  totalCancelado: number
  quantidadePagamentos: number
  recebidoNoPeriodo: number
  porFormaPagamento: Record<string, number>
}

type MonthlyRow = { mes: number; pago: number; pendente: number; quantidade: number }

export function FinancialDashboard() {
  const { toast } = useToast()
  const [range, setRange] = useState<{ start: string; end: string }>(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const end = new Date().toISOString().slice(0, 10)
    return { start, end }
  })
  const [summary, setSummary] = useState<Summary | null>(null)
  const [monthly, setMonthly] = useState<MonthlyRow[]>([])

  const load = async () => {
    try {
      const s = await financeApi.getSummary(range.start, range.end)
      const m = await financeApi.getMonthly(range.start, range.end)
      setSummary(s)
      setMonthly(Array.isArray(m) ? m : [])
    } catch (e) {
      console.error(e)
      toast({ title: "Erro", description: "Falha ao carregar dados financeiros.", variant: "destructive" })
    }
  }

  useEffect(() => { load() // eslint-disable-next-line
  }, [range.start, range.end])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Período</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Início</Label>
            <Input type="date" value={range.start} onChange={(e) => setRange((p) => ({ ...p, start: e.target.value }))} />
          </div>
          <div>
            <Label>Fim</Label>
            <Input type="date" value={range.end} onChange={(e) => setRange((p) => ({ ...p, end: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-200">
          <CardHeader><CardTitle className="text-sm">Total Pago</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">R$ {(summary?.totalPago ?? 0).toFixed(2)}</CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardHeader><CardTitle className="text-sm">Pendente</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">R$ {(summary?.totalPendente ?? 0).toFixed(2)}</CardContent>
        </Card>
        <Card className="border-rose-200">
          <CardHeader><CardTitle className="text-sm">Cancelado</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">R$ {(summary?.totalCancelado ?? 0).toFixed(2)}</CardContent>
        </Card>
        <Card className="border-sky-200">
          <CardHeader><CardTitle className="text-sm">Recebido no Período</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">R$ {(summary?.recebidoNoPeriodo ?? 0).toFixed(2)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Por Forma de Pagamento</CardTitle></CardHeader>
        <CardContent>
          {summary && Object.keys(summary.porFormaPagamento || {}).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(summary.porFormaPagamento).map(([forma, total]) => (
                <div key={forma} className="flex items-center justify-between p-3 rounded-md border">
                  <span className="text-sm">{forma}</span>
                  <span className="font-semibold">R$ {Number(total).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Sem dados no período.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Mensal (Pago x Pendente)</CardTitle></CardHeader>
        <CardContent>
          {monthly.length === 0 ? (
            <div className="text-sm text-gray-500">Sem dados.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[520px] w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Mês</th>
                    <th className="py-2 pr-4">Pago</th>
                    <th className="py-2 pr-4">Pendente</th>
                    <th className="py-2">Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((row) => (
                    <tr key={row.mes} className="border-b last:border-0">
                      <td className="py-2 pr-4">{row.mes.toString().padStart(2, "0")}</td>
                      <td className="py-2 pr-4">R$ {Number(row.pago).toFixed(2)}</td>
                      <td className="py-2 pr-4">R$ {Number(row.pendente).toFixed(2)}</td>
                      <td className="py-2">{row.quantidade}</td>
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
