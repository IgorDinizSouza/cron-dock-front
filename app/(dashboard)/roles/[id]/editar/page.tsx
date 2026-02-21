"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { roleApi } from "@/lib/perfil"

type RoleForm = {
  nome: string
  descricao: string
  ativo: boolean
}

export default function EditarRolePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const roleId = params?.id

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState<RoleForm>({
    nome: "",
    descricao: "",
    ativo: true,
  })
  const [original, setOriginal] = useState<RoleForm | null>(null)

  const hasChanges = useMemo(() => {
    if (!original) return false
    return (
      formData.nome !== original.nome ||
      formData.descricao !== original.descricao ||
      formData.ativo !== original.ativo
    )
  }, [formData, original])

  useEffect(() => {
    const load = async () => {
      if (!roleId) return
      try {
        setLoadingData(true)
        const role = await roleApi.getById(roleId)
        const state: RoleForm = {
          nome: role.nome || "",
          descricao: role.descricao || "",
          ativo: role.ativo !== false,
        }
        setFormData(state)
        setOriginal(state)
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Não foi possível carregar a role.",
          variant: "destructive",
        })
        router.push("/roles")
      } finally {
        setLoadingData(false)
      }
    }

    load()
  }, [roleId, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleId) return

    if (!formData.nome.trim()) {
      toast({ title: "Erro", description: "Nome é obrigatório.", variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      await roleApi.update(roleId, {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || undefined,
        ativo: formData.ativo,
      })
      toast({ title: "Sucesso", description: "Role atualizada com sucesso." })
      router.push("/roles")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar a role.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return <div className="py-12 text-center text-gray-500">Carregando role...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/roles">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar role</h1>
          <p className="text-gray-600">Atualize nome, descrição e status</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados da role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="ativo">Status</Label>
                <select
                  id="ativo"
                  value={formData.ativo ? "true" : "false"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ativo: e.target.value === "true" }))}
                  className="border-input rounded-md px-3 py-2 bg-white w-full h-10"
                  disabled={loading}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-6">
          <Link href="/roles">
            <Button type="button" variant="outline" disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="dental-primary" disabled={loading || !hasChanges}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar alteracoes
          </Button>
        </div>
      </form>
    </div>
  )
}

