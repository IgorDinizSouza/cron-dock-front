"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Printer, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

type ExamRequest = {
  id: string
  dataEmissao: string
  examesSolicitados: string[]
  justificativa: string
  observacoes: string
  urgencia: "baixa" | "media" | "alta"
  dentistaNome: string
  dentistaCro: string
  clinicaNome: string
  laboratorio?: string
}

export function ExamRequestSection({ pacienteId, patientName }: { pacienteId: string; patientName: string }) {
  const { toast } = useToast()
  const [examRequests, setExamRequests] = useState<ExamRequest[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newRequest, setNewRequest] = useState<Partial<ExamRequest>>({
    dataEmissao: new Date().toISOString().split("T")[0],
    examesSolicitados: [],
    justificativa: "",
    observacoes: "",
    urgencia: "media",
    dentistaNome: "",
    dentistaCro: "",
    clinicaNome: "Conect Odonto", // Updated clinic name
    laboratorio: "",
  })

  const examesDisponiveis = [
    // Exames Radiológicos
    "Radiografia Panorâmica",
    "Radiografia Periapical",
    "Radiografia Interproximal (Bite-wing)",
    "Radiografia Oclusal",
    "Tomografia Computadorizada (TC)",
    "Ressonância Magnética (RM)",
    "Ultrassonografia",

    // Exames Laboratoriais
    "Hemograma Completo",
    "Coagulograma",
    "Glicemia",
    "Ureia e Creatinina",
    "Transaminases (TGO/TGP)",
    "Proteína C Reativa (PCR)",
    "VHS (Velocidade de Hemossedimentação)",

    // Exames Microbiológicos
    "Cultura Bacteriana",
    "Antibiograma",
    "Pesquisa de Fungos",
    "PCR para Vírus",

    // Exames Histopatológicos
    "Biópsia Incisional",
    "Biópsia Excisional",
    "Citologia Esfoliativa",
    "Punção Aspirativa por Agulha Fina (PAAF)",

    // Exames Funcionais
    "Eletroneuromiografia (ENMG)",
    "Polissonografia",
    "Teste de Fluxo Salivar",
    "pH Salivar",

    // Exames Específicos Odontológicos
    "Teste de Vitalidade Pulpar",
    "Teste de Sensibilidade",
    "Análise Oclusal",
    "Moldagem para Estudo",
    "Fotografias Intraorais",
    "Modelos de Estudo",
  ]

  const handleExamToggle = (exame: string, checked: boolean) => {
    setNewRequest((prev) => ({
      ...prev,
      examesSolicitados: checked
        ? [...(prev.examesSolicitados || []), exame]
        : (prev.examesSolicitados || []).filter((e) => e !== exame),
    }))
  }

  const saveRequest = () => {
    if (
      !newRequest.examesSolicitados?.length ||
      !newRequest.justificativa ||
      !newRequest.dentistaNome ||
      !newRequest.dentistaCro
    ) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" })
      return
    }

    const request: ExamRequest = {
      id: Date.now().toString(),
      dataEmissao: newRequest.dataEmissao || new Date().toISOString().split("T")[0],
      examesSolicitados: newRequest.examesSolicitados || [],
      justificativa: newRequest.justificativa || "",
      observacoes: newRequest.observacoes || "",
      urgencia: newRequest.urgencia || "media",
      dentistaNome: newRequest.dentistaNome || "",
      dentistaCro: newRequest.dentistaCro || "",
      clinicaNome: newRequest.clinicaNome || "Conect Odonto", // Updated clinic name
      laboratorio: newRequest.laboratorio || "",
    }

    setExamRequests((prev) => [...prev, request])
    setNewRequest({
      dataEmissao: new Date().toISOString().split("T")[0],
      examesSolicitados: [],
      justificativa: "",
      observacoes: "",
      urgencia: "media",
      dentistaNome: "",
      dentistaCro: "",
      clinicaNome: "Conect Odonto", // Updated clinic name
      laboratorio: "",
    })
    setShowForm(false)
    toast({ title: "Sucesso", description: "Solicitação de exame salva com sucesso!" })
  }

  const printRequest = (request: ExamRequest) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const currentDate = new Date().toLocaleDateString("pt-BR")
    const issueDate = new Date(request.dataEmissao).toLocaleDateString("pt-BR")

    const urgencyColor = request.urgencia === "alta" ? "#ef4444" : request.urgencia === "media" ? "#f59e0b" : "#10b981"
    const urgencyText = request.urgencia === "alta" ? "URGENTE" : request.urgencia === "media" ? "NORMAL" : "BAIXA"

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Solicitação de Exame - ${patientName}</title>
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
            .request-title {
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
            .exams-list {
              margin: 20px 0;
              padding: 15px;
              background-color: #f8f9fa;
              border-left: 4px solid #0891b2;
            }
            .exams-list ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .exams-list li {
              margin: 5px 0;
            }
            .info-section {
              margin: 20px 0;
              padding: 15px;
              background-color: #f0f9ff;
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
            <div class="clinic-name">${request.clinicaNome}</div>
            <div class="clinic-info">
              Endereço da Clínica • Telefone: (00) 0000-0000<br>
              Email: contato@clinica.com • CNPJ: 00.000.000/0001-00
            </div>
          </div>

          <div class="request-title">
            Solicitação de Exames
            <span class="urgency-badge">${urgencyText}</span>
          </div>

          <div class="content">
            <p><strong>Data:</strong> ${issueDate}</p>
            <p><strong>Paciente:</strong> <span class="patient-name">${patientName}</span></p>
            ${request.laboratorio ? `<p><strong>Laboratório:</strong> ${request.laboratorio}</p>` : ""}
          </div>

          <div class="exams-list">
            <strong>Exames Solicitados:</strong>
            <ul>
              ${request.examesSolicitados.map((exame) => `<li>${exame}</li>`).join("")}
            </ul>
          </div>

          <div class="info-section">
            <strong>Justificativa Clínica:</strong><br>
            ${request.justificativa}
          </div>

          ${
            request.observacoes
              ? `
            <div class="info-section">
              <strong>Observações:</strong><br>
              ${request.observacoes}
            </div>
          `
              : ""
          }

          <div class="signature-area">
            <div class="signature-line"></div>
            <div class="doctor-info">
              <strong>${request.dentistaNome}</strong><br>
              CRO: ${request.dentistaCro}<br>
              Especialidade: Odontologia
            </div>
          </div>

          <div class="footer">
            Documento emitido em ${currentDate}<br>
            Esta solicitação é válida em todo território nacional
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
        <h3 className="text-lg font-semibold">Solicitações de Exames</h3>
        <Button onClick={() => setShowForm(!showForm)} className="dental-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nova Solicitação
        </Button>
      </div>

      {showForm && (
        <div className="dental-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Nova Solicitação de Exame</h4>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Data de Emissão</Label>
                <Input
                  type="date"
                  value={newRequest.dataEmissao}
                  onChange={(e) => setNewRequest((prev) => ({ ...prev, dataEmissao: e.target.value }))}
                />
              </div>
              <div>
                <Label>Urgência</Label>
                <Select
                  value={newRequest.urgencia}
                  onValueChange={(value: "baixa" | "media" | "alta") =>
                    setNewRequest((prev) => ({ ...prev, urgencia: value }))
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
              <div>
                <Label>Laboratório/Clínica</Label>
                <Input
                  value={newRequest.laboratorio}
                  onChange={(e) => setNewRequest((prev) => ({ ...prev, laboratorio: e.target.value }))}
                  placeholder="Nome do laboratório (opcional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Dentista *</Label>
                <Input
                  value={newRequest.dentistaNome}
                  onChange={(e) => setNewRequest((prev) => ({ ...prev, dentistaNome: e.target.value }))}
                  placeholder="Dr(a). Nome do Dentista"
                  required
                />
              </div>
              <div>
                <Label>CRO *</Label>
                <Input
                  value={newRequest.dentistaCro}
                  onChange={(e) => setNewRequest((prev) => ({ ...prev, dentistaCro: e.target.value }))}
                  placeholder="Ex: CRO/SP 12345"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Exames Solicitados *</Label>
              <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {examesDisponiveis.map((exame) => (
                    <div key={exame} className="flex items-center space-x-2">
                      <Checkbox
                        id={exame}
                        checked={newRequest.examesSolicitados?.includes(exame) || false}
                        onCheckedChange={(checked) => handleExamToggle(exame, checked as boolean)}
                      />
                      <Label htmlFor={exame} className="text-sm cursor-pointer">
                        {exame}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Selecione os exames necessários ({newRequest.examesSolicitados?.length || 0} selecionados)
              </p>
            </div>

            <div>
              <Label>Justificativa Clínica *</Label>
              <Textarea
                value={newRequest.justificativa}
                onChange={(e) => setNewRequest((prev) => ({ ...prev, justificativa: e.target.value }))}
                placeholder="Descreva a justificativa clínica para os exames solicitados..."
                rows={3}
                required
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={newRequest.observacoes}
                onChange={(e) => setNewRequest((prev) => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveRequest} className="dental-primary">
                <Search className="h-4 w-4 mr-2" />
                Salvar Solicitação
              </Button>
            </div>
          </div>
        </div>
      )}

      {examRequests.length > 0 && (
        <div className="dental-card p-6">
          <h4 className="text-lg font-semibold mb-4">Solicitações Emitidas</h4>
          <div className="space-y-3">
            {examRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <Search className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {request.examesSolicitados.length} exame{request.examesSolicitados.length > 1 ? "s" : ""}{" "}
                      solicitado{request.examesSolicitados.length > 1 ? "s" : ""}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgencia)}`}
                      >
                        {getUrgencyText(request.urgencia)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Emitido em {new Date(request.dataEmissao).toLocaleDateString("pt-BR")}
                      {request.laboratorio && ` • ${request.laboratorio}`}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {request.examesSolicitados.slice(0, 3).join(", ")}
                      {request.examesSolicitados.length > 3 && ` e mais ${request.examesSolicitados.length - 3}...`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => printRequest(request)}>
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
