"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Phone, Stethoscope, FileText, Edit, Trash2, Printer } from "lucide-react"
import { ReceiptDialog } from "@/components/appointments/receipt-dialog"

interface AppointmentDetailsModalProps {
  appointment: any
  isOpen: boolean
  onClose: () => void
}

function getStatusColor(status: string) {
  switch (status) {
    case "confirmed":
    case "confirmado":
      return "bg-green-100 text-green-800"
    case "pending":
    case "agendado":
      return "bg-yellow-100 text-yellow-800"
    case "cancelled":
    case "cancelado":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-blue-100 text-blue-800"
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "confirmed":
    case "confirmado":
      return "Confirmado"
    case "pending":
    case "agendado":
      return "Pendente"
    case "cancelled":
    case "cancelado":
      return "Cancelado"
    default:
      return "Agendado"
  }
}

export function AppointmentDetailsModal({ appointment, isOpen, onClose }: AppointmentDetailsModalProps) {
  const [openReceipt, setOpenReceipt] = useState(false)

  if (!appointment) return null

  const patientName = appointment.pacienteNome || appointment.patient
  const procedureName = appointment.procedimentoNome || appointment.procedure
  const dentistName = appointment.dentistaNome || appointment.dentist

  const dateStr = appointment.dataHora
    ? new Date(appointment.dataHora).toLocaleDateString("pt-BR")
    : appointment.date
      ? new Date(appointment.date).toLocaleDateString("pt-BR")
      : ""

  const timeStr =
    appointment.time ||
    (appointment.dataHora
      ? new Date(appointment.dataHora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : "")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">Detalhes do Agendamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header do Agendamento */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{patientName}</h2>
                <p className="text-gray-600">{procedureName}</p>
                <Badge className={getStatusColor(appointment.status)}>{getStatusText(appointment.status)}</Badge>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 bg-transparent">
                <Trash2 className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button size="sm" className="dental-primary" onClick={() => setOpenReceipt(true)}>
                <Printer className="h-4 w-4 mr-2" />
                Gerar Recibo
              </Button>
            </div>
          </div>

          {/* Informações do Agendamento */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="dental-card p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Data e Horário
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium">{dateStr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horário:</span>
                    <span className="font-medium">{timeStr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duração:</span>
                    <span className="font-medium">{appointment.duration || appointment.duracao || 60} minutos</span>
                  </div>
                </div>
              </div>

              <div className="dental-card p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Profissional
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dentista:</span>
                    <span className="font-medium">{dentistName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Especialidade:</span>
                    <span className="font-medium">Clínico Geral</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="dental-card p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Contato do Paciente
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telefone:</span>
                    <span className="font-medium">{appointment.phone || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{appointment.email || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="dental-card p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Procedimento
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium">{procedureName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-medium">
                      {appointment.preco
                        ? `R$ ${Number(appointment.preco).toFixed(2)}`
                        : appointment.price
                          ? `R$ ${Number(appointment.price).toFixed(2)}`
                          : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          {appointment.notes && (
            <div className="dental-card p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Observações
              </h3>
              <p className="text-sm text-gray-600">{appointment.notes}</p>
            </div>
          )}
        </div>

        {/* Diálogo de Recibo */}
        <ReceiptDialog
          open={openReceipt}
          onOpenChange={setOpenReceipt}
          appointment={{
            id: appointment.id,
            pacienteNome: patientName,
            dentistaNome: dentistName,
            procedimentoNome: procedureName,
            dataHora: appointment.dataHora || appointment.date,
            preco: appointment.preco || appointment.price,
          }}
          clinic={{
            nome: "OdontoCareSys", // Mudando nome da clínica
            cnpj: "12.345.678/0001-99",
            endereco: "Rua Exemplo, 123",
            cidadeUf: "São Paulo - SP",
            telefone: "(11) 0000-0000",
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
