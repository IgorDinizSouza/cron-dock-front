"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { produtoApi, type ProdutoStatus } from "@/lib/produto"
import { compradorApi, type CompradorResponse } from "@/lib/comprador"

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

export default function NovoProdutoPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [descricao, setDescricao] = useState("")
  const [compradorId, setCompradorId] = useState("")
  const [compradores, setCompradores] = useState<CompradorResponse[]>([])
  const [complemento, setComplemento] = useState("")
  const [lastro, setLastro] = useState("")
  const [altura, setAltura] = useState("")
  const [peso, setPeso] = useState("")
  const [pesoLiquido, setPesoLiquido] = useState("")
  const [composicao, setComposicao] = useState("")
  const [dataCadastro, setDataCadastro] = useState("")
  const [status, setStatus] = useState<ProdutoStatus>("ATIVO")
  const [embalagens, setEmbalagens] = useState<EmbalagemForm[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        setCompradores(await compradorApi.listAll())
      } catch {
        setCompradores([])
      }
    })()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!descricao.trim()) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return
    }
    if (descricao.trim().length > PRODUTO_LIMITES.descricao) {
      toast({ title: "Erro", description: `Descricao deve ter no maximo ${PRODUTO_LIMITES.descricao} caracteres.`, variant: "destructive" })
      return
    }
    if (complemento.trim().length > PRODUTO_LIMITES.complemento) {
      toast({ title: "Erro", description: `Complemento deve ter no maximo ${PRODUTO_LIMITES.complemento} caracteres.`, variant: "destructive" })
      return
    }
    if (peso.trim().length > PRODUTO_LIMITES.peso) {
      toast({ title: "Erro", description: `Peso deve ter no maximo ${PRODUTO_LIMITES.peso} caracteres.`, variant: "destructive" })
      return
    }
    if (pesoLiquido.trim().length > PRODUTO_LIMITES.pesoLiquido) {
      toast({ title: "Erro", description: `Peso liquido deve ter no maximo ${PRODUTO_LIMITES.pesoLiquido} caracteres.`, variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      await produtoApi.create({
        descricao: descricao.trim(),
        compradorId: compradorId.trim() ? Number(compradorId) : null,
        complemento: complemento.trim(),
        lastro: lastro.trim() ? Number(lastro) : null,
        altura: altura.trim() ? Number(altura) : null,
        peso: peso.trim(),
        pesoLiquido: pesoLiquido.trim(),
        composicao: composicao.trim() ? Number(composicao) : null,
        dataCadastro: dataCadastro || null,
        embalagens: embalagens.map((emb) => ({
          id: emb.id.trim() ? Number(emb.id) : undefined,
          digito: emb.digito.trim() ? Number(emb.digito) : null,
          codigoBarra: emb.codigoBarra.trim(),
          sigla: emb.sigla.trim(),
          multiplicador1: emb.multiplicador1.trim() ? Number(emb.multiplicador1) : null,
          multiplicador2: emb.multiplicador2.trim() ? Number(emb.multiplicador2) : null,
          status: emb.status,
        })),
        status,
      })
      toast({ title: "Sucesso", description: "Produto criado com sucesso." })
      router.push("/produtos")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível criar o produto.",
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
          <Link href="/produtos">
            <Button size="sm" className="btn-primary-custom">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo produto</h1>
            <p className="text-gray-600">Cadastre um produto para o grupo empresarial</p>
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
                <Label htmlFor="descricao">Descrição *</Label>
                <Input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} maxLength={PRODUTO_LIMITES.descricao} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="compradorId">Comprador</Label>
                <Select value={compradorId || "__none__"} onValueChange={(value) => setCompradorId(value === "__none__" ? "" : value)} disabled={loading}>
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
                <Input id="complemento" value={complemento} onChange={(e) => setComplemento(e.target.value)} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} maxLength={PRODUTO_LIMITES.complemento} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="lastro">Lastro</Label>
                <Input id="lastro" type="number" value={lastro} onChange={(e) => setLastro(e.target.value)} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
              </div>
              <div>
                <Label htmlFor="altura">Altura</Label>
                <Input id="altura" type="number" step="0.001" value={altura} onChange={(e) => setAltura(e.target.value)} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
              </div>
              <div>
                <Label htmlFor="peso">Peso</Label>
                <Input id="peso" value={peso} onChange={(e) => setPeso(e.target.value)} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} maxLength={PRODUTO_LIMITES.peso} />
              </div>
              <div>
                <Label htmlFor="pesoLiquido">Peso líquido</Label>
                <Input id="pesoLiquido" value={pesoLiquido} onChange={(e) => setPesoLiquido(e.target.value)} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} maxLength={PRODUTO_LIMITES.pesoLiquido} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="composicao">Composição</Label>
                <Input id="composicao" type="number" value={composicao} onChange={(e) => setComposicao(e.target.value)} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
              </div>
              <div>
                <Label htmlFor="dataCadastro">Data de cadastro</Label>
                <Input id="dataCadastro" type="date" value={dataCadastro} onChange={(e) => setDataCadastro(e.target.value)} className="h-10 border-gray-200 bg-white shadow-sm" disabled={loading} />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as ProdutoStatus)} disabled={loading}>
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
                    className="btn-primary-custom"
                    size="sm"
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
                  <p className="text-sm text-gray-500">Nenhuma embalagem adicionada.</p>
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
          <Button type="submit" className="btn-primary-custom" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Criar produto
          </Button>
        </div>
      </form>
    </div>
  )
}
