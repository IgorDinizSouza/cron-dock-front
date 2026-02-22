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
import { fornecedorApi, type FornecedorStatus } from "@/lib/fornecedor"

const LIMITES = {
  razaoSocial: 200,
  cidade: 120,
  uf: 2,
  cnpj: 50,
} as const

export default function NovoFornecedorPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [razaoSocial, setRazaoSocial] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [cidade, setCidade] = useState("")
  const [uf, setUf] = useState("")
  const [dataCadastro, setDataCadastro] = useState("")
  const [status, setStatus] = useState<FornecedorStatus>("ATIVO")

  const validarLimites = () => {
    if (razaoSocial.length > LIMITES.razaoSocial) {
      toast({ title: "Erro", description: `Razão social deve ter no máximo ${LIMITES.razaoSocial} caracteres.`, variant: "destructive" })
      return false
    }
    if (cnpj.length > LIMITES.cnpj) {
      toast({ title: "Erro", description: `CNPJ deve ter no máximo ${LIMITES.cnpj} caracteres.`, variant: "destructive" })
      return false
    }
    if (cidade.length > LIMITES.cidade) {
      toast({ title: "Erro", description: `Cidade deve ter no máximo ${LIMITES.cidade} caracteres.`, variant: "destructive" })
      return false
    }
    if (uf.length > LIMITES.uf) {
      toast({ title: "Erro", description: `UF deve ter no máximo ${LIMITES.uf} caracteres.`, variant: "destructive" })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!razaoSocial.trim()) {
      toast({ title: "Erro", description: "Razão social é obrigatória.", variant: "destructive" })
      return
    }
    if (!cnpj.trim()) {
      toast({ title: "Erro", description: "CNPJ é obrigatório.", variant: "destructive" })
      return
    }
    if (!validarLimites()) return

    try {
      setLoading(true)
      await fornecedorApi.create({
        razaoSocial: razaoSocial.trim(),
        cnpj: cnpj.trim(),
        cidade: cidade.trim(),
        uf: uf.trim().toUpperCase(),
        dataCadastro: dataCadastro || null,
        status,
      })
      toast({ title: "Sucesso", description: "Fornecedor criado com sucesso." })
      router.push("/fornecedores")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível criar o fornecedor.",
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
          <Link href="/fornecedores">
            <Button size="sm" className="btn-primary-custom">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo fornecedor</h1>
            <p className="text-gray-600">Cadastre um fornecedor para o grupo empresarial</p>
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
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  disabled={loading}
                  maxLength={LIMITES.razaoSocial}
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
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  disabled={loading}
                  maxLength={LIMITES.cidade}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                />
              </div>
              <div>
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, LIMITES.uf))}
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
                  value={dataCadastro}
                  onChange={(e) => setDataCadastro(e.target.value)}
                  disabled={loading}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as FornecedorStatus)} disabled={loading}>
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
          <Button type="submit" className="btn-primary-custom" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Criar fornecedor
          </Button>
        </div>
      </form>
    </div>
  )
}

