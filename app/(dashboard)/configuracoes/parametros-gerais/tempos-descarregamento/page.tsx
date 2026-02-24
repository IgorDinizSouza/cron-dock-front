"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { especieCargaApi, type EspecieCargaResponse } from "@/lib/especie-carga"
import { tempoDescarregamentoEspecieCargaApi, type TempoDescarregamentoEspecieCargaResponse } from "@/lib/tempo-descarregamento-especie-carga"
import { tempoDescarregamentoPaleteApi, type TempoDescarregamentoPaleteResponse } from "@/lib/tempo-descarregamento-palete"
import { tipoCargaApi, type TipoCargaResponse } from "@/lib/tipo-carga"
import { tipoVeiculoApi, type TipoVeiculoResponse } from "@/lib/tipoveiculo"
import { Edit, Loader2, Save } from "lucide-react"

type PaleteRow = {
  key: string
  tempoId?: number
  tipoVeiculoId: number
  tipoVeiculoNome: string
  tipoCargaId: number
  tipoCargaDescricao: string
  minSku: number | null
  maxSku: number | null
  minutoAtual: number
}

function paleteKey(tipoVeiculoId: number, tipoCargaId: number) {
  return `${tipoVeiculoId}-${tipoCargaId}`
}

function parseMinute(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return 0
  const n = Number(trimmed)
  if (!Number.isFinite(n) || Number.isNaN(n)) return null
  if (n < 0) return null
  return Math.floor(n)
}

