"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

const data = [
  { month: "Jan", revenue: 32000 },
  { month: "Fev", revenue: 28000 },
  { month: "Mar", revenue: 35000 },
  { month: "Abr", revenue: 42000 },
  { month: "Mai", revenue: 38000 },
  { month: "Jun", revenue: 45200 },
]

export function RevenueChart() {
  return (
    <div className="dental-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-serif font-semibold text-gray-900 mb-2">Faturamento Mensal</h2>
        <p className="text-sm text-gray-600">Evolução do faturamento nos últimos 6 meses</p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value) => [`R$ ${value.toLocaleString()}`, "Faturamento"]}
            />
            <Bar dataKey="revenue" fill="#0891b2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
