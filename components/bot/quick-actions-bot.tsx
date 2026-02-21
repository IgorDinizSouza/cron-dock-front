"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, Calendar, UserPlus, Users, Stethoscope, X, FileText, CreditCard, Settings } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export function QuickActionsBot() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const quickActions = [
    { label: "Novo Paciente", icon: <UserPlus className="h-4 w-4" />, path: "/pacientes/novo", color: "text-cyan-600" },
    {
      label: "Agendar Consulta",
      icon: <Calendar className="h-4 w-4" />,
      path: "/agendamentos/novo",
      color: "text-emerald-600",
    },
    { label: "Ver Agenda", icon: <Calendar className="h-4 w-4" />, path: "/agendamentos", color: "text-blue-600" },
    { label: "Pacientes", icon: <Users className="h-4 w-4" />, path: "/pacientes", color: "text-purple-600" },
    {
      label: "Procedimentos",
      icon: <Stethoscope className="h-4 w-4" />,
      path: "/procedimentos",
      color: "text-orange-600",
    },
    { label: "Orçamentos", icon: <FileText className="h-4 w-4" />, path: "/orcamentos", color: "text-indigo-600" },
    { label: "Financeiro", icon: <CreditCard className="h-4 w-4" />, path: "/financeiro", color: "text-green-600" },
    { label: "Usuários", icon: <Settings className="h-4 w-4" />, path: "/usuarios", color: "text-gray-600" },
  ]

  if (pathname?.startsWith("/login") || pathname?.startsWith("/auth")) {
    return null
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg dental-primary hover:scale-105 transition-all duration-200 z-50"
        size="sm"
        aria-label="Ações rápidas"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-24 right-6 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 min-w-[220px] max-w-[280px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-base text-gray-900">Ações Rápidas</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.path}
            variant="ghost"
            size="sm"
            className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-gray-50 rounded-lg transition-colors"
            onClick={() => {
              router.push(action.path)
              setIsOpen(false)
            }}
          >
            <div className={action.color}>{action.icon}</div>
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">{action.label}</span>
          </Button>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">Acesso rápido às principais funcionalidades</p>
      </div>
    </div>
  )
}
