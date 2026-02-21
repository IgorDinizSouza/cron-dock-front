import { User } from "lucide-react"
import { Button } from "@/components/ui/button"

const patients = [
  {
    id: 1,
    name: "Maria Silva",
    lastVisit: "2024-01-15",
    nextAppointment: "2024-01-22",
    status: "active",
  },
  {
    id: 2,
    name: "João Santos",
    lastVisit: "2024-01-10",
    nextAppointment: null,
    status: "needs_followup",
  },
  {
    id: 3,
    name: "Ana Costa",
    lastVisit: "2024-01-08",
    nextAppointment: "2024-01-20",
    status: "active",
  },
]

export function RecentPatients() {
  return (
    <div className="dental-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-serif font-semibold text-gray-900">Pacientes Recentes</h2>
        <Button variant="outline" size="sm">
          Ver Todos
        </Button>
      </div>

      <div className="space-y-3">
        {patients.map((patient) => (
          <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">{patient.name}</h3>
                <p className="text-xs text-gray-500">
                  Última visita: {new Date(patient.lastVisit).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  patient.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {patient.status === "active" ? "Ativo" : "Acompanhar"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
