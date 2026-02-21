"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { proceduresApi } from "@/lib/api"
import { ProcedureForm } from "@/components/procedures/procedure-form"
import { useToast } from "@/hooks/use-toast"

export default function EditarProcedimentoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const p = await proceduresApi.getById(id as string)
        setData(p)
      } catch {
        toast({ title: "Erro", description: "Não foi possível carregar o procedimento.", variant: "destructive" })
        router.push("/procedimentos")
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id, router, toast])

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-600" />
        <p className="text-gray-600">Carregando procedimento...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Editar Procedimento</h1>
          <p className="text-gray-600">Atualize as informações do procedimento</p>
        </div>
      </div>

      <div className="dental-card p-6">
        <ProcedureForm procedureId={id as string} initialData={data} />
      </div>
    </div>
  )
}
