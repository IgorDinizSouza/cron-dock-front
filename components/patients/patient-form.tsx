"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, X, Loader2 } from "lucide-react"
import { patientsApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { formatters, validators } from "@/lib/formatters"
import { cn } from "@/lib/utils"

interface PatientFormProps {
  patientId?: string
  initialData?: any
}

type YesNo = boolean | null

type FieldErrors = Partial<
  Record<
    | "nome"
    | "cpf"
    | "email"
    | "telefone"
    | "dataNascimento"
    | "endereco"
    | "cep"
    | "numero"
    | "profissao"
    | "comoNosConheceu"
    | "historicoMedico"
    | "alergias"
    | "medicamentos"
    | "observacoes"
    | "anm_observacoes",
    string
  >
>

export function PatientForm({ patientId, initialData }: PatientFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formErrors, setFormErrors] = useState<FieldErrors>({})

  const [formData, setFormData] = useState({
    nome: initialData?.nome || "",
    cpf: initialData?.cpf || "",
    email: initialData?.email || "",
    telefone: initialData?.telefone || "",
    dataNascimento: initialData?.dataNascimento || "",
    endereco: initialData?.endereco || "",
    cep: initialData?.cep || "",
    numero: initialData?.numero || "",
    profissao: initialData?.profissao || "",
    comoNosConheceu: initialData?.comoNosConheceu || "",
    historicoMedico: initialData?.historicoMedico || "",
    alergias: initialData?.alergias || "",
    medicamentos: initialData?.medicamentos || "",
    observacoes: initialData?.observacoes || "",
    anm_diabetes: (initialData?.anm_diabetes ?? null) as YesNo,
    anm_hipertensao: (initialData?.anm_hipertensao ?? null) as YesNo,
    anm_cardiopatia: (initialData?.anm_cardiopatia ?? null) as YesNo,
    anm_cirurgiaRecente: (initialData?.anm_cirurgiaRecente ?? null) as YesNo,
    anm_anticoagulante: (initialData?.anm_anticoagulante ?? null) as YesNo,
    anm_gravidez: (initialData?.anm_gravidez ?? null) as YesNo,
    anm_alergiaMedicacao: (initialData?.anm_alergiaMedicacao ?? null) as YesNo,
    anm_asma: (initialData?.anm_asma ?? null) as YesNo,
    anm_epilepsia: (initialData?.anm_epilepsia ?? null) as YesNo,
    anm_fumante: (initialData?.anm_fumante ?? null) as YesNo,
    anm_alcool: (initialData?.anm_alcool ?? null) as YesNo,
    anm_observacoes: initialData?.anm_observacoes || "",
  })

  const comoNosConheceuOptions = [
    "Indicação de amigo/familiar",
    "Redes sociais (Instagram, Facebook, etc.)",
    "Google/Internet",
    "Plano de saúde/Convênio",
    "Passou na frente da clínica",
    "Panfleto/Propaganda",
    "Jornal/Revista",
    "Rádio/TV",
    "Evento/Feira",
    "Outro profissional da saúde",
    "Já era paciente",
    "Outros",
  ]

  const handleChange = (field: string, value: string) => {
    let formattedValue = value
    if (field === "cpf") formattedValue = formatters.cpf(value)
    if (field === "telefone") formattedValue = formatters.phone(value)
    if (field === "cep")
      formattedValue = formatters.cep ? formatters.cep(value) : value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2")

    setFormData((prev) => ({ ...prev, [field]: formattedValue }))
    setFormErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const setYesNo = (field: keyof typeof formData, value: YesNo) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const scrollToFirstError = (errs: FieldErrors) => {
    const firstKey = Object.keys(errs)[0] as keyof FieldErrors | undefined
    if (!firstKey) return
    const el = document.getElementById(firstKey as string)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  /** valida UM campo e retorna a mensagem (ou undefined) */
  const validateField = (key: keyof FieldErrors, override?: string): string | undefined => {
    const v = (override ?? (formData as any)[key] ?? "").toString().trim()

    if (key === "nome") {
      if (!v) return "Informe o nome completo."
      if (v.length < 3) return "O nome deve ter pelo menos 3 caracteres."
    }

    if (key === "cpf") {
      if (!v) return "Informe o CPF."
      if (!validators.cpf(v)) return "CPF inválido. Revise os dígitos."
    }

    if (key === "telefone") {
      if (!v) return "Informe o telefone."
      if (!validators.phone(v)) return "Telefone inválido. Deve conter 10 ou 11 dígitos."
    }

    if (key === "dataNascimento") {
      if (!v) return "Informe a data de nascimento."
      const d = new Date(v)
      const hoje = new Date()
      if (isNaN(d.getTime())) return "Data inválida."
      if (d > hoje) return "A data de nascimento não pode ser futura."
    }

    if (key === "email" && v) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      if (!emailOk) return "E-mail inválido."
    }

    if (key === "cep" && v) {
      const cepOk = /^\d{5}-?\d{3}$/.test(v)
      if (!cepOk) return "CEP inválido. Use o formato 00000-000."
    }

    return undefined
  }

  /** valida TODOS os campos críticos e mostra toast agregado */
  const validateAll = (): boolean => {
    const errs: FieldErrors = {
      nome: validateField("nome"),
      cpf: validateField("cpf"),
      telefone: validateField("telefone"),
      dataNascimento: validateField("dataNascimento"),
      email: validateField("email"),
      cep: validateField("cep"),
    }

    // remove undefined
    Object.keys(errs).forEach((k) => errs[k as keyof FieldErrors] === undefined && delete errs[k as keyof FieldErrors])
    setFormErrors(errs)

    if (Object.keys(errs).length > 0) {
      toast({
        title: "Não foi possível salvar",
        description:
          "Revise os campos: " +
          Object.values(errs).slice(0, 3).join(" · ") +
          (Object.keys(errs).length > 3 ? " · ..." : ""),
        variant: "destructive",
      })
      scrollToFirstError(errs)
      return false
    }
    return true
  }

  /** dispara toast imediato do campo no onBlur */
  const showFieldErrorToast = (key: keyof FieldErrors) => {
    const msg = validateField(key)
    setFormErrors((prev) => ({ ...prev, [key]: msg }))
    if (msg) toast({ title: "Validação", description: msg, variant: "destructive" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAll()) return

    setLoading(true)
    try {
      const consultorioId = localStorage.getItem("consultorioId") || "1"
      const patientData = { ...formData, consultorioId }

      if (patientId) {
        await patientsApi.update(patientId, patientData)
        toast({ title: "Sucesso!", description: "Paciente atualizado com sucesso." })
      } else {
        await patientsApi.create(patientData)
        toast({ title: "Sucesso!", description: "Paciente cadastrado com sucesso." })
      }
      router.push("/pacientes")
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Não foi possível salvar o paciente. Tente novamente."
      toast({
        title: "Erro ao salvar",
        description: msg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const quickQs: Array<{ key: keyof typeof formData; label: string }> = [
    { key: "anm_diabetes", label: "Diabetes" },
    { key: "anm_hipertensao", label: "Hipertensão" },
    { key: "anm_cardiopatia", label: "Cardiopatia" },
    { key: "anm_cirurgiaRecente", label: "Cirurgia recente" },
    { key: "anm_anticoagulante", label: "Uso de anticoagulante" },
    { key: "anm_gravidez", label: "Gravidez" },
    { key: "anm_alergiaMedicacao", label: "Alergia a medicação" },
    { key: "anm_asma", label: "Asma" },
    { key: "anm_epilepsia", label: "Epilepsia" },
    { key: "anm_fumante", label: "Fumante" },
    { key: "anm_alcool", label: "Consumo de álcool" },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nome */}
            <div>
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                onBlur={() => showFieldErrorToast("nome")}
                placeholder="Digite o nome completo"
                required
                disabled={loading}
                aria-invalid={!!formErrors.nome}
                aria-describedby={formErrors.nome ? "nome-error" : undefined}
                className={cn(formErrors.nome && "border-red-500 focus-visible:ring-red-500")}
              />
              {formErrors.nome && (
                <p id="nome-error" className="mt-1 text-xs text-red-600">
                  {formErrors.nome}
                </p>
              )}
            </div>

            {/* CPF + Telefone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleChange("cpf", e.target.value)}
                  onBlur={() => showFieldErrorToast("cpf")}
                  placeholder="000.000.000-00"
                  required
                  disabled={loading}
                  aria-invalid={!!formErrors.cpf}
                  aria-describedby={formErrors.cpf ? "cpf-error" : undefined}
                  className={cn(formErrors.cpf && "border-red-500 focus-visible:ring-red-500")}
                />
                {formErrors.cpf && (
                  <p id="cpf-error" className="mt-1 text-xs text-red-600">
                    {formErrors.cpf}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleChange("telefone", e.target.value)}
                  onBlur={() => showFieldErrorToast("telefone")}
                  placeholder="(11) 99999-9999"
                  required
                  disabled={loading}
                  aria-invalid={!!formErrors.telefone}
                  aria-describedby={formErrors.telefone ? "telefone-error" : undefined}
                  className={cn(formErrors.telefone && "border-red-500 focus-visible:ring-red-500")}
                />
                {formErrors.telefone && (
                  <p id="telefone-error" className="mt-1 text-xs text-red-600">
                    {formErrors.telefone}
                  </p>
                )}
              </div>
            </div>

            {/* Data Nasc + Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => handleChange("dataNascimento", e.target.value)}
                  onBlur={() => showFieldErrorToast("dataNascimento")}
                  required
                  disabled={loading}
                  aria-invalid={!!formErrors.dataNascimento}
                  aria-describedby={formErrors.dataNascimento ? "dataNascimento-error" : undefined}
                  className={cn(formErrors.dataNascimento && "border-red-500 focus-visible:ring-red-500")}
                />
                {formErrors.dataNascimento && (
                  <p id="dataNascimento-error" className="mt-1 text-xs text-red-600">
                    {formErrors.dataNascimento}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => showFieldErrorToast("email")}
                  placeholder="email@exemplo.com"
                  disabled={loading}
                  aria-invalid={!!formErrors.email}
                  aria-describedby={formErrors.email ? "email-error" : undefined}
                  className={cn(formErrors.email && "border-red-500 focus-visible:ring-red-500")}
                />
                {formErrors.email && (
                  <p id="email-error" className="mt-1 text-xs text-red-600">
                    {formErrors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Profissão + Como nos conheceu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profissao">Profissão</Label>
                <Input
                  id="profissao"
                  value={formData.profissao}
                  onChange={(e) => handleChange("profissao", e.target.value)}
                  placeholder="Ex: Engenheiro, Professor, Estudante"
                  disabled={loading}
                  aria-invalid={!!formErrors.profissao}
                  aria-describedby={formErrors.profissao ? "profissao-error" : undefined}
                  className={cn(formErrors.profissao && "border-red-500 focus-visible:ring-red-500")}
                />
                {formErrors.profissao && (
                  <p id="profissao-error" className="mt-1 text-xs text-red-600">
                    {formErrors.profissao}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="comoNosConheceu">Como nos conheceu?</Label>
                <Select
                  value={formData.comoNosConheceu}
                  onValueChange={(value) => handleChange("comoNosConheceu", value)}
                >
                  <SelectTrigger id="comoNosConheceu">
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    {comoNosConheceuOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.comoNosConheceu && (
                  <p id="comoNosConheceu-error" className="mt-1 text-xs text-red-600">
                    {formErrors.comoNosConheceu}
                  </p>
                )}
              </div>
            </div>

            {/* Endereço + Número + CEP */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleChange("endereco", e.target.value)}
                  placeholder="Rua, bairro, cidade"
                  disabled={loading}
                  aria-invalid={!!formErrors.endereco}
                  aria-describedby={formErrors.endereco ? "endereco-error" : undefined}
                  className={cn(formErrors.endereco && "border-red-500 focus-visible:ring-red-500")}
                />
                {formErrors.endereco && (
                  <p id="endereco-error" className="mt-1 text-xs text-red-600">
                    {formErrors.endereco}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleChange("numero", e.target.value)}
                  placeholder="123"
                  disabled={loading}
                  aria-invalid={!!formErrors.numero}
                  aria-describedby={formErrors.numero ? "numero-error" : undefined}
                  className={cn(formErrors.numero && "border-red-500 focus-visible:ring-red-500")}
                />
                {formErrors.numero && (
                  <p id="numero-error" className="mt-1 text-xs text-red-600">
                    {formErrors.numero}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => handleChange("cep", e.target.value)}
                onBlur={() => showFieldErrorToast("cep")}
                placeholder="00000-000"
                disabled={loading}
                aria-invalid={!!formErrors.cep}
                aria-describedby={formErrors.cep ? "cep-error" : undefined}
                className={cn(formErrors.cep && "border-red-500 focus-visible:ring-red-500")}
              />
              {formErrors.cep && (
                <p id="cep-error" className="mt-1 text-xs text-red-600">
                  {formErrors.cep}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Histórico + Anamnese rápida */}
        <div className="space-y-6">
          {/* Histórico Médico/Odontológico */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Histórico Médico e Odontológico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="historicoMedico">Histórico Médico</Label>
                <Textarea
                  id="historicoMedico"
                  value={formData.historicoMedico}
                  onChange={(e) => handleChange("historicoMedico", e.target.value)}
                  placeholder="Descreva o histórico médico do paciente..."
                  rows={3}
                  disabled={loading}
                  aria-invalid={!!formErrors.historicoMedico}
                  aria-describedby={formErrors.historicoMedico ? "historicoMedico-error" : undefined}
                  className={cn(formErrors.historicoMedico && "border-red-500 focus-visible:ring-red-500")}
                />
                {formErrors.historicoMedico && (
                  <p id="historicoMedico-error" className="mt-1 text-xs text-red-600">
                    {formErrors.historicoMedico}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="alergias">Alergias</Label>
                <Textarea
                  id="alergias"
                  value={formData.alergias}
                  onChange={(e) => handleChange("alergias", e.target.value)}
                  placeholder="Liste as alergias conhecidas..."
                  rows={2}
                  disabled={loading}
                  aria-invalid={!!formErrors.alergias}
                  aria-describedby={formErrors.alergias ? "alergias-error" : undefined}
                  className={cn(formErrors.alergias && "border-red-500 focus-visible:ring-red-500")}
                />
                {formErrors.alergias && (
                  <p id="alergias-error" className="mt-1 text-xs text-red-600">
                    {formErrors.alergias}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="medicamentos">Medicamentos em Uso</Label>
                <Textarea
                  id="medicamentos"
                  value={formData.medicamentos}
                  onChange={(e) => handleChange("medicamentos", e.target.value)}
                  placeholder="Liste os medicamentos que o paciente está tomando..."
                  rows={2}
                  disabled={loading}
                  aria-invalid={!!formErrors.medicamentos}
                  aria-describedby={formErrors.medicamentos ? "medicamentos-error" : undefined}
                  className={cn(formErrors.medicamentos && "border-red-500 focus-visible:ring-red-500")}
                />
                {formErrors.medicamentos && (
                  <p id="medicamentos-error" className="mt-1 text-xs text-red-600">
                    {formErrors.medicamentos}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Anamnese Rápida (Sim/Não) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Anamnese</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickQs.map(({ key, label }) => {
                  const value = formData[key] as YesNo
                  return (
                    <div
                      key={String(key)}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-2.5"
                    >
                      <span className="text-sm text-gray-800">{label}</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setYesNo(key, true)}
                          className={cn(
                            "px-3 py-1.5 text-xs rounded-md border transition",
                            value === true
                              ? "bg-cyan-600 text-white border-cyan-600"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                          )}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setYesNo(key, false)}
                          className={cn(
                            "px-3 py-1.5 text-xs rounded-md border transition",
                            value === false
                              ? "bg-gray-800 text-white border-gray-800"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                          )}
                        >
                          Não
                        </button>
                        <button
                          type="button"
                          onClick={() => setYesNo(key, null)}
                          className={cn(
                            "px-2.5 py-1.5 text-xs rounded-md border transition",
                            value === null
                              ? "bg-gray-100 text-gray-700 border-gray-200"
                              : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50",
                          )}
                          title="Limpar"
                        >
                          –
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div>
                <Label htmlFor="anm_observacoes">Observações / Detalhes</Label>
                <Textarea
                  id="anm_observacoes"
                  value={formData.anm_observacoes}
                  onChange={(e) => handleChange("anm_observacoes", e.target.value)}
                  placeholder="Use este espaço para complementar as respostas acima (ex.: tipo de cirurgia, data, medicamentos, etc.)"
                  rows={3}
                  disabled={loading}
                  aria-invalid={!!formErrors.anm_observacoes}
                  aria-describedby={formErrors.anm_observacoes ? "anm_observacoes-error" : undefined}
                  className={cn(formErrors.anm_observacoes && "border-red-500 focus-visible:ring-red-500")}
                />
                {formErrors.anm_observacoes && (
                  <p id="anm_observacoes-error" className="mt-1 text-xs text-red-600">
                    {formErrors.anm_observacoes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Observações gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Observações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange("observacoes", e.target.value)}
                placeholder="Observações adicionais sobre o paciente..."
                rows={3}
                disabled={loading}
                aria-invalid={!!formErrors.observacoes}
                aria-describedby={formErrors.observacoes ? "observacoes-error" : undefined}
                className={cn(formErrors.observacoes && "border-red-500 focus-visible:ring-red-500")}
              />
              {formErrors.observacoes && (
                <p id="observacoes-error" className="mt-1 text-xs text-red-600">
                  {formErrors.observacoes}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={() => router.push("/pacientes")} disabled={loading}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" className="dental-primary" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {patientId ? "Atualizar" : "Salvar"} Paciente
        </Button>
      </div>
    </form>
  )
}
