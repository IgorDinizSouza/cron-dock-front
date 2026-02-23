"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { perfilApi, type PerfilResponse } from "@/lib/perfil"
import { usuariosApi } from "@/lib/usuarios"

const USUARIO_DESCRICAO_MAX = 100
const USUARIO_EMAIL_MAX = 150
// Senha conforme DDL (varchar(255)).
const USUARIO_SENHA_MAX = 255

export default function NovoUsuarioPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [loadingPerfis, setLoadingPerfis] = useState(true)
  const [perfis, setPerfis] = useState<PerfilResponse[]>([])
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    perfilId: "",
    ativo: true,
  })

  useEffect(() => {
    const loadPerfis = async () => {
      try {
        setLoadingPerfis(true)
        const data = await perfilApi.listAll()
        setPerfis(data)
        const firstId = data[0]?.id
        if (firstId != null) {
          setFormData((prev) => ({ ...prev, perfilId: String(firstId) }))
        }
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Nao foi possivel carregar os perfis.",
          variant: "destructive",
        })
      } finally {
        setLoadingPerfis(false)
      }
    }

    loadPerfis()
  }, [toast])

  const handleChange = (field: string, value: string | boolean) => {
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
      toast({
        title: "Erro",
        description: `Nome deve ter no maximo ${USUARIO_DESCRICAO_MAX} caracteres.`,
        variant: "destructive",
      })
      return false
    }

    if (!email || !email.includes("@")) {
      toast({ title: "Erro", description: "Informe um email valido.", variant: "destructive" })
      return false
    }
    if (email.length > USUARIO_EMAIL_MAX) {
      toast({
        title: "Erro",
        description: `E-mail deve ter no maximo ${USUARIO_EMAIL_MAX} caracteres.`,
        variant: "destructive",
      })
      return false
    }

    if (!formData.senha || formData.senha.length < 6) {
      toast({ title: "Erro", description: "Senha deve ter ao menos 6 caracteres.", variant: "destructive" })
      return false
    }
    if (formData.senha.length > USUARIO_SENHA_MAX) {
      toast({
        title: "Erro",
        description: `Senha deve ter no maximo ${USUARIO_SENHA_MAX} caracteres.`,
        variant: "destructive",
      })
      return false
    }

    if (formData.senha !== formData.confirmarSenha) {
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
    if (!validate()) return

    const perfilSelecionado = perfis.find((item) => String(item.id) === formData.perfilId)

    try {
      setLoading(true)
      await usuariosApi.create({
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        senha: formData.senha,
        ativo: formData.ativo,
        perfilId: Number(formData.perfilId),
        perfil: perfilSelecionado?.descricao,
      })

      toast({ title: "Sucesso", description: "Usuario criado com sucesso." })
      router.push("/usuarios")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Nao foi possivel criar o usuario.",
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
          <Link href="/usuarios">
            <Button size="sm" className="btn-primary-custom">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo usuario</h1>
            <p className="text-gray-600">Cadastre um novo usuario no sistema</p>
          </div>
        </div>
        <div />
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Informacoes do usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  placeholder="Digite o nome completo"
                  disabled={loading}
                  maxLength={USUARIO_DESCRICAO_MAX}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="usuario@email.com"
                  disabled={loading}
                  maxLength={USUARIO_EMAIL_MAX}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="senha">Senha *</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => handleChange("senha", e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  disabled={loading}
                  maxLength={USUARIO_SENHA_MAX}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                />
              </div>
              <div>
                <Label htmlFor="confirmarSenha">Confirmar senha *</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  value={formData.confirmarSenha}
                  onChange={(e) => handleChange("confirmarSenha", e.target.value)}
                  placeholder="Repita a senha"
                  disabled={loading}
                  maxLength={USUARIO_SENHA_MAX}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="perfilId">Perfil *</Label>
                <Select
                  value={formData.perfilId}
                  onValueChange={(value) => handleChange("perfilId", value)}
                  disabled={loading || loadingPerfis || perfis.length === 0}
                >
                  <SelectTrigger
                    id="perfilId"
                    className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500"
                  >
                    <SelectValue placeholder={loadingPerfis ? "Carregando perfis..." : "Selecione um perfil"} />
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
                {!loadingPerfis && perfis.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">Nenhum perfil cadastrado. Cadastre em Perfis antes de criar usuarios.</p>
                )}
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
          <Link href="/usuarios">
            <Button type="button" className="btn-primary-custom" disabled={loading}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="btn-primary-custom" disabled={loading || loadingPerfis || perfis.length === 0}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Criar usuario
          </Button>
        </div>
      </form>
    </div>
  )
}
