"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Phone, Mail, Calendar, User, Award } from "lucide-react"
import type { Dentista } from "@/app/(dashboard)/dentistas/page"

interface DentistaDetailsModalProps {
  dentista: Dentista
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DentistaDetailsModal({ dentista, open, onOpenChange }: DentistaDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Dentista</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-cyan-100 text-cyan-700 text-lg">
                {dentista.nome
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">{dentista.nome}</h3>
              <p className="text-gray-600">{dentista.cro}</p>
              <Badge
                variant={dentista.ativo ? "default" : "secondary"}
                className={`mt-2 ${dentista.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
              >
                {dentista.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações de Contato
              </h4>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{dentista.telefone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{dentista.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">
                    Cadastrado em {new Date(dentista.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Especialidades
              </h4>

              <div className="flex flex-wrap gap-2">
                {dentista.especialidades.map((especialidade, index) => (
                  <Badge key={index} variant="secondary" className="bg-cyan-50 text-cyan-700">
                    {especialidade}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Estatísticas</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">-</div>
                <div className="text-sm text-gray-600">Consultas Realizadas</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">-</div>
                <div className="text-sm text-gray-600">Pacientes Atendidos</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">-</div>
                <div className="text-sm text-gray-600">Avaliação Média</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
