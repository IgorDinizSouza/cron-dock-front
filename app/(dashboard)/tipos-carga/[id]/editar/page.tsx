"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Package, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { tipoCargaApi } from "@/lib/tipo-carga"

type FormState = {
  descricao: string
  minSku: string
  maxSku: string
}

export default function EditarTipoCargaPage() {
  const MAX_DESCRICAO = 50
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const itemId = params?.id

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState<FormState>({
    descricao: "",
    minSku: "",
    maxSku: "",
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
        const item = await tipoCargaApi.getById(itemId)
        const state: FormState = {
          descricao: item.descricao || "",
          minSku: item.minSku == null ? "" : String(item.minSku),
          maxSku: item.maxSku == null ? "" : String(item.maxSku),
        }
        setFormData(state)
        setOriginal(state)
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Não foi possível carregar o tipo de carga.",
          variant: "destructive",
        })
        router.push("/tipos-carga")
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [itemId, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemId) return

    const descricaoTrim = formData.descricao.trim()
    if (!descricaoTrim) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return
    }
    if (descricaoTrim.length > MAX_DESCRICAO) {
      toast({ title: "Erro", description: `Descrição deve ter no máximo ${MAX_DESCRICAO} caracteres.`, variant: "destructive" })
      return
    }

    const min = formData.minSku.trim() === "" ? null : Number(formData.minSku)
    const max = formData.maxSku.trim() === "" ? null : Number(formData.maxSku)
    if ((min != null && Number.isNaN(min)) || (max != null && Number.isNaN(max))) {
      toast({ title: "Erro", description: "Min SKU e Max SKU devem ser números válidos.", variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      await tipoCargaApi.update(itemId, {
        descricao: descricaoTrim,
        minSku: min,
        maxSku: max,
      })
      toast({ title: "Sucesso", description: "Tipo de carga atualizado com sucesso." })
      router.push("/tipos-carga")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar o tipo de carga.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) return <div className="py-12 text-center text-gray-500">Carregando tipo de carga...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tipos-carga">
          <Button size="sm" className="btn-primary-custom">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar tipo de carga</h1>
            <p className="text-gray-600">Atualize os dados do tipo de carga</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados do tipo de carga</CardTitle>
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
                <Label htmlFor="minSku">Min SKU</Label>
                <Input
                  id="minSku"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={formData.minSku}
                  onChange={(e) => setFormData((p) => ({ ...p, minSku: e.target.value }))}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="maxSku">Max SKU</Label>
                <Input
                  id="maxSku"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={formData.maxSku}
                  onChange={(e) => setFormData((p) => ({ ...p, maxSku: e.target.value }))}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  disabled={loading}
                />
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

