"use client"

import { useEffect, useState, useCallback } from "react"
import { fichasApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Stethoscope, Calendar, User, Loader2, ChevronRight, ChevronDown } from "lucide-react"

type RecordEntry = {
  id: string | number
  pacienteId?: number | string
  dentistaId?: number | string
  dentistaNome?: string
  procedimentoId?: number | string
  procedimentoNome?: string
  dataHora: string
  queixa?: string
  anamnese?: string
  observacoes?: string
  conduta?: string
  prescricoes?: string
}

export function PatientRecordList({
  pacienteId,
  reloadKey,
  onEdit,
  pageSize = 20,
  forceOpenAll = false,
}: {
  pacienteId: string | number
  reloadKey?: number
  onEdit: (record: RecordEntry) => void
  pageSize?: number
  forceOpenAll?: boolean
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<RecordEntry[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [open, setOpen] = useState<Set<string | number>>(new Set())

  const mapRecord = (r: any): RecordEntry => ({
    id: r.id ?? r.fichaId,
    pacienteId: r.pacienteId ?? r.paciente?.id,
    dentistaId: r.dentistaId ?? r.dentista?.id,
    dentistaNome: r.dentistaNome ?? r.dentista?.nome ?? r.profissionalNome,
    procedimentoId: r.procedimentoId ?? r.procedimento?.id,
    procedimentoNome: r.procedimentoNome ?? r.procedimento?.nome,
    dataHora: r.dataHora ?? r.data ?? r.createdAt ?? new Date().toISOString(),
    queixa: r.queixa,
    anamnese: r.anamnese,
    observacoes: r.observacoes ?? r.observacao,
    conduta: r.conduta,
    prescricoes: r.prescricoes ?? r.prescricao,
  })

  const load = useCallback(
    async (pageNumber = page) => {
      let cancelled = false

      try {
        setLoading(true)
        const result: any = await fichasApi.listByPatient(pacienteId as any, pageNumber, pageSize)

        if (!cancelled) {
          const content = result?.content ?? []
          const mapped = content.map(mapRecord).sort((a: any, b: any) => (a.dataHora < b.dataHora ? 1 : -1))
          setItems(mapped)
          setTotalPages(result?.totalPages ?? 1)
          setTotalElements(result?.totalElements ?? mapped.length)
          setPage(result?.number ?? pageNumber)
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e)
          toast({ title: "Erro", description: "Falha ao carregar a ficha.", variant: "destructive" })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }

      return () => {
        cancelled = true
      }
    },
    [pacienteId, pageSize, toast],
  )

  useEffect(() => {
    let cleanup: (() => void) | undefined

    if (pacienteId) {
      const loadData = async () => {
        cleanup = await load(0)
      }
      loadData()
    }

    return () => {
      if (cleanup) cleanup()
    }
  }, [pacienteId, load])

  useEffect(() => {
    let cleanup: (() => void) | undefined

    if (pacienteId && reloadKey !== undefined) {
      const reloadData = async () => {
        cleanup = await load(page)
      }
      reloadData()
    }

    return () => {
      if (cleanup) cleanup()
    }
  }, [reloadKey, pacienteId, page, load])

  useEffect(() => {
    if (forceOpenAll) {
      setOpen(new Set(items.map((i) => i.id)))
    } else {
      setOpen(new Set())
    }
  }, [forceOpenAll, items])

  const remove = async (id: string | number) => {
    if (!confirm("Confirma excluir esta anotação?")) return
    try {
      await fichasApi.delete(id as any)
      toast({ title: "Removido", description: "Anotação excluída com sucesso." })
      if (items.length === 1 && page > 0) await load(page - 1)
      else await load(page)
    } catch {
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" })
    }
  }

  const toggleOpen = (id: string | number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  if (loading) {
    return (
      <div className="p-6 text-gray-600 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando ficha…
      </div>
    )
  }

  if (!items.length) {
    return <div className="p-6 text-gray-600">Ainda não há anotações na ficha.</div>
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {items.map((rec) => {
          const d = new Date(rec.dataHora)
          const hasValidDate = !isNaN(d.getTime())
          const dataStr = hasValidDate
            ? d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
            : rec.dataHora
          const horaStr = hasValidDate ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""

          const isOpen = forceOpenAll || open.has(rec.id)

          return (
            <li
              key={rec.id}
              className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow"
            >
              {/* Cabeçalho (não alterna quando forceOpenAll=true) */}
              <button
                type="button"
                onClick={() => {
                  if (!forceOpenAll) toggleOpen(rec.id)
                }}
                className="w-full text-left p-4 flex items-start justify-between gap-4"
                aria-expanded={isOpen}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {dataStr} {horaStr && <>às {horaStr}</>}
                    </span>

                    {rec.dentistaNome && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        <User className="h-4 w-4" />
                        {rec.dentistaNome}
                      </span>
                    )}

                    {rec.procedimentoNome && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700">
                        <Stethoscope className="h-4 w-4" />
                        {rec.procedimentoNome}
                      </span>
                    )}
                  </div>

                  {/* preview resumido */}
                  <p className="text-sm text-gray-800 line-clamp-1">
                    {rec.queixa || rec.anamnese || rec.observacoes || rec.conduta || rec.prescricoes || "—"}
                  </p>
                </div>

                {/* Botões de ação somem na impressão/forceOpenAll */}
                {!forceOpenAll && (
                  <div className="flex items-center gap-2 shrink-0 no-print">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(rec)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        remove(rec.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Excluir
                    </Button>
                    {isOpen ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                )}
              </button>

              {/* Detalhes */}
              {isOpen && (
                <div className="px-4 pb-4">
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {rec.queixa && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="font-medium text-gray-900 mb-1">Queixa principal</div>
                        <p className="text-gray-700">{rec.queixa}</p>
                      </div>
                    )}
                    {rec.anamnese && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="font-medium text-gray-900 mb-1">Anamnese / Exame</div>
                        <p className="text-gray-700">{rec.anamnese}</p>
                      </div>
                    )}
                    {rec.observacoes && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="font-medium text-gray-900 mb-1">Observações / Procedimento</div>
                        <p className="text-gray-700">{rec.observacoes}</p>
                      </div>
                    )}
                    {rec.conduta && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="font-medium text-gray-900 mb-1">Conduta</div>
                        <p className="text-gray-700">{rec.conduta}</p>
                      </div>
                    )}
                    {rec.prescricoes && (
                      <div className="bg-gray-50 rounded-lg p-3 md:col-span-2">
                        <div className="font-medium text-gray-900 mb-1">Prescrições</div>
                        <p className="text-gray-700 whitespace-pre-wrap">{rec.prescricoes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {/* Paginação também some na impressão */}
      {!forceOpenAll && (
        <div className="flex items-center justify-between pt-1 no-print">
          <span className="text-sm text-gray-600">
            Página {page + 1} de {totalPages} • {totalElements} registros
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => load(page - 1)}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => load(page + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
