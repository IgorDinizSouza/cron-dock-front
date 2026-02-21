"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { dentistasApi } from "@/lib/api"
import { DentistaForm } from "@/components/dentists/dentista-form"

export default function EditDentistaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [dentista, setDentista] = useState<any>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await dentistasApi.getById(id)
        setDentista(data)
      } catch (e) {
        toast({ title: "Erro", description: "Não foi possível carregar o dentista.", variant: "destructive" })
        router.push("/dentistas")
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
        <p className="text-gray-600">Carregando dados do dentista...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Editar Dentista</h1>
          <p className="text-gray-600">Atualize as informações do dentista</p>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <DentistaForm initialData={dentista} isEditing />
      </div>
    </div>
  )
}
