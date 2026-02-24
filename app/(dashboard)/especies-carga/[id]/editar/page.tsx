"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Boxes, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { especieCargaApi, type EspecieCargaStatus } from "@/lib/especie-carga"

type FormState = {
  descricao: string
  status: EspecieCargaStatus
}

export default function EditarEspecieCargaPage() {
  const MAX_DESCRICAO = 50
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const itemId = params?.id

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState<FormState>({
    descricao: "",
    status: "ATIVO",
  })
  const [original, setOriginal] = useState<FormState | null>(null)

  const hasChanges = useMemo(
    () => (original ? JSON.stringify(formData) !== JSON.stringify(original) : false),
    [formData, original],
  )

  useEffect(() => {
    const load = async () => {
      if (!itemId) return
      try {
        setLoadingData(true)
        const item = await especieCargaApi.getById(itemId)
        const state: FormState = {
          descricao: item.descricao || "",
          status: item.status || "ATIVO",
        }
        setFormData(state)
        setOriginal(state)
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Não foi possível carregar a espécie de carga.",
          variant: "destructive",
        })
        router.push("/especies-carga")
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [itemId, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemId) return

    if (!formData.descricao.trim()) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return
    }
    if (formData.descricao.trim().length > MAX_DESCRICAO) {
      toast({ title: "Erro", description: `Descrição deve ter no máximo ${MAX_DESCRICAO} caracteres.`, variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      await especieCargaApi.update(itemId, {
        descricao: formData.descricao.trim(),
        ativo: formData.status === "ATIVO",
      })
      toast({ title: "Sucesso", description: "Espécie de carga atualizada com sucesso." })
      router.push("/especies-carga")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar a espécie de carga.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) return <div className="py-12 text-center text-gray-500">Carregando espécie de carga...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/especies-carga">
          <Button size="sm" className="btn-primary-custom">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar espécie de carga</h1>
            <p className="text-gray-600">Atualize os dados da espécie de carga</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados da espécie de carga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
                  maxLength={MAX_DESCRICAO}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((p) => ({ ...p, status: value as EspecieCargaStatus }))}
                  disabled={loading}
                >
                  <SelectTrigger id="status" className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">
                      Ativo
                    </SelectItem>
                    <SelectItem value="INATIVO" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">
                      Inativo
                    </SelectItem>
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
