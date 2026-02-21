"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, X, Loader2 } from "lucide-react"
import { proceduresApi, especialidadesApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useNotification } from "@/contexts/notification-context"
import { formatters, parseCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"

interface ProcedureFormProps {
  procedureId?: string
  initialData?: any
}

type FieldErrors = Partial<Record<"nome"|"especialidade"|"descricao"|"duracao"|"preco", string>>

export function ProcedureForm({ procedureId, initialData }: ProcedureFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [especialidades, setEspecialidades] = useState<Array<{ id: string; nome: string }>>([])
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true)

  const [formData, setFormData] = useState({
    nome: initialData?.nome || "",
    especialidade: initialData?.especialidade || "",
    descricao: initialData?.descricao || "",
    duracao: initialData?.duracao || "",
    preco: initialData?.preco ? String(initialData.preco) : "",
    materiaisNecessarios: initialData?.materiaisNecessarios?.join(", ") || "",
    instrucoesPre: initialData?.instrucoesPre || "",
    instrucoesPos: initialData?.instrucoesPos || "",
    contraindicacoes: initialData?.contraindicacoes || "",
    ativo: initialData?.ativo ?? true,
  })

  const [errors, setErrors] = useState<FieldErrors>({})

  const [precoFormatado, setPrecoFormatado] = useState(
    initialData?.preco ? formatters.currencyInput(String(initialData.preco * 100)) : "",
  )

  useEffect(() => {
    let cancelled = false
    const loadEspecialidades = async () => {
      try {
        const list = await especialidadesApi.listActive()
        if (!cancelled) setEspecialidades(list || [])
      } catch {
        try {
          const page = await especialidadesApi.getAll(0, 500)
          const arr = Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : []
          const onlyActive = arr.filter((e: any) => e.ativo).map((e: any) => ({ id: String(e.id), nome: e.nome }))
          if (!cancelled) setEspecialidades(onlyActive)
        } catch (e2) {
          console.error("Erro ao carregar especialidades:", e2)
          showNotification("Erro ao carregar especialidades", "error")
        }
      } finally {
        if (!cancelled) setLoadingEspecialidades(false)
      }
    }
    loadEspecialidades()
    return () => { cancelled = true }
  }, [])

  // ---------- validação ----------
  const validateField = (key: keyof FieldErrors, override?: string): string | undefined => {
    const v = (override ?? (formData as any)[key] ?? "").toString().trim()

    if (key === "especialidade" && !v) return "Especialidade é obrigatória."
    if (key === "nome") {
      if (!v) return "Nome do procedimento é obrigatório."
      if (v.length < 3) return "O nome deve ter pelo menos 3 caracteres."
    }
    if (key === "descricao") {
      if (!v) return "Descrição do procedimento é obrigatória."
      if (v.length < 5) return "A descrição deve ter pelo menos 5 caracteres."
    }
    if (key === "duracao") {
      const n = Number(v)
      if (!v) return "Duração é obrigatória."
      if (!Number.isFinite(n) || n <= 0) return "Duração deve ser maior que zero."
    }
    if (key === "preco") {
      const n = Number(v)
      if (!v) return "Preço é obrigatório."
      if (!Number.isFinite(n) || n <= 0) return "Preço deve ser maior que zero."
    }
    return undefined
  }

  const showFieldErrorToast = (key: keyof FieldErrors, override?: string) => {
    const msg = validateField(key, override)
    setErrors((prev) => ({ ...prev, [key]: msg }))
    if (msg) toast({ title: "Validação", description: msg, variant: "destructive" })
  }

  const validateAll = (): boolean => {
    const next: FieldErrors = {
      especialidade: validateField("especialidade"),
      nome: validateField("nome"),
      descricao: validateField("descricao"),
      duracao: validateField("duracao"),
      preco: validateField("preco"),
    }
    Object.keys(next).forEach((k) => next[k as keyof FieldErrors] === undefined && delete next[k as keyof FieldErrors])
    setErrors(next)
    const first = Object.values(next)[0]
    if (first) {
      toast({
        title: "Não foi possível salvar",
        description: Object.values(next).slice(0, 3).join(" · ") + (Object.keys(next).length > 3 ? " · ..." : ""),
        variant: "destructive",
      })
      return false
    }
    return true
  }

  // ---------- handlers ----------
  const handlePrecoChange = (value: string) => {
    const formatted = formatters.currencyInput(value)
    setPrecoFormatado(formatted)
    const numericValue = parseCurrency(formatted) // ex.: "150,00" -> 150
    setFormData((prev) => ({ ...prev, preco: String(numericValue) }))
    // valida em tempo real
    setErrors((prev) => ({ ...prev, preco: validateField("preco", String(numericValue)) }))
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field in errors) {
      // revalida campo que já tinha erro
      const msg = validateField(field as keyof FieldErrors, String(value))
      setErrors((prev) => ({ ...prev, [field]: msg }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAll()) return
    setLoading(true)
    try {
      const consultorioId = localStorage.getItem("consultorioId") || "1"
      const procedureData = {
        ...formData,
        duracao: Number.parseInt(String(formData.duracao || 0), 10),
        preco: Number.parseFloat(String(formData.preco || 0)),
        materiaisNecessarios: String(formData.materiaisNecessarios || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        consultorioId,
      }

      if (procedureId) {
        await proceduresApi.update(procedureId, procedureData)
        toast({ title: "Atualizado", description: "Procedimento atualizado com sucesso." })
        showNotification("Procedimento atualizado com sucesso!", "success")
      } else {
        await proceduresApi.create(procedureData)
        toast({ title: "Cadastrado", description: "Procedimento cadastrado com sucesso." })
        showNotification("Procedimento cadastrado com sucesso!", "success")
      }
      router.push("/procedimentos")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar procedimento"
      toast({ title: "Erro", description: errorMessage, variant: "destructive" })
      showNotification(`Erro: ${errorMessage}`, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Especialidade */}
            <div>
              <Label htmlFor="especialidade">Especialidade *</Label>
              <Select
                value={formData.especialidade}
                onValueChange={(value) => {
                  handleChange("especialidade", value)
                  showFieldErrorToast("especialidade", value)
                }}
              >
                <SelectTrigger
                  id="especialidade"
                  className={cn(errors.especialidade && "border-red-500 focus-visible:ring-red-500")}
                >
                  <SelectValue placeholder={loadingEspecialidades ? "Carregando..." : "Selecione a especialidade"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingEspecialidades ? (
                    <div className="px-2 py-1 text-sm text-muted-foreground">Carregando especialidades...</div>
                  ) : especialidades.length === 0 ? (
                    <div className="px-2 py-1 text-sm text-muted-foreground">Nenhuma especialidade cadastrada</div>
                  ) : (
                    especialidades.map((esp) => (
                      <SelectItem key={esp.id} value={esp.nome}>
                        {esp.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.especialidade && <p className="mt-1 text-xs text-red-600">{errors.especialidade}</p>}
            </div>

            {/* Nome do procedimento */}
            <div>
              <Label htmlFor="nome">Nome do Procedimento *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                onBlur={(e) => showFieldErrorToast("nome", e.target.value)}
                placeholder="Ex: Limpeza Dental"
                required
                disabled={loading}
                className={cn(errors.nome && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome}</p>}
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                onBlur={(e) => showFieldErrorToast("descricao", e.target.value)}
                placeholder="Descreva o procedimento..."
                rows={3}
                required
                disabled={loading}
                className={cn(errors.descricao && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.descricao && <p className="mt-1 text-xs text-red-600">{errors.descricao}</p>}
            </div>

            {/* Duração e Preço */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duracao">Duração (minutos) *</Label>
                <Input
                  id="duracao"
                  type="number"
                  value={formData.duracao}
                  onChange={(e) => handleChange("duracao", e.target.value)}
                  onBlur={(e) => showFieldErrorToast("duracao", e.target.value)}
                  placeholder="60"
                  required
                  disabled={loading}
                  className={cn(errors.duracao && "border-red-500 focus-visible:ring-red-500")}
                />
                {errors.duracao && <p className="mt-1 text-xs text-red-600">{errors.duracao}</p>}
              </div>
              <div>
                <Label htmlFor="preco">Preço (R$) *</Label>
                <Input
                  id="preco"
                  type="text"
                  value={precoFormatado}
                  onChange={(e) => handlePrecoChange(e.target.value)}
                  onBlur={() => showFieldErrorToast("preco", formData.preco)}
                  placeholder="0,00"
                  className={cn("text-right", errors.preco && "border-red-500 focus-visible:ring-red-500")}
                  required
                  disabled={loading}
                />
                {errors.preco && <p className="mt-1 text-xs text-red-600">{errors.preco}</p>}
              </div>
            </div>

            {/* Materiais */}
            <div>
              <Label htmlFor="materiaisNecessarios">Materiais Necessários</Label>
              <Textarea
                id="materiaisNecessarios"
                value={formData.materiaisNecessarios}
                onChange={(e) => handleChange("materiaisNecessarios", e.target.value)}
                placeholder="Separe os materiais por vírgula..."
                rows={3}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Instruções e Cuidados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Instruções e Cuidados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="instrucoesPre">Instruções Pré-Procedimento</Label>
              <Textarea
                id="instrucoesPre"
                value={formData.instrucoesPre}
                onChange={(e) => handleChange("instrucoesPre", e.target.value)}
                placeholder="Instruções para o paciente antes do procedimento..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="instrucoesPos">Cuidados Pós-Procedimento</Label>
              <Textarea
                id="instrucoesPos"
                value={formData.instrucoesPos}
                onChange={(e) => handleChange("instrucoesPos", e.target.value)}
                placeholder="Instruções para o paciente após o procedimento..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="contraindicacoes">Contraindicações</Label>
              <Textarea
                id="contraindicacoes"
                value={formData.contraindicacoes}
                onChange={(e) => handleChange("contraindicacoes", e.target.value)}
                placeholder="Situações em que o procedimento não deve ser realizado..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => handleChange("ativo", e.target.checked)}
                className="rounded border-gray-300"
                disabled={loading}
              />
              <Label htmlFor="ativo" className="text-sm">
                Procedimento ativo (disponível para agendamento)
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={() => router.push("/procedimentos")} disabled={loading}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" className="dental-primary" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {procedureId ? "Atualizar" : "Salvar"} Procedimento
        </Button>
      </div>
    </form>
  )
}
