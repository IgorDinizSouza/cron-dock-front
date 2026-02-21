import { AlertTriangle, Clock, CheckCircle } from "lucide-react"

const alerts = [
  {
    id: 1,
    type: "warning",
    message: "3 consultas pendentes de confirmação",
    time: "2h atrás",
  },
  {
    id: 2,
    type: "info",
    message: "Lembrete: Consulta com Maria Silva em 30min",
    time: "Agora",
  },
  {
    id: 3,
    type: "success",
    message: "Pagamento de R$ 450 recebido",
    time: "1h atrás",
  },
]

export function AlertsPanel() {
  return (
    <div className="dental-card p-6">
      <h2 className="text-lg font-serif font-semibold text-gray-900 mb-4">Alertas</h2>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
              {alert.type === "info" && <Clock className="h-4 w-4 text-blue-500" />}
              {alert.type === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{alert.message}</p>
              <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
