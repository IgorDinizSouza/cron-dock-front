"use client"

import type React from "react"
import { useEffect, useState, KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { dentistasApi, especialidadesApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { formatters } from "@/lib/formatters"

type DentistaFormProps = {
  initialData?: {
    id?: string
    nome?: string
    cro?: string
    telefone?: string
    email?: string
    ativo?: boolean
    especialidades?: string[]
  }
  isEditing?: boolean
}

type Errors = Partial<Record<"nome"|"cro"|"telefone"|"email"|"especialidades", string>>

export function DentistaForm({ initialData, isEditing = false }: DentistaFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const [especialidadesDisponiveis, setEspecialidadesDisponiveis] = useState<string[]>([])
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true)

  const [formData, setFormData] = useState({
    nome: "",
    cro: "",
    telefone: "",
    email: "",
    ativo: true,
  })
  const [errors, setErrors] = useState<Errors>({})

  // --------- carregamento e edição ----------
  useEffect(() => {
    (async () => {
      try {
        setLoadingEspecialidades(true)
        const response = await especialidadesApi.getAll()
        const nomes = response.content?.map((esp: any) => esp.nome) || []
        setEspecialidadesDisponiveis(nomes)
      } catch (error) {
        toast({ title: "Erro", description: "Erro ao carregar especialidades do sistema", variant: "destructive" })
        setEspecialidadesDisponiveis([])
      } finally {
        setLoadingEspecialidades(false)
      }
    })()
  }, [toast])

  useEffect(() => {
    if (!initialData) return
    setFormData({
      nome: initialData.nome ?? "",
      cro: initialData.cro ?? "",
      telefone: initialData.telefone ?? "",
      email: initialData.email ?? "",
      ativo: initialData.ativo ?? true,
    })
    setEspecialidades(initialData.especialidades ?? [])
  }, [initialData])

  // --------- validações ----------
  const croRegex = /^CRO[\s/-]?[A-Z]{2}\s?\d{1,6}$/i

  const validateField = (key: keyof Errors, value?: string): string | undefined => {
    const v = (value ?? (formData as any)[key] ?? "").trim()

    if (key === "nome" && !v) return "Informe o nome do dentista."
    if (key === "telefone") {
      const telDigits = v.replace(/\D/g, "")
      if (telDigits.length < 10 || telDigits.length > 11) return "Telefone inválido. Deve conter 10 ou 11 dígitos."
    }
    if (key === "cro" && !croRegex.test(v)) return "CRO inválido. Use o formato CRO/UF 12345 (ex.: CRO/SP 12345)."
    if (key === "email" && !v.includes("@")) return "Email inválido."
    if (key === "especialidades") {
      if (especialidadesDisponiveis.length > 0 && especialidades.length === 0)
        return "Selecione pelo menos uma especialidade."
    }
    return undefined
  }

  const validateAll = (): boolean => {
    const next: Errors = {
      nome: validateField("nome"),
      telefone: validateField("telefone"),
      cro: validateField("cro"),
      email: validateField("email"),
      especialidades: validateField("especialidades"),
    }
    // remove undefined
    Object.keys(next).forEach((k) => next[k as keyof Errors] === undefined && delete next[k as keyof Errors])
    setErrors(next)

    const firstError = Object.values(next)[0]
    if (firstError) toast({ title: "Validação", description: firstError, variant: "destructive" })
    return !firstError
  }

  const showFieldErrorToast = (key: keyof Errors) => {
    const msg = validateField(key)
    setErrors((prev) => ({ ...prev, [key]: msg }))
    if (msg) toast({ title: "Validação", description: msg, variant: "destructive" })
  }

  // --------- handlers ----------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let formattedValue = value
    if (name === "telefone") formattedValue = formatters.phone(value)
    else if (name === "cro") formattedValue = formatters.cro(value)
    setFormData((prev) => ({ ...prev, [name]: formattedValue }))
  }

  const handleAddEspecialidade = (esp: string) => {
    if (!especialidades.includes(esp)) setEspecialidades((prev) => [...prev, esp])
    // revalida grupo
    setErrors((prev) => ({ ...prev, especialidades: validateField("especialidades") }))
  }
  const handleRemoveEspecialidade = (esp: string) => {
    setEspecialidades((prev) => prev.filter((e) => e !== esp))
    setErrors((prev) => ({ ...prev, especialidades: validateField("especialidades") }))
  }

  const handleSubmit = async () => {
    if (!validateAll()) return

    try {
      setLoading(true)
      const payload = { ...formData, especialidades }
      if (isEditing && initialData?.id) {
        await dentistasApi.update(initialData.id, payload)
        toast({ title: "Sucesso", description: "Dentista atualizado com sucesso" })
      } else {
        await dentistasApi.create(payload)
        toast({ title: "Sucesso", description: "Dentista cadastrado com sucesso" })
      }
      router.push("/dentistas")
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err?.response?.data?.message || (isEditing ? "Erro ao atualizar dentista" : "Erro ao cadastrar dentista"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const onKeyDownMaybeSubmit = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    }
  }

  // --------- UI ----------
  const inputErrorClass = "border-red-500 focus-visible:ring-red-500"

  return (
    <div role="form" className="space-y-6" onKeyDown={onKeyDownMaybeSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">{isEditing ? "Dados do Dentista" : "Dados Pessoais"}</h3>

          <div>
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              onBlur={() => showFieldErrorToast("nome")}
              placeholder="Digite o nome completo"
              required
              aria-invalid={!!errors.nome}
              className={errors.nome ? inputErrorClass : ""}
            />
            {errors.nome && <p className="text-xs text-red-600 mt-1">{errors.nome}</p>}
          </div>

          <div>
            <Label htmlFor="cro">CRO *</Label>
            <Input
              id="cro"
              name="cro"
              value={formData.cro}
              onChange={handleInputChange}
              onBlur={() => showFieldErrorToast("cro")}
              placeholder="Ex: CRO/SP 12345"
              required
              aria-invalid={!!errors.cro}
              className={errors.cro ? inputErrorClass : ""}
            />
            {errors.cro && <p className="text-xs text-red-600 mt-1">{errors.cro}</p>}
          </div>

          <div>
            <Label htmlFor="telefone">Telefone *</Label>
            <Input
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleInputChange}
              onBlur={() => showFieldErrorToast("telefone")}
              placeholder="(11) 99999-9999"
              required
              aria-invalid={!!errors.telefone}
              className={errors.telefone ? inputErrorClass : ""}
            />
            {errors.telefone && <p className="text-xs text-red-600 mt-1">{errors.telefone}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={() => showFieldErrorToast("email")}
              placeholder="dentista@email.com"
              required
              aria-invalid={!!errors.email}
              className={errors.email ? inputErrorClass : ""}
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, ativo: checked }))}
            />
            <Label htmlFor="ativo">Dentista ativo</Label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Especialidades</h3>

          <div>
            <Label>Especialidades Selecionadas</Label>
            <div className={`flex flex-wrap gap-2 mt-2 min-h-[40px] p-2 border rounded-md ${errors.especialidades ? "border-red-500" : ""}`}>
              {especialidades.length === 0 ? (
                <span className="text-gray-500 text-sm">Nenhuma especialidade selecionada</span>
              ) : (
                especialidades.map((esp) => (
                  <Badge key={esp} variant="default" className="bg-cyan-100 text-cyan-800">
                    {esp}
                    <button
                      type="button"
                      onClick={() => handleRemoveEspecialidade(esp)}
                      className="ml-1 hover:bg-cyan-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            {errors.especialidades && <p className="text-xs text-red-600 mt-1">{errors.especialidades}</p>}
          </div>

          <div>
            <Label>Especialidades Disponíveis</Label>
            {loadingEspecialidades ? (
              <div className="flex items-center justify-center p-4 text-gray-500">Carregando especialidades...</div>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {especialidadesDisponiveis
                  .filter((esp) => !especialidades.includes(esp))
                  .map((esp) => (
                    <Badge
                      key={esp}
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleAddEspecialidade(esp)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {esp}
                    </Badge>
                  ))}
                {especialidadesDisponiveis.length === 0 && (
                  <span className="text-gray-500 text-sm">
                    Nenhuma especialidade cadastrada no sistema.
                    <br />
                    Cadastre especialidades primeiro na seção "Especialidades".
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={() => router.push("/dentistas")}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={loading}>
          {loading
            ? isEditing ? "Salvando..." : "Cadastrando..."
            : isEditing ? "Salvar Alterações" : "Salvar Dentista"}
        </Button>
      </div>
    </div>
  )
}
