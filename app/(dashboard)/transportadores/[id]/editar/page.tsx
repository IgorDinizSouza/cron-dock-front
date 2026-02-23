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
import { transportadorApi, type TransportadorStatus } from "@/lib/transportador"

const TRANSPORTADOR_DESCRICAO_MAX = 150
const TRANSPORTADOR_CNPJ_MAX = 20

type FormState = {
  descricao: string
  cnpj: string
  status: TransportadorStatus
}

export default function EditarTransportadorPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const transportadorId = params?.id

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState<FormState>({
    descricao: "",
    cnpj: "",
    status: "ATIVO",
  })
  const [original, setOriginal] = useState<FormState | null>(null)

  const hasChanges = useMemo(() => {
    if (!original) return false
    return (
      formData.descricao !== original.descricao ||
      formData.cnpj !== original.cnpj ||
      formData.status !== original.status
    )
  }, [formData, original])

  useEffect(() => {
    const load = async () => {
      if (!transportadorId) return
      try {
        setLoadingData(true)
        const item = await transportadorApi.getById(transportadorId)
        const state: FormState = {
          descricao: item.descricao || "",
          cnpj: item.cnpj || "",
          status: item.status || "ATIVO",
        }
        setFormData(state)
        setOriginal(state)
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Não foi possível carregar o transportador.",
          variant: "destructive",
        })
        router.push("/transportadores")
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [router, toast, transportadorId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transportadorId) return

    if (!formData.descricao.trim()) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return
    }
    if (!formData.cnpj.trim()) {
      toast({ title: "Erro", description: "CNPJ é obrigatório.", variant: "destructive" })
      return
    }

    if (formData.descricao.trim().length > TRANSPORTADOR_DESCRICAO_MAX) {
      toast({
        title: "Erro",
        description: `Descricao deve ter no maximo ${TRANSPORTADOR_DESCRICAO_MAX} caracteres.`,
        variant: "destructive",
      })
      return
    }
    if (formData.cnpj.trim().length > TRANSPORTADOR_CNPJ_MAX) {
      toast({
        title: "Erro",
        description: `CNPJ deve ter no maximo ${TRANSPORTADOR_CNPJ_MAX} caracteres.`,
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      await transportadorApi.update(transportadorId, {
        descricao: formData.descricao.trim(),
        cnpj: formData.cnpj.trim(),
        status: formData.status,
      })
      toast({ title: "Sucesso", description: "Transportador atualizado com sucesso." })
      router.push("/transportadores")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar o transportador.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return <div className="py-12 text-center text-gray-500">Carregando transportador...</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Editar transportador</h1>
            <p className="text-gray-600">Atualize os dados do transportador</p>
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
                  value={formData.descricao}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                  disabled={loading}
                  maxLength={TRANSPORTADOR_DESCRICAO_MAX}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cnpj: e.target.value }))}
                  disabled={loading}
                  maxLength={TRANSPORTADOR_CNPJ_MAX}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as TransportadorStatus }))}
                  disabled={loading}
                >
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
          <Button type="submit" className="btn-primary-custom" disabled={loading || !hasChanges}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
