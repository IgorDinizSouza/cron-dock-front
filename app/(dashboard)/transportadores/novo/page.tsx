"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Loader2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { transportadorApi, type TransportadorStatus } from "@/lib/transportador"

const TRANSPORTADOR_DESCRICAO_MAX = 150
const TRANSPORTADOR_CNPJ_MAX = 20

export default function NovoTransportadorPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [descricao, setDescricao] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [status, setStatus] = useState<TransportadorStatus>("ATIVO")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!descricao.trim()) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return
    }
    if (!cnpj.trim()) {
      toast({ title: "Erro", description: "CNPJ é obrigatório.", variant: "destructive" })
      return
    }

    if (descricao.trim().length > TRANSPORTADOR_DESCRICAO_MAX) {
      toast({
        title: "Erro",
        description: `Descricao deve ter no maximo ${TRANSPORTADOR_DESCRICAO_MAX} caracteres.`,
        variant: "destructive",
      })
      return
    }
    if (cnpj.trim().length > TRANSPORTADOR_CNPJ_MAX) {
      toast({
        title: "Erro",
        description: `CNPJ deve ter no maximo ${TRANSPORTADOR_CNPJ_MAX} caracteres.`,
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      await transportadorApi.create({
        descricao: descricao.trim(),
        cnpj: cnpj.trim(),
        status,
      })
      toast({ title: "Sucesso", description: "Transportador criado com sucesso." })
      router.push("/transportadores")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível criar o transportador.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-4">
          <Link href="/transportadores">
            <Button size="sm" className="btn-primary-custom">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo transportador</h1>
            <p className="text-gray-600">Cadastre um transportador para o grupo empresarial</p>
          </div>
        </div>
        <div />
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Dados do transportador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  disabled={loading}
                  maxLength={TRANSPORTADOR_DESCRICAO_MAX}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  disabled={loading}
                  maxLength={TRANSPORTADOR_CNPJ_MAX}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as TransportadorStatus)} disabled={loading}>
                  <SelectTrigger
                    id="status"
                    className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500"
                  >
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
          <Link href="/transportadores">
            <Button type="button" className="btn-primary-custom" disabled={loading}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="btn-primary-custom" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Criar transportador
          </Button>
        </div>
      </form>
    </div>
  )
}
