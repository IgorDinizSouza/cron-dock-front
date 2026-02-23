"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { compradorApi, type CompradorResponse } from "@/lib/comprador"
import { produtoApi, type ProdutoStatus } from "@/lib/produto"

type EmbalagemForm = {
  id: string
  digito: string
  codigoBarra: string
  sigla: string
  multiplicador1: string
  multiplicador2: string
  status: ProdutoStatus
}

function novaEmbalagem(): EmbalagemForm {
  return {
    id: "",
    digito: "",
    codigoBarra: "",
    sigla: "",
    multiplicador1: "",
    multiplicador2: "",
    status: "ATIVO",
  }
}

const PRODUTO_LIMITES = {
  descricao: 200,
  complemento: 200,
  peso: 30,
  pesoLiquido: 30,
} as const

type FormState = {
  id: string
  descricao: string
  compradorId: string
  complemento: string
  lastro: string
  altura: string
  peso: string
  pesoLiquido: string
  composicao: string
  dataCadastro: string
  status: ProdutoStatus
}

export default function EditarProdutoPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const produtoId = params?.id

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [compradores, setCompradores] = useState<CompradorResponse[]>([])
  const [embalagens, setEmbalagens] = useState<EmbalagemForm[]>([])
  const [formData, setFormData] = useState<FormState>({
    id: "",
    descricao: "",
    compradorId: "",
    complemento: "",
    lastro: "",
    altura: "",
    peso: "",
    pesoLiquido: "",
    composicao: "",
    dataCadastro: "",
    status: "ATIVO",
  })
  const [original, setOriginal] = useState<FormState | null>(null)
  const [originalEmbalagens, setOriginalEmbalagens] = useState<EmbalagemForm[]>([])

  const hasChanges = useMemo(() => {
    if (!original) return false
    return JSON.stringify(formData) !== JSON.stringify(original) || JSON.stringify(embalagens) !== JSON.stringify(originalEmbalagens)
  }, [formData, original, embalagens, originalEmbalagens])

  useEffect(() => {
    const load = async () => {
      if (!produtoId) return
      try {
        setLoadingData(true)
        const item = await produtoApi.getById(produtoId)
        const state: FormState = {
          id: item.id ? String(item.id) : "",
          descricao: item.descricao || "",
          compradorId: item.compradorId != null ? String(item.compradorId) : "",
          complemento: item.complemento || "",
          lastro: item.lastro != null ? String(item.lastro) : "",
          altura: item.altura != null ? String(item.altura) : "",
          peso: item.peso || "",
          pesoLiquido: item.pesoLiquido || "",
          composicao: item.composicao != null ? String(item.composicao) : "",
          dataCadastro: item.dataCadastro || "",
          status: item.status || "ATIVO",
        }
        const embalagensState: EmbalagemForm[] = (item.embalagens || []).map((emb) => ({
          id: emb.id ? String(emb.id) : "",
          digito: emb.digito != null ? String(emb.digito) : "",
          codigoBarra: emb.codigoBarra || "",
          sigla: emb.sigla || "",
          multiplicador1: emb.multiplicador1 != null ? String(emb.multiplicador1) : "",
          multiplicador2: emb.multiplicador2 != null ? String(emb.multiplicador2) : "",
          status: emb.status || "ATIVO",
        }))
        setFormData(state)
        setOriginal(state)
        setEmbalagens(embalagensState)
        setOriginalEmbalagens(embalagensState)
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Não foi possível carregar o produto.",
          variant: "destructive",
        })
        router.push("/produtos")
      } finally {
        setLoadingData(false)
      }
    }

    load()
    ;(async () => {
      try {
        setCompradores(await compradorApi.listAll())
      } catch {
        setCompradores([])
      }
    })()
  }, [produtoId, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!produtoId) return

    if (!formData.descricao.trim()) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return
    }
    if (formData.descricao.trim().length > PRODUTO_LIMITES.descricao) {
      toast({ title: "Erro", description: `Descricao deve ter no maximo ${PRODUTO_LIMITES.descricao} caracteres.`, variant: "destructive" })
      return
    }
    if (formData.complemento.trim().length > PRODUTO_LIMITES.complemento) {
      toast({ title: "Erro", description: `Complemento deve ter no maximo ${PRODUTO_LIMITES.complemento} caracteres.`, variant: "destructive" })
      return
    }
    if (formData.peso.trim().length > PRODUTO_LIMITES.peso) {
      toast({ title: "Erro", description: `Peso deve ter no maximo ${PRODUTO_LIMITES.peso} caracteres.`, variant: "destructive" })
      return
    }
    if (formData.pesoLiquido.trim().length > PRODUTO_LIMITES.pesoLiquido) {
      toast({ title: "Erro", description: `Peso liquido deve ter no maximo ${PRODUTO_LIMITES.pesoLiquido} caracteres.`, variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      await produtoApi.update(produtoId, {
        descricao: formData.descricao.trim(),
        compradorId: formData.compradorId.trim() ? Number(formData.compradorId) : null,
        complemento: formData.complemento.trim(),
        lastro: formData.lastro.trim() ? Number(formData.lastro) : null,
        altura: formData.altura.trim() ? Number(formData.altura) : null,
        peso: formData.peso.trim(),
        pesoLiquido: formData.pesoLiquido.trim(),
        composicao: formData.composicao.trim() ? Number(formData.composicao) : null,
        dataCadastro: formData.dataCadastro || null,
        embalagens: embalagens.map((emb) => ({
          id: emb.id.trim() ? Number(emb.id) : undefined,
          digito: emb.digito.trim() ? Number(emb.digito) : null,
          codigoBarra: emb.codigoBarra.trim(),
          sigla: emb.sigla.trim(),
          multiplicador1: emb.multiplicador1.trim() ? Number(emb.multiplicador1) : null,
          multiplicador2: emb.multiplicador2.trim() ? Number(emb.multiplicador2) : null,
          status: emb.status,
        })),
        status: formData.status,
      })
      toast({ title: "Sucesso", description: "Produto atualizado com sucesso." })
      router.push("/produtos")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar o produto.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return <div className="py-12 text-center text-gray-500">Carregando produto...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-4">
          <Link href="/produtos">
            <Button size="sm" className="btn-primary-custom">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar produto</h1>
            <p className="text-gray-600">Atualize os dados do produto</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados do produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="id">ID</Label>
                <Input id="id" type="number" value={formData.id} className="h-10 border-gray-200 bg-white shadow-sm" disabled />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  disabled={loading}
                  maxLength={PRODUTO_LIMITES.descricao}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="compradorId">Comprador</Label>
                <Select
                  value={formData.compradorId || "__none__"}
                  onValueChange={(value) => setFormData((p) => ({ ...p, compradorId: value === "__none__" ? "" : value }))}
                  disabled={loading}
                >
                  <SelectTrigger id="compradorId" className="h-10 w-full border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                    <SelectValue placeholder="Selecione um comprador" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="__none__" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">
                      Não informado
                    </SelectItem>
                    {compradores.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)} className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">
                        {c.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => setFormData((p) => ({ ...p, complemento: e.target.value }))}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  disabled={loading}
                  maxLength={PRODUTO_LIMITES.complemento}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="lastro">Lastro</Label>
                <Input id="lastro" type="number" value={formData.lastro} onChange={(e) => setFormData((p) => ({ ...p, lastro: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
              </div>
              <div>
                <Label htmlFor="altura">Altura</Label>
                <Input id="altura" type="number" step="0.001" value={formData.altura} onChange={(e) => setFormData((p) => ({ ...p, altura: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
              </div>
              <div>
                <Label htmlFor="peso">Peso</Label>
                <Input id="peso" value={formData.peso} onChange={(e) => setFormData((p) => ({ ...p, peso: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} maxLength={PRODUTO_LIMITES.peso} />
              </div>
              <div>
                <Label htmlFor="pesoLiquido">Peso líquido</Label>
                <Input id="pesoLiquido" value={formData.pesoLiquido} onChange={(e) => setFormData((p) => ({ ...p, pesoLiquido: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} maxLength={PRODUTO_LIMITES.pesoLiquido} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="composicao">Composição</Label>
                <Input id="composicao" type="number" value={formData.composicao} onChange={(e) => setFormData((p) => ({ ...p, composicao: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
              </div>
              <div>
                <Label htmlFor="dataCadastro">Data de cadastro</Label>
                <Input id="dataCadastro" type="date" value={formData.dataCadastro} onChange={(e) => setFormData((p) => ({ ...p, dataCadastro: e.target.value }))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData((p) => ({ ...p, status: value as ProdutoStatus }))} disabled={loading}>
                  <SelectTrigger id="status" className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">Ativo</SelectItem>
                    <SelectItem value="INATIVO" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="border-orange-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Embalagens</CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    className="btn-primary-custom"
                    onClick={() => setEmbalagens((prev) => [...prev, novaEmbalagem()])}
                    disabled={loading}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar embalagem
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {embalagens.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma embalagem cadastrada.</p>
                ) : (
                  embalagens.map((emb, index) => (
                    <div key={`${index}-${emb.id}`} className="space-y-3 rounded-lg border border-orange-100 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">Embalagem {index + 1}</p>
                        <Button
                          type="button"
                          size="sm"
                          className="btn-primary-custom"
                          onClick={() => setEmbalagens((prev) => prev.filter((_, i) => i !== index))}
                          disabled={loading}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Remover
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                          <Label>ID</Label>
                          <Input value={emb.id} onChange={(e) => setEmbalagens((prev) => prev.map((x, i) => (i === index ? { ...x, id: e.target.value } : x)))} type="number" className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
                        </div>
                        <div>
                          <Label>Dígito</Label>
                          <Input value={emb.digito} onChange={(e) => setEmbalagens((prev) => prev.map((x, i) => (i === index ? { ...x, digito: e.target.value } : x)))} type="number" className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
                        </div>
                        <div>
                          <Label>Sigla</Label>
                          <Input value={emb.sigla} onChange={(e) => setEmbalagens((prev) => prev.map((x, i) => (i === index ? { ...x, sigla: e.target.value } : x)))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                          <Label>Código de barras</Label>
                          <Input value={emb.codigoBarra} onChange={(e) => setEmbalagens((prev) => prev.map((x, i) => (i === index ? { ...x, codigoBarra: e.target.value } : x)))} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
                        </div>
                        <div>
                          <Label>Multiplicador 1</Label>
                          <Input value={emb.multiplicador1} onChange={(e) => setEmbalagens((prev) => prev.map((x, i) => (i === index ? { ...x, multiplicador1: e.target.value } : x)))} type="number" step="0.000001" className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
                        </div>
                        <div>
                          <Label>Multiplicador 2</Label>
                          <Input value={emb.multiplicador2} onChange={(e) => setEmbalagens((prev) => prev.map((x, i) => (i === index ? { ...x, multiplicador2: e.target.value } : x)))} type="number" step="0.000001" className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <Label>Status</Label>
                          <Select value={emb.status} onValueChange={(value) => setEmbalagens((prev) => prev.map((x, i) => (i === index ? { ...x, status: value as ProdutoStatus } : x)))} disabled={loading}>
                            <SelectTrigger className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ATIVO" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">Ativo</SelectItem>
                              <SelectItem value="INATIVO" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
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
