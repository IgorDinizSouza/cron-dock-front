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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { perfilApi, type PerfilResponse } from "@/lib/perfil"
import { usuariosApi, type UsuarioResponse } from "@/lib/usuarios"

type FormState = {
  nome: string
  email: string
  senha: string
  confirmarSenha: string
  perfilId: string
  ativo: boolean
}

function resolvePerfilId(user: UsuarioResponse): number | null {
  if (typeof user.perfilId === "number") return user.perfilId
  if (user.perfil && typeof user.perfil === "object" && typeof user.perfil.id === "number") return user.perfil.id
  return null
}

function sameState(a: FormState, b: FormState): boolean {
  return a.nome === b.nome && a.email === b.email && a.perfilId === b.perfilId && a.ativo === b.ativo && !a.senha && !a.confirmarSenha
}

export default function EditarUsuarioPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const userId = params?.id

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [perfis, setPerfis] = useState<PerfilResponse[]>([])
  const [original, setOriginal] = useState<FormState | null>(null)
  const [formData, setFormData] = useState<FormState>({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    perfilId: "",
    ativo: true,
  })

  const hasChanges = useMemo(() => {
    if (!original) return false
    return !sameState(formData, original)
  }, [formData, original])

  useEffect(() => {
    const load = async () => {
      if (!userId) return
      try {
        setLoadingData(true)
        const [user, perfisData] = await Promise.all([usuariosApi.getById(userId), perfilApi.listAll()])
        setPerfis(perfisData)

        const resolvedPerfilId = resolvePerfilId(user)
        const perfilDescricao =
          typeof user.perfil === "string"
            ? user.perfil
            : user.perfil && typeof user.perfil === "object"
              ? user.perfil.descricao
              : undefined
        const fromDescricao =
          perfilDescricao ? perfisData.find((item) => item.descricao.toLowerCase() === perfilDescricao.toLowerCase())?.id : undefined

        const perfilId = resolvedPerfilId ?? fromDescricao ?? perfisData[0]?.id ?? ""

        const state: FormState = {
          nome: user.nome || "",
          email: user.email || "",
          senha: "",
          confirmarSenha: "",
          perfilId: String(perfilId),
          ativo: Boolean(user.ativo),
        }

        setFormData(state)
        setOriginal(state)
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Não foi possível carregar os dados do usuário.",
          variant: "destructive",
        })
        router.push("/usuarios")
      } finally {
        setLoadingData(false)
      }
    }

    load()
  }, [router, toast, userId])

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    if (!formData.nome.trim()) {
      toast({ title: "Erro", description: "Nome é obrigatório.", variant: "destructive" })
      return false
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast({ title: "Erro", description: "Informe um email válido.", variant: "destructive" })
      return false
    }
    if (formData.senha && formData.senha.length < 6) {
      toast({ title: "Erro", description: "Nova senha deve ter ao menos 6 caracteres.", variant: "destructive" })
      return false
    }
    if (formData.senha && formData.senha !== formData.confirmarSenha) {
      toast({ title: "Erro", description: "As senhas não conferem.", variant: "destructive" })
      return false
    }
    if (!formData.perfilId) {
      toast({ title: "Erro", description: "Selecione um perfil.", variant: "destructive" })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !validate()) return

    const perfilSelecionado = perfis.find((item) => String(item.id) === formData.perfilId)

    try {
      setLoading(true)
      await usuariosApi.update(userId, {
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        ativo: formData.ativo,
        perfilId: Number(formData.perfilId),
        perfil: perfilSelecionado?.descricao,
        ...(formData.senha ? { senha: formData.senha } : {}),
      })

      toast({ title: "Sucesso", description: "Usuário atualizado com sucesso." })
      router.push("/usuarios")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar o usuário.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return <div className="py-12 text-center text-gray-500">Carregando dados do usuário...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/usuarios">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar usuário</h1>
          <p className="text-gray-600">Atualize os dados do usuário</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" value={formData.nome} onChange={(e) => handleChange("nome", e.target.value)} disabled={loading} />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="senha">Nova senha (opcional)</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => handleChange("senha", e.target.value)}
                  placeholder="Deixe em branco para manter a atual"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  value={formData.confirmarSenha}
                  onChange={(e) => handleChange("confirmarSenha", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="perfilId">Perfil *</Label>
                <Select value={formData.perfilId} onValueChange={(value) => handleChange("perfilId", value)} disabled={loading}>
                  <SelectTrigger id="perfilId">
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfis.map((perfil) => (
                      <SelectItem key={perfil.id} value={String(perfil.id)}>
                        {perfil.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ativo">Status</Label>
                <Select value={formData.ativo ? "true" : "false"} onValueChange={(value) => handleChange("ativo", value === "true")}>
                  <SelectTrigger id="ativo">
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

        <div className="flex justify-end gap-4 pt-6">
          <Link href="/usuarios">
            <Button type="button" variant="outline" disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="dental-primary" disabled={loading || !hasChanges}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
