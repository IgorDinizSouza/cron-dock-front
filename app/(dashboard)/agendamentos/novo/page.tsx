import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NovoAgendamentoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/agendamentos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Agendamento</h1>
          <p className="text-gray-600">Agende uma nova consulta</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informacoes do Agendamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Formulario de agendamento removido desta versao.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}