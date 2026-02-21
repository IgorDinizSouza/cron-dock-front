"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, X, Loader2 } from "lucide-react"
import { especialidadesApi } from "@/lib/api"
import { useNotification } from "@/contexts/notification-context"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface EspecialidadeFormProps {
  especialidadeId?: string
  initialData?: any
  consultorioId?: string | number
}

type FieldErrors = Partial<Record<"nome" | "descricao" | "consultorio", string>>

function getCurrentConsultorioIdLocal(): string | number | null {
  try {
    const fromLs = typeof window !== "undefined" ? localStorage.getItem("consultorioId") : null
    if (fromLs && fromLs !== "undefined") return fromLs
  } catch {}
  return null
}

export function EspecialidadeForm({
  especialidadeId,
  initialData,
  consultorioId: consultorioIdProp,
}: EspecialidadeFormProps) {
  const router = useRouter()
  const { showSuccess, showError } = useNotification()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  const [consultorioId, setConsultorioId] = useState<string | number | null>(consultorioIdProp ?? null)
  useEffect(() => {
    if (consultorioIdProp != null) {
      setConsultorioId(consultorioIdProp)
      return
    }
    const fallback = getCurrentConsultorioIdLocal()
    if (fallback) setConsultorioId(fallback)
  }, [consultorioIdProp])

  const [formData, setFormData] = useState({
    nome: initialData?.nome || "",
    descricao: initialData?.descricao || "",
    ativo: initialData?.ativo ?? true,
  })

  // ---------- validação ----------
  const validateField = (key: keyof FieldErrors, value?: string): string | undefined => {
    const v = (value ?? (key === "consultorio" ? String(consultorioId ?? "") : (formData as any)[key] ?? "")).trim()

    if (key === "consultorio") {
      if (!v) return "Nenhum consultório selecionado. Selecione o consultório atual para continuar."
    }
    if (key === "nome") {
      if (!v) return "Nome da especialidade é obrigatório."
      if (v.length < 3) return "O nome deve ter pelo menos 3 caracteres."
    }
    if (key === "descricao") {
      if (v && v.length < 3) return "A descrição deve ter pelo menos 3 caracteres (ou deixe em branco)."
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
      consultorio: validateField("consultorio"),
      nome: validateField("nome"),
      descricao: validateField("descricao"),
    }
    Object.keys(next).forEach((k) => next[k as keyof FieldErrors] === undefined && delete next[k as keyof FieldErrors])
    setErrors(next)

    const first = Object.values(next)[0]
    if (first) {
      toast({
        title: "Não foi possível salvar",
        description:
          Object.values(next).slice(0, 3).join(" · ") + (Object.keys(next).length > 3 ? " · ..." : ""),
        variant: "destructive",
      })
      return false
    }
    return true
  }

  // ---------- submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAll()) return

    setLoading(true)
    try {
      const payload = {
        ...formData,
        consultorioId:
          typeof consultorioId === "string" ? Number(consultorioId) || consultorioId : consultorioId,
      }

      if (especialidadeId) {
        await especialidadesApi.update(especialidadeId, payload)
        showSuccess("Sucesso", "Especialidade atualizada com sucesso!")
        toast({ title: "Atualizada", description: "Especialidade atualizada com sucesso." })
      } else {
        await especialidadesApi.create(payload)
        showSuccess("Sucesso", "Especialidade cadastrada com sucesso!")
        toast({ title: "Cadastrada", description: "Especialidade cadastrada com sucesso." })
      }

      router.push("/especialidades")
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Erro ao salvar especialidade"
      showError("Erro", msg)
      toast({ title: "Erro", description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field in errors) {
      const msg = validateField(field as keyof FieldErrors, String(value))
      setErrors((prev) => ({ ...prev, [field]: msg }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-serif">Informações da Especialidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(consultorioId == null || consultorioId === "") && (
            <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
              Selecione um consultório para continuar. (Sem <i>consultorioId</i>)
            </div>
          )}

          <div>
            <Label htmlFor="nome">Nome da Especialidade *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              onBlur={(e) => showFieldErrorToast("nome", e.target.value)}
              placeholder="Ex: Ortodontia, Endodontia, Implantodontia..."
              required
              disabled={loading}
              aria-invalid={!!errors.nome}
              className={cn(errors.nome && "border-red-500 focus-visible:ring-red-500")}
            />
            {errors.nome && <p className="text-xs text-red-600 mt-1">{errors.nome}</p>}
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
              onBlur={(e) => showFieldErrorToast("descricao", e.target.value)}
              placeholder="Descreva a especialidade e seus procedimentos..."
              rows={4}
              disabled={loading}
              aria-invalid={!!errors.descricao}
              className={cn(errors.descricao && "border-red-500 focus-visible:ring-red-500")}
            />
            {errors.descricao && <p className="text-xs text-red-600 mt-1">{errors.descricao}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => handleChange("ativo", checked)}
              disabled={loading}
            />
            <Label htmlFor="ativo" className="text-sm">
              Especialidade ativa (disponível para procedimentos e dentistas)
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={() => router.push("/especialidades")} disabled={loading}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" className="dental-primary" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {especialidadeId ? "Atualizar" : "Salvar"} Especialidade
        </Button>
      </div>
    </form>
  )
}
