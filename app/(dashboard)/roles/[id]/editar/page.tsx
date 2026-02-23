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
import { roleApi } from "@/lib/perfil"

const ROLE_NOME_MAX = 100
const ROLE_DESCRICAO_MAX = 100

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
    return formData.nome !== original.nome || formData.descricao !== original.descricao || formData.ativo !== original.ativo
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
          description: error?.message || "Nao foi possivel carregar a role.",
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
      toast({ title: "Erro", description: "Nome e obrigatorio.", variant: "destructive" })
      return
    }
    if (formData.nome.trim().length > ROLE_NOME_MAX) {
      toast({ title: "Erro", description: `Nome deve ter no maximo ${ROLE_NOME_MAX} caracteres.`, variant: "destructive" })
      return
    }
    if (formData.descricao.trim().length > ROLE_DESCRICAO_MAX) {
      toast({
        title: "Erro",
        description: `Descricao deve ter no maximo ${ROLE_DESCRICAO_MAX} caracteres.`,
        variant: "destructive",
      })
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
        description: error?.message || "Nao foi possivel atualizar a role.",
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
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-4">
          <Link href="/roles">
            <Button size="sm" className="btn-primary-custom">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar role</h1>
            <p className="text-gray-600">Atualize nome, descrição e status</p>
          </div>
        </div>
        <div />
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Dados da role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                  disabled={loading}
                  maxLength={ROLE_NOME_MAX}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                />
              </div>
              <div>
                <Label htmlFor="ativo">Status</Label>
                <Select value={formData.ativo ? "true" : "false"} onValueChange={(value) => setFormData((prev) => ({ ...prev, ativo: value === "true" }))}>
                  <SelectTrigger
                    id="ativo"
                    className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="true"
                      className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700"
                    >
                      Ativo
                    </SelectItem>
                    <SelectItem
                      value="false"
                      className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700"
                    >
                      Inativo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descricao</Label>
              <Input
                id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                  disabled={loading}
                  maxLength={ROLE_DESCRICAO_MAX}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-6">
          <Button type="submit" className="btn-primary-custom" disabled={loading || !hasChanges}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </form>
    </div>
  )
}
