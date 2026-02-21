"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Phone, Mail, MapPin, User, Heart, FileText, Edit } from "lucide-react"

interface PatientDetailsModalProps {
  patient: any
  isOpen: boolean
  onClose: () => void
}

export function PatientDetailsModal({ patient, isOpen, onClose }: PatientDetailsModalProps) {
  if (!patient) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">Detalhes do Paciente</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coluna Principal - Informações Básicas */}
          <div className="md:col-span-2 space-y-6">
            {/* Header do Paciente */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <img
                src={patient.avatar || "/placeholder.svg"}
                alt={patient.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{patient.name}</h2>
                <p className="text-gray-600">{patient.cpf}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant={patient.status === "Ativo" ? "default" : "secondary"}>{patient.status}</Badge>
                  <span className="text-sm text-gray-500">
                    {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} anos
                  </span>
                </div>
              </div>
              <Button size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>

            {/* Informações de Contato */}
            <div className="dental-card p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Informações de Contato
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{patient.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Nascimento: {new Date(patient.birthDate).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>São Paulo, SP</span>
                </div>
              </div>
            </div>

            {/* Histórico Médico */}
            <div className="dental-card p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Heart className="h-4 w-4 mr-2" />
                Histórico Médico
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Alergias:</span>
                  <p className="text-gray-600 mt-1">Penicilina, Látex</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Medicamentos:</span>
                  <p className="text-gray-600 mt-1">Losartana 50mg (hipertensão)</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Condições:</span>
                  <p className="text-gray-600 mt-1">Hipertensão controlada</p>
                </div>
              </div>
            </div>

            {/* Histórico Odontológico */}
            <div className="dental-card p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Histórico Odontológico
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Último Tratamento:</span>
                  <p className="text-gray-600 mt-1">Limpeza e aplicação de flúor - 15/01/2024</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tratamentos Anteriores:</span>
                  <ul className="text-gray-600 mt-1 list-disc list-inside">
                    <li>Obturação dente 16 (Dez/2023)</li>
                    <li>Extração dente 28 (Nov/2023)</li>
                    <li>Tratamento de canal dente 36 (Set/2023)</li>
                  </ul>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Observações:</span>
                  <p className="text-gray-600 mt-1">
                    Paciente com boa higiene oral. Recomendado uso de fio dental diário.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Lateral - Consultas e Ações */}
          <div className="space-y-6">
            {/* Próximas Consultas */}
            <div className="dental-card p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Próximas Consultas</h3>
              {patient.nextAppointment ? (
                <div className="p-3 bg-cyan-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-cyan-900">Consulta Agendada</span>
                    <Badge variant="outline" className="text-cyan-700 border-cyan-300">
                      Confirmado
                    </Badge>
                  </div>
                  <p className="text-sm text-cyan-800">
                    {new Date(patient.nextAppointment).toLocaleDateString("pt-BR")} às 14:00
                  </p>
                  <p className="text-xs text-cyan-600 mt-1">Limpeza e avaliação</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma consulta agendada</p>
              )}
            </div>

            {/* Ações Rápidas */}
            <div className="dental-card p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Ações Rápidas</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Consulta
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar para Paciente
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Prontuário
                </Button>
              </div>
            </div>

            {/* Estatísticas do Paciente */}
            <div className="dental-card p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Estatísticas</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de Consultas:</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Faltas:</span>
                  <span className="font-medium">1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Última Consulta:</span>
                  <span className="font-medium">{new Date(patient.lastVisit).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paciente desde:</span>
                  <span className="font-medium">Mar/2023</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
