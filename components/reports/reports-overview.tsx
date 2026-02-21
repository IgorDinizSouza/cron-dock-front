"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, Stethoscope } from "lucide-react"
import { pacientesApi, agendamentosApi, procedimentosApi, orcamentosApi } from "@/lib/api"

interface ReportsData {
  faturamentoTotal: number
  novosPacientes: number
  consultasRealizadas: number
  totalProcedimentos: number
  taxaOcupacao: number
  ticketMedio: number
  taxaCancelamento: number
  satisfacaoCliente: number
}

export function ReportsOverview() {
  const [data, setData] = useState<ReportsData>({
    faturamentoTotal: 0,
    novosPacientes: 0,
    consultasRealizadas: 0,
    totalProcedimentos: 0,
    taxaOcupacao: 0,
    ticketMedio: 0,
    taxaCancelamento: 0,
    satisfacaoCliente: 4.5,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadReportsData = async () => {
      try {
        const [pacientesRes, agendamentosRes, procedimentosRes, orcamentosRes] = await Promise.all([
          pacientesApi.getAll(0, 1000),
          agendamentosApi.getAll(0, 1000),
          procedimentosApi.getAll(0, 1000),
          orcamentosApi.getAll(0, 1000),
        ])

        const mesAtual = new Date().getMonth()
        const anoAtual = new Date().getFullYear()
        const inicioMes = new Date(anoAtual, mesAtual, 1)

        const pacientesMesAtual =
          pacientesRes.content?.filter((p: any) => {
            const dataCriacao = new Date(p.createdAt || p.dataCadastro)
            return dataCriacao >= inicioMes
          }) || []

        const agendamentosMesAtual =
          agendamentosRes.content?.filter((a: any) => {
            const dataAgendamento = new Date(a.data || a.createdAt)
            return dataAgendamento >= inicioMes
          }) || []

        const consultasRealizadas = agendamentosMesAtual.filter(
          (a: any) => a.status === "REALIZADO" || a.status === "CONCLUIDO",
        )

        const faturamentoTotal =
          orcamentosRes.content?.reduce((total: number, orcamento: any) => {
            const dataOrcamento = new Date(orcamento.createdAt || orcamento.data)
            if (dataOrcamento >= inicioMes) {
              return total + (orcamento.valorTotal || 0)
            }
            return total
          }, 0) || 0

        const ticketMedio = consultasRealizadas.length > 0 ? faturamentoTotal / consultasRealizadas.length : 0
        const taxaOcupacao =
          agendamentosMesAtual.length > 0 ? (consultasRealizadas.length / agendamentosMesAtual.length) * 100 : 0

        const consultasCanceladas = agendamentosMesAtual.filter((a: any) => a.status === "CANCELADO")
        const taxaCancelamento =
          agendamentosMesAtual.length > 0 ? (consultasCanceladas.length / agendamentosMesAtual.length) * 100 : 0

        setData({
          faturamentoTotal,
          novosPacientes: pacientesMesAtual.length,
          consultasRealizadas: consultasRealizadas.length,
          totalProcedimentos: procedimentosRes.totalElements || 0,
          taxaOcupacao,
          ticketMedio,
          taxaCancelamento,
          satisfacaoCliente: 4.5, // Placeholder até implementar sistema de avaliação
        })
      } catch (error) {
        console.error("Erro ao carregar dados dos relatórios:", error)
      } finally {
        setLoading(false)
      }
    }

    loadReportsData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="dental-card p-6 animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const metrics = [
    {
      name: "Faturamento Total",
      value: `R$ ${(data.faturamentoTotal / 1000).toFixed(1)}k`,
      change: "+12.5%", // Placeholder até implementar cálculo de crescimento
      changeType: "increase" as const,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Novos Pacientes",
      value: data.novosPacientes.toString(),
      change: "+8.2%",
      changeType: "increase" as const,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Consultas Realizadas",
      value: data.consultasRealizadas.toString(),
      change: "-2.1%",
      changeType: "decrease" as const,
      icon: Calendar,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
    {
      name: "Procedimentos",
      value: data.totalProcedimentos.toString(),
      change: "+15.3%",
      changeType: "increase" as const,
      icon: Stethoscope,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  const detailedMetrics = [
    { label: "Taxa de Ocupação", value: `${data.taxaOcupacao.toFixed(1)}%`, target: "90%" },
    { label: "Ticket Médio", value: `R$ ${data.ticketMedio.toFixed(0)}`, target: "R$ 320" },
    { label: "Taxa de Cancelamento", value: `${data.taxaCancelamento.toFixed(1)}%`, target: "5%" },
    { label: "Satisfação do Cliente", value: `${data.satisfacaoCliente}/5`, target: "4.5/5" },
  ]

  const mesAtual = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  const diasUteis = 22 // Placeholder
  const mediaDiaria = data.consultasRealizadas > 0 ? data.faturamentoTotal / diasUteis : 0

  return (
    <div className="space-y-6 mb-8">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.name} className="dental-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                {metric.changeType === "increase" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-600 text-sm mb-1">{metric.name}</h3>
                <p className={`text-2xl font-serif font-bold ${metric.color} mb-1`}>{metric.value}</p>
                <p className={`text-sm ${metric.changeType === "increase" ? "text-green-600" : "text-red-600"}`}>
                  {metric.change} vs mês anterior
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="dental-card p-6">
          <h3 className="text-lg font-serif font-semibold text-gray-900 mb-4">Indicadores de Performance</h3>
          <div className="space-y-4">
            {detailedMetrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">{metric.label}</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">{metric.value}</span>
                  <span className="text-xs text-gray-500">Meta: {metric.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dental-card p-6">
          <h3 className="text-lg font-serif font-semibold text-gray-900 mb-4">Resumo do Período</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Período analisado:</span>
              <span className="font-medium">{mesAtual}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dias úteis:</span>
              <span className="font-medium">{diasUteis} dias</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Média diária:</span>
              <span className="font-medium">R$ {mediaDiaria.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total de pacientes:</span>
              <span className="font-medium">{data.novosPacientes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Faturamento:</span>
              <span className="font-medium text-green-600">R$ {data.faturamentoTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
