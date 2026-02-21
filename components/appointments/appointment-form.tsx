"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Save, X, Search, Loader2, MessageCircle } from "lucide-react"
import { appointmentsApi, patientsApi, proceduresApi, especialidadesApi, dentistasApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { whatsappApi } from "@/lib/whatsapp-api"

interface AppointmentFormProps {
  appointmentId?: string
  initialData?: any
}

export function AppointmentForm({ appointmentId, initialData }: AppointmentFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [searchPatient, setSearchPatient] = useState("")
  const [patients, setPatients] = useState<any[]>([])
  const [procedures, setProcedures] = useState<any[]>([])
  const [especialidades, setEspecialidades] = useState<any[]>([])
  const [dentistas, setDentistas] = useState<any[]>([])
  const [loadingProcedures, setLoadingProcedures] = useState(true)
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true)
  const [loadingDentistas, setLoadingDentistas] = useState(true)

  const [whatsappSettings, setWhatsappSettings] = useState({
    sendNotification: true,
    sendReminder: true,
    allowConfirmation: true,
  })

  const [formData, setFormData] = useState({
    pacienteId: initialData?.pacienteId ? String(initialData.pacienteId) : "",
    pacienteNome: initialData?.pacienteNome || "",
    dataHora: initialData?.dataHora || "",
    duracao: initialData?.duracao ?? 60,
    dentistaId: initialData?.dentistaId ? String(initialData.dentistaId) : "",
    procedimentoId: initialData?.procedimentoId ? String(initialData.procedimentoId) : "",
    especialidadeId: initialData?.especialidadeId ? String(initialData.especialidadeId) : "",
    observacoes: initialData?.observacoes || "",
    status: initialData?.status || "agendado",
  })

  const loadEspecialidades = useCallback(async () => {
    try {
      setLoadingEspecialidades(true)
      const resp = await especialidadesApi.getAll()
      const items = Array.isArray(resp) ? resp : (resp?.content ?? [])
      setEspecialidades(items)
    } catch (error) {
      console.error("Erro ao carregar especialidades:", error)
      setEspecialidades([])
    } finally {
      setLoadingEspecialidades(false)
    }
  }, [])

  const loadDentistas = useCallback(async () => {
    try {
      setLoadingDentistas(true)
      const resp = await dentistasApi.getAll()
      const items = Array.isArray(resp) ? resp : (resp?.content ?? [])
      setDentistas(items)
    } catch (error) {
      console.error("Erro ao carregar dentistas:", error)
      setDentistas([])
    } finally {
      setLoadingDentistas(false)
    }
  }, [])

  const loadProcedures = useCallback(async (especialidadeId?: string) => {
  try {
    setLoadingProcedures(true)

    // helper p/ normalizar Page<T> | T[] -> T[]
    const normalize = (resp: any) => (Array.isArray(resp) ? resp : (resp?.content ?? []))

    // sem especialidade => pega tudo (máx. 100)
    if (!especialidadeId) {
      const resp = await proceduresApi.getAll(0, 100)
      setProcedures(normalize(resp))
      return
    }

    // 1) tenta por NOME (muito back usa /especialidade/{nome})
    const esp = especialidades.find((e: any) => String(e.id) === String(especialidadeId))
    if (esp?.nome) {
      try {
        const byName = await proceduresApi.getBySpecialty(esp.nome)
        const itemsByName = normalize(byName)
        if (itemsByName.length > 0) {
          setProcedures(itemsByName)
          return
        }
      } catch {
        // ignora e tenta as próximas opções
      }
    }

    // 2) tenta por ID (se o teu back tiver rota por id)
    try {
      const byId = await proceduresApi.getByEspecialidade(especialidadeId)
      const itemsById = normalize(byId)
      if (itemsById.length > 0) {
        setProcedures(itemsById)
        return
      }
    } catch {
      // ignora e tenta fallback
    }

    // 3) fallback: carrega todos e (se quiser) poderia filtrar no front por espId
    const all = await proceduresApi.getAll(0, 100)
    setProcedures(normalize(all))
  } catch (error) {
    console.error("Erro ao carregar procedimentos:", error)
    setProcedures([])
  } finally {
    setLoadingProcedures(false)
  }
}, [especialidades])

  const searchPatients = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setPatients([])
      return
    }

    try {
      setLoadingPatients(true)
      const data = await patientsApi.search(searchTerm.trim())
      const items = Array.isArray(data) ? data : (data?.content ?? [])
      setPatients(items)
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error)
      setPatients([])
    } finally {
      setLoadingPatients(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadInitialData = async () => {
      await Promise.all([loadEspecialidades(), loadDentistas(), loadProcedures()])
    }

    if (!cancelled) {
      loadInitialData()
    }

    return () => {
      cancelled = true
    }
  }, [loadEspecialidades, loadDentistas, loadProcedures])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatients(searchPatient)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchPatient, searchPatients])

  useEffect(() => {
    let cancelled = false

    const reloadProcedures = async () => {
      if (!cancelled) {
        await loadProcedures(formData.especialidadeId)
      }
    }

    reloadProcedures()

    return () => {
      cancelled = true
    }
  }, [formData.especialidadeId, loadProcedures])

  const sendWhatsAppNotification = async (appointmentData: any, type: "create" | "update" | "reminder") => {
    try {
      const patient = patients.find((p) => p.id === Number(appointmentData.pacienteId))
      const procedure = procedures.find((p) => p.id === Number(appointmentData.procedimentoId))
      const dentista = dentistas.find((d) => d.id === Number(appointmentData.dentistaId))

      if (!patient?.telefone) {
        console.warn("Paciente não possui telefone cadastrado")
        return
      }

      const messageData = {
        to: patient.telefone,
        type,
        appointmentData: {
          patientName: patient.nome,
          date: new Date(appointmentData.dataHora).toLocaleDateString("pt-BR"),
          time: new Date(appointmentData.dataHora).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          procedure: procedure?.nome || "Consulta",
          dentist: dentista?.nome || "Dentista",
          duration: appointmentData.duracao,
          observations: appointmentData.observacoes,
        },
        settings: whatsappSettings,
      }

      await whatsappApi.sendAppointmentNotification(messageData)

      toast({
        title: "WhatsApp enviado!",
        description: `Notificação enviada para ${patient.nome}`,
      })
    } catch (error) {
      console.error("Erro ao enviar WhatsApp:", error)
      toast({
        title: "Erro no WhatsApp",
        description: "Não foi possível enviar a notificação",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        pacienteId: formData.pacienteId ? Number(formData.pacienteId) : undefined,
        dataHora: formData.dataHora,
        duracao: Number(formData.duracao),
        dentistaId: formData.dentistaId ? Number(formData.dentistaId) : undefined,
        procedimentoId: formData.procedimentoId ? Number(formData.procedimentoId) : undefined,
        especialidadeId: formData.especialidadeId ? Number(formData.especialidadeId) : undefined,
        observacoes: formData.observacoes,
        status: formData.status,
      }

      if (!payload.pacienteId || !payload.procedimentoId || !payload.dataHora) {
        toast({
          title: "Campos obrigatórios",
          description: "Selecione um paciente, procedimento e informe a data/hora.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      let result
      if (appointmentId) {
        result = await appointmentsApi.update(appointmentId, payload)
        toast({ title: "Sucesso!", description: "Agendamento atualizado com sucesso." })

        if (whatsappSettings.sendNotification) {
          await sendWhatsAppNotification(payload, "update")
        }
      } else {
        result = await appointmentsApi.create(payload)
        toast({ title: "Sucesso!", description: "Agendamento criado com sucesso." })

        if (whatsappSettings.sendNotification) {
          await sendWhatsAppNotification(payload, "create")
        }
      }

      router.push("/agendamentos")
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar agendamento.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "especialidadeId" ? { procedimentoId: "" } : {}),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações do Agendamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Informações do Agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pesquisa de Paciente */}
            <div>
              <Label htmlFor="patient">Paciente *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="patient"
                  value={searchPatient}
                  onChange={(e) => setSearchPatient(e.target.value)}
                  placeholder="Buscar paciente por nome..."
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
              {loadingPatients && <div className="mt-2 text-sm text-gray-500">Carregando pacientes...</div>}
              {searchPatient && patients.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-md bg-white shadow-sm max-h-40 overflow-y-auto">
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          pacienteId: String(patient.id),
                          pacienteNome: patient.nome,
                        }))
                        setSearchPatient(patient.nome)
                        setPatients([])
                      }}
                    >
                      <div className="font-medium text-gray-900">{patient.nome}</div>
                      <div className="text-sm text-gray-500">{patient.telefone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="dataHora">Data e Hora *</Label>
              <Input
                id="dataHora"
                type="datetime-local"
                value={formData.dataHora}
                onChange={(e) => handleChange("dataHora", e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="especialidadeId">Especialidade *</Label>
              <Select
                value={formData.especialidadeId}
                onValueChange={(value) => handleChange("especialidadeId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingEspecialidades ? "Carregando..." : "Selecione a especialidade"} />
                </SelectTrigger>
                <SelectContent>
                  {especialidades?.map((esp: any) => (
                    <SelectItem key={esp.id} value={String(esp.id)}>
                      {esp.nome}
                    </SelectItem>
                  ))}
                  {(!especialidades || especialidades.length === 0) && !loadingEspecialidades && (
                    <div className="px-3 py-2 text-sm text-gray-500">Nenhuma especialidade encontrada</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duracao">Duração (minutos) *</Label>
                <Select
                  value={String(formData.duracao)}
                  onValueChange={(value) => handleChange("duracao", Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a duração" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1h 30min</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dentistaId">Dentista *</Label>
                <Select value={formData.dentistaId} onValueChange={(value) => handleChange("dentistaId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingDentistas ? "Carregando..." : "Selecione o dentista"} />
                  </SelectTrigger>
                  <SelectContent>
                    {dentistas?.map((dentista: any) => (
                      <SelectItem key={dentista.id} value={String(dentista.id)}>
                        {dentista.nome} - {dentista.especialidade}
                      </SelectItem>
                    ))}
                    {(!dentistas || dentistas.length === 0) && !loadingDentistas && (
                      <div className="px-3 py-2 text-sm text-gray-500">Nenhum dentista encontrado</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="procedimentoId">Procedimento *</Label>
              <Select
                value={formData.procedimentoId}
                onValueChange={(value) => handleChange("procedimentoId", value)}
                disabled={!formData.especialidadeId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !formData.especialidadeId
                        ? "Selecione uma especialidade primeiro"
                        : loadingProcedures
                          ? "Carregando..."
                          : "Selecione o procedimento"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {procedures?.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nome} - R$ {Number(p.preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </SelectItem>
                  ))}
                  {(!procedures || procedures.length === 0) && !loadingProcedures && formData.especialidadeId && (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Nenhum procedimento encontrado para esta especialidade
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="em-andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Observações e WhatsApp */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Observações e Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange("observacoes", e.target.value)}
                placeholder="Observações sobre a consulta..."
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-4 w-4 text-green-600" />
                <Label className="text-sm font-medium">Notificações WhatsApp</Label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendNotification"
                    checked={whatsappSettings.sendNotification}
                    onCheckedChange={(checked) =>
                      setWhatsappSettings((prev) => ({ ...prev, sendNotification: !!checked }))
                    }
                  />
                  <Label htmlFor="sendNotification" className="text-sm">
                    Enviar notificação de agendamento
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendReminder"
                    checked={whatsappSettings.sendReminder}
                    onCheckedChange={(checked) => setWhatsappSettings((prev) => ({ ...prev, sendReminder: !!checked }))}
                  />
                  <Label htmlFor="sendReminder" className="text-sm">
                    Enviar lembrete 24h antes
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowConfirmation"
                    checked={whatsappSettings.allowConfirmation}
                    onCheckedChange={(checked) =>
                      setWhatsappSettings((prev) => ({ ...prev, allowConfirmation: !!checked }))
                    }
                  />
                  <Label htmlFor="allowConfirmation" className="text-sm">
                    Permitir confirmação via WhatsApp
                  </Label>
                </div>
              </div>

              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-700">
                  <MessageCircle className="h-3 w-3 inline mr-1" />
                  As mensagens serão enviadas automaticamente para o telefone do paciente
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={() => router.push("/agendamentos")} disabled={loading}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" className="dental-primary" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {appointmentId ? "Atualizar" : "Agendar"} Consulta
        </Button>
      </div>
    </form>
  )
}
