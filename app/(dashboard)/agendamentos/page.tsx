"use client"

import { useCallback, useState } from "react"
import { AppointmentsHeader } from "@/components/appointments/appointments-header"
import { AppointmentsCalendar } from "@/components/appointments/appointments-calendar"

export default function AgendamentosPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")
  const [reloadKey, setReloadKey] = useState(0)

  const onRefresh = useCallback(() => {
    // força recarregar o calendário (muda a key do componente)
    setReloadKey((k) => k + 1)
  }, [])

  return (
    <div className="space-y-6">
      <AppointmentsHeader
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onRefresh={onRefresh}
      />
      {/* reloadKey obriga o calendário a refazer a busca quando você clicar em “Atualizar” */}
      <div key={`${viewMode}-${currentDate.toDateString()}-${reloadKey}`}>
        <AppointmentsCalendar currentDate={currentDate} viewMode={viewMode} />
      </div>
    </div>
  )
}
