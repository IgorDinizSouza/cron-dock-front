"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Loader2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { roleApi } from "@/lib/perfil"

export default function NovaRolePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [ativo, setAtivo] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      toast({ title: "Erro", description: "Nome e obrigatorio.", variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      await roleApi.create({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        ativo,
      })
      toast({ title: "Sucesso", description: "Role criada com sucesso." })
      router.push("/roles")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Nao foi possivel criar a role.",
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
          <Link href="/roles">
            <Button size="sm" className="btn-primary-custom">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nova role</h1>
            <p className="text-gray-600">Cadastre uma nova role de permissao</p>
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
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
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
              <Label htmlFor="descricao">Descricao</Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={loading}
                className="h-10 border-gray-200 bg-white shadow-sm"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-6">
          <Link href="/roles">
            <Button type="button" className="btn-primary-custom" disabled={loading}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="btn-primary-custom" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Criar role
          </Button>
        </div>
      </form>
    </div>
  )
}

