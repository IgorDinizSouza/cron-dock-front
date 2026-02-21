"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { patientsApi, api } from "@/lib/api"
import { PatientRecordForm } from "@/components/patients/patient-record-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DentalRecordWorkflow } from "@/components/patients/dental-record-workflow"
import { PaymentSection } from "@/components/patients/payment-section"
import { CertificateSection } from "@/components/patients/certificate-section"
import { PrescriptionSection } from "@/components/patients/prescription-section"
import { BudgetHistorySection } from "@/components/patients/budget-history-section"
import { ReferralSection } from "@/components/patients/referral-section"
import { ExamRequestSection } from "@/components/patients/exam-request-section"

type ClinicInfo = {
  name: string
  email?: string
  phone?: string
  address?: string
  cep?: string
  estado?: string
  cidade?: string
  bairro?: string
  rua?: string
  numero?: string
  complemento?: string
}

export default function FichaDoPacientePage() {
  const params = useParams<{ id: string }>()
  const pacienteId = params?.id
  const { toast } = useToast()

  const [patient, setPatient] = useState<any | null>(null)
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [printMode, setPrintMode] = useState(false)
  const [clinic, setClinic] = useState<ClinicInfo | undefined>(undefined)

  const loadPatient = async () => {
    try {
      const data = await patientsApi.getById(String(pacienteId))
      setPatient(data)
    } catch (e: any) {
      toast({ title: "Erro", description: "Não foi possível carregar o paciente.", variant: "destructive" })
    }
  }

  // Tenta descobrir o consultório atual do usuário logado e montar os campos de endereço/contato
  const loadClinic = async () => {
    try {
      // 1) Se você já salva isso no localStorage (ex.: após login/configurações), respeitamos
      const saved = typeof window !== "undefined" ? localStorage.getItem("clinicInfo") : null
      if (saved) {
        const parsed = JSON.parse(saved)
        setClinic(normalizeClinic(parsed))
        return
      }

      // 2) Tenta endpoints comuns do backend (ajuste para o seu)
      //    Use o primeiro que responder OK.
      const candidates = ["/consultorios/me", "/me/consultorio", "/consultorios/atual"]

      for (const endpoint of candidates) {
        try {
          const data = await api.get(endpoint)
          if (data) {
            setClinic(normalizeClinic(data))
            return
          }
        } catch {
          // ignora e tenta o próximo
        }
      }

      // 3) Se tiver consultorioId no patient (ou em outro lugar), dá para tentar /consultorios/{id}
      const consultorioId =
        patient?.consultorioId ||
        (typeof window !== "undefined" ? localStorage.getItem("consultorioId") : null)

      if (consultorioId) {
        try {
          const data = await api.get(`/consultorios/${consultorioId}`)
          if (data) {
            setClinic(normalizeClinic(data))
            return
          }
        } catch {
          // silencioso
        }
      }

    } catch {
      // silencioso: não bloqueia a página
    }
  }

  // Converte qualquer payload do backend para a estrutura do BudgetHistorySection
  const normalizeClinic = (raw: any): ClinicInfo => {
    const name =
      raw?.nome ||
      raw?.name ||
      raw?.fantasia ||
      "Cron Dock"

    const phone = raw?.telefone || raw?.phone || raw?.celular || raw?.contato || undefined
    const email = raw?.email || raw?.contatoEmail || undefined

    // Endereço pode vir em campos separados
    const cep = raw?.cep || raw?.enderecoCep || undefined
    const estado = raw?.estado || raw?.uf || raw?.enderecoUf || undefined
    const cidade = raw?.cidade || raw?.municipio || raw?.enderecoCidade || undefined
    const bairro = raw?.bairro || raw?.enderecoBairro || undefined
    const rua = raw?.rua || raw?.logradouro || raw?.enderecoRua || raw?.enderecoLogradouro || undefined
    const numero = raw?.numero || raw?.enderecoNumero || undefined
    const complemento = raw?.complemento || raw?.enderecoComplemento || undefined

    // Monta address pronto caso as partes estejam disponíveis
    const parts = [
      [rua, numero].filter(Boolean).join(", "),
      [bairro].filter(Boolean).join(""),
      [cidade, estado].filter(Boolean).join(" - "),
      cep ? `CEP ${cep}` : undefined,
      complemento,
    ].filter(Boolean)

    const address = parts.join(" • ")

    return {
      name,
      email,
      phone,
      address,
      cep,
      estado,
      cidade,
      bairro,
      rua,
      numero,
      complemento,
    }
  }

  useEffect(() => {
    if (pacienteId) loadPatient()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId])

  // Carrega dados do consultório (uma vez e também quando o patient chegar, caso precise do consultorioId)
  useEffect(() => {
    loadClinic()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient])

  useEffect(() => {
    const onBefore = () => setPrintMode(true)
    const onAfter = () => setPrintMode(false)
    window.addEventListener("beforeprint", onBefore)
    window.addEventListener("afterprint", onAfter)
    return () => {
      window.removeEventListener("beforeprint", onBefore)
      window.removeEventListener("afterprint", onAfter)
    }
  }, [])

  const onCreateNew = () => {
    setEditing(null)
    setOpenForm(true)
  }

  const onEdit = (record: any) => {
    setEditing(record)
    setOpenForm(true)
  }

  const onSaved = () => {
    setOpenForm(false)
    setEditing(null)
    setReloadKey((k) => k + 1)
  }

  const print = () => window.print()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Ficha do Paciente</h1>
          <p className="text-gray-600">
            {patient ? `${patient.nome}${patient.cpf ? " • CPF " + patient.cpf : ""}` : "Carregando paciente..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="dental-primary" onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova anotação
          </Button>
        </div>
      </div>

      <Tabs defaultValue="orcamento" className="w-full">
        <TabsList className="no-print grid w-full grid-cols-6">
          <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
          <TabsTrigger value="receituario">Receituário</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="atestados">Atestados</TabsTrigger>
          <TabsTrigger value="encaminhamentos">Encaminhamentos</TabsTrigger>
          <TabsTrigger value="exames">Exames</TabsTrigger>
        </TabsList>

        <TabsContent value="orcamento" className="mt-4">
          <div className="space-y-6">
            {/* Odontograma */}
            <DentalRecordWorkflow pacienteId={String(pacienteId)} patientName={patient?.nome || "Paciente"} />

            {/* Histórico de Orçamentos */}
            <div className="dental-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Orçamentos</h3>
              <BudgetHistorySection
                key={reloadKey}
                pacienteId={String(pacienteId)}
                patientName={patient?.nome || "Paciente"}
                clinic={clinic}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="receituario" className="mt-4">
          <div className="dental-card p-6">
            <PrescriptionSection pacienteId={String(pacienteId)} patientName={patient?.nome || "Paciente"} />
          </div>
        </TabsContent>

        <TabsContent value="pagamentos" className="mt-4">
          <div className="dental-card p-6">
            <PaymentSection pacienteId={String(pacienteId)} />
          </div>
        </TabsContent>

        <TabsContent value="atestados" className="mt-4">
          <div className="dental-card p-6">
            <CertificateSection pacienteId={String(pacienteId)} patientName={patient?.nome || "Paciente"} />
          </div>
        </TabsContent>

        <TabsContent value="encaminhamentos" className="mt-4">
          <div className="dental-card p-6">
            <ReferralSection pacienteId={String(pacienteId)} patientName={patient?.nome || "Paciente"} />
          </div>
        </TabsContent>

        <TabsContent value="exames" className="mt-4">
          <div className="dental-card p-6">
            <ExamRequestSection pacienteId={String(pacienteId)} patientName={patient?.nome || "Paciente"} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: criar/editar anotação (não imprime) */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-3xl no-print">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">
              {editing ? "Editar anotação" : "Nova anotação"}
            </DialogTitle>
          </DialogHeader>

          <PatientRecordForm
            pacienteId={String(pacienteId)}
            initialData={editing}
            onSaved={onSaved}
            onCancel={() => {
              setEditing(null)
              setOpenForm(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
