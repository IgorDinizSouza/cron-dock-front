"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { perfilApi, roleApi, type RoleResponse } from "@/lib/perfil"

export default function NovoPerfilPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [roles, setRoles] = useState<RoleResponse[]>([])
  const [descricao, setDescricao] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])

  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoadingRoles(true)
        const data = await roleApi.listAll()
        setRoles(data)
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Nao foi possivel carregar as roles.",
          variant: "destructive",
        })
      } finally {
        setLoadingRoles(false)
      }
    }

    loadRoles()
  }, [toast])

  const toggleRole = (roleId: number, checked: boolean) => {
    setSelectedRoleIds((prev) => {
      if (checked) return Array.from(new Set([...prev, roleId]))
      return prev.filter((id) => id !== roleId)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descricao.trim()) {
      toast({ title: "Erro", description: "Descricao e obrigatoria.", variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      await perfilApi.create({
        descricao: descricao.trim(),
        ativo,
        roleIds: selectedRoleIds,
        roles: selectedRoleIds,
      })
      toast({ title: "Sucesso", description: "Perfil criado com sucesso." })
      router.push("/perfis")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Nao foi possivel criar o perfil.",
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
          <Link href="/perfis">
            <Button size="sm" className="btn-primary-custom">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo perfil</h1>
            <p className="text-gray-600">Cadastre um novo perfil e vincule as roles</p>
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
                <Label htmlFor="descricao">Descricao *</Label>
                <Input
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  disabled={loading}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                />
              </div>
              <div>
                <Label htmlFor="ativo">Status</Label>
                <Select value={ativo ? "true" : "false"} onValueChange={(value) => setAtivo(value === "true")} disabled={loading}>
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
              {loadingRoles ? (
                <p className="mt-2 text-sm text-gray-500">Carregando roles...</p>
              ) : roles.length === 0 ? (
                <p className="mt-2 text-sm text-amber-600">Nenhuma role cadastrada. Cadastre em Roles antes de criar perfis com permissao.</p>
              ) : (
                <div className="mt-2 grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-2">
                  {roles.map((role) => {
                    const checked = selectedRoleIds.includes(role.id)
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
          <Link href="/perfis">
            <Button type="button" className="btn-primary-custom" disabled={loading}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="btn-primary-custom" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Criar perfil
          </Button>
        </div>
      </form>
    </div>
  )
}

