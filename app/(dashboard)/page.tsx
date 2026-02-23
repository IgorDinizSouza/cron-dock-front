"use client"

import { useEffect, useState } from "react"
import { appointmentsApi, budgetsApi } from "@/lib/api"


interface DashboardStats {
  totalPacientes: number
  consultasHoje: number
  totalProcedimentos: number
  faturamentoMes: number
  consultasPendentes: number
  crescimentoPacientes: number
  crescimentoProcedimentos: number
  crescimentoFaturamento: number
}

interface ConsultaHoje {
  id: string
  horario: string
  paciente: string
  procedimento: string
  status: string
}

export default function RootPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPacientes: 0,
    consultasHoje: 0,
    totalProcedimentos: 0,
    faturamentoMes: 0,
    consultasPendentes: 0,
    crescimentoPacientes: 0,
    crescimentoProcedimentos: 0,
    crescimentoFaturamento: 0,
  })
  const [consultasHoje, setConsultasHoje] = useState<ConsultaHoje[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [agendamentosRes, orcamentosRes] = await Promise.all([
          appointmentsApi.getAll(0, 1000), // agendamentos
          budgetsApi.list(0, 1000), // orçamentos
        ])

        const hoje = new Date().toISOString().split("T")[0]
        const consultasHojeData =
          agendamentosRes.content?.filter((agendamento: any) => agendamento.data?.startsWith(hoje)) || []

        const mesAtual = new Date().getMonth()
        const anoAtual = new Date().getFullYear()

        // Calcular faturamento do mÃªs atual
        const faturamentoMes =
          orcamentosRes.content?.reduce((total: number, orcamento: any) => {
            const dataOrcamento = new Date(orcamento.createdAt || orcamento.data)
            if (dataOrcamento.getMonth() === mesAtual && dataOrcamento.getFullYear() === anoAtual) {
              return total + (orcamento.valorTotal || 0)
            }
            return total
          }, 0) || 0

        setStats({
          totalPacientes: 0,
          consultasHoje: consultasHojeData.length,
          totalProcedimentos: 0,
          faturamentoMes,
          consultasPendentes: consultasHojeData.filter((c: any) => c.status === "AGENDADO").length,
          crescimentoPacientes: Math.floor(Math.random() * 20), // Placeholder atÃ© implementar cÃ¡lculo real
          crescimentoProcedimentos: Math.floor(Math.random() * 30),
          crescimentoFaturamento: Math.floor(Math.random() * 15),
        })

        setConsultasHoje(
          consultasHojeData.slice(0, 5).map((agendamento: any) => ({
            id: agendamento.id,
            horario: agendamento.horario || "00:00",
            paciente: agendamento.pacienteNome || "Paciente nÃ£o informado",
            procedimento: agendamento.procedimentoNome || "Consulta",
            status:
              agendamento.status === "AGENDADO"
                ? "Confirmado"
                : agendamento.status === "EM_ANDAMENTO"
                  ? "Em andamento"
                  : "Pendente",
          })),
        )
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: "24px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
          <p>Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: "24px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "30px", fontWeight: "bold", color: "#1f2937", marginBottom: "8px" }}>Dashboard</h1>
          <p style={{ color: "#6b7280", marginBottom: "4px" }}>Bem-vindo ao Cron Dock</p>
        </div>
      </div>

      {/* Cards de mÃ©tricas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "4px" }}>Pacientes Ativos</p>
              <p style={{ fontSize: "32px", fontWeight: "bold", color: "#0891b2" }}>{stats.totalPacientes}</p>
              <p style={{ color: "#10b981", fontSize: "12px" }}>+{stats.crescimentoPacientes} este mÃªs</p>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#e0f2fe",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ðŸ‘¥
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "4px" }}>Consultas Hoje</p>
              <p style={{ fontSize: "32px", fontWeight: "bold", color: "#0891b2" }}>{stats.consultasHoje}</p>
              <p style={{ color: "#f59e0b", fontSize: "12px" }}>{stats.consultasPendentes} pendentes</p>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#fef3c7",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ðŸ“…
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "4px" }}>Procedimentos</p>
              <p style={{ fontSize: "32px", fontWeight: "bold", color: "#0891b2" }}>{stats.totalProcedimentos}</p>
              <p style={{ color: "#10b981", fontSize: "12px" }}>+{stats.crescimentoProcedimentos}% este mÃªs</p>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#dcfce7",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ðŸ¦·
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "4px" }}>Faturamento</p>
              <p style={{ fontSize: "32px", fontWeight: "bold", color: "#0891b2" }}>
                R$ {(stats.faturamentoMes / 1000).toFixed(1)}k
              </p>
              <p style={{ color: "#10b981", fontSize: "12px" }}>+{stats.crescimentoFaturamento}% este mÃªs</p>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#d1fae5",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ðŸ’°
            </div>
          </div>
        </div>
      </div>

      {/* Consultas de Hoje */}
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937", marginBottom: "16px" }}>Consultas de Hoje</h2>
        <div style={{ gap: "12px" }}>
          {consultasHoje.length > 0 ? (
            consultasHoje.map((appointment, index) => (
              <div
                key={appointment.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: index < consultasHoje.length - 1 ? "1px solid #e5e7eb" : "none",
                }}
              >
                <div>
                  <p style={{ fontWeight: 500, color: "#1f2937" }}>
                    {appointment.horario} - {appointment.paciente}
                  </p>
                  <p style={{ color: "#6b7280", fontSize: "14px" }}>{appointment.procedimento}</p>
                </div>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor:
                      appointment.status === "Confirmado"
                        ? "#dcfce7"
                        : appointment.status === "Em andamento"
                          ? "#fef3c7"
                          : "#fee2e2",
                    color:
                      appointment.status === "Confirmado"
                        ? "#166534"
                        : appointment.status === "Em andamento"
                          ? "#92400e"
                          : "#991b1b",
                  }}
                >
                  {appointment.status}
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: "#6b7280", textAlign: "center", padding: "20px" }}>
              Nenhuma consulta agendada para hoje
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

