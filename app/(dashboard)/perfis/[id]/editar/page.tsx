"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { perfilApi, roleApi, type RoleResponse } from "@/lib/perfil"

const PERFIL_DESCRICAO_MAX = 100

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
    if (formData.descricao.trim().length > PERFIL_DESCRICAO_MAX) {
      toast({
        title: "Erro",
        description: `Descricao deve ter no maximo ${PERFIL_DESCRICAO_MAX} caracteres.`,
        variant: "destructive",
      })
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
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-4">
          <Link href="/perfis">
            <Button size="sm" className="btn-primary-custom">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar perfil</h1>
            <p className="text-gray-600">Atualize a descrição e as roles vinculadas</p>
          </div>
        </div>
        <div />
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Dados do perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                  maxLength={PERFIL_DESCRICAO_MAX}
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
              <Label>Roles</Label>
              {roles.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">Nenhuma role cadastrada.</p>
              ) : (
                <div className="mt-2 grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-2">
                  {roles.map((role) => {
                    const checked = formData.selectedRoleIds.includes(role.id)
                    return (
                      <label key={role.id} className="flex cursor-pointer items-start gap-3">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleRole(role.id, value === true)}
                          className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white"
                        />
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
          <Button type="submit" className="btn-primary-custom" disabled={loading || !hasChanges}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
