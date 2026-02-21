"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PatientForm } from "@/components/patients/patient-form"
import { patientsApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Patient {
  id: string
  nome: string
  cpf: string
  telefone: string
  email: string
  dataNascimento: string
  endereco: string
  historicoMedico?: string
  alergias?: string
  medicamentos?: string
  observacoes?: string
}

function normalizeForForm(p: Patient | null): Patient | null {
  if (!p) return p
  // garante yyyy-MM-dd para <input type="date">
  const dn = p.dataNascimento ? p.dataNascimento.substring(0, 10) : ""
  return { ...p, dataNascimento: dn }
}

export default function EditPatientPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPatient() {
      try {
        const patientData = await patientsApi.getById(id)
        setPatient(normalizeForForm(patientData))
      } catch (error) {
        console.error("[v0] Erro ao carregar paciente:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do paciente",
          variant: "destructive",
        })
        router.push("/pacientes")
      } finally {
        setLoading(false)
      }
    }
    if (id) loadPatient()
  }, [id, router, toast])

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-600" />
        <p className="text-gray-600">Carregando dados do paciente...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Paciente</h1>
          <p className="text-gray-600">Atualize as informações do paciente</p>
        </div>
      </div>

      <div className="dental-card p-6">
        {/* AQUI: passamos o patientId e REMOVEMOS isEditing */}
        <PatientForm patientId={id} initialData={patient!} />
      </div>
    </div>
  )
}
