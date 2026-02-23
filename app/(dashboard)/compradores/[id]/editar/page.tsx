"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { compradorApi, type CompradorStatus } from "@/lib/comprador"

const COMPRADOR_DESCRICAO_MAX = 120

type FormState = { descricao: string; status: CompradorStatus }

export default function EditarCompradorPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const compradorId = params?.id

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState<FormState>({ descricao: "", status: "ATIVO" })
  const [original, setOriginal] = useState<FormState | null>(null)

  const hasChanges = useMemo(() => (original ? JSON.stringify(formData) !== JSON.stringify(original) : false), [formData, original])

  useEffect(() => {
    const load = async () => {
      if (!compradorId) return
      try {
        setLoadingData(true)
        const item = await compradorApi.getById(compradorId)
        const state: FormState = { descricao: item.descricao || "", status: item.status || "ATIVO" }
        setFormData(state)
        setOriginal(state)
      } catch (error: any) {
        toast({ title: "Erro", description: error?.message || "Não foi possível carregar o comprador.", variant: "destructive" })
        router.push("/compradores")
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [compradorId, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!compradorId) return
    if (!formData.descricao.trim()) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return
    }
    if (formData.descricao.trim().length > COMPRADOR_DESCRICAO_MAX) {
      toast({
        title: "Erro",
        description: `Descricao deve ter no maximo ${COMPRADOR_DESCRICAO_MAX} caracteres.`,
        variant: "destructive",
      })
      return
    }
    try {
      setLoading(true)
      await compradorApi.update(compradorId, { descricao: formData.descricao.trim(), status: formData.status })
      toast({ title: "Sucesso", description: "Comprador atualizado com sucesso." })
      router.push("/compradores")
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || "Não foi possível atualizar o comprador.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) return <div className="py-12 text-center text-gray-500">Carregando comprador...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/compradores">
          <Button size="sm" className="btn-primary-custom">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar comprador</h1>
          <p className="text-gray-600">Atualize os dados do comprador</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados do comprador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input id="descricao" value={formData.descricao} onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} maxLength={COMPRADOR_DESCRICAO_MAX} />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData((p) => ({ ...p, status: value as CompradorStatus }))} disabled={loading}>
                  <SelectTrigger id="status" className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">Ativo</SelectItem>
                    <SelectItem value="INATIVO" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-4 pt-6">
          <Button type="submit" className="btn-primary-custom" disabled={loading || !hasChanges}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
