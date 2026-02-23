"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { compradorApi, type CompradorStatus } from "@/lib/comprador"

const COMPRADOR_DESCRICAO_MAX = 120

export default function NovoCompradorPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [descricao, setDescricao] = useState("")
  const [status, setStatus] = useState<CompradorStatus>("ATIVO")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descricao.trim()) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return
    }
    if (descricao.trim().length > COMPRADOR_DESCRICAO_MAX) {
      toast({
        title: "Erro",
        description: `Descricao deve ter no maximo ${COMPRADOR_DESCRICAO_MAX} caracteres.`,
        variant: "destructive",
      })
      return
    }
    try {
      setLoading(true)
      await compradorApi.create({ descricao: descricao.trim(), status })
      toast({ title: "Sucesso", description: "Comprador criado com sucesso." })
      router.push("/compradores")
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || "Não foi possível criar o comprador.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Novo comprador</h1>
          <p className="text-gray-600">Cadastre um comprador para o grupo empresarial</p>
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
                <Input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} maxLength={COMPRADOR_DESCRICAO_MAX} />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as CompradorStatus)} disabled={loading}>
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
          <Button type="submit" className="btn-primary-custom" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Criar comprador
          </Button>
        </div>
      </form>
    </div>
  )
}
