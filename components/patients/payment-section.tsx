"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, CreditCard, Check, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { paymentsApi } from "@/lib/api"
import { formatters, parseCurrency } from "@/lib/formatters"

type Payment = {
  id: string
  data: string
  valor: number
  formaPagamento: string
  status: "Pendente" | "Pago" | "Cancelado"
  observacoes: string
}

const formaToEnum = (v: string) => {
  switch (v) {
    case "Dinheiro":
      return "DINHEIRO"
    case "Cartão de Débito":
      return "CARTAO_DEBITO"
    case "Cartão de Crédito":
      return "CARTAO_CREDITO"
    case "PIX":
      return "PIX"
    case "Transferência":
      return "TRANSFERENCIA"
    case "Cheque":
      return "CHEQUE"
    default:
      return "OUTRO"
  }
}
const enumToForma = (v?: string) => {
  switch (v) {
    case "DINHEIRO":
      return "Dinheiro"
    case "CARTAO_DEBITO":
      return "Cartão de Débito"
    case "CARTAO_CREDITO":
      return "Cartão de Crédito"
    case "PIX":
      return "PIX"
    case "TRANSFERENCIA":
      return "Transferência"
    case "CHEQUE":
      return "Cheque"
    default:
      return "Outro"
  }
}

const statusToEnum = (s: Payment["status"]) => (s === "Pago" ? "PAGO" : s === "Cancelado" ? "CANCELADO" : "PENDENTE")
const enumToStatus = (s?: string): Payment["status"] =>
  s === "PAGO" ? "Pago" : s === "CANCELADO" ? "Cancelado" : "Pendente"

export function PaymentSection({ pacienteId }: { pacienteId: string }) {
  const { toast } = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [newPayment, setNewPayment] = useState<Partial<Payment>>({
    data: new Date().toISOString().split("T")[0],
    valor: 0,
    formaPagamento: "",
    status: "Pendente",
    observacoes: "",
  })

  const [valorFormatado, setValorFormatado] = useState("")

  // Carrega pagamentos do backend ao montar
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const list = await paymentsApi.listByPatient(pacienteId)
        const mapped: Payment[] = (Array.isArray(list) ? list : []).map((p: any) => ({
          id: String(p.id),
          data: p.data, // yyyy-MM-dd
          valor: Number(p.valor ?? 0),
          formaPagamento: enumToForma(p.formaPagamento),
          status: enumToStatus(p.status),
          observacoes: p.observacoes ?? "",
        }))
        setPayments(mapped)
      } catch (e) {
        toast({ title: "Erro", description: "Não foi possível carregar os pagamentos", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [pacienteId, toast])

  const handleValorChange = (value: string) => {
    const formatted = formatters.currencyInput(value)
    setValorFormatado(formatted)
    const numericValue = parseCurrency(formatted)
    setNewPayment((prev) => ({ ...prev, valor: numericValue }))
  }

  const addPayment = async () => {
    if (!newPayment.valor || !newPayment.formaPagamento) {
      toast({ title: "Erro", description: "Preencha valor e forma de pagamento", variant: "destructive" })
      return
    }

    try {
      setSaving(true)
      const payload = {
        data: newPayment.data || new Date().toISOString().split("T")[0],
        valor: Number(newPayment.valor || 0),
        formaPagamento: formaToEnum(newPayment.formaPagamento!),
        status: statusToEnum(newPayment.status || "Pendente"),
        observacoes: newPayment.observacoes || "",
      }
      const created = await paymentsApi.createForPatient(pacienteId, payload)
      const added: Payment = {
        id: String(created.id),
        data: created.data,
        valor: Number(created.valor ?? payload.valor),
        formaPagamento: enumToForma(created.formaPagamento) || newPayment.formaPagamento!,
        status: enumToStatus(created.status),
        observacoes: created.observacoes ?? payload.observacoes,
      }
      setPayments((prev) => [added, ...prev])
      setNewPayment({
        data: new Date().toISOString().split("T")[0],
        valor: 0,
        formaPagamento: "",
        status: "Pendente",
        observacoes: "",
      })
      setValorFormatado("")
      toast({ title: "Sucesso", description: "Pagamento adicionado!" })
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao salvar pagamento", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const markAsPaid = async (id: string) => {
    try {
      setSaving(true)
      await paymentsApi.updateStatus(pacienteId, id, "PAGO")
      setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: "Pago" } : p)))
      toast({ title: "Sucesso", description: "Pagamento marcado como pago!" })
    } catch {
      toast({ title: "Erro", description: "Não foi possível atualizar o status", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const removePayment = async (id: string) => {
    try {
      setSaving(true)
      await paymentsApi.delete(pacienteId, id)
      setPayments((prev) => prev.filter((p) => p.id !== id))
      toast({ title: "Sucesso", description: "Pagamento removido" })
    } catch {
      toast({ title: "Erro", description: "Não foi possível remover", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const totalPago = useMemo(
    () => payments.filter((p) => p.status === "Pago").reduce((sum, p) => sum + p.valor, 0),
    [payments],
  )
  const totalPendente = useMemo(
    () => payments.filter((p) => p.status === "Pendente").reduce((sum, p) => sum + p.valor, 0),
    [payments],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pagamentos {loading && "— carregando..."}</h3>
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 font-medium">Pago: R$ {totalPago.toFixed(2)}</span>
          <span className="text-orange-600 font-medium">Pendente: R$ {totalPendente.toFixed(2)}</span>
        </div>
      </div>

      {/* Novo Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={newPayment.data}
                onChange={(e) => setNewPayment((prev) => ({ ...prev, data: e.target.value }))}
              />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="text"
                value={valorFormatado}
                onChange={(e) => handleValorChange(e.target.value)}
                placeholder="0,00"
                className="text-right"
              />
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select
                value={newPayment.formaPagamento || ""}
                onValueChange={(value) => setNewPayment((prev) => ({ ...prev, formaPagamento: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={newPayment.status || "Pendente"}
                onValueChange={(value) => setNewPayment((prev) => ({ ...prev, status: value as Payment["status"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label>Observações</Label>
              <Input
                value={newPayment.observacoes || ""}
                onChange={(e) => setNewPayment((prev) => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações sobre o pagamento..."
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addPayment} className="dental-primary w-full" disabled={saving}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pagamentos */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">R$ {payment.valor.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(payment.data).toLocaleDateString()} • {payment.formaPagamento}
                      </div>
                      {payment.observacoes && <div className="text-xs text-gray-500">{payment.observacoes}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={payment.status === "Pago" ? "default" : "secondary"}>{payment.status}</Badge>
                    {payment.status === "Pendente" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsPaid(payment.id)}
                        className="text-green-600 hover:text-green-700"
                        disabled={saving}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Marcar como Pago
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePayment(payment.id)}
                      disabled={saving}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
