"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Save, Trash2, CheckCircle2, Baby, User, Plus } from "lucide-react"
import { useNotification } from "@/contexts/notification-context"
import { proceduresApi, odontogramApi, budgetsApi } from "@/lib/api"
import { emitBudgetChanged } from "@/components/patients/budget-history-section"

/* =========================
 * Tipos
 * ========================= */
type ToothRecord = {
  /** Identificador único do item do orçamento (não depende do número do dente) */
  recordId: string
  toothNumber?: string
  status: string // higido | cariado | restaurado | ausente | implante | protese | endodontia | extracao_indicada
  specialty: string
  procedureId?: string | number | null
  procedure: string
  price: number
  notes?: string
}

type ProcedureItem = {
  id: string | number
  nome: string
  especialidade?: string | null
  preco?: number | null
  ativo?: boolean
}

type DentalRecordWorkflowProps = {
  pacienteId: string
  patientName: string
  clinic?: {
    name: string
    address?: string
    phone?: string
  }
}

type DentitionType = "permanent" | "deciduous"

/* =========================
 * Constantes
 * ========================= */
const TOOTH_STATUSES = [
  { value: "higido", label: "Hígido", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { value: "cariado", label: "Cariado", color: "bg-red-100 text-red-800 border-red-300" },
  { value: "restaurado", label: "Restaurado", color: "bg-green-100 text-green-800 border-green-300" },
  { value: "ausente", label: "Ausente", color: "bg-gray-100 text-gray-800 border-gray-300" },
  { value: "implante", label: "Implante", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { value: "protese", label: "Prótese", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "endodontia", label: "Endodontia", color: "bg-orange-100 text-orange-800 border-orange-300" },
  { value: "extracao_indicada", label: "Extração Indicada", color: "bg-red-200 text-red-900 border-red-400" },
]

const STATUS_TO_BACK: Record<string, string> = {
  higido: "Sadio",
  cariado: "Cariado",
  restaurado: "Restaurado",
  ausente: "Ausente",
  implante: "Implante",
  protese: "Restaurado",
  endodontia: "Endo",
  extracao_indicada: "Extração Indicada",
}
const STATUS_FROM_BACK: Record<string, string> = {
  Sadio: "higido",
  Cariado: "cariado",
  Restaurado: "restaurado",
  Ausente: "ausente",
  Implante: "implante",
  Endo: "endodontia",
  "Extração Indicada": "extracao_indicada",
}

const PERMANENT_TEETH = {
  upper: ["18","17","16","15","14","13","12","11","21","22","23","24","25","26","27","28"],
  lower: ["48","47","46","45","44","43","42","41","31","32","33","34","35","36","37","38"],
}

const DECIDUOUS_TEETH = {
  upper: ["55","54","53","52","51","61","62","63","64","65"],
  lower: ["85","84","83","82","81","71","72","73","74","75"],
}

/* =========================
 * Helpers
 * ========================= */
const norm = (s?: string | null) => (s ?? "").trim()
const normKey = (s?: string | null) => norm(s).toLocaleLowerCase("pt-BR")

const normalizeProcedure = (raw: any): ProcedureItem | null => {
  if (!raw) return null
  const id = raw.id ?? raw.procedureId ?? raw._id
  const nome = raw.nome ?? raw.name ?? raw.title
  const especialidade = raw.especialidade ?? raw.categoria ?? raw.specialty ?? raw.especialidadeNome ?? null
  const precoRaw = raw.preco ?? raw.price ?? raw.valor ?? null
  const preco = precoRaw == null || precoRaw === "" ? null : Number(String(precoRaw).replace(",", "."))
  const ativo = raw.ativo ?? raw.active ?? true
  if (id == null || !nome) return null
  return { id, nome, especialidade: especialidade ?? null, preco, ativo }
}

// Currency helpers (pt-BR)
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 })
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const formatBRL = (n: number) => BRL.format(isFinite(n) ? n : 0)
const parseBRL = (s: string) => {
  const digits = s.replace(/[^\d]/g, "")
  return digits ? Number(digits) / 100 : 0
}
const MIN_PRICE = 0.01 // não deixar zerar

