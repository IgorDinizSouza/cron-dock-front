import { TrendingUp, TrendingDown, Users, Calendar, Stethoscope, DollarSign } from "lucide-react"

const stats = [
  {
    name: "Pacientes Ativos",
    value: "248",
    change: "+12",
    changeType: "increase",
    icon: Users,
    color: "cyan",
  },
  {
    name: "Consultas Hoje",
    value: "15",
    change: "3 pendentes",
    changeType: "neutral",
    icon: Calendar,
    color: "emerald",
  },
  {
    name: "Procedimentos",
    value: "89",
    change: "+23%",
    changeType: "increase",
    icon: Stethoscope,
    color: "blue",
  },
  {
    name: "Faturamento",
    value: "R$ 45.2k",
    change: "+8.2%",
    changeType: "increase",
    icon: DollarSign,
    color: "green",
  },
]

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.name} className="dental-card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                <Icon className={`h-5 w-5 text-${stat.color}-600`} />
              </div>
              {stat.changeType === "increase" && <TrendingUp className="h-4 w-4 text-green-500" />}
              {stat.changeType === "decrease" && <TrendingDown className="h-4 w-4 text-red-500" />}
            </div>
            <div>
              <h3 className="font-medium text-gray-600 text-sm mb-1">{stat.name}</h3>
              <p className={`text-2xl font-serif font-bold text-${stat.color}-600 mb-1`}>{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.change}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
