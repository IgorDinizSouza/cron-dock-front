"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Clock, User, Stethoscope, DollarSign, Save } from "lucide-react"
import { useNotification } from "@/contexts/notification-context"
import { appointmentsApi, patientsApi, dentistasApi, proceduresApi } from "@/lib/api"

interface QuickAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  selectedTime: string
  onAppointmentCreated: () => void
}

export function QuickAppointmentDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedTime,
  onAppointmentCreated,
}: QuickAppointmentDialogProps) {
  const { showSuccess, showError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [dentists, setDentists] = useState<any[]>([])
  const [procedures, setProcedures] = useState<any[]>([])

  const [formData, setFormData] = useState({
    pacienteId: "",
    dentistaId: "",
    procedimentoId: "",
    observacoes: "",
    preco: 0,
  })

  // Carregar dados necessários
  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    try {
      const [patientsData, dentistsData, proceduresData] = await Promise.all([
        patientsApi.getAll(0, 100),
        dentistasApi.getAll(0, 100),
        proceduresApi.listAll(0, 100),
      ])

      setPatients(patientsData?.content || [])
      setDentists(dentistsData?.content || [])
      setProcedures(proceduresData || [])
    } catch (error) {
      showError("Erro", "Falha ao carregar dados necessários")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.pacienteId || !formData.dentistaId || !formData.procedimentoId) {
      showError("Campos obrigatórios", "Selecione paciente, dentista e procedimento")
      return
    }

    setLoading(true)

    try {
      // Criar data/hora completa
      const [hours, minutes] = selectedTime.split(":").map(Number)
      const appointmentDateTime = new Date(selectedDate)
      appointmentDateTime.setHours(hours, minutes, 0, 0)

      const appointmentData = {
        pacienteId: Number(formData.pacienteId),
        dentistaId: Number(formData.dentistaId),
        procedimentoId: Number(formData.procedimentoId),
        dataHora: appointmentDateTime.toISOString(),
        observacoes: formData.observacoes,
        preco: formData.preco,
        status: "agendado",
        duracao: 60, // 1 hora padrão
      }

      await appointmentsApi.create(appointmentData)
      showSuccess("Sucesso", "Agendamento criado com sucesso!")
      onAppointmentCreated()
    } catch (error) {
      showError("Erro", "Não foi possível criar o agendamento")
    } finally {
      setLoading(false)
    }
  }

  // Atualizar preço quando procedimento for selecionado
  useEffect(() => {
    if (formData.procedimentoId) {
      const selectedProcedure = procedures.find((p) => p.id === Number(formData.procedimentoId))
      if (selectedProcedure?.preco) {
        setFormData((prev) => ({ ...prev, preco: selectedProcedure.preco }))
      }
    }
  }, [formData.procedimentoId, procedures])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-600" />
            Novo Agendamento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Data</Label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{selectedDate.toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Horário</Label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{selectedTime}</span>
              </div>
            </div>
          </div>

          {/* Paciente */}
          <div>
            <Label className="text-sm font-medium">Paciente *</Label>
            <Select
              value={formData.pacienteId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, pacienteId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id.toString()}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {patient.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dentista */}
          <div>
            <Label className="text-sm font-medium">Dentista *</Label>
            <Select
              value={formData.dentistaId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, dentistaId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o dentista" />
              </SelectTrigger>
              <SelectContent>
                {dentists.map((dentist) => (
                  <SelectItem key={dentist.id} value={dentist.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      {dentist.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Procedimento */}
          <div>
            <Label className="text-sm font-medium">Procedimento *</Label>
            <Select
              value={formData.procedimentoId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, procedimentoId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o procedimento" />
              </SelectTrigger>
              <SelectContent>
                {procedures.map((procedure) => (
                  <SelectItem key={procedure.id} value={procedure.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{procedure.nome}</span>
                      {procedure.preco && (
                        <span className="text-xs text-gray-500 ml-2">R$ {Number(procedure.preco).toFixed(2)}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preço */}
          <div>
            <Label className="text-sm font-medium">Valor</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="number"
                step="0.01"
                value={formData.preco}
                onChange={(e) => setFormData((prev) => ({ ...prev, preco: Number(e.target.value) }))}
                className="pl-10"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label className="text-sm font-medium">Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="dental-primary" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Agendar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
