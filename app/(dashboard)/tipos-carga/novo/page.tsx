"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Loader2, Package, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { tipoCargaApi } from "@/lib/tipo-carga"

export default function NovoTipoCargaPage() {
  const MAX_DESCRICAO = 50
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [descricao, setDescricao] = useState("")
  const [minSku, setMinSku] = useState("")
  const [maxSku, setMaxSku] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const descricaoTrim = descricao.trim()
    if (!descricaoTrim) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return
    }
    if (descricaoTrim.length > MAX_DESCRICAO) {
      toast({ title: "Erro", description: `Descrição deve ter no máximo ${MAX_DESCRICAO} caracteres.`, variant: "destructive" })
      return
    }

    const min = minSku.trim() === "" ? null : Number(minSku)
    const max = maxSku.trim() === "" ? null : Number(maxSku)
    if ((min != null && Number.isNaN(min)) || (max != null && Number.isNaN(max))) {
      toast({ title: "Erro", description: "Min SKU e Max SKU devem ser números válidos.", variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      await tipoCargaApi.create({ descricao: descricaoTrim, minSku: min, maxSku: max })
      toast({ title: "Sucesso", description: "Tipo de carga criado com sucesso." })
      router.push("/tipos-carga")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível criar o tipo de carga.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Novo tipo de carga</h1>
            <p className="text-gray-600">Cadastre um novo tipo de carga</p>
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
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
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
                  value={minSku}
                  onChange={(e) => setMinSku(e.target.value)}
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
                  value={maxSku}
                  onChange={(e) => setMaxSku(e.target.value)}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-6">
          <Button type="submit" className="btn-primary-custom" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Criar tipo de carga
          </Button>
        </div>
      </form>
    </div>
  )
}

