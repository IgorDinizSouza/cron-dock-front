"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Printer, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { especialidadesApi } from "@/lib/api"

type Referral = {
  id: string
  tipo: string
  especialidade: string
  profissionalDestino: string
  dataEmissao: string
  motivo: string
  observacoes: string
  urgencia: "baixa" | "media" | "alta"
  dentistaNome: string
  dentistaCro: string
  clinicaNome: string
  laboratorio?: string
}

export function ReferralSection({ pacienteId, patientName }: { pacienteId: string; patientName: string }) {
  const { toast } = useToast()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [showForm, setShowForm] = useState(false)
  const [especialidades, setEspecialidades] = useState<any[]>([])
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true)

  const [newReferral, setNewReferral] = useState<Partial<Referral>>({
    tipo: "Encaminhamento",
    especialidade: "",
    profissionalDestino: "",
    dataEmissao: new Date().toISOString().split("T")[0],
    motivo: "",
    observacoes: "",
    urgencia: "media",
    dentistaNome: "",
    dentistaCro: "",
    clinicaNome: "Cron Dock",
    laboratorio: "",
  })

  useEffect(() => {
    const loadEspecialidades = async () => {
      try {
        setLoadingEspecialidades(true)
        const response = await especialidadesApi.getAll()
        const items = Array.isArray(response) ? response : (response?.content ?? [])
        setEspecialidades(items)
      } catch (error) {
        console.error("Erro ao carregar especialidades:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as especialidades",
          variant: "destructive",
        })
        setEspecialidades([])
      } finally {
        setLoadingEspecialidades(false)
      }
    }

    loadEspecialidades()
  }, [toast])

  const saveReferral = () => {
    if (!newReferral.especialidade || !newReferral.motivo || !newReferral.dentistaNome || !newReferral.dentistaCro) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" })
      return
    }

    const referral: Referral = {
      id: Date.now().toString(),
      tipo: newReferral.tipo || "Encaminhamento",
      especialidade: newReferral.especialidade || "",
      profissionalDestino: newReferral.profissionalDestino || "",
      dataEmissao: newReferral.dataEmissao || new Date().toISOString().split("T")[0],
      motivo: newReferral.motivo || "",
      observacoes: newReferral.observacoes || "",
      urgencia: newReferral.urgencia || "media",
      dentistaNome: newReferral.dentistaNome || "",
      dentistaCro: newReferral.dentistaCro || "",
      clinicaNome: newReferral.clinicaNome || "Cron Dock",
      laboratorio: newReferral.laboratorio || "",
    }

    setReferrals((prev) => [...prev, referral])
    setNewReferral({
      tipo: "Encaminhamento",
      especialidade: "",
      profissionalDestino: "",
      dataEmissao: new Date().toISOString().split("T")[0],
      motivo: "",
      observacoes: "",
      urgencia: "media",
      dentistaNome: "",
      dentistaCro: "",
      clinicaNome: "Cron Dock",
      laboratorio: "",
    })
    setShowForm(false)
    toast({ title: "Sucesso", description: "Encaminhamento salvo com sucesso!" })
  }

  const printReferral = (referral: Referral) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const currentDate = new Date().toLocaleDateString("pt-BR")
    const issueDate = new Date(referral.dataEmissao).toLocaleDateString("pt-BR")

    const urgencyColor =
      referral.urgencia === "alta" ? "#ef4444" : referral.urgencia === "media" ? "#f59e0b" : "#10b981"
    const urgencyText = referral.urgencia === "alta" ? "URGENTE" : referral.urgencia === "media" ? "NORMAL" : "BAIXA"

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Encaminhamento - ${patientName}</title>
          <style>
            @page { margin: 2cm; }
            body { 
              font-family: 'Times New Roman', serif; 
              line-height: 1.6; 
              color: #333;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #0891b2;
              padding-bottom: 20px;
              margin-bottom: 40px;
            }
            .clinic-name {
              font-size: 24px;
              font-weight: bold;
              color: #0891b2;
              margin-bottom: 5px;
            }
            .clinic-info {
              font-size: 14px;
              color: #666;
            }
            .referral-title {
              font-size: 20px;
              font-weight: bold;
              text-align: center;
              margin: 40px 0;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .urgency-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              color: white;
              background-color: ${urgencyColor};
              margin-left: 10px;
            }
            .content {
              font-size: 16px;
              margin: 30px 0;
              line-height: 1.8;
            }
            .patient-name {
              font-weight: bold;
              text-decoration: underline;
            }
            .info-section {
              margin: 20px 0;
              padding: 15px;
              background-color: #f8f9fa;
              border-left: 4px solid #0891b2;
            }
            .signature-area {
              margin-top: 80px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #333;
              width: 300px;
              margin: 0 auto 10px;
            }
            .doctor-info {
              font-size: 14px;
              line-height: 1.4;
            }
            .footer {
              margin-top: 60px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">${referral.clinicaNome}</div>
            <div class="clinic-info">
              Endereço da Clínica • Telefone: (00) 0000-0000<br>
              Email: contato@clinica.com • CNPJ: 00.000.000/0001-00
            </div>
          </div>

          <div class="referral-title">
            Encaminhamento Odontológico
            <span class="urgency-badge">${urgencyText}</span>
          </div>

          <div class="content">
            <p><strong>Data:</strong> ${issueDate}</p>
            <p><strong>Paciente:</strong> <span class="patient-name">${patientName}</span></p>
            <p><strong>Especialidade:</strong> ${referral.especialidade}</p>
            ${referral.profissionalDestino ? `<p><strong>Profissional de Destino:</strong> ${referral.profissionalDestino}</p>` : ""}
            ${referral.laboratorio ? `<p><strong>Laboratório:</strong> ${referral.laboratorio}</p>` : ""}
          </div>

          <div class="info-section">
            <strong>Motivo do Encaminhamento:</strong><br>
            ${referral.motivo}
          </div>

          ${
            referral.observacoes
              ? `
            <div class="info-section">
              <strong>Observações:</strong><br>
              ${referral.observacoes}
            </div>
          `
              : ""
          }

          <div class="signature-area">
            <div class="signature-line"></div>
            <div class="doctor-info">
              <strong>${referral.dentistaNome}</strong><br>
              CRO: ${referral.dentistaCro}<br>
              Especialidade: Odontologia
            </div>
          </div>

          <div class="footer">
            Documento emitido em ${currentDate}<br>
            Este encaminhamento é válido em todo território nacional
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const getUrgencyColor = (urgencia: string) => {
    switch (urgencia) {
      case "alta":
        return "bg-red-100 text-red-800"
      case "media":
        return "bg-yellow-100 text-yellow-800"
      case "baixa":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUrgencyText = (urgencia: string) => {
    switch (urgencia) {
      case "alta":
        return "Urgente"
      case "media":
        return "Normal"
      case "baixa":
        return "Baixa"
      default:
        return "Normal"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Encaminhamentos</h3>
        <Button onClick={() => setShowForm(!showForm)} className="dental-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Encaminhamento
        </Button>
      </div>

      {showForm && (
        <div className="dental-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Novo Encaminhamento</h4>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Data de Emissão</Label>
                <Input
                  type="date"
                  value={newReferral.dataEmissao}
                  onChange={(e) => setNewReferral((prev) => ({ ...prev, dataEmissao: e.target.value }))}
                />
              </div>
              <div>
                <Label>Especialidade *</Label>
                <Select
                  value={newReferral.especialidade}
                  onValueChange={(value) => setNewReferral((prev) => ({ ...prev, especialidade: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingEspecialidades ? "Carregando..." : "Selecione a especialidade"} />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((esp) => (
                      <SelectItem key={esp.id} value={esp.nome}>
                        {esp.nome}
                      </SelectItem>
                    ))}
                    {(!especialidades || especialidades.length === 0) && !loadingEspecialidades && (
                      <div className="px-3 py-2 text-sm text-gray-500">Nenhuma especialidade encontrada</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Urgência</Label>
                <Select
                  value={newReferral.urgencia}
                  onValueChange={(value: "baixa" | "media" | "alta") =>
                    setNewReferral((prev) => ({ ...prev, urgencia: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Normal</SelectItem>
                    <SelectItem value="alta">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nome do Dentista *</Label>
                <Input
                  value={newReferral.dentistaNome}
                  onChange={(e) => setNewReferral((prev) => ({ ...prev, dentistaNome: e.target.value }))}
                  placeholder="Dr(a). Nome do Dentista"
                  required
                />
              </div>
              <div>
                <Label>CRO *</Label>
                <Input
                  value={newReferral.dentistaCro}
                  onChange={(e) => setNewReferral((prev) => ({ ...prev, dentistaCro: e.target.value }))}
                  placeholder="Ex: CRO/SP 12345"
                  required
                />
              </div>
              <div>
                <Label>Profissional de Destino</Label>
                <Input
                  value={newReferral.profissionalDestino}
                  onChange={(e) => setNewReferral((prev) => ({ ...prev, profissionalDestino: e.target.value }))}
                  placeholder="Nome do profissional (opcional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Laboratório</Label>
                <Input
                  value={newReferral.laboratorio}
                  onChange={(e) => setNewReferral((prev) => ({ ...prev, laboratorio: e.target.value }))}
                  placeholder="Nome do laboratório (opcional)"
                />
              </div>
            </div>

            <div>
              <Label>Motivo do Encaminhamento *</Label>
              <Textarea
                value={newReferral.motivo}
                onChange={(e) => setNewReferral((prev) => ({ ...prev, motivo: e.target.value }))}
                placeholder="Descreva o motivo do encaminhamento..."
                rows={3}
                required
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={newReferral.observacoes}
                onChange={(e) => setNewReferral((prev) => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveReferral} className="dental-primary">
                <Send className="h-4 w-4 mr-2" />
                Salvar Encaminhamento
              </Button>
            </div>
          </div>
        </div>
      )}

      {referrals.length > 0 && (
        <div className="dental-card p-6">
          <h4 className="text-lg font-semibold mb-4">Encaminhamentos Emitidos</h4>
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <Send className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {referral.especialidade}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(referral.urgencia)}`}
                      >
                        {getUrgencyText(referral.urgencia)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Emitido em {new Date(referral.dataEmissao).toLocaleDateString("pt-BR")}
                      {referral.profissionalDestino && ` • Para: ${referral.profissionalDestino}`}
                      {referral.laboratorio && ` • Laboratório: ${referral.laboratorio}`}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 max-w-md truncate">{referral.motivo}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => printReferral(referral)}>
                    <Printer className="h-4 w-4 mr-1" />
                    Imprimir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
