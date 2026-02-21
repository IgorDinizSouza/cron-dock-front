"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { odontogramApi, proceduresApi } from "@/lib/api"

type ToothState = {
  status?: "Sadio" | "Cariado" | "Restaurado" | "Ausente" | "Implante" | "Endo"
  procedimento?: string
  especialidade?: string
  preco?: number
  observacoes?: string
}

type SimpleOdontogram = Record<string, ToothState>

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

const STATUS_COLORS = {
  Sadio: "bg-green-100 text-green-800 border-green-200",
  Cariado: "bg-red-100 text-red-800 border-red-200",
  Restaurado: "bg-blue-100 text-blue-800 border-blue-200",
  Ausente: "bg-gray-100 text-gray-800 border-gray-200",
  Implante: "bg-purple-100 text-purple-800 border-purple-200",
  Endo: "bg-orange-100 text-orange-800 border-orange-200",
}

const ToothSVG = ({
  toothNumber,
  status,
  hasData,
  onClick,
  selected,
}: {
  toothNumber: number
  status?: string
  hasData: boolean
  onClick: () => void
  selected: boolean
}) => {
  const getToothColor = () => {
    switch (status) {
      case "Cariado":
        return "#ef4444" // red-500
      case "Restaurado":
        return "#3b82f6" // blue-500
      case "Ausente":
        return "#6b7280" // gray-500
      case "Implante":
        return "#8b5cf6" // violet-500
      case "Endo":
        return "#f97316" // orange-500
      default:
        return "#ffffff" // white
    }
  }

  const getStrokeColor = () => {
    if (selected) return "#06b6d4" // cyan-500
    if (hasData) return "#06b6d4" // cyan-500
    return "#d1d5db" // gray-300
  }

  // Diferentes formas de dente baseado na posição
  const isIncisor = [11, 12, 21, 22, 41, 42, 31, 32].includes(toothNumber)
  const isCanine = [13, 23, 43, 33].includes(toothNumber)
  const isPremolar = [14, 15, 24, 25, 44, 45, 34, 35].includes(toothNumber)
  const isMolar = [16, 17, 18, 26, 27, 28, 46, 47, 48, 36, 37, 38].includes(toothNumber)

  if (status === "Ausente") {
    return (
      <div
        className={`w-8 h-12 border-2 cursor-pointer hover:border-cyan-500 transition-colors flex items-center justify-center bg-gray-100 border-dashed`}
        style={{ borderColor: getStrokeColor() }}
        onClick={onClick}
      >
        <span className="text-gray-500 text-xs font-bold">X</span>
      </div>
    )
  }

  return (
    <svg
      width="32"
      height="48"
      viewBox="0 0 32 48"
      className="cursor-pointer hover:drop-shadow-md transition-all"
      onClick={onClick}
    >
      {/* Dente baseado no tipo */}
      {isIncisor && (
        <path
          d="M8 4 C8 2, 10 1, 16 1 C22 1, 24 2, 24 4 L24 25 C24 35, 20 42, 16 44 C12 42, 8 35, 8 25 Z"
          fill={getToothColor()}
          stroke={getStrokeColor()}
          strokeWidth={selected ? "3" : "2"}
        />
      )}
      {isCanine && (
        <path
          d="M8 4 C8 2, 10 1, 16 1 C22 1, 24 2, 24 4 L24 28 C24 38, 20 44, 16 46 C12 44, 8 38, 8 28 Z"
          fill={getToothColor()}
          stroke={getStrokeColor()}
          strokeWidth={selected ? "3" : "2"}
        />
      )}
      {isPremolar && (
        <path
          d="M6 4 C6 2, 8 1, 16 1 C24 1, 26 2, 26 4 L26 20 C26 25, 24 30, 22 35 C20 40, 18 42, 16 44 C14 42, 12 40, 10 35 C8 30, 6 25, 6 20 Z"
          fill={getToothColor()}
          stroke={getStrokeColor()}
          strokeWidth={selected ? "3" : "2"}
        />
      )}
      {isMolar && (
        <path
          d="M4 4 C4 2, 6 1, 16 1 C26 1, 28 2, 28 4 L28 18 C28 22, 26 26, 24 30 C22 34, 20 38, 18 40 C17 42, 16 43, 16 44 C16 43, 15 42, 14 40 C12 38, 10 34, 8 30 C6 26, 4 22, 4 18 Z"
          fill={getToothColor()}
          stroke={getStrokeColor()}
          strokeWidth={selected ? "3" : "2"}
        />
      )}

      {/* Indicadores visuais para condições */}
      {status === "Cariado" && <circle cx="16" cy="15" r="3" fill="#7f1d1d" opacity="0.8" />}
      {status === "Restaurado" && <rect x="12" y="12" width="8" height="6" fill="#1e40af" rx="1" />}
      {status === "Implante" && <rect x="14" y="35" width="4" height="8" fill="#6b21a8" rx="1" />}
      {status === "Endo" && <line x1="16" y1="8" x2="16" y2="35" stroke="#c2410c" strokeWidth="2" />}
    </svg>
  )
}

