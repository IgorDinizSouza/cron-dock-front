"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { perfilApi, roleApi, type PerfilResponse, type RoleResponse } from "@/lib/perfil"

type FormState = {
  descricao: string
  ativo: boolean
  selectedRoleIds: number[]
}

function sameRoles(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort((x, y) => x - y)
  const sb = [...b].sort((x, y) => x - y)
  return sa.every((item, idx) => item === sb[idx])
}

export default function EditarPerfilPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const perfilId = params?.id

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [roles, setRoles] = useState<RoleResponse[]>([])
  const [formData, setFormData] = useState<FormState>({
    descricao: "",
    ativo: true,
    selectedRoleIds: [],
  })
  const [original, setOriginal] = useState<FormState | null>(null)

  const hasChanges = useMemo(() => {
    if (!original) return false
    return (
      formData.descricao !== original.descricao ||
      formData.ativo !== original.ativo ||
      !sameRoles(formData.selectedRoleIds, original.selectedRoleIds)
    )
  }, [formData, original])

  useEffect(() => {
    const load = async () => {
      if (!perfilId) return
      try {
        setLoadingData(true)
        const [perfil, rolesData] = await Promise.all([perfilApi.getById(perfilId), roleApi.listAll()])
        setRoles(rolesData)

        const fromRoles = Array.isArray(perfil.roles) ? perfil.roles.map((role) => role.id) : []
        const selectedRoleIds = perfil.roleIds && perfil.roleIds.length > 0 ? perfil.roleIds : fromRoles

        const state: FormState = {
          descricao: perfil.descricao || "",
          ativo: perfil.ativo !== false,
          selectedRoleIds,
        }
        setFormData(state)
        setOriginal(state)
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Nao foi possivel carregar o perfil.",
          variant: "destructive",
        })
        router.push("/perfis")
      } finally {
        setLoadingData(false)
      }
    }

    load()
  }, [perfilId, router, toast])

  const toggleRole = (roleId: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selectedRoleIds: checked ? Array.from(new Set([...prev.selectedRoleIds, roleId])) : prev.selectedRoleIds.filter((id) => id !== roleId),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!perfilId) return

    if (!formData.descricao.trim()) {
      toast({ title: "Erro", description: "Descricao e obrigatoria.", variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      await perfilApi.update(perfilId, {
        descricao: formData.descricao.trim(),
        ativo: formData.ativo,
        roleIds: formData.selectedRoleIds,
        roles: formData.selectedRoleIds,
      })
      toast({ title: "Sucesso", description: "Perfil atualizado com sucesso." })
      router.push("/perfis")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Nao foi possivel atualizar o perfil.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return <div className="py-12 text-center text-gray-500">Carregando perfil...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/perfis">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar perfil</h1>
          <p className="text-gray-600">Atualize a descricao e as roles vinculadas</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados do perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="descricao">Descricao *</Label>
                <Input id="descricao" value={formData.descricao} onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="ativo">Status</Label>
                <select
                  id="ativo"
                  value={formData.ativo ? "true" : "false"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ativo: e.target.value === "true" }))}
                  className="border-input rounded-md px-3 py-2 bg-white w-full h-10"
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Roles</Label>
              {roles.length === 0 ? (
                <p className="text-sm text-gray-500 mt-2">Nenhuma role cadastrada.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 border rounded-lg p-4">
                  {roles.map((role) => {
                    const checked = formData.selectedRoleIds.includes(role.id)
                    return (
                      <label key={role.id} className="flex items-start gap-3 cursor-pointer">
                        <Checkbox checked={checked} onCheckedChange={(value) => toggleRole(role.id, value === true)} />
                        <span>
                          <span className="text-sm font-medium text-gray-900">{role.nome}</span>
                          {role.descricao ? <span className="block text-xs text-gray-500">{role.descricao}</span> : null}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-6">
          <Link href="/perfis">
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

