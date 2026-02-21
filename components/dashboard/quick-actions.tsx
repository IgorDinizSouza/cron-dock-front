import { Plus, Calendar, Users, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

const actions = [
  {
    name: "Novo Paciente",
    icon: Plus,
    href: "/pacientes/novo",
    color: "bg-cyan-600 hover:bg-cyan-700",
  },
  {
    name: "Agendar Consulta",
    icon: Calendar,
    href: "/agendamentos/novo",
    color: "bg-emerald-600 hover:bg-emerald-700",
  },
  {
    name: "Ver Pacientes",
    icon: Users,
    href: "/pacientes",
    color: "bg-blue-600 hover:bg-blue-700",
  },
  {
    name: "Relatórios",
    icon: FileText,
    href: "/relatorios",
    color: "bg-purple-600 hover:bg-purple-700",
  },
]

export function QuickActions() {
  return (
    <div className="dental-card p-6">
      <h2 className="text-lg font-serif font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.name}
              variant="default"
              className={`${action.color} text-white h-auto p-4 flex flex-col items-center space-y-2`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.name}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
