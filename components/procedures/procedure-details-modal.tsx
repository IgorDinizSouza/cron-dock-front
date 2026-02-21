"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, DollarSign, FileText, AlertTriangle, CheckCircle, Edit, UserPlus } from "lucide-react"

interface ProcedureDetailsModalProps {
  procedure: any
  isOpen: boolean
  onClose: () => void
}

export function ProcedureDetailsModal({ procedure, isOpen, onClose }: ProcedureDetailsModalProps) {
  if (!procedure) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">Detalhes do Procedimento</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header do Procedimento */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-cyan-100 rounded-lg flex items-center justify-center text-3xl">
                {procedure.icon}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{procedure.name}</h2>
                <Badge className={procedure.color}>{procedure.category}</Badge>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{procedure.duration} minutos</span>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600 font-semibold">
                    <DollarSign className="h-4 w-4" />
                    <span>R$ {procedure.price}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button size="sm" className="dental-primary">
                <UserPlus className="h-4 w-4 mr-2" />
                Agendar
              </Button>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna Esquerda */}
            <div className="space-y-6">
              {/* Descrição */}
              <div className="dental-card p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Descrição
                </h3>
                <p className="text-sm text-gray-600">{procedure.description}</p>
              </div>

              {/* Materiais Necessários */}
              <div className="dental-card p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Materiais Necessários</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Anestésico local</li>
                  <li>• Instrumentos de limpeza</li>
                  <li>• Curetas periodontais</li>
                  <li>• Ultrassom odontológico</li>
                  <li>• Pasta profilática</li>
                </ul>
              </div>

              {/* Instruções Pré-Procedimento */}
              <div className="dental-card p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Instruções Pré-Procedimento
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Realizar higiene bucal normal</li>
                  <li>• Não consumir álcool 24h antes</li>
                  <li>• Informar sobre medicamentos em uso</li>
                  <li>• Chegar 15 minutos antes do horário</li>
                </ul>
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-6">
              {/* Estatísticas */}
              <div className="dental-card p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Estatísticas</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Popularidade:</span>
                    <Badge className="bg-green-100 text-green-800">{procedure.popularity}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Último uso:</span>
                    <span className="font-medium">{new Date(procedure.lastUsed).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Realizados este mês:</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxa de sucesso:</span>
                    <span className="font-medium text-green-600">98%</span>
                  </div>
                </div>
              </div>

              {/* Contraindicações */}
              <div className="dental-card p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                  Contraindicações
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Infecção ativa na boca</li>
                  <li>• Problemas de coagulação</li>
                  <li>• Gravidez (primeiro trimestre)</li>
                  <li>• Alergia aos materiais utilizados</li>
                </ul>
              </div>

              {/* Cuidados Pós-Procedimento */}
              <div className="dental-card p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Cuidados Pós-Procedimento</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Evitar alimentos duros por 24h</li>
                  <li>• Não fazer bochechos vigorosos</li>
                  <li>• Usar escova macia</li>
                  <li>• Retorno em 7 dias para avaliação</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Gerar Orçamento
              </Button>
              <Button variant="outline" size="sm">
                Imprimir Detalhes
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" className="dental-accent">
                <UserPlus className="h-4 w-4 mr-2" />
                Agendar para Paciente
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
