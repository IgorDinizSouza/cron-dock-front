import { Clock, User, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

const appointments = [
  {
    id: 1,
    time: "09:00",
    patient: "Maria Silva",
    phone: "(11) 99999-9999",
    procedure: "Limpeza",
    status: "confirmed",
  },
  {
    id: 2,
    time: "10:30",
    patient: "João Santos",
    phone: "(11) 88888-8888",
    procedure: "Consulta",
    status: "pending",
  },
  {
    id: 3,
    time: "14:00",
    patient: "Ana Costa",
    phone: "(11) 77777-7777",
    procedure: "Obturação",
    status: "confirmed",
  },
  {
    id: 4,
    time: "15:30",
    patient: "Pedro Lima",
    phone: "(11) 66666-6666",
    procedure: "Extração",
    status: "confirmed",
  },
]

export function AppointmentsToday() {
  return (
    <div className="dental-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-serif font-semibold text-gray-900">Consultas de Hoje</h2>
        <Button variant="outline" size="sm">
          Ver Agenda
        </Button>
      </div>

      <div className="space-y-4">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 rounded-lg">
                <Clock className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900">{appointment.patient}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      appointment.status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {appointment.status === "confirmed" ? "Confirmado" : "Pendente"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{appointment.procedure}</p>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm font-medium text-cyan-600">{appointment.time}</span>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Phone className="h-3 w-3" />
                    <span>{appointment.phone}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
