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
import { fornecedorApi, type FornecedorStatus } from "@/lib/fornecedor"

type FormState = {
  razaoSocial: string
  cnpj: string
  cidade: string
  uf: string
  dataCadastro: string
  status: FornecedorStatus
}

const LIMITES = {
  razaoSocial: 200,
  cidade: 120,
  uf: 2,
  cnpj: 50,
} as const

export default function EditarFornecedorPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const fornecedorId = params?.id

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState<FormState>({
    razaoSocial: "",
    cnpj: "",
    cidade: "",
    uf: "",
    dataCadastro: "",
    status: "ATIVO",
  })
  const [original, setOriginal] = useState<FormState | null>(null)

  const hasChanges = useMemo(() => {
    if (!original) return false
    return JSON.stringify(formData) !== JSON.stringify(original)
  }, [formData, original])

  useEffect(() => {
    const load = async () => {
      if (!fornecedorId) return
      try {
        setLoadingData(true)
        const item = await fornecedorApi.getById(fornecedorId)
        const state: FormState = {
          razaoSocial: item.razaoSocial || "",
          cnpj: item.cnpj || "",
          cidade: item.cidade || "",
          uf: item.uf || "",
          dataCadastro: item.dataCadastro || "",
          status: item.status || "ATIVO",
        }
        setFormData(state)
        setOriginal(state)
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Não foi possível carregar o fornecedor.",
          variant: "destructive",
        })
        router.push("/fornecedores")
      } finally {
        setLoadingData(false)
      }
    }

    load()
  }, [fornecedorId, router, toast])

  const validarLimites = () => {
    if (formData.razaoSocial.length > LIMITES.razaoSocial) {
      toast({ title: "Erro", description: `Razão social deve ter no máximo ${LIMITES.razaoSocial} caracteres.`, variant: "destructive" })
      return false
    }
    if (formData.cnpj.length > LIMITES.cnpj) {
      toast({ title: "Erro", description: `CNPJ deve ter no máximo ${LIMITES.cnpj} caracteres.`, variant: "destructive" })
      return false
    }
    if (formData.cidade.length > LIMITES.cidade) {
      toast({ title: "Erro", description: `Cidade deve ter no máximo ${LIMITES.cidade} caracteres.`, variant: "destructive" })
      return false
    }
    if (formData.uf.length > LIMITES.uf) {
      toast({ title: "Erro", description: `UF deve ter no máximo ${LIMITES.uf} caracteres.`, variant: "destructive" })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fornecedorId) return

    if (!formData.razaoSocial.trim()) {
      toast({ title: "Erro", description: "Razão social é obrigatória.", variant: "destructive" })
      return
    }
    if (!formData.cnpj.trim()) {
      toast({ title: "Erro", description: "CNPJ é obrigatório.", variant: "destructive" })
      return
    }
    if (!validarLimites()) return

    try {
      setLoading(true)
      await fornecedorApi.update(fornecedorId, {
        razaoSocial: formData.razaoSocial.trim(),
        cnpj: formData.cnpj.trim(),
        cidade: formData.cidade.trim(),
        uf: formData.uf.trim().toUpperCase(),
        dataCadastro: formData.dataCadastro || null,
        status: formData.status,
      })
      toast({ title: "Sucesso", description: "Fornecedor atualizado com sucesso." })
      router.push("/fornecedores")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar o fornecedor.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return <div className="py-12 text-center text-gray-500">Carregando fornecedor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-4">
          <Link href="/fornecedores">
            <Button size="sm" className="btn-primary-custom">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar fornecedor</h1>
            <p className="text-gray-600">Atualize os dados do fornecedor</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Dados do fornecedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="razaoSocial">Razão social *</Label>
                <Input
                  id="razaoSocial"
                  value={formData.razaoSocial}
                  onChange={(e) => setFormData((prev) => ({ ...prev, razaoSocial: e.target.value }))}
                  disabled={loading}
                  maxLength={LIMITES.razaoSocial}
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
                  maxLength={LIMITES.cnpj}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cidade: e.target.value }))}
                  disabled={loading}
                  maxLength={LIMITES.cidade}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                />
              </div>
              <div>
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  value={formData.uf}
                  onChange={(e) => setFormData((prev) => ({ ...prev, uf: e.target.value.toUpperCase().slice(0, LIMITES.uf) }))}
                  disabled={loading}
                  maxLength={LIMITES.uf}
                  className="h-10 border-gray-200 bg-white uppercase shadow-sm"
                />
              </div>
              <div>
                <Label htmlFor="dataCadastro">Data de cadastro</Label>
                <Input
                  id="dataCadastro"
                  type="date"
                  value={formData.dataCadastro}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dataCadastro: e.target.value }))}
                  disabled={loading}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as FornecedorStatus }))}
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

