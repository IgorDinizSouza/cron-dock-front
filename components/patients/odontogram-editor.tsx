"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Save, Undo2, LayoutGrid, Smile } from "lucide-react"
import { odontogramApi, proceduresApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

/* =========================================================
   Tipos e helpers
   ========================================================= */

type ToothCode = number // ex.: 11..48
type SurfaceCode = "M" | "D" | "V" | "L" | "O" | "I"

type ToothState = {
  status?: "Sadio" | "Cariado" | "Restaurado" | "Ausente" | "Implante" | "Endo"
  notes?: string
  surfaces?: Partial<Record<SurfaceCode, "x">>
  // NOVOS CAMPOS
  especialidade?: string | null
  procedimentoId?: string | number | null
  procedimentoNome?: string | null
  preco?: number | null
}

type Odontogram = Record<string, ToothState>

type ProcedureItem = {
  id: string | number
  nome: string
  especialidade?: string | null
  preco?: number | null
  ativo?: boolean
}

const UPPER: ToothCode[] = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER: ToothCode[] = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

const ESPEC_COMUNS = [
  "Clínica Geral",
  "Ortodontia",
  "Endodontia",
  "Periodontia",
  "Implantodontia",
  "Cirurgia Oral",
  "Odontopediatria",
  "Prótese Dentária",
  "Estética Dental",
  "Radiologia Odontológica",
]

// normaliza texto para comparações
const norm = (s?: string | null) => (s ?? "").trim()
const normKey = (s?: string | null) => norm(s).toLocaleLowerCase("pt-BR")

function toothKind(code: ToothCode): "molar" | "premolar" | "canine" | "incisor" {
  const n = Number(String(code).slice(-1))
  if ([6, 7, 8].includes(n)) return "molar"
  if ([4, 5].includes(n)) return "premolar"
  if (n === 3) return "canine"
  return "incisor"
}
function centerSurface(kind: ReturnType<typeof toothKind>): SurfaceCode {
  return kind === "molar" || kind === "premolar" ? "O" : "I"
}

function statusColorCls(s?: ToothState["status"]) {
  return s === "Cariado"
    ? "bg-red-100 text-red-800"
    : s === "Restaurado"
      ? "bg-amber-100 text-amber-800"
      : s === "Implante"
        ? "bg-sky-100 text-sky-800"
        : s === "Endo"
          ? "bg-purple-100 text-purple-800"
          : s === "Ausente"
            ? "bg-gray-200 text-gray-700"
            : "bg-emerald-100 text-emerald-800"
}

function normalizeProcedure(raw: any): ProcedureItem | null {
  if (!raw) return null
  const id = raw.id ?? raw.procedureId ?? raw._id
  const nome = raw.nome ?? raw.name ?? raw.title
  const especialidade = raw.especialidade ?? raw.specialty ?? raw.especialidadeNome ?? null

  const precoRaw = raw.preco ?? raw.price ?? raw.valor ?? null
  const preco = precoRaw == null || precoRaw === "" ? null : Number(String(precoRaw).toString().replace(",", "."))

  const ativo = raw.ativo ?? raw.active ?? true

  if (id == null || !nome) return null
  return { id, nome, especialidade: especialidade ?? null, preco, ativo }
}

/* =========================================================
   Componente principal
   ========================================================= */

export function OdontogramEditor({ pacienteId }: { pacienteId: string }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [view, setView] = useState<"blocks" | "teeth">("teeth")

  const [data, setData] = useState<Odontogram>({})
  const [selectedTooth, setSelectedTooth] = useState<ToothCode | null>(null)
  const sel = selectedTooth != null ? (data[String(selectedTooth)] ?? {}) : {}

  // ======== Procedimentos / Especialidades ========
  const [procedures, setProcedures] = useState<ProcedureItem[]>([])

  const especialidades = useMemo(() => {
    const set = new Set<string>()
    procedures.forEach((p) => {
      const esp = norm(p.especialidade)
      if (esp) set.add(esp)
    })
    // adiciona comuns como fallback
    ESPEC_COMUNS.forEach((e) => set.add(e))
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [procedures])

  const procedimentosFiltrados = useMemo(() => {
    const esp = normKey(sel.especialidade)
    return procedures
      .filter((p) => p.ativo ?? true)
      .filter((p) => {
        if (!esp) return true // se não escolher especialidade, lista todos
        return normKey(p.especialidade) === esp
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
  }, [procedures, sel.especialidade])

  const totalProcedimentos = useMemo(() => {
    let soma = 0
    for (const key of Object.keys(data)) {
      const t = data[key]
      if (t?.preco != null && !Number.isNaN(t.preco)) {
        soma += Number(t.preco)
      }
    }
    return soma
  }, [data])

  const load = async () => {
    try {
      setLoading(true)
      const resp = await odontogramApi.get(pacienteId)
      setData(resp || {})
      setDirty(false)
    } catch (e) {
      console.error(e)
      toast({ title: "Erro", description: "Falha ao carregar odontograma.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const loadProcedures = async () => {
    try {
      // carrega todas as páginas
      const raw = await proceduresApi.listAll(25, 200)
      const arr: ProcedureItem[] = (Array.isArray(raw) ? raw : [])
        .map(normalizeProcedure)
        .filter(Boolean) as ProcedureItem[]

      setProcedures(arr)
      if (!arr.length) {
        toast({
          title: "Atenção",
          description:
            "Nenhum procedimento foi encontrado. Verifique se a API está retornando itens e se há especialidades.",
        })
      }
    } catch (e) {
      console.error(e)
      toast({
        title: "Aviso",
        description: "Não foi possível carregar a lista de procedimentos. Verifique o endpoint `proceduresApi`.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    load()
    loadProcedures()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async () => {
    try {
      setLoading(true)
      await odontogramApi.save(pacienteId, data)
      setDirty(false)
      toast({ title: "Salvo", description: "Odontograma atualizado." })
    } catch (e) {
      console.error(e)
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const resetLocal = () => {
    setDirty(false)
    load()
  }

  // ======== Mutators ========
  const toggleSurface = (code: ToothCode, surf: SurfaceCode) => {
    setData((prev) => {
      const key = String(code)
      const cur = prev[key] ?? {}
      const surfaces = { ...(cur.surfaces ?? {}) }
      if (surfaces[surf]) delete surfaces[surf]
      else surfaces[surf] = "x"
      return { ...prev, [key]: { ...cur, surfaces } }
    })
    setDirty(true)
  }
  const setStatus = (code: ToothCode, status: ToothState["status"]) => {
    setData((prev) => {
      const key = String(code)
      const cur = prev[key] ?? {}
      return { ...prev, [key]: { ...cur, status } }
    })
    setDirty(true)
  }
  const setNotes = (code: ToothCode, notes: string) => {
    setData((prev) => {
      const key = String(code)
      const cur = prev[key] ?? {}
      return { ...prev, [key]: { ...cur, notes } }
    })
    setDirty(true)
  }
  const setEspecialidade = (code: ToothCode, especialidade: string | null) => {
    setData((prev) => {
      const key = String(code)
      const cur = prev[key] ?? {}
      return {
        ...prev,
        [key]: { ...cur, especialidade, procedimentoId: null, procedimentoNome: null, preco: null },
      }
    })
    setDirty(true)
  }
  const setProcedimento = (code: ToothCode, procedimentoId: string | number | null) => {
    const proc = procedures.find((p) => String(p.id) === String(procedimentoId))
    setData((prev) => {
      const key = String(code)
      const cur = prev[key] ?? {}
      return {
        ...prev,
        [key]: {
          ...cur,
          procedimentoId,
          procedimentoNome: proc?.nome ?? null,
          preco: proc?.preco != null ? Number(proc.preco) : (cur.preco ?? null),
          especialidade: cur.especialidade ?? (proc?.especialidade || null),
        },
      }
    })
    setDirty(true)
  }
  const setPreco = (code: ToothCode, precoStr: string) => {
    const v = precoStr.replace(",", ".")
    const num = v === "" ? null : Number(v)
    setData((prev) => {
      const key = String(code)
      const cur = prev[key] ?? {}
      return { ...prev, [key]: { ...cur, preco: num } }
    })
    setDirty(true)
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={view === "blocks" ? "default" : "outline"}
        onClick={() => setView("blocks")}
        className={cn(view === "blocks" && "dental-primary")}
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Blocos
      </Button>
      <Button
        type="button"
        variant={view === "teeth" ? "default" : "outline"}
        onClick={() => setView("teeth")}
        className={cn(view === "teeth" && "dental-primary")}
      >
        <Smile className="h-4 w-4 mr-2" />
        Dentes (SVG)
      </Button>

      <div className="ml-2" />

      <Button type="button" variant="outline" onClick={resetLocal} disabled={loading || !dirty}>
        <Undo2 className="h-4 w-4 mr-2" /> Desfazer
      </Button>
      <Button onClick={save} disabled={loading || !dirty} className="dental-primary">
        <Save className="h-4 w-4 mr-2" /> Salvar
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Odontograma</h3>
          {dirty && <p className="text-xs text-amber-600 mt-1">Há alterações não salvas.</p>}
        </div>
        {headerActions}
      </div>

      <div className="dental-card">
        {view === "blocks" ? (
          <BlocksView data={data} onSelect={setSelectedTooth} />
        ) : (
          <TeethView data={data} onSelect={setSelectedTooth} onToggleSurface={toggleSurface} />
        )}
      </div>

      {selectedTooth != null && (
        <>
          {/* overlay SEM cobrir os dropdowns */}
          <div className="fixed inset-0 bg-black/30 z-[40]" onClick={() => setSelectedTooth(null)} />
          <aside
            className="fixed right-0 top-0 bottom-0 z-[61] w-full sm:w-[460px] bg-white shadow-2xl border-l border-gray-200 animate-in slide-in-from-right"
            role="dialog"
            aria-label={`Edição do dente ${selectedTooth}`}
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Dente</div>
                    <div className="text-xl font-semibold">{selectedTooth}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sel.procedimentoNome && (
                      <Badge className="text-xs bg-cyan-100 text-cyan-800 border-cyan-200">
                        {sel.procedimentoNome}
                      </Badge>
                    )}
                    <Badge className={cn("text-xs", statusColorCls(sel.status))}>{sel.status ?? "Sadio"}</Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-5 overflow-auto">
                {/* Status */}
                <section className="space-y-2">
                  <div className="text-sm font-medium text-gray-900">Status</div>
                  <div className="grid grid-cols-2 gap-2">
                    {["Sadio", "Cariado", "Restaurado", "Ausente", "Implante", "Endo"].map((s) => (
                      <Button
                        key={s}
                        variant={sel.status === s ? "default" : "outline"}
                        className={cn("justify-start", sel.status === s && "dental-primary")}
                        onClick={() => setStatus(selectedTooth, s as ToothState["status"])}
                      >
                        <Check className={cn("h-4 w-4 mr-2", sel.status === s ? "opacity-100" : "opacity-0")} />
                        {s}
                      </Button>
                    ))}
                  </div>
                </section>

                {/* Especialidade / Procedimento / Preço */}
                <section className="space-y-3">
                  <div className="text-sm font-medium text-gray-900">Procedimento</div>

                  <div className="space-y-1.5">
                    <Label htmlFor="esp">Especialidade</Label>
                    <Select
                      value={sel.especialidade ?? ""}
                      onValueChange={(v) => setEspecialidade(selectedTooth, v || null)}
                    >
                      <SelectTrigger id="esp">
                        <SelectValue placeholder="Selecione a especialidade" />
                      </SelectTrigger>
                      <SelectContent className="z-[80]">
                        {especialidades.length === 0 && (
                          <div className="px-2 py-1 text-sm text-gray-500">Nenhuma especialidade encontrada</div>
                        )}
                        {especialidades.map((esp) => (
                          <SelectItem key={esp} value={esp}>
                            {esp}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="proc">Procedimento</Label>
                    <Select
                      value={sel.procedimentoId ? String(sel.procedimentoId) : ""}
                      onValueChange={(v) => setProcedimento(selectedTooth, v || null)}
                      disabled={procedimentosFiltrados.length === 0}
                    >
                      <SelectTrigger id="proc">
                        <SelectValue
                          placeholder={procedimentosFiltrados.length ? "Selecione o procedimento" : "Sem itens"}
                        />
                      </SelectTrigger>
                      <SelectContent className="z-[80]">
                        {procedimentosFiltrados.map((p) => (
                          <SelectItem key={String(p.id)} value={String(p.id)}>
                            {p.nome} {p.preco != null && `- R$ ${Number(p.preco).toFixed(2)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="preco">Preço (R$)</Label>
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      value={sel.preco ?? ""}
                      onChange={(e) => setPreco(selectedTooth, e.target.value)}
                      placeholder="0,00"
                    />
                    <p className="text-xs text-gray-500">
                      Ao escolher um procedimento cadastrado, o preço é preenchido automaticamente. Você pode ajustar se
                      necessário.
                    </p>
                  </div>
                </section>

                {/* Observações */}
                <section className="space-y-2">
                  <div className="text-sm font-medium text-gray-900">Observações</div>
                  <Textarea
                    placeholder="Observações deste dente…"
                    value={sel.notes ?? ""}
                    onChange={(e) => setNotes(selectedTooth, e.target.value)}
                    rows={4}
                  />
                </section>
              </div>

              <div className="mt-auto p-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Total</span>: R$ {totalProcedimentos.toFixed(2)}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedTooth(null)}>
                    Fechar
                  </Button>
                  <Button className="dental-primary" onClick={save} disabled={loading || !dirty}>
                    <Save className="h-4 w-4 mr-2" /> Salvar
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}

/* =========================================================
   View 1: Blocos
   ========================================================= */

function BlocksView({ data, onSelect }: { data: Odontogram; onSelect: (t: ToothCode) => void }) {
  const cell = (code: ToothCode) => {
    const s = data[String(code)]?.status
    const hasProc = !!data[String(code)]?.procedimentoNome
    return (
      <button
        key={code}
        onClick={() => onSelect(code)}
        className={cn(
          "h-14 w-14 rounded-xl border flex items-center justify-center text-sm font-semibold relative",
          "transition-all hover:shadow-sm hover:border-cyan-300",
          !s && "bg-white",
        )}
        title={`Dente ${code}`}
      >
        {code}
        {hasProc && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-cyan-500" />}
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-gray-500 mb-2">Arcada Superior</div>
        <div className="flex flex-wrap gap-2">{UPPER.map(cell)}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-2">Arcada Inferior</div>
        <div className="flex flex-wrap gap-2">{LOWER.map(cell)}</div>
      </div>
    </div>
  )
}

/* =========================================================
   View 2: Dentes (SVG)
   ========================================================= */

function TeethView({
  data,
  onSelect,
  onToggleSurface,
}: {
  data: Odontogram
  onSelect: (t: ToothCode) => void
  onToggleSurface: (t: ToothCode, s: SurfaceCode) => void
}) {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs text-gray-500 mb-3">Arcada Superior</div>
        <div className="grid grid-cols-8 gap-10 max-w-[1100px]">
          {UPPER.map((code) => (
            <ToothSVG
              key={code}
              code={code}
              state={data[String(code)]}
              onClickTooth={() => onSelect(code)}
              onToggleSurface={(s) => onToggleSurface(code, s)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-gray-500 mb-3">Arcada Inferior</div>
        <div className="grid grid-cols-8 gap-10 max-w-[1100px]">
          {LOWER.map((code) => (
            <ToothSVG
              key={code}
              code={code}
              state={data[String(code)]}
              onClickTooth={() => onSelect(code)}
              onToggleSurface={(s) => onToggleSurface(code, s)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ToothSVG({
  code,
  state,
  onClickTooth,
  onToggleSurface,
}: {
  code: ToothCode
  state?: ToothState
  onClickTooth: () => void
  onToggleSurface: (s: SurfaceCode) => void
}) {
  const kind = toothKind(code)
  const center = centerSurface(kind)
  const surfaces = state?.surfaces ?? {}

  const fillBase = "fill-white"
  const strokeBase = "stroke-gray-400"
  const active = "fill-cyan-200 stroke-cyan-500"

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg
          width="80"
          height="100"
          viewBox="0 0 80 100"
          className="cursor-pointer drop-shadow-md hover:drop-shadow-lg transition-all"
          onClick={onClickTooth}
        >
          {/* Dente realista baseado no tipo */}
          {kind === "molar" ? (
            // Molar - formato quadrado com raízes
            <>
              <path
                className={`${fillBase} ${strokeBase}`}
                strokeWidth="2"
                d="M15,20 C12,25 10,35 12,45 C14,55 16,65 20,72 C22,76 24,80 28,84 C32,88 48,88 52,84 C56,80 58,76 60,72 C64,65 66,55 68,45 C70,35 68,25 65,20 C62,15 58,12 52,10 C45,8 35,8 28,10 C22,12 18,15 15,20 z"
                fill="url(#toothGradient)"
              />
              {/* Raízes do molar */}
              <path
                className="fill-gray-100 stroke-gray-300"
                strokeWidth="1.5"
                d="M25,84 C23,88 23,92 25,96 M35,84 C33,88 33,92 35,96 M45,84 C43,88 43,92 45,96 M55,84 C53,88 53,92 55,96"
              />
            </>
          ) : kind === "premolar" ? (
            // Pré-molar - formato oval com duas cúspides
            <>
              <path
                className={`${fillBase} ${strokeBase}`}
                strokeWidth="2"
                d="M18,22 C15,28 14,38 16,48 C18,58 22,68 26,75 C28,78 32,82 40,82 C48,82 52,78 54,75 C58,68 62,58 64,48 C66,38 65,28 62,22 C58,16 54,14 48,12 C42,10 38,10 32,12 C26,14 22,16 18,22 z"
                fill="url(#toothGradient)"
              />
              {/* Raízes do pré-molar */}
              <path
                className="fill-gray-100 stroke-gray-300"
                strokeWidth="1.5"
                d="M32,82 C30,86 30,90 32,94 M48,82 C46,86 46,90 48,94"
              />
            </>
          ) : kind === "canine" ? (
            // Canino - formato pontiagudo
            <>
              <path
                className={`${fillBase} ${strokeBase}`}
                strokeWidth="2"
                d="M25,18 C22,22 20,28 20,36 C20,44 22,52 24,60 C26,68 28,76 32,80 C36,84 44,84 48,80 C52,76 54,68 56,60 C58,52 60,44 60,36 C60,28 58,22 55,18 C52,14 48,10 40,10 C32,10 28,14 25,18 z"
                fill="url(#toothGradient)"
              />
              {/* Raiz longa do canino */}
              <path className="fill-gray-100 stroke-gray-300" strokeWidth="1.5" d="M40,84 C38,88 38,94 40,98" />
            </>
          ) : (
            // Incisivo - formato retangular achatado
            <>
              <path
                className={`${fillBase} ${strokeBase}`}
                strokeWidth="2"
                d="M28,16 C25,20 24,26 24,34 C24,42 26,50 28,58 C30,66 32,74 36,78 C38,80 42,80 44,78 C48,74 50,66 52,58 C54,50 56,42 56,34 C56,26 55,20 52,16 C49,12 45,10 40,10 C35,10 31,12 28,16 z"
                fill="url(#toothGradient)"
              />
              {/* Raiz do incisivo */}
              <path className="fill-gray-100 stroke-gray-300" strokeWidth="1.5" d="M40,78 C38,82 38,88 40,92" />
            </>
          )}

          {/* Gradiente para dar volume ao dente */}
          <defs>
            <linearGradient id="toothGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>
          </defs>

          {/* Superfícies clicáveis mais realistas */}
          {/* Mesial */}
          <ellipse
            cx="20"
            cy="45"
            rx="8"
            ry="15"
            className={cn(
              "stroke-[1.5] cursor-pointer opacity-80 hover:opacity-100",
              surfaces.M ? active : "fill-transparent stroke-gray-400",
            )}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSurface("M")
            }}
          />
          {/* Distal */}
          <ellipse
            cx="60"
            cy="45"
            rx="8"
            ry="15"
            className={cn(
              "stroke-[1.5] cursor-pointer opacity-80 hover:opacity-100",
              surfaces.D ? active : "fill-transparent stroke-gray-400",
            )}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSurface("D")
            }}
          />
          {/* Vestibular */}
          <ellipse
            cx="40"
            cy="25"
            rx="15"
            ry="6"
            className={cn(
              "stroke-[1.5] cursor-pointer opacity-80 hover:opacity-100",
              surfaces.V ? active : "fill-transparent stroke-gray-400",
            )}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSurface("V")
            }}
          />
          {/* Lingual/Palatina */}
          <ellipse
            cx="40"
            cy="65"
            rx="15"
            ry="6"
            className={cn(
              "stroke-[1.5] cursor-pointer opacity-80 hover:opacity-100",
              surfaces.L ? active : "fill-transparent stroke-gray-400",
            )}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSurface("L")
            }}
          />
          {/* Centro: O ou I */}
          <ellipse
            cx="40"
            cy="45"
            rx="12"
            ry="10"
            className={cn(
              "stroke-[1.5] cursor-pointer opacity-80 hover:opacity-100",
              surfaces[center] ? active : "fill-transparent stroke-gray-400",
            )}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSurface(center)
            }}
          />
        </svg>

        {(state?.status || state?.procedimentoNome) && (
          <span
            className={cn(
              "absolute -top-2 -right-2 px-2 py-0.5 text-[10px] rounded-full border shadow-sm",
              state?.procedimentoNome ? "bg-cyan-100 text-cyan-800 border-cyan-200" : statusColorCls(state?.status),
            )}
            title={state?.procedimentoNome || state?.status}
          >
            {state?.procedimentoNome ? "💰" : state?.status}
          </span>
        )}
      </div>

      <button
        className="text-xs text-gray-700 font-medium hover:text-cyan-700 transition-colors"
        onClick={onClickTooth}
      >
        {code}
      </button>
    </div>
  )
}
