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
      <div className="flex items-center gap-4">
        <Link href="/perfis">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo perfil</h1>
          <p className="text-gray-600">Cadastre um novo perfil e vincule as roles</p>
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
                <Input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} disabled={loading} />
              </div>
              <div>
                <Label htmlFor="ativo">Status</Label>
                <select
                  id="ativo"
                  value={ativo ? "true" : "false"}
                  onChange={(e) => setAtivo(e.target.value === "true")}
                  className="border-input rounded-md px-3 py-2 bg-white w-full h-10"
                  disabled={loading}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Roles</Label>
              {loadingRoles ? (
                <p className="text-sm text-gray-500 mt-2">Carregando roles...</p>
              ) : roles.length === 0 ? (
                <p className="text-sm text-amber-600 mt-2">Nenhuma role cadastrada. Cadastre em Roles antes de criar perfis com permissao.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 border rounded-lg p-4">
                  {roles.map((role) => {
                    const checked = selectedRoleIds.includes(role.id)
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
          <Button type="submit" className="dental-primary" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Criar perfil
          </Button>
        </div>
      </form>
    </div>
  )
}

