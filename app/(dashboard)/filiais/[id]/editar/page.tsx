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
import { filialApi, type FilialRequest, type FilialStatus } from "@/lib/filial"

type FormState = {
  descricao: string
  cnpj: string
  endereco: string
  bairro: string
  codigoIbgeCidade: string
  uf: string
  cep: string
  cd: string
  wms: string
  flagRegional: string
  descricaoRegional: string
  status: FilialStatus
}

const LIMITES = {
  descricao: 120,
  cnpj: 50,
  endereco: 255,
  bairro: 120,
  codigoIbgeCidade: 20,
  uf: 2,
  cep: 20,
  descricaoRegional: 200,
} as const

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

function toFormState(item: any): FormState {
  return {
    descricao: item.descricao || "",
    cnpj: item.cnpj || "",
    endereco: item.endereco || "",
    bairro: item.bairro || "",
    codigoIbgeCidade: item.codigoIbgeCidade || "",
    uf: item.uf || "",
    cep: item.cep || "",
    cd: item.cd != null ? String(item.cd) : "",
    wms: item.wms != null ? String(item.wms) : "",
    flagRegional: item.flagRegional != null ? String(item.flagRegional) : "",
    descricaoRegional: item.descricaoRegional || "",
    status: item.status || "ATIVO",
  }
}

function buildPayload(form: FormState): FilialRequest {
  return {
    descricao: form.descricao.trim(),
    cnpj: form.cnpj.trim(),
    endereco: form.endereco.trim(),
    bairro: form.bairro.trim(),
    codigoIbgeCidade: form.codigoIbgeCidade.trim(),
    uf: form.uf.trim().toUpperCase(),
    cep: form.cep.trim(),
    cd: toNullableNumber(form.cd),
    wms: toNullableNumber(form.wms),
    flagRegional: toNullableNumber(form.flagRegional),
    descricaoRegional: form.descricaoRegional.trim(),
    status: form.status,
  }
}

