"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EspecialidadeForm } from "@/components/especialidades/especialidade-form"

export default function NovaEspecialidadePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/especialidades">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Especialidade</h1>
          <p className="text-gray-600">Cadastre uma nova especialidade odontológica</p>
        </div>
      </div>

      <div className="dental-card p-6">
        <EspecialidadeForm />
      </div>
    </div>
  )
}
