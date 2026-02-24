"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Boxes, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { especieCargaApi, type EspecieCargaStatus } from "@/lib/especie-carga"

export default function NovaEspecieCargaPage() {
  const MAX_DESCRICAO = 50
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [descricao, setDescricao] = useState("")
  const [status, setStatus] = useState<EspecieCargaStatus>("ATIVO")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descricao.trim()) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return
    }
    if (descricao.trim().length > MAX_DESCRICAO) {
      toast({ title: "Erro", description: `Descrição deve ter no máximo ${MAX_DESCRICAO} caracteres.`, variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      await especieCargaApi.create({
        descricao: descricao.trim(),
        ativo: status === "ATIVO",
      })
      toast({ title: "Sucesso", description: "Espécie de carga criada com sucesso." })
      router.push("/especies-carga")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível criar a espécie de carga.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Nova espécie de carga</h1>
            <p className="text-gray-600">Cadastre uma nova espécie de carga</p>
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
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  maxLength={MAX_DESCRICAO}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as EspecieCargaStatus)} disabled={loading}>
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
          <Button type="submit" className="btn-primary-custom" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Criar espécie de carga
          </Button>
        </div>
      </form>
    </div>
  )
}
