"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { financeApi, type Page } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type Payment = {
  id: number
  pacienteId?: number
  orcamentoId?: number
  dataPagamento: string
  valor: number
  formaPagamento?: string
  status: "PENDENTE" | "PAGO" | "CANCELADO"
  observacoes?: string
  consultorioId: number
}

export function CashFlow() {
  const { toast } = useToast()
  const [range, setRange] = useState<{ start: string; end: string }>(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const end = new Date().toISOString().slice(0, 10)
    return { start, end }
  })
  const [status, setStatus] = useState<string>("TODOS")
  const [page, setPage] = useState(0)
  const [data, setData] = useState<Page<Payment> | null>(null)

  const load = async () => {
    try {
      const res = await financeApi.getCashflow({ start: range.start, end: range.end, status, page, size: 20 })
      setData(res)
    } catch (e) {
      console.error(e)
      toast({ title: "Erro", description: "Falha ao carregar fluxo de caixa.", variant: "destructive" })
    }
  }

  useEffect(() => { setPage(0) }, [range.start, range.end, status])
  useEffect(() => { load() // eslint-disable-next-line
  }, [page, range.start, range.end, status])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm">Início</label>
            <Input type="date" value={range.start} onChange={(e) => setRange((p) => ({ ...p, start: e.target.value }))}/>
          </div>
          <div>
            <label className="text-sm">Fim</label>
            <Input type="date" value={range.end} onChange={(e) => setRange((p) => ({ ...p, end: e.target.value }))}/>
          </div>
          <div>
            <label className="text-sm">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="PAGO">Pago</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Movimentações</CardTitle></CardHeader>
        <CardContent>
          {!data || data.content.length === 0 ? (
            <div className="text-sm text-gray-500">Sem registros no período.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Data</th>
                    <th className="py-2 pr-4">Valor</th>
                    <th className="py-2 pr-4">Forma</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">PacienteId</th>
                    <th className="py-2">Obs</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{new Date(p.dataPagamento).toLocaleDateString()}</td>
                      <td className="py-2 pr-4 font-semibold">R$ {Number(p.valor).toFixed(2)}</td>
                      <td className="py-2 pr-4">{p.formaPagamento ?? "—"}</td>
                      <td className="py-2 pr-4">{p.status}</td>
                      <td className="py-2 pr-4">{p.pacienteId ?? "—"}</td>
                      <td className="py-2">{p.observacoes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* paginação simples */}
              <div className="flex items-center justify-between mt-4 text-sm">
                <span>
                  Página {data.number + 1} de {data.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    disabled={data.first}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Anterior
                  </button>
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    disabled={data.last}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
