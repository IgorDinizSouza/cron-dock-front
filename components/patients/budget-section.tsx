"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Save, FileText, Percent } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatters } from "@/lib/formatters"

type BudgetItem = {
  id: string
  dente?: number
  procedimento: string
  especialidade: string
  quantidade: number
  preco: number
  total: number
  realizado: boolean
}

type Budget = {
  id?: string
  pacienteId: string
  itens: BudgetItem[]
  desconto: number
  descontoTipo: "valor" | "percentual"
  observacoes: string
  validade: string
  status: "Pendente" | "Aprovado" | "Rejeitado"
  total: number
}

export function BudgetSection({ pacienteId }: { pacienteId: string }) {
  const { toast } = useToast()
  const [budget, setBudget] = useState<Budget>({
    pacienteId,
    itens: [],
    desconto: 0,
    descontoTipo: "valor",
    observacoes: "",
    validade: "",
    status: "Pendente",
    total: 0,
  })
  const [loading, setLoading] = useState(false)

  const addItem = () => {
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      procedimento: "",
      especialidade: "",
      quantidade: 1,
      preco: 0,
      total: 0,
      realizado: false,
    }
    setBudget((prev) => ({
      ...prev,
      itens: [...prev.itens, newItem],
    }))
  }

  const updateItem = (id: string, updates: Partial<BudgetItem>) => {
    setBudget((prev) => ({
      ...prev,
      itens: prev.itens.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates }
          updated.total = updated.quantidade * updated.preco
          return updated
        }
        return item
      }),
    }))
  }

  const removeItem = (id: string) => {
    setBudget((prev) => ({
      ...prev,
      itens: prev.itens.filter((item) => item.id !== id),
    }))
  }

  const calculateTotal = () => {
    const subtotal = budget.itens.reduce((sum, item) => sum + item.total, 0)
    let descontoValor = budget.desconto

    if (budget.descontoTipo === "percentual") {
      descontoValor = (subtotal * budget.desconto) / 100
    }

    const total = Math.max(0, subtotal - descontoValor)
    setBudget((prev) => ({ ...prev, total }))
  }

  useEffect(() => {
    calculateTotal()
  }, [budget.itens, budget.desconto])

  const saveBudget = async () => {
    try {
      setLoading(true)
      // Aqui você faria a chamada para a API
      // await budgetApi.save(budget)
      toast({ title: "Sucesso", description: "Orçamento salvo com sucesso!" })
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao salvar orçamento", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Orçamento</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
          <Button onClick={saveBudget} disabled={loading} className="dental-primary" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens do Orçamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {budget.itens.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
              <div className="col-span-1 flex flex-col items-center">
                <Label className="text-xs mb-2">Feito</Label>
                <Checkbox
                  checked={item.realizado}
                  onCheckedChange={(checked) => updateItem(item.id, { realizado: !!checked })}
                  className="mt-1"
                />
              </div>
              <div className="col-span-1">
                <Label className="text-xs">Dente</Label>
                <Input
                  type="number"
                  value={item.dente || ""}
                  onChange={(e) => updateItem(item.id, { dente: Number.parseInt(e.target.value) || undefined })}
                  placeholder="11"
                  className="text-sm"
                />
              </div>
              <div className="col-span-3">
                <Label className="text-xs">Procedimento</Label>
                <Input
                  value={item.procedimento}
                  onChange={(e) => updateItem(item.id, { procedimento: e.target.value })}
                  placeholder="Nome do procedimento"
                  className="text-sm"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Especialidade</Label>
                <Select
                  value={item.especialidade}
                  onValueChange={(value) => updateItem(item.id, { especialidade: value })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Clínica Geral">Clínica Geral</SelectItem>
                    <SelectItem value="Ortodontia">Ortodontia</SelectItem>
                    <SelectItem value="Endodontia">Endodontia</SelectItem>
                    <SelectItem value="Periodontia">Periodontia</SelectItem>
                    <SelectItem value="Implantodontia">Implantodontia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Label className="text-xs">Qtd</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantidade}
                  onChange={(e) => updateItem(item.id, { quantidade: Number.parseInt(e.target.value) || 1 })}
                  className="text-sm"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Preço Unit.</Label>
                <Input
                  type="text"
                  value={formatters.formatCurrencyInput(item.preco)}
                  onChange={(e) => {
                    const numericValue = formatters.parseCurrencyInput(e.target.value)
                    updateItem(item.id, { preco: numericValue })
                  }}
                  placeholder="R$ 0,00"
                  className="text-sm"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Total</Label>
                <div className="text-sm font-medium p-2 bg-gray-50 rounded border">
                  {formatters.currency(item.total)}
                </div>
              </div>
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addItem} className="w-full bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <Label>Tipo de Desconto</Label>
              <Select
                value={budget.descontoTipo}
                onValueChange={(value: "valor" | "percentual") =>
                  setBudget((prev) => ({ ...prev, descontoTipo: value, desconto: 0 }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valor">Valor (R$)</SelectItem>
                  <SelectItem value="percentual">Percentual (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Desconto {budget.descontoTipo === "percentual" ? "(%)" : "(R$)"}</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={
                    budget.descontoTipo === "percentual"
                      ? budget.desconto.toString()
                      : formatters.formatCurrencyInput(budget.desconto)
                  }
                  onChange={(e) => {
                    const value =
                      budget.descontoTipo === "percentual"
                        ? Math.min(100, Math.max(0, Number.parseFloat(e.target.value) || 0))
                        : formatters.parseCurrencyInput(e.target.value)
                    setBudget((prev) => ({ ...prev, desconto: value }))
                  }}
                  placeholder={budget.descontoTipo === "percentual" ? "0" : "R$ 0,00"}
                />
                {budget.descontoTipo === "percentual" && (
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
            <div>
              <Label>Validade</Label>
              <Input
                type="date"
                value={budget.validade}
                onChange={(e) => setBudget((prev) => ({ ...prev, validade: e.target.value }))}
              />
            </div>
            <div className="col-span-3">
              <Label>Observações</Label>
              <Textarea
                value={budget.observacoes}
                onChange={(e) => setBudget((prev) => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações do orçamento..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Badge variant={budget.status === "Aprovado" ? "default" : "secondary"}>{budget.status}</Badge>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                Subtotal: {formatters.currency(budget.itens.reduce((sum, item) => sum + item.total, 0))}
              </div>
              <div className="text-sm text-gray-600">
                Desconto:{" "}
                {budget.descontoTipo === "percentual"
                  ? `${budget.desconto}% (${formatters.currency((budget.itens.reduce((sum, item) => sum + item.total, 0) * budget.desconto) / 100)})`
                  : formatters.currency(budget.desconto)}
              </div>
              <div className="text-lg font-bold">Total: {formatters.currency(budget.total)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