export default function TemposDescarregamentoPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  const [especies, setEspecies] = useState<EspecieCargaResponse[]>([])
  const [tiposVeiculo, setTiposVeiculo] = useState<TipoVeiculoResponse[]>([])
  const [tiposCarga, setTiposCarga] = useState<TipoCargaResponse[]>([])

  const [temposEspecie, setTemposEspecie] = useState<TempoDescarregamentoEspecieCargaResponse[]>([])
  const [temposPalete, setTemposPalete] = useState<TempoDescarregamentoPaleteResponse[]>([])

  const [especieDraft, setEspecieDraft] = useState<Record<number, string>>({})
  const [paleteDraft, setPaleteDraft] = useState<Record<string, string>>({})

  const load = async () => {
    try {
      setLoading(true)

      const [especiesRes, tiposVeiculoRes, tiposCargaRes] = await Promise.all([
        especieCargaApi.listAll(),
        tipoVeiculoApi.listAll(),
        tipoCargaApi.listAll(),
      ])

      let [temposEspecieRes, temposPaleteRes] = await Promise.all([
        tempoDescarregamentoEspecieCargaApi.listAll(),
        tempoDescarregamentoPaleteApi.listAll(),
      ])

      // Completa registros faltantes (ou cria tudo, se vier vazio) com minuto = 0
      const especieIdsComTempo = new Set(temposEspecieRes.map((r) => r.especieCargaId))
      const especiesFaltantes = especiesRes.filter((e) => !especieIdsComTempo.has(e.id))
      if (especiesFaltantes.length > 0) {
        await Promise.all(
          especiesFaltantes.map((e) =>
            tempoDescarregamentoEspecieCargaApi.create({
              especieCargaId: e.id,
              minuto: 0,
            }),
          ),
        )
        temposEspecieRes = await tempoDescarregamentoEspecieCargaApi.listAll()
      }

      const paleteKeysComTempo = new Set(
        temposPaleteRes.map((r) => paleteKey(Number(r.tipoVeiculoId), Number(r.tipoCargaId))),
      )
      const combinacoesFaltantes =
        tiposVeiculoRes.length > 0 && tiposCargaRes.length > 0
          ? tiposVeiculoRes.flatMap((tv) =>
              tiposCargaRes
                .filter((tc) => !paleteKeysComTempo.has(paleteKey(tv.id, tc.id)))
                .map((tc) => ({ tv, tc })),
            )
          : []

      if (combinacoesFaltantes.length > 0) {
        const creates = combinacoesFaltantes.map(({ tv, tc }) =>
            tempoDescarregamentoPaleteApi.create({
              tipoVeiculoId: tv.id,
              tipoCargaId: tc.id,
              minuto: 0,
            }),
        )
        await Promise.all(creates)
        temposPaleteRes = await tempoDescarregamentoPaleteApi.listAll()
      }

      const especiesSorted = [...especiesRes].sort((a, b) => a.descricao.localeCompare(b.descricao, "pt-BR"))
      const tiposVeiculoSorted = [...tiposVeiculoRes].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      const tiposCargaSorted = [...tiposCargaRes].sort((a, b) => a.descricao.localeCompare(b.descricao, "pt-BR"))

      setEspecies(especiesSorted)
      setTiposVeiculo(tiposVeiculoSorted)
      setTiposCarga(tiposCargaSorted)
      setTemposEspecie(temposEspecieRes)
      setTemposPalete(temposPaleteRes)

      const especieMap = new Map<number, TempoDescarregamentoEspecieCargaResponse>(
        temposEspecieRes.map((r) => [r.especieCargaId, r]),
      )
      const paleteMap = new Map<string, TempoDescarregamentoPaleteResponse>(
        temposPaleteRes.map((r) => [paleteKey(r.tipoVeiculoId, r.tipoCargaId), r]),
      )

      const especieDraftInit: Record<number, string> = {}
      for (const e of especiesSorted) {
        especieDraftInit[e.id] = String(especieMap.get(e.id)?.minuto ?? 0)
      }

      const paleteDraftInit: Record<string, string> = {}
      for (const tv of tiposVeiculoSorted) {
        for (const tc of tiposCargaSorted) {
          const key = paleteKey(tv.id, tc.id)
          paleteDraftInit[key] = String(paleteMap.get(key)?.minuto ?? 0)
        }
      }

      setEspecieDraft(especieDraftInit)
      setPaleteDraft(paleteDraftInit)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar os tempos de descarregamento.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const especieRecordByEspecieId = useMemo(
    () => new Map<number, TempoDescarregamentoEspecieCargaResponse>(temposEspecie.map((r) => [r.especieCargaId, r])),
    [temposEspecie],
  )

  const paleteRecordByKey = useMemo(
    () => new Map<string, TempoDescarregamentoPaleteResponse>(temposPalete.map((r) => [paleteKey(r.tipoVeiculoId, r.tipoCargaId), r])),
    [temposPalete],
  )

  const paleteRows = useMemo<PaleteRow[]>(() => {
    return tiposVeiculo.flatMap((tv) =>
      tiposCarga.map((tc) => {
        const key = paleteKey(tv.id, tc.id)
        const rec = paleteRecordByKey.get(key)
        return {
          key,
          tempoId: rec?.id,
          tipoVeiculoId: tv.id,
          tipoVeiculoNome: tv.nome,
          tipoCargaId: tc.id,
          tipoCargaDescricao: tc.descricao,
          minSku: tc.minSku,
          maxSku: tc.maxSku,
          minutoAtual: rec?.minuto ?? 0,
        }
      }),
    )
  }, [tiposVeiculo, tiposCarga, paleteRecordByKey])

  const handleSave = async () => {
    try {
      const especieOps: Promise<any>[] = []
      for (const especie of especies) {
        const minute = parseMinute(especieDraft[especie.id] ?? "0")
        if (minute == null) {
          toast({
            title: "Erro",
            description: `Minuto inválido para espécie de carga "${especie.descricao}".`,
            variant: "destructive",
          })
          return
        }
        const existing = especieRecordByEspecieId.get(especie.id)
        const changed = (existing?.minuto ?? 0) !== minute
        if (!changed && existing) continue
        if (existing) {
          especieOps.push(
            tempoDescarregamentoEspecieCargaApi.update(existing.id, {
              especieCargaId: especie.id,
              minuto: minute,
            }),
          )
        } else {
          especieOps.push(
            tempoDescarregamentoEspecieCargaApi.create({
              especieCargaId: especie.id,
              minuto: minute,
            }),
          )
        }
      }

      const paleteOps: Promise<any>[] = []
      for (const row of paleteRows) {
        const minute = parseMinute(paleteDraft[row.key] ?? "0")
        if (minute == null) {
          toast({
            title: "Erro",
            description: `Minuto inválido para ${row.tipoVeiculoNome} / ${row.tipoCargaDescricao}.`,
            variant: "destructive",
          })
          return
        }
        const existing = paleteRecordByKey.get(row.key)
        const changed = (existing?.minuto ?? 0) !== minute
        if (!changed && existing) continue
        if (existing) {
          paleteOps.push(
            tempoDescarregamentoPaleteApi.update(existing.id, {
              tipoVeiculoId: row.tipoVeiculoId,
              tipoCargaId: row.tipoCargaId,
              minuto: minute,
            }),
          )
        } else {
          paleteOps.push(
            tempoDescarregamentoPaleteApi.create({
              tipoVeiculoId: row.tipoVeiculoId,
              tipoCargaId: row.tipoCargaId,
              minuto: minute,
            }),
          )
        }
      }

      setSaving(true)
      await Promise.all([...especieOps, ...paleteOps])
      toast({ title: "Sucesso", description: "Tempos de descarregamento salvos com sucesso." })
      setEditing(false)
      await load()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível salvar os tempos de descarregamento.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    setEditing(false)
    await load()
  }

  if (loading) return <div className="py-12 text-center text-gray-500">Carregando tempos de descarregamento...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tempos de descarregamento padrão</h1>
          <p className="text-gray-600">Parâmetros padrão por espécie de carga e por combinação de palete</p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <Button className="btn-primary-custom" onClick={() => setEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          ) : (
            <>
              <Button type="button" className="btn-primary-custom" onClick={handleCancel} disabled={saving}>
                Cancelar
              </Button>
              <Button className="btn-primary-custom" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tempo de descarregamento acrescentado em cada palete por espécie de carga</CardTitle>
        </CardHeader>
        <CardContent>
          {especies.length === 0 ? (
            <div className="text-sm text-gray-500">Nenhuma espécie de carga cadastrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-700">
                    <th className="px-3 py-3 font-semibold">Padrão</th>
                    {especies.map((e) => (
                      <th key={e.id} className="px-3 py-3 font-semibold">
                        <div>{e.descricao}</div>
                        <div className="text-xs font-normal text-gray-500">Minutos</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-3 py-3 font-medium text-gray-900">Padrão do sistema</td>
                    {especies.map((e) => (
                      <td key={e.id} className="px-3 py-3">
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          value={especieDraft[e.id] ?? "0"}
                          onChange={(ev) => setEspecieDraft((p) => ({ ...p, [e.id]: ev.target.value }))}
                          disabled={!editing || saving}
                          className="h-9 w-28 border-gray-200 bg-white shadow-sm"
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tempo de descarregamento de cada palete</CardTitle>
        </CardHeader>
        <CardContent>
          {paleteRows.length === 0 ? (
            <div className="text-sm text-gray-500">Cadastre tipos de veículo e tipos de carga para montar a tabela.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-700">
                    <th className="px-3 py-3 font-semibold">Tipo de veículo</th>
                    <th className="px-3 py-3 font-semibold">Tipo de carga</th>
                    <th className="px-3 py-3 font-semibold">Min SKU</th>
                    <th className="px-3 py-3 font-semibold">Max SKU</th>
                    <th className="px-3 py-3 font-semibold">Minutos por palete padrão</th>
                    <th className="px-3 py-3 font-semibold">Alterar para</th>
                  </tr>
                </thead>
                <tbody>
                  {paleteRows.map((row) => (
                    <tr key={row.key} className="border-b">
                      <td className="px-3 py-3">{row.tipoVeiculoNome}</td>
                      <td className="px-3 py-3">{row.tipoCargaDescricao}</td>
                      <td className="px-3 py-3">{row.minSku ?? "-"}</td>
                      <td className="px-3 py-3">{row.maxSku ?? "-"}</td>
                      <td className="px-3 py-3 font-medium text-gray-900">{row.minutoAtual}</td>
                      <td className="px-3 py-3">
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          value={paleteDraft[row.key] ?? String(row.minutoAtual)}
                          onChange={(ev) => setPaleteDraft((p) => ({ ...p, [row.key]: ev.target.value }))}
                          disabled={!editing || saving}
                          className="h-9 w-28 border-gray-200 bg-white shadow-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