// converte estado salvo no odontograma → registro da UI (mantido para compat, mas não usamos p/ hidratar itens)
const fromOdontoToRecord = (toothNumber: string, t: any): Omit<ToothRecord, "recordId"> | null => {
  if (!t) return null
  return {
    toothNumber,
    status: STATUS_FROM_BACK[t.status ?? "Sadio"] ?? "higido",
    specialty: norm(t.especialidade) || "",
    procedureId: t.procedimentoId ?? null,
    procedure: norm(t.procedimentoNome) || "",
    price: Number(t.preco ?? 0),
    notes: t.notes ?? "",
  }
}

// converte registro da UI → formato do odontograma (apenas estado/notes/especialidade)
const toOdontoTooth = (r: Partial<ToothRecord>) => ({
  status: STATUS_TO_BACK[r.status ?? "higido"] ?? "Sadio",
  notes: r.notes ?? "",
  especialidade: r.specialty || null,
})

/* =========================
 * Componente
 * ========================= */
export function DentalRecordWorkflow({ pacienteId, patientName, clinic }: DentalRecordWorkflowProps) {
  const { showSuccess, showError, showWarning } = useNotification()

  const [selectedTooth, setSelectedTooth] = useState<string>("")
  const [toothlessMode, setToothlessMode] = useState<boolean>(false)
  const [currentRecord, setCurrentRecord] = useState<Partial<ToothRecord>>({})
  const [savedRecords, setSavedRecords] = useState<ToothRecord[]>([])

  const [dentitionType, setDentitionType] = useState<DentitionType>("permanent")

  const [odontoMap, setOdontoMap] = useState<Record<string, any>>({})
  const [loadingOdonto, setLoadingOdonto] = useState(false)
  const [saving, setSaving] = useState(false)

  const [procedures, setProcedures] = useState<ProcedureItem[]>([])
  const [loadingProcedures, setLoadingProcedures] = useState(false)

  // ---- controles de preço e desconto
  const [basePrice, setBasePrice] = useState<number>(0)
  const [priceInput, setPriceInput] = useState<string>(formatBRL(0))
  const [discountMode, setDiscountMode] = useState<"percent" | "amount">("percent")
  const [discountInput, setDiscountInput] = useState<string>("")

  const currentTeeth = useMemo(
    () => (dentitionType === "permanent" ? PERMANENT_TEETH : DECIDUOUS_TEETH),
    [dentitionType],
  )

  /* -------- Carregar dados do backend -------- */
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoadingOdonto(true)
        const map = (await odontogramApi.get(pacienteId)) || {}
        setOdontoMap(map)
        // ⚠️ NÃO hidratar savedRecords a partir do odontograma (ele guarda no máximo 1 por dente)
        // Mantemos os itens do orçamento separados em savedRecords
      } catch {
        showError("Erro", "Falha ao carregar odontograma.")
      } finally {
        setLoadingOdonto(false)
      }

      try {
        setLoadingProcedures(true)
        const raw = await proceduresApi.listAll(25, 200)
        const arr: ProcedureItem[] = (Array.isArray(raw) ? raw : [])
          .map(normalizeProcedure)
          .filter(Boolean) as ProcedureItem[]
        setProcedures(arr)
        if (!arr.length) showWarning("Atenção", "Nenhum procedimento cadastrado no sistema.")
      } catch {
        showError("Erro", "Falha ao carregar procedimentos.")
      } finally {
        setLoadingProcedures(false)
      }
    }
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId])

  /* -------- Backfill de IDs para registros antigos (opcional) -------- */
  useEffect(() => {
    if (!procedures.length || !savedRecords.length) return
    let changed = false
    const fixed = savedRecords.map((r) => {
      if (r.procedureId || !r.procedure) return r
      const match = procedures.find(
        (p) => p.nome === r.procedure && normKey(p.especialidade) === normKey(r.specialty),
      )
      if (match) {
        changed = true
        return { ...r, procedureId: match.id, price: r.price || match.preco || 0 }
      }
      return r
    })
    if (changed) setSavedRecords(fixed)
  }, [procedures, savedRecords])

  /* -------- Especialidades & Procedimentos filtrados -------- */
  const specialtiesFromSystem = useMemo(() => {
    const set = new Set<string>()
    procedures
      .filter((p) => p.ativo ?? true)
      .forEach((p) => {
        const esp = norm(p.especialidade)
        if (esp) set.add(esp)
      })
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [procedures])

  const availableProcedures = useMemo(() => {
    const espKey = normKey(currentRecord.specialty)
    if (!espKey) return []
    return procedures
      .filter((p) => p.ativo ?? true)
      .filter((p) => normKey(p.especialidade) === espKey)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
  }, [procedures, currentRecord.specialty])

  // ao trocar especialidade, limpa procedimento/valor/discount
  useEffect(() => {
    setCurrentRecord((prev) => ({ ...prev, procedure: "", procedureId: null, price: 0 }))
    setBasePrice(0)
    setPriceInput(formatBRL(0))
    setDiscountInput("")
  }, [currentRecord.specialty])

  // Select de procedimento **com value = ID** e preenchendo o preço
  const onChangeProcedureById = (val: string) => {
    const id = val ? Number(val) : null
    const proc = availableProcedures.find((p) => String(p.id) === String(id))
    const preco = Number(proc?.preco ?? 0)
    const final = Math.max(MIN_PRICE, preco)
    setCurrentRecord((prev) => ({
      ...prev,
      procedureId: id,
      procedure: proc?.nome ?? "",
      price: final,
    }))
    setBasePrice(final)
    setPriceInput(formatBRL(final))
    setDiscountInput("")
  }

  // Input de valor com máscara BRL (sem spinedit)
  const onChangePriceMasked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(MIN_PRICE, parseBRL(e.target.value))
    setPriceInput(formatBRL(v))
    setBasePrice(v)
    setDiscountInput("")
    setCurrentRecord((prev) => ({ ...prev, price: v }))
  }

  // Desconto (percentual ou valor) — nunca deixa o valor final zerar
  const applyDiscountOverBase = (raw: string) => {
    setDiscountInput(raw)

    let newPrice = basePrice
    if (!raw) {
      setCurrentRecord((prev) => ({ ...prev, price: basePrice }))
      setPriceInput(formatBRL(basePrice))
      return
    }

    if (discountMode === "percent") {
      const pct = clamp(Number(raw.replace(/[^\d.,]/g, "").replace(",", ".")) || 0, 0, 99.99) // evita 100%
      newPrice = basePrice * (1 - pct / 100)
    } else {
      const off = parseBRL(raw)
      newPrice = basePrice - off
    }

    newPrice = Math.max(MIN_PRICE, newPrice)
    setCurrentRecord((prev) => ({ ...prev, price: newPrice }))
    setPriceInput(formatBRL(newPrice))
  }

  /* -------- Ações -------- */
  const handleToothClick = (toothNumber: string) => {
    setSelectedTooth(toothNumber)
    // Sempre começa um novo registro para este dente (pode haver vários no orçamento)
    const record = {
      toothNumber,
      status: STATUS_FROM_BACK[odontoMap[toothNumber]?.status] ?? "higido",
      specialty: odontoMap[toothNumber]?.especialidade ?? "",
      procedureId: null,
      procedure: "",
      price: 0,
      notes: odontoMap[toothNumber]?.notes ?? "",
    } as Partial<ToothRecord>
    setCurrentRecord(record)
    setBasePrice(0)
    setPriceInput(formatBRL(0))
    setDiscountInput("")
  }

  const startToothlessFlow = () => {
  setSelectedTooth("")
  setToothlessMode(true)
  setCurrentRecord({
    status: "higido",       // irrelevante no geral
    specialty: "",
    procedureId: null,
    procedure: "",
    price: 0,
    notes: "",
  })
  setBasePrice(0)
  setPriceInput(formatBRL(0))
  setDiscountInput("")
 }


  const persistOdonto = async (newMap: Record<string, any>) => {
    await odontogramApi.save(pacienteId, newMap)
    setOdontoMap(newMap)
  }

  const handleSaveRecord = async () => {
     const isToothless = !!toothlessMode || !currentRecord.toothNumber
    if (!currentRecord.status || !currentRecord.specialty) {
       showWarning("Campos obrigatórios", "Preencha estado e especialidade.")
       return
    }
    if (!currentRecord.procedureId) {
      showWarning("Procedimento obrigatório", "Selecione um procedimento válido (com ID).")
      return
    }

    const rec: ToothRecord = {
      recordId: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
      toothNumber: isToothless ? undefined : currentRecord.toothNumber!,
      status: currentRecord.status!,
      specialty: currentRecord.specialty!,
      procedure: currentRecord.procedure || "",
      procedureId: currentRecord.procedureId,
      price: Math.max(MIN_PRICE, currentRecord.price || 0),
      notes: currentRecord.notes ?? "",
    }
    try {
      setSaving(true)

      // ✅ Apenas adiciona (permite múltiplos itens por dente)
      setSavedRecords((prev) => [...prev, rec])

      // ✅ Persistir no odontograma apenas estado/notes/especialidade (não itens)
      if (!isToothless && rec.toothNumber) {
          const prevTooth = odontoMap[rec.toothNumber] ?? {}
          const newMap = { ...odontoMap, [rec.toothNumber]: { ...prevTooth, ...toOdontoTooth(rec) } }
          await persistOdonto(newMap)
      }

      showSuccess("Registro salvo", isToothless ? "Procedimento geral salvo" : `Dente ${rec.toothNumber} salvo com sucesso`)
      setSelectedTooth("")
      setCurrentRecord({})
      setDiscountInput("")
      setToothlessMode(false)
    } catch {
      showError("Erro", "Não foi possível salvar este dente.")
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveRecord = async (recordId: string, toothNumber?: string) => {
    try {
      setSaving(true)
      setSavedRecords((prev) => prev.filter((r) => r.recordId !== recordId))

      // Se era o último item do dente, opcionalmente persistir mudança no odontograma (aqui mantemos como está)
      const aindaTem = savedRecords.some((r) => r.recordId !== recordId && r.toothNumber === toothNumber)
      if (!aindaTem) {
        // escolha: manter status/notes existentes (não alterar odontograma) — se quiser resetar, descomente:
        // const newMap = { ...odontoMap, [toothNumber]: { status: "Sadio", notes: "" } }
        // await persistOdonto(newMap)
      }

      showSuccess("Registro removido", `Item do dente ${toothNumber} removido`)
    } catch {
      showError("Erro", "Falha ao remover o item.")
    } finally {
      setSaving(false)
    }
  }

  const handleFinalizeBudget = async () => {
    try {
      if (!pacienteId) {
        showWarning("Atenção", "Paciente inválido.")
        return
      }
      if (savedRecords.length === 0) {
        showWarning("Nada a salvar", "Adicione pelo menos um dente/procedimento.")
        return
      }

      const semId = savedRecords.filter((r) => !r.procedureId)
      if (semId.length > 0) {
        const dentes = semId.map((r) => r.toothNumber).join(", ")
        showWarning(
          "Procedimentos sem ID",
          `Os dentes ${dentes} não têm procedimento vinculado corretamente. Re-selecione o procedimento para esses dentes.`,
        )
        return
      }

      setSaving(true)

      // 1) Sincroniza odontograma (somente estado/notes/especialidade)
      const merged: Record<string, any> = { ...odontoMap }
      savedRecords.forEach((r) => {
        if (r.toothNumber) {
            merged[r.toothNumber] = { ...(merged[r.toothNumber] ?? {}), ...toOdontoTooth(r) }
        }
      })
      await persistOdonto(merged)

      // 2) Monta payload do orçamento (permite múltiplos itens por dente)
      const itens = savedRecords.map((r) => ({
        dente: r.toothNumber ?? null,
        procedimentoId: Number(r.procedureId),
        nomeProcedimento: r.procedure,
        categoria: r.specialty || null,
        quantidade: 1,
        descontoPercent: 0,
        precoUnit: Math.max(MIN_PRICE, r.price ?? 0),
      }))

      const payload = {
        pacienteId,
        observacoes: `Gerado via odontograma. Itens: ${savedRecords.length}`,
        itens,
      }

      // 3) Cria orçamento
      const created = await budgetsApi.create(payload)
      showSuccess("Orçamento concluído", `Orçamento #${created?.id ?? ""} criado com sucesso.`)
      emitBudgetChanged()
    } catch (e) {
      console.error(e)
      showError("Erro", "Não foi possível concluir o orçamento.")
    } finally {
      setSaving(false)
    }
  }

  const getTotalBudget = () => savedRecords.reduce((total, record) => total + record.price, 0)

  // Status do dente agora vem do odontograma (fonte de verdade do estado)
  const getToothStatus = (toothNumber: string) => {
    const raw = odontoMap[toothNumber]?.status ?? "Sadio"
    return STATUS_FROM_BACK[raw] ?? "higido"
  }

  const getStatusColor = (status: string) =>
    TOOTH_STATUSES.find((s) => s.value === status)?.color || "bg-white text-gray-800 border-gray-300"

  /* =========================
   * Render
   * ========================= */
  return (
    <div className="space-y-6">
      {/* Odontograma */}
      <Card className="dental-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-serif">Odontograma {loadingOdonto ? "— carregando..." : ""}</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Baby className="h-4 w-4 text-gray-600" />
              <Switch
                id="dentition-type"
                checked={dentitionType === "permanent"}
                onCheckedChange={(checked) => setDentitionType(checked ? "permanent" : "deciduous")}
              />
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <Label htmlFor="dentition-type" className="text-sm font-medium">
              {dentitionType === "permanent" ? "Dentição Permanente" : "Dentição Decídua"}
            </Label>
            <Button variant="secondary" onClick={startToothlessFlow} className="ml-2">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar procedimento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Arcada Superior */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">Arcada Superior</h4>
              <div className={`grid gap-2 ${dentitionType === "permanent" ? "grid-cols-16" : "grid-cols-10"} justify-center`}>
                {currentTeeth.upper.map((tooth) => (
                  <button
                    key={tooth}
                    onClick={() => handleToothClick(tooth)}
                    className={`
                      aspect-square border-2 rounded-lg flex flex-col items-center justify-center text-xs font-medium
                      transition-all hover:scale-105 ${getStatusColor(getToothStatus(tooth))}
                      ${selectedTooth === tooth ? "ring-2 ring-cyan-500 ring-offset-1" : ""}
                    `}
                  >
                    <div className="text-[10px] font-bold">{tooth}</div>
                    <div className="w-4 h-4 bg-white rounded-sm border-2 border-gray-400 mt-1 shadow-sm"></div>
                  </button>
                ))}
              </div>
            </div>

            {/* Arcada Inferior */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">Arcada Inferior</h4>
              <div className={`grid gap-2 ${dentitionType === "permanent" ? "grid-cols-16" : "grid-cols-10"} justify-center`}>
                {currentTeeth.lower.map((tooth) => (
                  <button
                    key={tooth}
                    onClick={() => handleToothClick(tooth)}
                    className={`
                      aspect-square border-2 rounded-lg flex flex-col items-center justify-center text-xs font-medium
                      transition-all hover:scale-105 ${getStatusColor(getToothStatus(tooth))}
                      ${selectedTooth === tooth ? "ring-2 ring-cyan-500 ring-offset-1" : ""}
                    `}
                  >
                    <div className="w-4 h-4 bg-white rounded-sm border-2 border-gray-400 mb-1 shadow-sm"></div>
                    <div className="text-[10px] font-bold">{tooth}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-2">
              {TOOTH_STATUSES.map((status) => (
                <Badge key={status.value} className={`${status.color} border`}>
                  {status.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário do dente selecionado */}
      {(selectedTooth || toothlessMode) && (
        <Card className="dental-card">
          <CardHeader>
            <CardTitle className="font-serif">
              {toothlessMode ? (
                <>Procedimento (sem dente)</>
              ) : (
                <>
                  Registro do Dente {selectedTooth}
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({dentitionType === "permanent" ? "Permanente" : "Decíduo"})
                  </span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Linha 1: Estado + Especialidade */}
            <div className="grid grid-cols-2 gap-4">
                        {!toothlessMode && (
              <div>
                <label className="text-sm font-medium">Estado do Dente</label>
                {/* ...Select... */}
              </div>
            )}

            <div className={!toothlessMode ? "" : "col-span-2"}>
              {/* ...Especialidade... */}
            </div>

              <div>
                <label className="text-sm font-medium">Estado do Dente</label>
                <Select
                  value={currentRecord.status || "higido"}
                  onValueChange={(value) => setCurrentRecord((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {TOOTH_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Especialidade</label>
                <Select
                  value={currentRecord.specialty || ""}
                  onValueChange={(value) => setCurrentRecord((prev) => ({ ...prev, specialty: value }))}
                  disabled={loadingProcedures}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingProcedures ? "Carregando..." : "Selecione a especialidade"} />
                  </SelectTrigger>
                  <SelectContent>
                    {specialtiesFromSystem.length === 0 ? (
                      <div className="px-2 py-1 text-sm text-muted-foreground">Nenhuma especialidade disponível</div>
                    ) : (
                      specialtiesFromSystem.map((esp) => (
                        <SelectItem key={esp} value={esp}>
                          {esp}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 2: Procedimento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium">Procedimento</label>
                <Select
                  value={currentRecord.procedureId ? String(currentRecord.procedureId) : ""}
                  onValueChange={onChangeProcedureById}
                  disabled={!currentRecord.specialty || availableProcedures.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !currentRecord.specialty
                          ? "Selecione uma especialidade"
                          : availableProcedures.length
                            ? "Selecione o procedimento"
                            : "Sem procedimentos"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {availableProcedures.map((proc) => (
                      <SelectItem key={String(proc.id)} value={String(proc.id)}>
                        <div className="flex items-center justify-between w-full">
                          <span>{proc.nome}</span>
                          {proc.preco != null && (
                            <span className="text-xs text-muted-foreground ml-2">
                              {formatBRL(Number(proc.preco))}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 3: Valor (BRL) + Desconto */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Valor</label>
                <Input inputMode="numeric" value={priceInput} onChange={onChangePriceMasked} placeholder="R$ 0,00" />
              </div>

              <div>
                <label className="text-sm font-medium">Desconto</label>
                <div className="flex gap-2">
                  <Select
                    value={discountMode}
                    onValueChange={(v: "percent" | "amount") => {
                      setDiscountMode(v)
                      setDiscountInput("")
                      setCurrentRecord((prev) => ({ ...prev, price: basePrice }))
                      setPriceInput(formatBRL(basePrice))
                    }}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">% Percentual</SelectItem>
                      <SelectItem value="amount">R$ Valor</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    className="flex-1"
                    inputMode="numeric"
                    value={discountInput}
                    onChange={(e) => {
                      const val = e.target.value
                      if (discountMode === "amount") {
                        const num = parseBRL(val)
                        const masked = formatBRL(num)
                        applyDiscountOverBase(masked)
                      } else {
                        const only = val.replace(/[^\d.,]/g, "")
                        applyDiscountOverBase(only)
                      }
                    }}
                    placeholder={discountMode === "percent" ? "0" : "R$ 0,00"}
                  />
                  <div className="self-center text-sm text-muted-foreground">
                    {discountMode === "percent" ? "%" : ""}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Observações</label>
              <Textarea
                value={currentRecord.notes || ""}
                onChange={(e) => setCurrentRecord((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>

            <Button onClick={handleSaveRecord} className="dental-primary" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Registro
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Orçamento (lista) */}
      {savedRecords.length > 0 && (
        <Card className="dental-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-serif">Itens do Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedRecords
                .slice()
                .sort((a, b) => (Number(a.toothNumber ?? 9999) - Number(b.toothNumber ?? 9999)))
                .map((record) => (
                  <div key={record.recordId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                       <Badge className={getStatusColor(record.toothNumber ? getToothStatus(record.toothNumber) : "higido")}>
                            {record.toothNumber ? `Dente ${record.toothNumber}` : "Geral"}
                       </Badge>
                      <div>
                        <div className="font-medium">{record.procedure}</div>
                        <div className="text-sm text-gray-600">{record.specialty}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatBRL(record.price)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveRecord(record.recordId, record.toothNumber)}
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

              <Separator />

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>{formatBRL(getTotalBudget())}</span>
              </div>

              <div className="pt-2 flex gap-2">
                <Button onClick={handleFinalizeBudget} disabled={saving || loadingOdonto}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Concluir Orçamento
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
