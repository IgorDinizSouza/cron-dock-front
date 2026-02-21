import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProcedureForm } from "@/components/procedures/procedure-form"

export default function NovoProcedimentoPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/procedimentos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Procedimento</h1>
          <p className="text-gray-600">Cadastre um novo procedimento odontológico</p>
        </div>
      </div>

      <div className="dental-card p-6">
        <ProcedureForm />
      </div>
    </div>
  )
}
