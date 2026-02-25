"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit, Loader2, Plus, Save, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export type SimpleDescricaoItem = {
  id: number
  descricao: string
}

export type SimpleDescricaoApi = {
  listAll: () => Promise<SimpleDescricaoItem[]>
  getById: (id: string | number) => Promise<SimpleDescricaoItem>
  create: (payload: { descricao: string }) => Promise<SimpleDescricaoItem>
  update: (id: string | number, payload: { descricao: string }) => Promise<SimpleDescricaoItem>
  delete: (id: string | number) => Promise<void>
}

type CrudConfig = {
  titulo: string
  tituloPlural: string
  descricaoListagem: string
  rotaBase: string
  cardTitle: string
  api: SimpleDescricaoApi
  icon?: any
  descricaoMax?: number
}

export function SimpleDescricaoListPage({ config }: { config: CrudConfig }) {
  const { toast } = useToast()
  const [items, setItems] = useState<SimpleDescricaoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const Icon = config.icon

  const load = async () => {
    try {
      setLoading(true)
      setItems(await config.api.listAll())
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || `Não foi possível carregar ${config.tituloPlural.toLowerCase()}.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => (q ? item.descricao.toLowerCase().includes(q) : true))
  }, [items, search])

  const handleDelete = async (item: SimpleDescricaoItem) => {
    if (!confirm(`Deseja realmente excluir "${item.descricao}"?`)) return
    if (!confirm("Deseja realmente excluir o registro?")) return
    try {
      await config.api.delete(item.id)
      toast({ title: "Sucesso", description: `${config.titulo} excluído com sucesso.` })
      await load()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || `Não foi possível excluir ${config.titulo.toLowerCase()}.`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{config.titulo}</h1>
          <p className="text-gray-600">{config.descricaoListagem}</p>
        </div>
        <div />
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Filtros</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid w-full grid-cols-1 gap-2">
              <Input
                className="h-10 border-gray-200 bg-white pl-3 shadow-sm"
                placeholder="Descrição"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={load} disabled={loading} className="btn-primary-custom">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
              <Link href={`${config.rotaBase}/novo`}>
                <Button className="btn-primary-custom">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Filtre por descrição.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{config.tituloPlural} ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Nenhum registro encontrado.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    {Icon && (
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
                        <Icon className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{item.descricao}</p>
                      <p className="text-xs text-gray-500">ID: {item.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`${config.rotaBase}/${item.id}/editar`}>
                      <Button size="sm" className="btn-primary-custom">
                        <Edit className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                    </Link>
                    <Button size="sm" className="btn-primary-custom" onClick={() => handleDelete(item)}>
                      <Trash2 className="mr-1 h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function SimpleDescricaoCreatePage({ config }: { config: CrudConfig }) {
  const max = config.descricaoMax ?? 100
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [descricao, setDescricao] = useState("")
  const Icon = config.icon

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const descricaoTrim = descricao.trim()
    if (!descricaoTrim) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return
    }
    if (descricaoTrim.length > max) {
      toast({ title: "Erro", description: `Descrição deve ter no máximo ${max} caracteres.`, variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      await config.api.create({ descricao: descricaoTrim })
      toast({ title: "Sucesso", description: `${config.titulo} criado com sucesso.` })
      router.push(config.rotaBase)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || `Não foi possível criar ${config.titulo.toLowerCase()}.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={config.rotaBase}>
          <Button size="sm" className="btn-primary-custom">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo {config.titulo.toLowerCase()}</h1>
            <p className="text-gray-600">Cadastre um novo registro</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{config.cardTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  maxLength={max}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-4 pt-6">
          <Button type="submit" className="btn-primary-custom" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Criar
          </Button>
        </div>
      </form>
    </div>
  )
}

export function SimpleDescricaoEditPage({ config }: { config: CrudConfig }) {
  const max = config.descricaoMax ?? 100
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const itemId = params?.id
  const Icon = config.icon

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [descricao, setDescricao] = useState("")
  const [original, setOriginal] = useState("")

  const hasChanges = descricao !== original

  useEffect(() => {
    const load = async () => {
      if (!itemId) return
      try {
        setLoadingData(true)
        const item = await config.api.getById(itemId)
        setDescricao(item.descricao || "")
        setOriginal(item.descricao || "")
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || `Não foi possível carregar ${config.titulo.toLowerCase()}.`,
          variant: "destructive",
        })
        router.push(config.rotaBase)
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [config.api, config.rotaBase, config.titulo, itemId, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemId) return
    const descricaoTrim = descricao.trim()
    if (!descricaoTrim) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return
    }
    if (descricaoTrim.length > max) {
      toast({ title: "Erro", description: `Descrição deve ter no máximo ${max} caracteres.`, variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      await config.api.update(itemId, { descricao: descricaoTrim })
      toast({ title: "Sucesso", description: `${config.titulo} atualizado com sucesso.` })
      router.push(config.rotaBase)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || `Não foi possível atualizar ${config.titulo.toLowerCase()}.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) return <div className="py-12 text-center text-gray-500">Carregando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={config.rotaBase}>
          <Button size="sm" className="btn-primary-custom">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar {config.titulo.toLowerCase()}</h1>
            <p className="text-gray-600">Atualize os dados do registro</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{config.cardTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  maxLength={max}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  disabled={loading}
                />
              </div>
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