export default function EditarFilialPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const filialId = params?.id

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState<FormState>({
    descricao: "",
    cnpj: "",
    endereco: "",
    bairro: "",
    codigoIbgeCidade: "",
    uf: "",
    cep: "",
    cd: "",
    wms: "",
    flagRegional: "",
    descricaoRegional: "",
    status: "ATIVO",
  })
  const [original, setOriginal] = useState<FormState | null>(null)

  const hasChanges = useMemo(() => {
    if (!original) return false
    return JSON.stringify(formData) !== JSON.stringify(original)
  }, [formData, original])

  useEffect(() => {
    const load = async () => {
      if (!filialId) return
      try {
        setLoadingData(true)
        const item = await filialApi.getById(filialId)
        const state = toFormState(item)
        setFormData(state)
        setOriginal(state)
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Não foi possível carregar a filial.",
          variant: "destructive",
        })
        router.push("/filiais")
      } finally {
        setLoadingData(false)
      }
    }

    load()
  }, [filialId, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!filialId) return

    if (!formData.descricao.trim()) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return
    }
    if (!formData.cnpj.trim()) {
      toast({ title: "Erro", description: "CNPJ é obrigatório.", variant: "destructive" })
      return
    }

    if (formData.descricao.trim().length > LIMITES.descricao) {
      toast({ title: "Erro", description: `Descricao deve ter no maximo ${LIMITES.descricao} caracteres.`, variant: "destructive" })
      return
    }
    if (formData.cnpj.trim().length > LIMITES.cnpj) {
      toast({ title: "Erro", description: `CNPJ deve ter no maximo ${LIMITES.cnpj} caracteres.`, variant: "destructive" })
      return
    }
    if (formData.endereco.trim().length > LIMITES.endereco) {
      toast({ title: "Erro", description: `Endereco deve ter no maximo ${LIMITES.endereco} caracteres.`, variant: "destructive" })
      return
    }
    if (formData.bairro.trim().length > LIMITES.bairro) {
      toast({ title: "Erro", description: `Bairro deve ter no maximo ${LIMITES.bairro} caracteres.`, variant: "destructive" })
      return
    }
    if (formData.codigoIbgeCidade.trim().length > LIMITES.codigoIbgeCidade) {
      toast({ title: "Erro", description: `Codigo IBGE da cidade deve ter no maximo ${LIMITES.codigoIbgeCidade} caracteres.`, variant: "destructive" })
      return
    }
    if (formData.cep.trim().length > LIMITES.cep) {
      toast({ title: "Erro", description: `CEP deve ter no maximo ${LIMITES.cep} caracteres.`, variant: "destructive" })
      return
    }
    if (formData.descricaoRegional.trim().length > LIMITES.descricaoRegional) {
      toast({ title: "Erro", description: `Descricao regional deve ter no maximo ${LIMITES.descricaoRegional} caracteres.`, variant: "destructive" })
      return
    }
    if (formData.uf.trim().length > LIMITES.uf) {
      toast({ title: "Erro", description: `UF deve ter no maximo ${LIMITES.uf} caracteres.`, variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      await filialApi.update(filialId, buildPayload(formData))
      toast({ title: "Sucesso", description: "Filial atualizada com sucesso." })
      router.push("/filiais")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar a filial.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return <div className="py-12 text-center text-gray-500">Carregando filial...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-4">
          <Link href="/filiais">
            <Button size="sm" className="btn-primary-custom">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar filial</h1>
            <p className="text-gray-600">Atualize os dados da filial</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados da filial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input id="descricao" value={formData.descricao} onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} maxLength={LIMITES.descricao} />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input id="cnpj" value={formData.cnpj} onChange={(e) => setFormData((p) => ({ ...p, cnpj: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} maxLength={LIMITES.cnpj} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" value={formData.endereco} onChange={(e) => setFormData((p) => ({ ...p, endereco: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} maxLength={LIMITES.endereco} />
              </div>
              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" value={formData.bairro} onChange={(e) => setFormData((p) => ({ ...p, bairro: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} maxLength={LIMITES.bairro} />
              </div>
              <div>
                <Label htmlFor="codigoIbgeCidade">Código IBGE da cidade</Label>
                <Input id="codigoIbgeCidade" value={formData.codigoIbgeCidade} onChange={(e) => setFormData((p) => ({ ...p, codigoIbgeCidade: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} maxLength={LIMITES.codigoIbgeCidade} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="uf">UF</Label>
                <Input id="uf" value={formData.uf} onChange={(e) => setFormData((p) => ({ ...p, uf: e.target.value.toUpperCase().slice(0, 2) }))} className="h-10 border-gray-200 bg-white uppercase shadow-sm" disabled={loading} maxLength={2} />
              </div>
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input id="cep" value={formData.cep} onChange={(e) => setFormData((p) => ({ ...p, cep: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} maxLength={LIMITES.cep} />
              </div>
              <div>
                <Label htmlFor="cd">CD</Label>
                <Input id="cd" type="number" value={formData.cd} onChange={(e) => setFormData((p) => ({ ...p, cd: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
              </div>
              <div>
                <Label htmlFor="wms">WMS</Label>
                <Input id="wms" type="number" value={formData.wms} onChange={(e) => setFormData((p) => ({ ...p, wms: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="flagRegional">Flag regional</Label>
                <Input id="flagRegional" type="number" value={formData.flagRegional} onChange={(e) => setFormData((p) => ({ ...p, flagRegional: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="descricaoRegional">Descrição regional</Label>
                <Input id="descricaoRegional" value={formData.descricaoRegional} onChange={(e) => setFormData((p) => ({ ...p, descricaoRegional: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} maxLength={LIMITES.descricaoRegional} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData((p) => ({ ...p, status: value as FilialStatus }))} disabled={loading}>
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
