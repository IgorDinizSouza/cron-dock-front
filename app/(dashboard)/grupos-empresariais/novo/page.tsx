"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { grupoEmpresarialApi, type GrupoEmpresarialResponse as GrupoEmpresa } from "@/lib/grupoempresarial"


const MAX_DESCRICAO = 150
const MAX_CNPJ = 18 // no banco: VARCHAR(18)

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "")
}

// Máscara CNPJ: 00.000.000/0000-00
function maskCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14) // máscara completa usa 14 dígitos
  const p1 = digits.slice(0, 2)
  const p2 = digits.slice(2, 5)
  const p3 = digits.slice(5, 8)
  const p4 = digits.slice(8, 12)
  const p5 = digits.slice(12, 14)

  let out = p1
  if (p2) out += "." + p2
  if (p3) out += "." + p3
  if (p4) out += "/" + p4
  if (p5) out += "-" + p5
  return out
}

export default function NovoGrupoEmpresarialPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    descricao: "",
    cnpj: "",
    ativo: true,
  })

  const descricaoLen = useMemo(() => formData.descricao.length, [formData.descricao])
  const cnpjDigitsLen = useMemo(() => onlyDigits(formData.cnpj).length, [formData.cnpj])

  const handleDescricaoChange = (v: string) => {
    // limita em 150 chars (banco)
    const trimmed = v.slice(0, MAX_DESCRICAO)
    setFormData((prev) => ({ ...prev, descricao: trimmed }))
  }

  const handleCnpjChange = (v: string) => {
    // aplica máscara; limita em 14 dígitos e no máximo 18 chars no campo (com máscara)
    const masked = maskCnpj(v)
    setFormData((prev) => ({ ...prev, cnpj: masked.slice(0, MAX_CNPJ) }))
  }

  const validateForm = () => {
    const desc = formData.descricao.trim()
    const digits = onlyDigits(formData.cnpj)

    if (!desc) {
      toast({ title: "Erro", description: "Descrição é obrigatória", variant: "destructive" })
      return false
    }
    if (desc.length < 3) {
      toast({ title: "Erro", description: "Descrição deve ter pelo menos 3 caracteres", variant: "destructive" })
      return false
    }
    if (desc.length > MAX_DESCRICAO) {
      toast({ title: "Erro", description: `Descrição deve ter no máximo ${MAX_DESCRICAO} caracteres`, variant: "destructive" })
      return false
    }

    if (!digits) {
      toast({ title: "Erro", description: "CNPJ é obrigatório", variant: "destructive" })
      return false
    }

    // CNPJ real tem 14 dígitos
    if (digits.length !== 14) {
      toast({ title: "Erro", description: "CNPJ inválido. Informe os 14 dígitos.", variant: "destructive" })
      return false
    }

    // só pra garantir que não passa do banco (VARCHAR(18))
    if (formData.cnpj.length > MAX_CNPJ) {
      toast({ title: "Erro", description: `CNPJ deve ter no máximo ${MAX_CNPJ} caracteres`, variant: "destructive" })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      // ✅ chama o backend
      await grupoEmpresarialApi.create({
        descricao: formData.descricao.trim(),
        cnpj: formData.cnpj.trim(),
        ativo: formData.ativo,
      })


      toast({ title: "Sucesso", description: "Grupo empresarial criado com sucesso!" })
      router.push("/grupos-empresariais")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível criar o grupo empresarial",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/grupos-empresariais">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Grupo Empresarial</h1>
          <p className="text-gray-600">Cadastre um novo grupo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-end justify-between">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <span className={`text-xs ${descricaoLen >= MAX_DESCRICAO ? "text-red-600" : "text-gray-500"}`}>
                    {descricaoLen}/{MAX_DESCRICAO}
                  </span>
                </div>

                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleDescricaoChange(e.target.value)}
                  placeholder="Ex: Grupo Matriz"
                  required
                  disabled={loading}
                  maxLength={MAX_DESCRICAO}
                />
              </div>

              <div>
                <div className="flex items-end justify-between">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <span className={`text-xs ${cnpjDigitsLen === 14 ? "text-green-700" : "text-gray-500"}`}>
                    {cnpjDigitsLen}/14
                  </span>
                </div>

                <Input
                  id="cnpj"
                  inputMode="numeric"
                  value={formData.cnpj}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  required
                  disabled={loading}
                  maxLength={MAX_CNPJ}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ativo">Status</Label>
                <Select
                  value={formData.ativo ? "true" : "false"}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, ativo: value === "true" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4 pt-6">
          <Link href="/grupos-empresariais">
            <Button type="button" variant="outline" disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </Link>

          <Button type="submit" className="dental-primary" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Criar
          </Button>
        </div>
      </form>
    </div>
  )
}