export function SimpleOdontogram({ pacienteId }: { pacienteId: string }) {
  const { toast } = useToast()
  const [data, setData] = useState<SimpleOdontogram>({})
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [procedures, setProcedures] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
    loadProcedures()
  }, [pacienteId])

  const loadData = async () => {
    try {
      const response = await odontogramApi.get(pacienteId)
      setData(response || {})
    } catch (error) {
      console.error("Erro ao carregar odontograma:", error)
    }
  }

  const loadProcedures = async () => {
    try {
      const response = await proceduresApi.listAll(1, 100)
      setProcedures(Array.isArray(response) ? response : [])
    } catch (error) {
      console.error("Erro ao carregar procedimentos:", error)
    }
  }

  const saveData = async () => {
    try {
      setLoading(true)
      await odontogramApi.save(pacienteId, data)
      toast({ title: "Sucesso", description: "Odontograma salvo com sucesso!" })
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao salvar odontograma", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const updateTooth = (toothNumber: number, updates: Partial<ToothState>) => {
    setData((prev) => ({
      ...prev,
      [toothNumber]: { ...prev[toothNumber], ...updates },
    }))
  }

  const renderToothRow = (teeth: number[], label: string) => (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-600">{label}</div>
      <div className="flex justify-center">
        <div className="flex gap-1 max-w-4xl flex-wrap justify-center">
          {teeth.map((toothNumber) => {
            const tooth = data[toothNumber]
            const hasData = tooth && tooth.status !== "Sadio" && tooth.status

            return (
              <div key={toothNumber} className="flex flex-col items-center">
                <ToothSVG
                  toothNumber={toothNumber}
                  status={tooth?.status}
                  hasData={!!hasData}
                  onClick={() => setSelectedTooth(toothNumber)}
                  selected={selectedTooth === toothNumber}
                />
                {/* Número do dente */}
                <div className="text-xs mt-1 font-medium">{toothNumber}</div>
                {/* Indicador de procedimento */}
                {tooth?.procedimento && (
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1" title={tooth.procedimento}></div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const selectedToothData = selectedTooth ? data[selectedTooth] : null

  return (
    <div className="space-y-6">
      {/* Odontograma Visual */}
      <div className="dental-card p-6">
        <div className="space-y-8">
          {renderToothRow(UPPER_TEETH, "Arcada Superior")}
          {renderToothRow(LOWER_TEETH, "Arcada Inferior")}
        </div>

        {/* Legenda */}
        <div className="mt-6 pt-4 border-t">
          <div className="text-sm font-medium mb-2">Legenda:</div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span>C = Cariado</span>
            <span>R = Restaurado</span>
            <span>X = Ausente</span>
            <span>I = Implante</span>
            <span>E = Endodontia</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>= Com procedimento
            </span>
          </div>
        </div>
      </div>

      {/* Painel de Edição */}
      {selectedTooth && (
        <div className="dental-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Dente {selectedTooth}</h3>
            <Button variant="ghost" size="sm" onClick={() => setSelectedTooth(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label>Status</Label>
                <Select
                  value={selectedToothData?.status || "Sadio"}
                  onValueChange={(value) => updateTooth(selectedTooth, { status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sadio">Sadio</SelectItem>
                    <SelectItem value="Cariado">Cariado</SelectItem>
                    <SelectItem value="Restaurado">Restaurado</SelectItem>
                    <SelectItem value="Ausente">Ausente</SelectItem>
                    <SelectItem value="Implante">Implante</SelectItem>
                    <SelectItem value="Endo">Endodontia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Especialidade</Label>
                <Select
                  value={selectedToothData?.especialidade || ""}
                  onValueChange={(value) => updateTooth(selectedTooth, { especialidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Clínica Geral">Clínica Geral</SelectItem>
                    <SelectItem value="Ortodontia">Ortodontia</SelectItem>
                    <SelectItem value="Endodontia">Endodontia</SelectItem>
                    <SelectItem value="Periodontia">Periodontia</SelectItem>
                    <SelectItem value="Implantodontia">Implantodontia</SelectItem>
                    <SelectItem value="Cirurgia Oral">Cirurgia Oral</SelectItem>
                    <SelectItem value="Prótese">Prótese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Procedimento</Label>
                <Select
                  value={selectedToothData?.procedimento || ""}
                  onValueChange={(value) => {
                    const proc = procedures.find((p) => p.nome === value)
                    updateTooth(selectedTooth, {
                      procedimento: value,
                      preco: proc?.preco || selectedToothData?.preco,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o procedimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {procedures.map((proc) => (
                      <SelectItem key={proc.id} value={proc.nome}>
                        {proc.nome} {proc.preco && `- R$ ${proc.preco}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={selectedToothData?.preco || ""}
                  onChange={(e) => updateTooth(selectedTooth, { preco: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={selectedToothData?.observacoes || ""}
                onChange={(e) => updateTooth(selectedTooth, { observacoes: e.target.value })}
                placeholder="Observações sobre este dente..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={saveData} disabled={loading} className="dental-primary">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
