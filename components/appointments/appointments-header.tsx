"use client"

import { useEffect, useState } from "react"
import { Plus, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { dentistasApi } from "@/lib/api"

type ViewMode = "day" | "week" | "month"

interface AppointmentsHeaderProps {
  currentDate: Date
  setCurrentDate: (d: Date) => void
  viewMode: ViewMode
  setViewMode: (v: ViewMode) => void
  onRefresh?: () => void
  /** opcional: se quiser reagir ao filtro de dentista */
  onDentistFilterChange?: (dentistId: string | "all") => void
}

export function AppointmentsHeader({
  currentDate,
  setCurrentDate,
  viewMode,
  setViewMode,
  onRefresh,
  onDentistFilterChange,
}: AppointmentsHeaderProps) {
  const [dentistas, setDentistas] = useState<any[]>([])
  const [loadingDentistas, setLoadingDentistas] = useState(true)
  const [dentistFilter, setDentistFilter] = useState<"all" | string>("all")

  useEffect(() => {
    let cancelled = false
    const loadDentistas = async () => {
      try {
        setLoadingDentistas(true)
        const resp = await dentistasApi.getAll(0, 200)
        const items = Array.isArray(resp) ? resp : (resp?.content ?? [])
        if (!cancelled) setDentistas(items)
      } catch (e) {
        console.error("Erro ao carregar dentistas:", e)
        if (!cancelled) setDentistas([])
      } finally {
        if (!cancelled) setLoadingDentistas(false)
      }
    }
    loadDentistas()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    onDentistFilterChange?.(dentistFilter)
  }, [dentistFilter, onDentistFilterChange])

  const formatDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  const navigateDate = (direction: "prev" | "next") => {
    const next = new Date(currentDate)
    if (viewMode === "week") {
      next.setDate(next.getDate() + (direction === "next" ? 7 : -7))
    } else if (viewMode === "month") {
      next.setMonth(next.getMonth() + (direction === "next" ? 1 : -1))
    } else {
      next.setDate(next.getDate() + (direction === "next" ? 1 : -1))
    }
    setCurrentDate(next)
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Agendamentos</h1>
          <p className="text-gray-600">Gerencie todas as consultas da clínica</p>
        </div>
        <div className="flex gap-2">
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              Atualizar
            </Button>
          )}
          <Link href="/agendamentos/novo">
            <Button className="dental-primary">
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </Link>
        </div>
      </div>

      <div className="dental-card p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {formatDate(currentDate)}
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Hoje
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Dia</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={dentistFilter}
              onValueChange={(v) => setDentistFilter(v as "all" | string)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Dentista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Dentistas</SelectItem>

                {loadingDentistas && (
                  <div className="px-3 py-2 text-sm text-gray-500">Carregando...</div>
                )}

                {!loadingDentistas && dentistas.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">Nenhum dentista encontrado</div>
                )}

                {!loadingDentistas &&
                  dentistas.map((d: any) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.nome}{d.especialidade ? ` — ${d.especialidade}` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
