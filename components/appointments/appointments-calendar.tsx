"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, CalendarClock, MoreHorizontal, Printer, Edit, XIcon, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { appointmentsApi } from "@/lib/api"
import { ReceiptDialog } from "@/components/appointments/receipt-dialog"

type Apt = {
  id: string | number
  consultorioId?: number
  pacienteId?: number
  pacienteNome?: string
  dentistaId?: number
  dentistaNome?: string
  procedimentoId?: number
  procedimentoNome?: string
  dataHora: string // ISO
  duracao?: number
  status?: string
  observacoes?: string
  preco?: number
}

const timeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

export function AppointmentsCalendar() {
  const router = useRouter()
  const { toast } = useToast()

  const [appointments, setAppointments] = useState<Apt[]>([])
  const [loading, setLoading] = useState(true)
  const [openReceipt, setOpenReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<{
    id?: string | number
    pacienteNome?: string
    dentistaNome?: string
    procedimentoNome?: string
    dataHora?: string
    preco?: number
  } | null>(null)

  // semana atual (segunda a domingo)
  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  const weekDays = useMemo(() => {
    const start = new Date(anchorDate)
    const day = start.getDay() === 0 ? 7 : start.getDay() // dom = 7
    // volta até segunda
    start.setDate(start.getDate() - (day - 1))
    start.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [anchorDate])

  const weekKey = useMemo(() => weekDays.map((d) => d.toDateString()).join("|"), [weekDays])

  const loadWeek = useCallback(async () => {
    let cancelled = false

    try {
      setLoading(true)
      const all: Apt[] = []

      const promises = weekDays.map(async (d) => {
        const iso = d.toISOString().slice(0, 10) // yyyy-mm-dd
        const dayItems = await appointmentsApi.getByDate(iso)
        return (dayItems || []).map((a: any) => ({
          id: a.id,
          pacienteId: a.pacienteId,
          pacienteNome: a.pacienteNome ?? a.patient,
          dentistaId: a.dentistaId,
          dentistaNome: a.dentistaNome ?? a.dentist,
          procedimentoId: a.procedimentoId,
          procedimentoNome: a.procedimentoNome ?? a.procedure,
          dataHora: a.dataHora ?? a.date,
          duracao: a.duracao ?? a.duration ?? 60,
          status: a.status,
          observacoes: a.observacoes ?? a.notes,
          preco: a.preco ?? a.price,
        }))
      })

      const results = await Promise.all(promises)
      results.forEach((dayAppointments) => all.push(...dayAppointments))

      if (!cancelled) {
        setAppointments(all)
      }
    } catch (error) {
      if (!cancelled) {
        toast({ title: "Erro", description: "Falha ao carregar agendamentos.", variant: "destructive" })
      }
    } finally {
      if (!cancelled) {
        setLoading(false)
      }
    }

    return () => {
      cancelled = true
    }
  }, [weekDays, toast])

  useEffect(() => {
    let cleanup: (() => void) | undefined

    const load = async () => {
      cleanup = await loadWeek()
    }

    load()

    return () => {
      if (cleanup) cleanup()
    }
  }, [weekKey, loadWeek])

  const getStatusColor = (status?: string) => {
    const s = (status || "").toLowerCase()
    if (s.includes("confirm")) return "bg-green-100 border-green-300 text-green-800"
    if (s.includes("pend") || s.includes("agend")) return "bg-yellow-100 border-yellow-300 text-yellow-800"
    if (s.includes("cancel")) return "bg-gray-100 border-gray-300 text-gray-600"
    return "bg-blue-100 border-blue-300 text-blue-800"
  }

  const sameTime = (iso: string, slot: string) => {
    const d = new Date(iso)
    const hh = String(d.getHours()).padStart(2, "0")
    const mm = String(d.getMinutes()).padStart(2, "0")
    return `${hh}:${mm}` === slot
  }

  const sameDay = (iso: string, day: Date) => {
    const d = new Date(iso)
    return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate()
  }

  const isTimeSlotOccupied = (day: Date, time: string) => {
    return appointments.some((apt) => sameDay(apt.dataHora, day) && sameTime(apt.dataHora, time))
  }

  const handleTimeSlotClick = (day: Date, time: string) => {
    if (isTimeSlotOccupied(day, time)) return // Não permite agendar em horário ocupado

    const dateStr = day.toISOString().slice(0, 10) // yyyy-mm-dd

    router.push(`/agendamentos/novo?date=${dateStr}&time=${time}`)
  }

  const openReceiptFromApt = (apt: Apt) => {
    setReceiptData({
      id: apt.id,
      pacienteNome: apt.pacienteNome,
      dentistaNome: apt.dentistaNome,
      procedimentoNome: apt.procedimentoNome,
      dataHora: apt.dataHora,
      preco: apt.preco,
    })
    setOpenReceipt(true)
  }

  const onCancel = async (apt: Apt) => {
    try {
      await appointmentsApi.updateStatus(String(apt.id), "cancelado")
      toast({ title: "Agendamento cancelado" })
      await loadWeek()
    } catch {
      toast({ title: "Erro", description: "Não foi possível cancelar.", variant: "destructive" })
    }
  }

  const onConfirm = async (apt: Apt) => {
    try {
      await appointmentsApi.updateStatus(String(apt.id), "confirmado")
      toast({ title: "Agendamento confirmado" })
      await loadWeek()
    } catch {
      toast({ title: "Erro", description: "Não foi possível confirmar.", variant: "destructive" })
    }
  }

  const onReschedule = (apt: Apt) => {
    router.push(`/agendamentos/editar/${apt.id}`)
  }

  if (loading) {
    return <div className="dental-card p-6 text-center text-gray-600">Carregando agenda…</div>
  }

  return (
    <>
      <div className="dental-card overflow-hidden">
        {/* Cabeçalho do calendário */}
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-4 bg-gray-50 border-r border-gray-200">
            <span className="text-sm font-medium text-gray-500">Horário</span>
          </div>
          {weekDays.map((day) => (
            <div key={day.toDateString()} className="p-4 bg-gray-50 border-r border-gray-200 last:border-r-0">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">
                  {day.toLocaleDateString("pt-BR", { weekday: "short" })}
                </div>
                <div className="text-lg font-semibold text-gray-900 mt-1">{day.getDate()}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Corpo do calendário */}
        <div className="max-h-[600px] overflow-y-auto">
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-8 border-b border-gray-100 min-h-[60px]">
              {/* Coluna do horário */}
              <div className="p-3 bg-gray-50 border-r border-gray-200 flex items-center">
                <span className="text-sm text-gray-600 font-medium">{time}</span>
              </div>

              {/* Colunas dos dias */}
              {weekDays.map((day) => {
                const isOccupied = isTimeSlotOccupied(day, time)
                const appointmentsInSlot = appointments.filter(
                  (apt) => sameDay(apt.dataHora, day) && sameTime(apt.dataHora, time),
                )

                return (
                  <div
                    key={`${day.toDateString()}-${time}`}
                    className={`border-r border-gray-100 last:border-r-0 p-1 relative ${
                      !isOccupied ? "cursor-pointer hover:bg-cyan-50 transition-colors" : ""
                    }`}
                    onClick={() => !isOccupied && handleTimeSlotClick(day, time)}
                  >
                    {!isOccupied && (
                      <div className="flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTimeSlotClick(day, time)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Agendamentos existentes */}
                    {appointmentsInSlot.map((apt) => (
                      <div
                        key={apt.id}
                        className={`p-2 rounded-md border text-xs transition-shadow ${getStatusColor(apt.status)}`}
                      >
                        <div className="font-medium truncate">{apt.pacienteNome ?? "Paciente"}</div>
                        <div className="text-xs opacity-75 truncate">{apt.procedimentoNome ?? "Procedimento"}</div>
                        <div className="text-xs opacity-75 truncate">{apt.dentistaNome ?? "Dentista"}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs">{time}</span>

                          {/* MENU DE AÇÕES RÁPIDAS */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* EDITAR */}
                              <DropdownMenuItem
                                onClick={() => router.push(`/agendamentos/editar/${apt.id}`)}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>

                              {/* CONFIRMAR */}
                              <DropdownMenuItem onClick={() => onConfirm(apt)} className="gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Confirmar
                              </DropdownMenuItem>

                              {/* REAGENDAR */}
                              <DropdownMenuItem onClick={() => onReschedule(apt)} className="gap-2">
                                <CalendarClock className="h-4 w-4" />
                                Reagendar
                              </DropdownMenuItem>

                              {/* GERAR RECIBO */}
                              <DropdownMenuItem onClick={() => openReceiptFromApt(apt)} className="gap-2">
                                <Printer className="h-4 w-4" />
                                Gerar Recibo
                              </DropdownMenuItem>

                              {/* CANCELAR */}
                              <DropdownMenuItem className="gap-2 text-red-600" onClick={() => onCancel(apt)}>
                                <XIcon className="h-4 w-4" />
                                Cancelar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Diálogo de Recibo */}
      {receiptData && (
        <ReceiptDialog
          open={openReceipt}
          onOpenChange={setOpenReceipt}
          appointment={receiptData}
          clinic={{
            nome: "OdontoCareSys", // Mudando nome da clínica
            cnpj: "12.345.678/0001-99",
            endereco: "Rua Exemplo, 123",
            cidadeUf: "São Paulo - SP",
            telefone: "(11) 0000-0000",
          }}
        />
      )}
    </>
  )
}
