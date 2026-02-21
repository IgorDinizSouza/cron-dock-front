"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, X, Loader2 } from "lucide-react"
import { especialidadesApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function EditarEspecialidadePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    ativo: true,
  })

  const especialidadeId = params?.id as string

  useEffect(() => {
    const loadEspecialidade = async () => {
      try {
        setLoadingData(true)
        const especialidade = await especialidadesApi.getById(especialidadeId)
        setFormData({
          nome: especialidade.nome || "",
          descricao: especialidade.descricao || "",
          ativo: especialidade.ativo ?? true,
        })
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da especialidade",
          variant: "destructive",
        })
        router.push("/especialidades")
      } finally {
        setLoadingData(false)
      }
    }

    if (especialidadeId) {
      loadEspecialidade()
    }
  }, [especialidadeId, router, toast])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.nome.trim()) {
      toast({ title: "Erro", description: "Nome da especialidade é obrigatório", variant: "destructive" })
      return false
    }
    if (formData.nome.trim().length < 2) {
      toast({ title: "Erro", description: "Nome deve ter pelo menos 2 caracteres", variant: "destructive" })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      await especialidadesApi.update(especialidadeId, {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim(),
        ativo: formData.ativo,
      })

      toast({ title: "Sucesso", description: "Especialidade atualizada com sucesso!" })
      router.push("/especialidades")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar a especialidade",
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
          <div className="text-gray-500">Carregando dados da especialidade...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/especialidades">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Especialidade</h1>
          <p className="text-gray-600">Altere as informações da especialidade</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da Especialidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome da Especialidade *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                placeholder="Ex: Ortodontia, Endodontia, Implantodontia"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                placeholder="Descreva a especialidade odontológica..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="ativo">Status</Label>
              <select
                id="ativo"
                value={formData.ativo ? "true" : "false"}
                onChange={(e) => handleChange("ativo", e.target.value === "true")}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={loading}
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4 pt-6">
          <Link href="/especialidades">
            <Button type="button" variant="outline" disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="dental-primary" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
