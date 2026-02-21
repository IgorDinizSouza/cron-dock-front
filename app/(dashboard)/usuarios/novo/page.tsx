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
          description: error?.message || "Não foi possível carregar os perfis.",
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
    if (!formData.nome.trim()) {
      toast({ title: "Erro", description: "Nome é obrigatório.", variant: "destructive" })
      return false
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast({ title: "Erro", description: "Informe um email válido.", variant: "destructive" })
      return false
    }
    if (!formData.senha || formData.senha.length < 6) {
      toast({ title: "Erro", description: "Senha deve ter ao menos 6 caracteres.", variant: "destructive" })
      return false
    }
    if (formData.senha !== formData.confirmarSenha) {
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

      toast({ title: "Sucesso", description: "Usuário criado com sucesso." })
      router.push("/usuarios")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível criar o usuário.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Novo usuário</h1>
          <p className="text-gray-600">Cadastre um novo usuário no sistema</p>
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
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  placeholder="Digite o nome completo"
                  disabled={loading}
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
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="senha">Senha *</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => handleChange("senha", e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  disabled={loading}
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
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="perfilId">Perfil *</Label>
                <Select
                  value={formData.perfilId}
                  onValueChange={(value) => handleChange("perfilId", value)}
                  disabled={loading || loadingPerfis || perfis.length === 0}
                >
                  <SelectTrigger id="perfilId">
                    <SelectValue placeholder={loadingPerfis ? "Carregando perfis..." : "Selecione um perfil"} />
                  </SelectTrigger>
                  <SelectContent>
                    {perfis.map((perfil) => (
                      <SelectItem key={perfil.id} value={String(perfil.id)}>
                        {perfil.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!loadingPerfis && perfis.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2">Nenhum perfil cadastrado. Cadastre em Perfis antes de criar usuários.</p>
                )}
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
          <Button type="submit" className="dental-primary" disabled={loading || loadingPerfis || perfis.length === 0}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Criar usuário
          </Button>
        </div>
      </form>
    </div>
  )
}

