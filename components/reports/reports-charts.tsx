"use client"

import { useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { agendamentosApi, procedimentosApi, orcamentosApi, dentistasApi } from "@/lib/api"

export function ReportsCharts() {
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [proceduresData, setProceduresData] = useState<any[]>([])
  const [dentistPerformance, setDentistPerformance] = useState<any[]>([])
  const [appointmentTrends, setAppointmentTrends] = useState<any[]>([])
  const [dailyReports, setDailyReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadChartsData = async () => {
      try {
        const [agendamentosRes, procedimentosRes, orcamentosRes, dentistasRes] = await Promise.all([
          agendamentosApi.getAll(0, 1000),
          procedimentosApi.getAll(0, 1000),
          orcamentosApi.getAll(0, 1000),
          dentistasApi.getAll(0, 1000),
        ])

        const mesesData = []
        for (let i = 5; i >= 0; i--) {
          const data = new Date()
          data.setMonth(data.getMonth() - i)
          const mesNome = data.toLocaleDateString("pt-BR", { month: "short" })

          const agendamentosMes =
            agendamentosRes.content?.filter((a: any) => {
              const dataAgendamento = new Date(a.data || a.createdAt)
              return (
                dataAgendamento.getMonth() === data.getMonth() && dataAgendamento.getFullYear() === data.getFullYear()
              )
            }) || []

          const faturamentoMes =
            orcamentosRes.content?.reduce((total: number, orcamento: any) => {
              const dataOrcamento = new Date(orcamento.createdAt || orcamento.data)
              if (dataOrcamento.getMonth() === data.getMonth() && dataOrcamento.getFullYear() === data.getFullYear()) {
                return total + (orcamento.valorTotal || 0)
              }
              return total
            }, 0) || 0

          mesesData.push({
            month: mesNome,
            revenue: faturamentoMes,
            appointments: agendamentosMes.length,
            newPatients: Math.floor(agendamentosMes.length * 0.3), // Estimativa
          })
        }
        setRevenueData(mesesData)

        const procedimentosCount =
          procedimentosRes.content?.reduce((acc: any, proc: any) => {
            const nome = proc.nome || "Outros"
            acc[nome] = (acc[nome] || 0) + 1
            return acc
          }, {}) || {}

        const cores = ["#0891b2", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]
        const procedimentosArray = Object.entries(procedimentosCount)
          .map(([name, value], index) => ({
            name,
            value: value as number,
            color: cores[index % cores.length],
          }))
          .slice(0, 6)
        setProceduresData(procedimentosArray)

        const dentistasPerformance =
          dentistasRes.content
            ?.map((dentista: any) => {
              const agendamentosDentista =
                agendamentosRes.content?.filter((a: any) => a.dentistaId === dentista.id) || []

              const faturamentoDentista =
                orcamentosRes.content?.reduce((total: number, orcamento: any) => {
                  if (orcamento.dentistaId === dentista.id) {
                    return total + (orcamento.valorTotal || 0)
                  }
                  return total
                }, 0) || 0

              return {
                name: dentista.nome || "Dentista",
                appointments: agendamentosDentista.length,
                revenue: faturamentoDentista,
              }
            })
            .slice(0, 5) || []
        setDentistPerformance(dentistasPerformance)

        const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
        const tendenciasSemana = diasSemana.map((dia, index) => {
          const agendamentosDia =
            agendamentosRes.content?.filter((a: any) => {
              const dataAgendamento = new Date(a.data || a.createdAt)
              return dataAgendamento.getDay() === (index + 1) % 7
            }) || []

          const realizados = agendamentosDia.filter((a: any) => a.status === "REALIZADO" || a.status === "CONCLUIDO")
          const cancelados = agendamentosDia.filter((a: any) => a.status === "CANCELADO")

          return {
            day: dia,
            scheduled: agendamentosDia.length,
            completed: realizados.length,
            cancelled: cancelados.length,
          }
        })
        setAppointmentTrends(tendenciasSemana)

        const relatoriosDiarios = []
        for (let i = 4; i >= 0; i--) {
          const data = new Date()
          data.setDate(data.getDate() - i)
          const dataStr = data.toLocaleDateString("pt-BR")

          const agendamentosDia =
            agendamentosRes.content?.filter((a: any) => {
              const dataAgendamento = new Date(a.data || a.createdAt)
              return dataAgendamento.toDateString() === data.toDateString()
            }) || []

          const faturamentoDia =
            orcamentosRes.content?.reduce((total: number, orcamento: any) => {
              const dataOrcamento = new Date(orcamento.createdAt || orcamento.data)
              if (dataOrcamento.toDateString() === data.toDateString()) {
                return total + (orcamento.valorTotal || 0)
              }
              return total
            }, 0) || 0

          const novosPacientesDia = Math.floor(agendamentosDia.length * 0.2) // Estimativa
          const taxaOcupacao =
            agendamentosDia.length > 0 ? `${Math.min(100, (agendamentosDia.length / 10) * 100).toFixed(0)}%` : "0%"

          relatoriosDiarios.push({
            date: dataStr,
            appointments: agendamentosDia.length,
            revenue: faturamentoDia,
            newPatients: novosPacientesDia,
            occupancy: taxaOcupacao,
          })
        }
        setDailyReports(relatoriosDiarios)
      } catch (error) {
        console.error("Erro ao carregar dados dos gráficos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadChartsData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="dental-card p-6 animate-pulse">
              <div className="h-80 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Revenue and Appointments Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dental-card p-6">
          <h3 className="text-lg font-serif font-semibold text-gray-900 mb-4">Evolução do Faturamento</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
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
                  formatter={(value, name) => [
                    name === "revenue" ? `R$ ${value.toLocaleString()}` : value,
                    name === "revenue" ? "Faturamento" : "Consultas",
                  ]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#0891b2" strokeWidth={3} dot={{ fill: "#0891b2" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dental-card p-6">
          <h3 className="text-lg font-serif font-semibold text-gray-900 mb-4">Distribuição de Procedimentos</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={proceduresData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {proceduresData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, "Quantidade"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dentist Performance and Weekly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dental-card p-6">
          <h3 className="text-lg font-serif font-semibold text-gray-900 mb-4">Performance por Dentista</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dentistPerformance} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value, name) => [
                    name === "revenue" ? `R$ ${value.toLocaleString()}` : value,
                    name === "revenue" ? "Faturamento" : "Consultas",
                  ]}
                />
                <Bar dataKey="appointments" fill="#0891b2" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dental-card p-6">
          <h3 className="text-lg font-serif font-semibold text-gray-900 mb-4">Consultas por Dia da Semana</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#10b981" name="Realizadas" radius={[0, 0, 0, 0]} />
                <Bar dataKey="cancelled" stackId="a" fill="#ef4444" name="Canceladas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Reports Table */}
      <div className="dental-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-serif font-semibold text-gray-900">Relatórios Detalhados</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-cyan-100 text-cyan-700 rounded-md">Financeiro</button>
            <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Pacientes</button>
            <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Procedimentos</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consultas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faturamento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Novos Pacientes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taxa Ocupação</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailyReports.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{row.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row.appointments}</td>
                  <td className="px-4 py-3 text-sm text-green-600 font-semibold">R$ {row.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row.newPatients}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row.occupancy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
