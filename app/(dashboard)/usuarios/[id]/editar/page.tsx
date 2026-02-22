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
import { perfilApi, type PerfilResponse } from "@/lib/perfil"
import { usuariosApi, type UsuarioResponse } from "@/lib/usuarios"

const USUARIO_DESCRICAO_MAX = 100
const USUARIO_EMAIL_MAX = 150
// Senha nao consta no DDL enviado; aplicando limite conservador de UI.
const USUARIO_SENHA_MAX = 100

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
          description: error?.message || "Nao foi possivel carregar os dados do usuario.",
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
    const nome = formData.nome.trim()
    const email = formData.email.trim()

    if (!nome) {
      toast({ title: "Erro", description: "Nome e obrigatorio.", variant: "destructive" })
      return false
    }
    if (nome.length > USUARIO_DESCRICAO_MAX) {
      toast({ title: "Erro", description: `Nome deve ter no maximo ${USUARIO_DESCRICAO_MAX} caracteres.`, variant: "destructive" })
      return false
    }
    if (!email || !email.includes("@")) {
      toast({ title: "Erro", description: "Informe um email valido.", variant: "destructive" })
      return false
    }
    if (email.length > USUARIO_EMAIL_MAX) {
      toast({ title: "Erro", description: `E-mail deve ter no maximo ${USUARIO_EMAIL_MAX} caracteres.`, variant: "destructive" })
      return false
    }
    if (formData.senha && formData.senha.length < 6) {
      toast({ title: "Erro", description: "Nova senha deve ter ao menos 6 caracteres.", variant: "destructive" })
      return false
    }
    if (formData.senha && formData.senha.length > USUARIO_SENHA_MAX) {
      toast({ title: "Erro", description: `Senha deve ter no maximo ${USUARIO_SENHA_MAX} caracteres.`, variant: "destructive" })
      return false
    }
    if (formData.senha && formData.senha !== formData.confirmarSenha) {
      toast({ title: "Erro", description: "As senhas nao conferem.", variant: "destructive" })
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

      toast({ title: "Sucesso", description: "Usuario atualizado com sucesso." })
      router.push("/usuarios")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Nao foi possivel atualizar o usuario.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return <div className="py-12 text-center text-gray-500">Carregando dados do usuario...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-4">
          <Link href="/usuarios">
            <Button size="sm" className="btn-primary-custom">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar usuário</h1>
          </div>
        </div>
        <div />
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Informações do usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  disabled={loading}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  maxLength={USUARIO_DESCRICAO_MAX}
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  disabled={loading}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  maxLength={USUARIO_EMAIL_MAX}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="senha">Nova senha (opcional)</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => handleChange("senha", e.target.value)}
                  placeholder="Deixe em branco para manter a atual"
                  disabled={loading}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  maxLength={USUARIO_SENHA_MAX}
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
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  maxLength={USUARIO_SENHA_MAX}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="perfilId">Perfil *</Label>
                <Select value={formData.perfilId} onValueChange={(value) => handleChange("perfilId", value)} disabled={loading}>
                  <SelectTrigger
                    id="perfilId"
                    className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500"
                  >
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfis.map((perfil) => (
                      <SelectItem
                        key={perfil.id}
                        value={String(perfil.id)}
                        className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700"
                      >
                        {perfil.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ativo">Status</Label>
                <Select value={formData.ativo ? "true" : "false"} onValueChange={(value) => handleChange("ativo", value === "true")}>
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
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-6">
          <Button type="submit" className="btn-primary-custom" disabled={loading || !hasChanges}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar alteracoes
          </Button>
        </div>
      </form>
    </div>
  )
}
