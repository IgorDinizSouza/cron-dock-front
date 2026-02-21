"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { grupoEmpresarialApi, type GrupoEmpresarialResponse as GrupoEmpresa } from "@/lib/grupoempresarial"


function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "")
}

export default function EditarGrupoEmpresaPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  const [originalData, setOriginalData] = useState({
    descricao: "",
    cnpj: "",
    ativo: true,
  })

  const [formData, setFormData] = useState({
    descricao: "",
    cnpj: "",
    ativo: true,
  })

  const id = params?.id as string

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingData(true)
        const data: GrupoEmpresa = await grupoEmpresarialApi.getById(id)

        const normalized = {
          descricao: data.descricao || "",
          cnpj: data.cnpj || "",
          ativo: data.ativo ?? true,
        }

        setOriginalData(normalized)
        setFormData(normalized)
      } catch (e: any) {
        toast({
          title: "Erro",
          description: e?.message || "Não foi possível carregar o grupo de empresa",
          variant: "destructive",
        })
        router.push("/grupos-empresariais")
      } finally {
        setLoadingData(false)
      }
    }

    if (id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const checkForChanges = (next: typeof formData) => {
    const changed =
      next.descricao !== originalData.descricao ||
      onlyDigits(next.cnpj) !== onlyDigits(originalData.cnpj) ||
      next.ativo !== originalData.ativo

    setHasChanges(changed)
  }

  const handleChange = (field: string, value: string | boolean) => {
    const next = { ...formData, [field]: value }
    setFormData(next)
    checkForChanges(next)
  }

  const validateForm = () => {
    const desc = formData.descricao.trim()
    const cnpj = onlyDigits(formData.cnpj)

    if (!desc) {
      toast({ title: "Erro", description: "Descrição é obrigatória", variant: "destructive" })
      return false
    }
    if (desc.length < 3) {
      toast({ title: "Erro", description: "Descrição deve ter pelo menos 3 caracteres", variant: "destructive" })
      return false
    }
    if (!cnpj) {
      toast({ title: "Erro", description: "CNPJ é obrigatório", variant: "destructive" })
      return false
    }
    if (cnpj.length < 8 || cnpj.length > 18) {
      toast({ title: "Erro", description: "CNPJ inválido (tamanho incorreto)", variant: "destructive" })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      await grupoEmpresarialApi.update(id, {
        descricao: formData.descricao.trim(),
        cnpj: onlyDigits(formData.cnpj),
        ativo: formData.ativo,
      })

      toast({ title: "Sucesso", description: "Grupo empresarial atualizado com sucesso!" })
      router.push("/grupos-empresariais")
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e?.message || "Não foi possível atualizar o grupo empresarial",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando dados do grupo...</div>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900">Editar Grupo Empresarial</h1>
          <p className="text-gray-600">Altere as informações do grupo</p>
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
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  className="pl-3 shadow-sm border-gray-200 bg-white h-10 placeholder:font-italic"
                  value={formData.descricao}
                  onChange={(e) => handleChange("descricao", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  className="pl-3 shadow-sm border-gray-200 bg-white h-10 placeholder:font-italic"
                  value={formData.cnpj}
                  onChange={(e) => handleChange("cnpj", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ativo">Status</Label>
                <Select
                  value={formData.ativo ? "true" : "false"}
                  onValueChange={(value) => handleChange("ativo", value === "true")}
                >
                  <SelectTrigger className="border-gray-200 bg-white h-10 shadow-sm">
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

          <Button type="submit" className="btn-primary-custom" disabled={loading || !hasChanges}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
