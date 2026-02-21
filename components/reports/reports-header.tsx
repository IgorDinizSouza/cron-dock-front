"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Filter, Calendar, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { dentistasApi, proceduresApi } from "@/lib/api"

type DentistId = "all" | string
type ProcedureId = "all" | string

interface ReportsHeaderProps {
  /** Callback opcional ao clicar em Exportar PDF */
  onExportPdf?: (filters: {
    dateRange: { from: Date | null; to: Date | null }
    dentistId: DentistId
    procedureId: ProcedureId
  }) => void

  /** Callback opcional ao clicar em Gerar Relatório */
  onGenerateReport?: (filters: {
    dateRange: { from: Date | null; to: Date | null }
    dentistId: DentistId
    procedureId: ProcedureId
  }) => void

  /** Callback opcional para reagir a qualquer mudança de filtro */
  onFiltersChange?: (filters: {
    dateRange: { from: Date | null; to: Date | null }
    dentistId: DentistId
    procedureId: ProcedureId
  }) => void

  /** Valor inicial opcional do período */
  initialDateRange?: {
    from: Date | null
    to: Date | null
  }
}

export function ReportsHeader({
  onExportPdf,
  onGenerateReport,
  onFiltersChange,
  initialDateRange,
}: ReportsHeaderProps) {
  // ---------- Filtros
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>(() => ({
    from: initialDateRange?.from ?? new Date(2024, 0, 1),
    to: initialDateRange?.to ?? new Date(),
  }))
  const [dentistFilter, setDentistFilter] = useState<DentistId>("all")
  const [procedureFilter, setProcedureFilter] = useState<ProcedureId>("all")

  // ---------- Estados: Dentistas (API)
  const [dentistas, setDentistas] = useState<any[]>([])
  const [loadingDentistas, setLoadingDentistas] = useState<boolean>(true)

  // ---------- Estados: Procedimentos (API)
  const [procedures, setProcedures] = useState<any[]>([])
  const [loadingProcedures, setLoadingProcedures] = useState<boolean>(true)

  // Normalizador: Page<T> | T[] -> T[]
  const normalize = (resp: any) => (Array.isArray(resp) ? resp : (resp?.content ?? []))

  // Carrega Dentistas
  useEffect(() => {
    let cancelled = false
    const loadDentistas = async () => {
      try {
        setLoadingDentistas(true)
        const resp = await dentistasApi.getAll(0, 200)
        const items = normalize(resp)
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

  // Carrega Procedimentos (todos)
  useEffect(() => {
    let cancelled = false
    const loadProcedures = async () => {
      try {
        setLoadingProcedures(true)
        const resp = await proceduresApi.getAll(0, 200)
        const items = normalize(resp)
        if (!cancelled) setProcedures(items)
      } catch (e) {
        console.error("Erro ao carregar procedimentos:", e)
        if (!cancelled) setProcedures([])
      } finally {
        if (!cancelled) setLoadingProcedures(false)
      }
    }
    loadProcedures()
    return () => {
      cancelled = true
    }
  }, [])

  // Monta objeto de filtros e emite callback quando algo muda
  const filters = useMemo(
    () => ({
      dateRange,
      dentistId: dentistFilter,
      procedureId: procedureFilter,
    }),
    [dateRange, dentistFilter, procedureFilter]
  )

  useEffect(() => {
    onFiltersChange?.(filters)
  }, [filters, onFiltersChange])

  // Handlers botões
  const handleExportPdf = () => {
    onExportPdf?.(filters)
  }
  const handleGenerateReport = () => {
    onGenerateReport?.(filters)
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Relatórios</h1>
          <p className="text-gray-600">Análise completa do desempenho da clínica</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportPdf}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button className="dental-primary" onClick={handleGenerateReport}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Gerar Relatório
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="dental-card p-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Período */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Período:</span>
          </div>

          <DatePickerWithRange date={dateRange} setDate={setDateRange} />

          {/* Dentistas (dinâmico da API) */}
          <Select value={dentistFilter} onValueChange={(v) => setDentistFilter(v as DentistId)}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Dentista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Dentistas</SelectItem>

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

          {/* Procedimentos (dinâmico da API) */}
          <Select value={procedureFilter} onValueChange={(v) => setProcedureFilter(v as ProcedureId)}>
            <SelectTrigger className="w-56">
              <SelectValue
                placeholder={loadingProcedures ? "Carregando..." : "Procedimento"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Procedimentos</SelectItem>

              {loadingProcedures && (
                <div className="px-3 py-2 text-sm text-gray-500">Carregando...</div>
              )}

              {!loadingProcedures && procedures.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">Nenhum procedimento encontrado</div>
              )}

              {!loadingProcedures &&
                procedures.map((p: any) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nome}
                    {typeof p.preco !== "undefined" && p.preco !== null
                      ? ` — R$ ${Number(p.preco).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : ""}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Mais Filtros
          </Button>
        </div>
      </div>
    </div>
  )
}
