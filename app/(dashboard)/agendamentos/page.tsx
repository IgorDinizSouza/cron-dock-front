"use client"

import { useCallback, useState } from "react"
import { AppointmentsCalendar } from "@/components/appointments/appointments-calendar"

export default function AgendamentosPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")
  const [reloadKey, setReloadKey] = useState(0)

  const onRefresh = useCallback(() => {
    setReloadKey((k) => k + 1)
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
            <p className="text-sm text-gray-600">Calendario de consultas</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setViewMode("day")} className={`rounded-md px-3 py-2 text-sm ${viewMode === "day" ? "bg-orange-500 text-white" : "border bg-white text-gray-700"}`}>Dia</button>
            <button type="button" onClick={() => setViewMode("week")} className={`rounded-md px-3 py-2 text-sm ${viewMode === "week" ? "bg-orange-500 text-white" : "border bg-white text-gray-700"}`}>Semana</button>
            <button type="button" onClick={() => setViewMode("month")} className={`rounded-md px-3 py-2 text-sm ${viewMode === "month" ? "bg-orange-500 text-white" : "border bg-white text-gray-700"}`}>Mes</button>
            <button type="button" onClick={onRefresh} className="rounded-md border bg-white px-3 py-2 text-sm text-gray-700">Atualizar</button>
          </div>
        </div>
      </div>

      <div key={`${viewMode}-${currentDate.toDateString()}-${reloadKey}`}>
        <AppointmentsCalendar currentDate={currentDate} viewMode={viewMode} />
      </div>
    </div>
  )
}