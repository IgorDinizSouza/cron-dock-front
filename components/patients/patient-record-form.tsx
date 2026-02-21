"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { patientRecordsApi, dentistasApi, proceduresApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, X } from "lucide-react"

type FormData = {
  dataHora: string
  dentistaId?: string
  procedimentoId?: string
  queixa?: string
  anamnese?: string
  observacoes?: string
  conduta?: string
  prescricoes?: string
}

export function PatientRecordForm({
  pacienteId,
  initialData,
  onSaved,
  onCancel,
}: {
  pacienteId: string
  initialData?: any | null
  onSaved: () => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dentistas, setDentistas] = useState<any[]>([])
  const [procedimentos, setProcedimentos] = useState<any[]>([])

  const [form, setForm] = useState<FormData>({
    dataHora: initialData?.dataHora
      ? initialData.dataHora
      : new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    dentistaId: initialData?.dentistaId ? String(initialData.dentistaId) : "",
    procedimentoId: initialData?.procedimentoId ? String(initialData.procedimentoId) : "",
    queixa: initialData?.queixa || "",
    anamnese: initialData?.anamnese || "",
    observacoes: initialData?.observacoes || "",
    conduta: initialData?.conduta || "",
    prescricoes: initialData?.prescricoes || "",
  })

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const densPage: any = await dentistasApi.getAll(0, 100, "")
        const dens = densPage?.content ?? densPage ?? []
        setDentistas(dens)

        const procsPage: any = await proceduresApi.getAll(0, 200, "")
        const procs = procsPage?.content ?? procsPage ?? []
        setProcedimentos(procs)
      } catch {
        /* silencioso */
      }
    }
    loadRefs()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form }
      if (initialData?.id) {
        await patientRecordsApi.update(initialData.id, payload)
        toast({ title: "Salvo", description: "Anotação atualizada com sucesso." })
      } else {
        await patientRecordsApi.create(pacienteId, payload)
        toast({ title: "Salvo", description: "Anotação criada com sucesso." })
      }
      onSaved()
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err?.message || "Não foi possível salvar a anotação.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Seção 1 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Dados da consulta</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label>Data e Hora *</Label>
            <Input
              type="datetime-local"
              value={form.dataHora}
              onChange={(e) => setForm((p) => ({ ...p, dataHora: e.target.value }))}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label>Dentista</Label>
            <Select
              value={form.dentistaId || ""}
              onValueChange={(v) => setForm((p) => ({ ...p, dentistaId: v }))}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o dentista" />
              </SelectTrigger>
              <SelectContent>
                {(dentistas || []).map((d: any) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Procedimento</Label>
            <Select
              value={form.procedimentoId || ""}
              onValueChange={(v) => setForm((p) => ({ ...p, procedimentoId: v }))}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o procedimento" />
              </SelectTrigger>
              <SelectContent>
                {(procedimentos || []).map((p: any) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nome} {p.preco ? `- R$ ${p.preco}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Seção 2 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Conteúdo da evolução</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Queixa principal</Label>
            <Textarea
              value={form.queixa}
              onChange={(e) => setForm((p) => ({ ...p, queixa: e.target.value }))}
              placeholder="Relato do paciente…"
              rows={4}
              disabled={loading}
            />
          </div>
          <div>
            <Label>Anamnese / Exame físico</Label>
            <Textarea
              value={form.anamnese}
              onChange={(e) => setForm((p) => ({ ...p, anamnese: e.target.value }))}
              placeholder="Anamnese, exames, achados clínicos…"
              rows={4}
              disabled={loading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Observações / Procedimento realizado</Label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
              placeholder="Detalhes do procedimento, orientações…"
              rows={4}
              disabled={loading}
            />
          </div>
          <div>
            <Label>Conduta / Prescrições</Label>
            <Textarea
              value={form.prescricoes}
              onChange={(e) => setForm((p) => ({ ...p, prescricoes: e.target.value }))}
              placeholder="Medicações, cuidados, retorno…"
              rows={4}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" className="dental-primary" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
      </div>
    </form>
  )
}
