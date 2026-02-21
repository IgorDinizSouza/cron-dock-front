"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Download, Plus, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

type Certificate = {
  id: string
  tipo: string
  dataEmissao: string
  diasAfastamento?: number
  observacoes: string
  texto: string
  cid?: string
  dentistaNome: string
  dentistaCro: string
  clinicaNome: string
}

export function CertificateSection({ pacienteId, patientName }: { pacienteId: string; patientName: string }) {
  const { toast } = useToast()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [showForm, setShowForm] = useState(false)
  const [previewCertificate, setPreviewCertificate] = useState<Certificate | null>(null)
  const [newCertificate, setNewCertificate] = useState<Partial<Certificate>>({
    tipo: "Atestado Médico",
    dataEmissao: new Date().toISOString().split("T")[0],
    diasAfastamento: 1,
    observacoes: "",
    texto: "",
    cid: "",
    dentistaNome: "",
    dentistaCro: "",
    clinicaNome: "OdontoCareSys", // Mudando nome padrão da clínica
  })

  const commonCIDs = [
    // Cáries e Doenças da Polpa
    { code: "K02.0", description: "Cárie limitada ao esmalte" },
    { code: "K02.1", description: "Cárie da dentina" },
    { code: "K02.2", description: "Cárie do cemento" },
    { code: "K02.3", description: "Cárie dentária estacionária" },
    { code: "K02.9", description: "Cárie dentária, não especificada" },
    { code: "K04.0", description: "Pulpite" },
    { code: "K04.1", description: "Necrose da polpa" },
    { code: "K04.2", description: "Degeneração da polpa" },
    { code: "K04.3", description: "Formação anormal de tecido duro na polpa" },
    { code: "K04.4", description: "Periodontite apical aguda originária da polpa" },
    { code: "K04.5", description: "Periodontite apical crônica" },
    { code: "K04.6", description: "Abscesso periapical com fístula" },
    { code: "K04.7", description: "Abscesso periapical sem fístula" },
    { code: "K04.8", description: "Cisto radicular" },

    // Doenças Gengivais e Periodontais
    { code: "K05.0", description: "Gengivite aguda" },
    { code: "K05.1", description: "Gengivite crônica" },
    { code: "K05.2", description: "Periodontite aguda" },
    { code: "K05.3", description: "Periodontite crônica" },
    { code: "K05.4", description: "Periodontose" },
    { code: "K05.5", description: "Outras doenças periodontais" },
    { code: "K05.6", description: "Doença periodontal, não especificada" },
    { code: "K06.0", description: "Retração gengival" },
    { code: "K06.1", description: "Hiperplasia gengival" },
    { code: "K06.2", description: "Lesões da gengiva e do rebordo alveolar desdentado associadas com trauma" },

    // Outros Transtornos dos Dentes e Estruturas de Sustentação
    { code: "K07.0", description: "Anomalias importantes do tamanho da mandíbula" },
    { code: "K07.1", description: "Anomalias da relação maxilo-mandibular" },
    { code: "K07.2", description: "Anomalias da relação entre os arcos dentários" },
    { code: "K07.3", description: "Anomalias da posição do dente" },
    { code: "K07.4", description: "Maloclusão, não especificada" },
    { code: "K07.6", description: "Transtornos da articulação temporomandibular" },

    // Perda de Dentes
    { code: "K08.0", description: "Exfoliação dos dentes devido a causas sistêmicas" },
    { code: "K08.1", description: "Perda de dentes devido a acidente, extração ou doença periodontal local" },
    { code: "K08.2", description: "Atrofia do rebordo alveolar desdentado" },
    { code: "K08.3", description: "Raiz dentária retida" },
    { code: "K08.8", description: "Outros transtornos especificados dos dentes e estruturas de sustentação" },
    { code: "K08.9", description: "Transtorno dos dentes e de suas estruturas de sustentação, não especificado" },

    // Cistos da Região Bucal
    { code: "K09.0", description: "Cistos odontogênicos de desenvolvimento" },
    { code: "K09.1", description: "Cistos de desenvolvimento (não-odontogênicos) da região bucal" },
    { code: "K09.2", description: "Outros cistos dos maxilares" },
    { code: "K09.8", description: "Outros cistos da região bucal, não classificados em outra parte" },
    { code: "K09.9", description: "Cisto da região bucal, não especificado" },

    // Outras Doenças dos Maxilares
    { code: "K10.0", description: "Transtornos do desenvolvimento dos maxilares" },
    { code: "K10.1", description: "Granuloma central de células gigantes" },
    { code: "K10.2", description: "Condições inflamatórias dos maxilares" },
    { code: "K10.3", description: "Alveolite do maxilar" },
    { code: "K10.8", description: "Outras doenças especificadas dos maxilares" },
    { code: "K10.9", description: "Doença não especificada dos maxilares" },

    // Doenças da Língua
    { code: "K14.0", description: "Glossite" },
    { code: "K14.1", description: "Língua geográfica" },
    { code: "K14.2", description: "Glossite rombóide mediana" },
    { code: "K14.3", description: "Hipertrofia das papilas linguais" },
    { code: "K14.4", description: "Atrofia das papilas linguais" },
    { code: "K14.5", description: "Língua pilosa" },
    { code: "K14.6", description: "Glossodinia" },

    // Estomatites e Lesões Correlatas
    { code: "K12.0", description: "Estomatite aftosa recorrente" },
    { code: "K12.1", description: "Outras formas de estomatite" },
    { code: "K12.2", description: "Celulite e abscesso da boca" },
    { code: "K13.0", description: "Doenças dos lábios" },
    { code: "K13.1", description: "Mordedura da mucosa oral" },
    { code: "K13.2", description: "Leucoplasia e outras alterações do epitélio oral, incluindo a língua" },
    { code: "K13.3", description: "Leucoplasia pilosa" },
    { code: "K13.4", description: "Granuloma e lesões semelhantes da mucosa oral" },
    { code: "K13.5", description: "Fibrose submucosa oral" },
    { code: "K13.6", description: "Hiperplasia irritativa da mucosa oral" },

    // Códigos de Procedimentos e Exames
    { code: "Z01.2", description: "Exame odontológico" },
    { code: "Z46.3", description: "Ajustamento e manuseamento de aparelho ortodôntico" },
    { code: "Z48.0", description: "Atenção a suturas e curativos cirúrgicos" },
    {
      code: "Z51.4",
      description: "Cuidados preparatórios para tratamento subsequente, não classificados em outra parte",
    },
    { code: "Z98.2", description: "Estado de presença de dispositivo protético odontológico" },
  ]

  const generateCertificateText = () => {
    const data = new Date(newCertificate.dataEmissao || new Date()).toLocaleDateString()
    const dias = newCertificate.diasAfastamento || 1

    let texto = `ATESTADO MÉDICO ODONTOLÓGICO\n\n`
    texto += `Atesto para os devidos fins que o(a) paciente ${patientName}, `
    texto += `esteve sob meus cuidados profissionais em ${data}, `
    texto += `necessitando de afastamento de suas atividades por ${dias} dia${dias > 1 ? "s" : ""}, `
    texto += `para tratamento odontológico.\n\n`

    if (newCertificate.cid) {
      const cidInfo = commonCIDs.find((c) => c.code === newCertificate.cid)
      texto += `CID-10: ${newCertificate.cid}`
      if (cidInfo) {
        texto += ` - ${cidInfo.description}`
      }
      texto += `\n\n`
    }

    if (newCertificate.observacoes) {
      texto += `Observações: ${newCertificate.observacoes}\n\n`
    }

    texto += `${new Date().toLocaleDateString()}\n\n`
    texto += `_________________________________\n`
    texto += `${newCertificate.dentistaNome || "Dr(a). [Nome do Dentista]"}\n`
    texto += `CRO: ${newCertificate.dentistaCro || "[Número do CRO]"}`

    setNewCertificate((prev) => ({ ...prev, texto }))
  }

  const saveCertificate = () => {
    if (!newCertificate.texto) {
      toast({ title: "Erro", description: "Gere o texto do atestado primeiro", variant: "destructive" })
      return
    }

    if (!newCertificate.dentistaNome || !newCertificate.dentistaCro) {
      toast({ title: "Erro", description: "Informe o nome e CRO do dentista", variant: "destructive" })
      return
    }

    const certificate: Certificate = {
      id: Date.now().toString(),
      tipo: newCertificate.tipo || "Atestado Médico",
      dataEmissao: newCertificate.dataEmissao || new Date().toISOString().split("T")[0],
      diasAfastamento: newCertificate.diasAfastamento,
      observacoes: newCertificate.observacoes || "",
      texto: newCertificate.texto,
      cid: newCertificate.cid || "",
      dentistaNome: newCertificate.dentistaNome || "",
      dentistaCro: newCertificate.dentistaCro || "",
      clinicaNome: newCertificate.clinicaNome || "OdontoCareSys", // Mudando nome padrão da clínica
    }

    setCertificates((prev) => [...prev, certificate])
    setNewCertificate({
      tipo: "Atestado Médico",
      dataEmissao: new Date().toISOString().split("T")[0],
      diasAfastamento: 1,
      observacoes: "",
      texto: "",
      cid: "",
      dentistaNome: "",
      dentistaCro: "",
      clinicaNome: "OdontoCareSys", // Mudando nome padrão da clínica
    })
    setShowForm(false)
    toast({ title: "Sucesso", description: "Atestado salvo com sucesso!" })
  }

  const printCertificate = (certificate: Certificate) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const currentDate = new Date().toLocaleDateString("pt-BR")
    const issueDate = new Date(certificate.dataEmissao).toLocaleDateString("pt-BR")

    const cidSection = certificate.cid
      ? `
      <div class="cid-section">
        <strong>CID-10:</strong> ${certificate.cid}
        ${commonCIDs.find((c) => c.code === certificate.cid) ? ` - ${commonCIDs.find((c) => c.code === certificate.cid)?.description}` : ""}
      </div>
    `
      : ""

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Atestado Médico - ${patientName}</title>
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
            .certificate-title {
              font-size: 20px;
              font-weight: bold;
              text-align: center;
              margin: 40px 0;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .content {
              font-size: 16px;
              text-align: justify;
              margin: 30px 0;
              line-height: 2;
            }
            .patient-name {
              font-weight: bold;
              text-decoration: underline;
            }
            .cid-section {
              margin: 20px 0;
              padding: 15px;
              background-color: #f0f9ff;
              border-left: 4px solid #0891b2;
              font-size: 14px;
            }
            .observations {
              margin: 30px 0;
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
            <div class="clinic-name">${certificate.clinicaNome}</div>
            <div class="clinic-info">
              Endereço da Clínica • Telefone: (00) 0000-0000<br>
              Email: contato@clinica.com • CNPJ: 00.000.000/0001-00
            </div>
          </div>

          <div class="certificate-title">Atestado Médico Odontológico</div>

          <div class="content">
            Atesto para os devidos fins que o(a) paciente <span class="patient-name">${patientName}</span>, 
            portador(a) do documento de identidade informado em prontuário, esteve sob meus cuidados 
            profissionais em <strong>${issueDate}</strong>, necessitando de afastamento de suas atividades 
            por <strong>${certificate.diasAfastamento || 1} dia${(certificate.diasAfastamento || 1) > 1 ? "s" : ""}</strong>, 
            para tratamento odontológico.
          </div>

          ${cidSection}

          ${
            certificate.observacoes
              ? `
            <div class="observations">
              <strong>Observações:</strong> ${certificate.observacoes}
            </div>
          `
              : ""
          }

          <div class="signature-area">
            <div class="signature-line"></div>
            <div class="doctor-info">
              <strong>${certificate.dentistaNome}</strong><br>
              CRO: ${certificate.dentistaCro}<br>
              Especialidade: Odontologia
            </div>
          </div>

          <div class="footer">
            Documento emitido em ${currentDate}<br>
            Este atestado é válido em todo território nacional
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

  const downloadCertificate = (certificate: Certificate) => {
    const element = document.createElement("a")
    const file = new Blob([certificate.texto], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `atestado_${patientName}_${certificate.dataEmissao}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Atestados</h3>
        <Button onClick={() => setShowForm(!showForm)} className="dental-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Atestado
        </Button>
      </div>

      {showForm && (
        <div className="dental-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Novo Atestado</h4>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Data de Emissão</Label>
                <Input
                  type="date"
                  value={newCertificate.dataEmissao}
                  onChange={(e) => setNewCertificate((prev) => ({ ...prev, dataEmissao: e.target.value }))}
                />
              </div>
              <div>
                <Label>Dias de Afastamento</Label>
                <Input
                  type="number"
                  min="1"
                  value={newCertificate.diasAfastamento}
                  onChange={(e) =>
                    setNewCertificate((prev) => ({ ...prev, diasAfastamento: Number.parseInt(e.target.value) || 1 }))
                  }
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Input
                  value={newCertificate.tipo}
                  onChange={(e) => setNewCertificate((prev) => ({ ...prev, tipo: e.target.value }))}
                  placeholder="Atestado Médico"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nome do Dentista *</Label>
                <Input
                  value={newCertificate.dentistaNome}
                  onChange={(e) => setNewCertificate((prev) => ({ ...prev, dentistaNome: e.target.value }))}
                  placeholder="Dr(a). Nome do Dentista"
                  required
                />
              </div>
              <div>
                <Label>CRO *</Label>
                <Input
                  value={newCertificate.dentistaCro}
                  onChange={(e) => setNewCertificate((prev) => ({ ...prev, dentistaCro: e.target.value }))}
                  placeholder="Ex: CRO/SP 12345"
                  required
                />
              </div>
              <div>
                <Label>Nome da Clínica</Label>
                <Input
                  value={newCertificate.clinicaNome}
                  onChange={(e) => setNewCertificate((prev) => ({ ...prev, clinicaNome: e.target.value }))}
                  placeholder="Nome da clínica"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>CID-10 (Classificação Internacional de Doenças)</Label>
                <Select
                  value={newCertificate.cid || "none"}
                  onValueChange={(value) =>
                    setNewCertificate((prev) => ({ ...prev, cid: value === "none" ? "" : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um CID (opcional)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="none">Nenhum CID</SelectItem>
                    {commonCIDs.map((cid) => (
                      <SelectItem key={cid.code} value={cid.code}>
                        <div className="flex flex-col">
                          <span className="font-medium">{cid.code}</span>
                          <span className="text-xs text-gray-600">{cid.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>CID Manual (se não estiver na lista)</Label>
                <Input
                  value={
                    newCertificate.cid && !commonCIDs.find((c) => c.code === newCertificate.cid)
                      ? newCertificate.cid
                      : ""
                  }
                  onChange={(e) => setNewCertificate((prev) => ({ ...prev, cid: e.target.value }))}
                  placeholder="Ex: K02.9"
                />
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={newCertificate.observacoes}
                onChange={(e) => setNewCertificate((prev) => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais sobre o tratamento..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={generateCertificateText}>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Texto
              </Button>
              <Button onClick={saveCertificate} disabled={!newCertificate.texto} className="dental-primary">
                Salvar Atestado
              </Button>
            </div>

            {newCertificate.texto && (
              <div>
                <Label>Prévia do Atestado</Label>
                <div className="border rounded-lg p-4 bg-gray-50 font-mono text-sm whitespace-pre-line">
                  {newCertificate.texto}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {certificates.length > 0 && (
        <div className="dental-card p-6">
          <h4 className="text-lg font-semibold mb-4">Atestados Emitidos</h4>
          <div className="space-y-3">
            {certificates.map((certificate) => (
              <div
                key={certificate.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <FileText className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{certificate.tipo}</div>
                    <div className="text-sm text-gray-600">
                      Emitido em {new Date(certificate.dataEmissao).toLocaleDateString("pt-BR")}
                      {certificate.diasAfastamento &&
                        ` • ${certificate.diasAfastamento} dia${certificate.diasAfastamento > 1 ? "s" : ""} de afastamento`}
                      {certificate.cid && ` • CID: ${certificate.cid}`}
                    </div>
                    {certificate.observacoes && (
                      <div className="text-xs text-gray-500 mt-1 max-w-md truncate">{certificate.observacoes}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => printCertificate(certificate)}>
                    <Printer className="h-4 w-4 mr-1" />
                    Imprimir
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => downloadCertificate(certificate)}>
                    <Download className="h-4 w-4 mr-1" />
                    Baixar
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
