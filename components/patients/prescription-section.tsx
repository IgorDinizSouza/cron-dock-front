"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Pill, Plus, Printer, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Medication = {
  id: string
  nome: string
  dosagem: string
  frequencia: string
  duracao: string
  observacoes: string
}

type Prescription = {
  id: string
  dataEmissao: string
  medicamentos: Medication[]
  orientacoes: string
  observacoes: string
  dentistaNome: string
  dentistaCro: string
  clinicaNome: string
}

export function PrescriptionSection({ pacienteId, patientName }: { pacienteId: string; patientName: string }) {
  const { toast } = useToast()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [showForm, setShowForm] = useState(false)
  const [currentPrescription, setCurrentPrescription] = useState<Partial<Prescription>>({
    dataEmissao: new Date().toISOString().split("T")[0],
    medicamentos: [],
    orientacoes: "",
    observacoes: "",
    dentistaNome: "",
    dentistaCro: "",
    clinicaNome: "Conect Odonto",
  })
  const [newMedication, setNewMedication] = useState<Partial<Medication>>({
    nome: "",
    dosagem: "",
    frequencia: "",
    duracao: "",
    observacoes: "",
  })

  const commonMedications = [
    { nome: "Amoxicilina", dosagem: "500mg", frequencia: "8/8h", duracao: "7 dias" },
    { nome: "Ibuprofeno", dosagem: "600mg", frequencia: "8/8h", duracao: "3 dias" },
    { nome: "Paracetamol", dosagem: "750mg", frequencia: "6/6h", duracao: "3 dias" },
    { nome: "Nimesulida", dosagem: "100mg", frequencia: "12/12h", duracao: "3 dias" },
    { nome: "Dipirona", dosagem: "500mg", frequencia: "6/6h", duracao: "3 dias" },
    { nome: "Azitromicina", dosagem: "500mg", frequencia: "24/24h", duracao: "3 dias" },
    { nome: "Clindamicina", dosagem: "300mg", frequencia: "8/8h", duracao: "7 dias" },
    { nome: "Dexametasona", dosagem: "4mg", frequencia: "12/12h", duracao: "3 dias" },
    { nome: "Cetoconazol", dosagem: "200mg", frequencia: "12/12h", duracao: "7 dias" },
    { nome: "Omeprazol", dosagem: "20mg", frequencia: "24/24h", duracao: "7 dias" },
  ]

  const addMedication = () => {
    if (!newMedication.nome || !newMedication.dosagem || !newMedication.frequencia) {
      toast({
        title: "Erro",
        description: "Preencha nome, dosagem e frequência do medicamento",
        variant: "destructive",
      })
      return
    }

    const medication: Medication = {
      id: Date.now().toString(),
      nome: newMedication.nome || "",
      dosagem: newMedication.dosagem || "",
      frequencia: newMedication.frequencia || "",
      duracao: newMedication.duracao || "",
      observacoes: newMedication.observacoes || "",
    }

    setCurrentPrescription((prev) => ({
      ...prev,
      medicamentos: [...(prev.medicamentos || []), medication],
    }))

    setNewMedication({ nome: "", dosagem: "", frequencia: "", duracao: "", observacoes: "" })
    toast({ title: "Sucesso", description: "Medicamento adicionado à receita" })
  }

  const removeMedication = (medicationId: string) => {
    setCurrentPrescription((prev) => ({
      ...prev,
      medicamentos: prev.medicamentos?.filter((med) => med.id !== medicationId) || [],
    }))
  }

  const savePrescription = () => {
    if (!currentPrescription.medicamentos || currentPrescription.medicamentos.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos um medicamento à receita", variant: "destructive" })
      return
    }

    if (!currentPrescription.dentistaNome || !currentPrescription.dentistaCro) {
      toast({ title: "Erro", description: "Informe o nome e CRO do dentista", variant: "destructive" })
      return
    }

    try {
      const prescription: Prescription = {
        id: Date.now().toString(),
        dataEmissao: currentPrescription.dataEmissao || new Date().toISOString().split("T")[0],
        medicamentos: currentPrescription.medicamentos,
        orientacoes: currentPrescription.orientacoes || "",
        observacoes: currentPrescription.observacoes || "",
        dentistaNome: currentPrescription.dentistaNome || "",
        dentistaCro: currentPrescription.dentistaCro || "",
        clinicaNome: currentPrescription.clinicaNome || "Conect Odonto",
      }

      setPrescriptions((prev) => [...prev, prescription])

      // Reset form
      setCurrentPrescription({
        dataEmissao: new Date().toISOString().split("T")[0],
        medicamentos: [],
        orientacoes: "",
        observacoes: "",
        dentistaNome: "",
        dentistaCro: "",
        clinicaNome: "Conect Odonto",
      })

      setShowForm(false)
      toast({ title: "Sucesso", description: "Receita salva com sucesso!" })
    } catch (error) {
      console.error("[v0] Erro ao salvar receita:", error)
      toast({ title: "Erro", description: "Não foi possível salvar a receita", variant: "destructive" })
    }
  }

  const printPrescription = (prescription: Prescription) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const currentDate = new Date().toLocaleDateString("pt-BR")
    const issueDate = new Date(prescription.dataEmissao).toLocaleDateString("pt-BR")

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receituário - ${patientName}</title>
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
            .prescription-title {
              font-size: 20px;
              font-weight: bold;
              text-align: center;
              margin: 40px 0;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .patient-info {
              margin: 30px 0;
              padding: 15px;
              background-color: #f8f9fa;
              border-left: 4px solid #0891b2;
            }
            .medications {
              margin: 30px 0;
            }
            .medication {
              margin: 20px 0;
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 8px;
              background-color: #fafafa;
            }
            .medication-name {
              font-size: 18px;
              font-weight: bold;
              color: #0891b2;
              margin-bottom: 10px;
            }
            .medication-details {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 15px;
              margin-bottom: 10px;
            }
            .detail-item {
              font-size: 14px;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
            }
            .orientations {
              margin: 30px 0;
              padding: 20px;
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
            <div class="clinic-name">${prescription.clinicaNome}</div>
            <div class="clinic-info">
              Endereço da Clínica • Telefone: (00) 0000-0000<br>
              Email: contato@clinica.com • CNPJ: 00.000.000/0001-00
            </div>
          </div>

          <div class="prescription-title">Receituário Odontológico</div>

          <div class="patient-info">
            <strong>Paciente:</strong> ${patientName}<br>
            <strong>Data:</strong> ${issueDate}
          </div>

          <div class="medications">
            <h3>Medicamentos Prescritos:</h3>
            ${prescription.medicamentos
              .map(
                (med) => `
              <div class="medication">
                <div class="medication-name">${med.nome}</div>
                <div class="medication-details">
                  <div class="detail-item">
                    <span class="detail-label">Dosagem:</span> ${med.dosagem}
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Frequência:</span> ${med.frequencia}
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Duração:</span> ${med.duracao}
                  </div>
                </div>
                ${med.observacoes ? `<div class="detail-item"><span class="detail-label">Observações:</span> ${med.observacoes}</div>` : ""}
              </div>
            `,
              )
              .join("")}
          </div>

          ${
            prescription.orientacoes
              ? `
            <div class="orientations">
              <h3>Orientações Gerais:</h3>
              <p>${prescription.orientacoes}</p>
            </div>
          `
              : ""
          }

          ${
            prescription.observacoes
              ? `
            <div class="orientations">
              <h3>Observações:</h3>
              <p>${prescription.observacoes}</p>
            </div>
          `
              : ""
          }

          <div class="signature-area">
            <div class="signature-line"></div>
            <div class="doctor-info">
              <strong>${prescription.dentistaNome}</strong><br>
              CRO: ${prescription.dentistaCro}<br>
              Especialidade: Odontologia
            </div>
          </div>

          <div class="footer">
            Receita emitida em ${currentDate}<br>
            Esta receita é válida em todo território nacional
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Receituário</h3>
        <Button onClick={() => setShowForm(!showForm)} className="dental-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nova Receita
        </Button>
      </div>

      {showForm && (
        <div className="dental-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Nova Receita</h4>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Data de Emissão</Label>
                <Input
                  type="date"
                  value={currentPrescription.dataEmissao}
                  onChange={(e) => setCurrentPrescription((prev) => ({ ...prev, dataEmissao: e.target.value }))}
                />
              </div>
              <div>
                <Label>Nome do Dentista *</Label>
                <Input
                  value={currentPrescription.dentistaNome}
                  onChange={(e) => setCurrentPrescription((prev) => ({ ...prev, dentistaNome: e.target.value }))}
                  placeholder="Dr(a). Nome do Dentista"
                  required
                />
              </div>
              <div>
                <Label>CRO *</Label>
                <Input
                  value={currentPrescription.dentistaCro}
                  onChange={(e) => setCurrentPrescription((prev) => ({ ...prev, dentistaCro: e.target.value }))}
                  placeholder="Ex: CRO/SP 12345"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Nome da Clínica</Label>
              <Input
                value={currentPrescription.clinicaNome}
                onChange={(e) => setCurrentPrescription((prev) => ({ ...prev, clinicaNome: e.target.value }))}
                placeholder="Nome da clínica"
              />
            </div>

            <div>
              <Label>Medicamento</Label>
              <Select
                value={newMedication.nome}
                onValueChange={(value) => {
                  const commonMed = commonMedications.find((med) => med.nome === value)
                  if (commonMed) {
                    setNewMedication((prev) => ({
                      ...prev,
                      nome: value,
                      dosagem: commonMed.dosagem,
                      frequencia: commonMed.frequencia,
                      duracao: commonMed.duracao,
                    }))
                  } else {
                    setNewMedication((prev) => ({ ...prev, nome: value }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione ou digite" />
                </SelectTrigger>
                <SelectContent>
                  {commonMedications.map((med) => (
                    <SelectItem key={med.nome} value={med.nome}>
                      {med.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="mt-2"
                value={newMedication.nome}
                onChange={(e) => setNewMedication((prev) => ({ ...prev, nome: e.target.value }))}
                placeholder="Ou digite o nome do medicamento"
              />
            </div>
            <div>
              <Label>Dosagem</Label>
              <Input
                value={newMedication.dosagem}
                onChange={(e) => setNewMedication((prev) => ({ ...prev, dosagem: e.target.value }))}
                placeholder="Ex: 500mg"
              />
            </div>
            <div>
              <Label>Frequência</Label>
              <Select
                value={newMedication.frequencia}
                onValueChange={(value) => setNewMedication((prev) => ({ ...prev, frequencia: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6/6h">6/6h</SelectItem>
                  <SelectItem value="8/8h">8/8h</SelectItem>
                  <SelectItem value="12/12h">12/12h</SelectItem>
                  <SelectItem value="24/24h">24/24h</SelectItem>
                  <SelectItem value="SOS">SOS (se necessário)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duração</Label>
              <Input
                value={newMedication.duracao}
                onChange={(e) => setNewMedication((prev) => ({ ...prev, duracao: e.target.value }))}
                placeholder="Ex: 7 dias"
              />
            </div>
            <div className="mt-4">
              <Label>Observações do Medicamento</Label>
              <Input
                value={newMedication.observacoes}
                onChange={(e) => setNewMedication((prev) => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações específicas para este medicamento"
              />
            </div>
            <Button onClick={addMedication} className="mt-4 dental-primary">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Medicamento
            </Button>

            {currentPrescription.medicamentos && currentPrescription.medicamentos.length > 0 && (
              <div className="border-t pt-6">
                <h5 className="text-md font-semibold mb-4">Medicamentos na Receita</h5>
                <div className="space-y-3">
                  {currentPrescription.medicamentos.map((med) => (
                    <div key={med.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-cyan-100 rounded-lg">
                          <Pill className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{med.nome}</div>
                          <div className="text-sm text-gray-600">
                            {med.dosagem} • {med.frequencia} • {med.duracao}
                          </div>
                          {med.observacoes && <div className="text-xs text-gray-500">{med.observacoes}</div>}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => removeMedication(med.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Orientações Gerais</Label>
                <Textarea
                  value={currentPrescription.orientacoes}
                  onChange={(e) => setCurrentPrescription((prev) => ({ ...prev, orientacoes: e.target.value }))}
                  placeholder="Orientações gerais para o paciente..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={currentPrescription.observacoes}
                  onChange={(e) => setCurrentPrescription((prev) => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações adicionais..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={savePrescription} className="dental-primary">
                Salvar Receita
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {prescriptions.length > 0 && (
        <div className="dental-card p-6">
          <h4 className="text-lg font-semibold mb-4">Receitas Emitidas</h4>
          <div className="space-y-3">
            {prescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <Pill className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Receita - {prescription.medicamentos.length} medicamento
                      {prescription.medicamentos.length > 1 ? "s" : ""}
                    </div>
                    <div className="text-sm text-gray-600">
                      Emitida em {new Date(prescription.dataEmissao).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {prescription.medicamentos.map((med) => med.nome).join(", ")}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => printPrescription(prescription)}>
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
