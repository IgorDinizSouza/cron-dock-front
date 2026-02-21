"use client"

import { PatientForm } from "@/components/patients/patient-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NovoPacientePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pacientes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Paciente</h1>
          <p className="text-gray-600">Cadastre um novo paciente no sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <PatientForm />
      </div>
    </div>
  )
}
