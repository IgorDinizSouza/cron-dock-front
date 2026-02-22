"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { produtoApi, type ProdutoResponse } from "@/lib/produto"
import { compradorApi, type CompradorResponse } from "@/lib/comprador"
import { Edit, Eraser, Package, Plus, Search, Trash2 } from "lucide-react"

export default function ProdutosPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<ProdutoResponse[]>([])
  const [compradores, setCompradores] = useState<CompradorResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [descricaoFilter, setDescricaoFilter] = useState("")
  const [idFilter, setIdFilter] = useState("")
  const [compradorFilter, setCompradorFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const load = async () => {
    try {
      setLoading(true)
      setItems(await produtoApi.listByGrupoEmpresarial())
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar os produtos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    ;(async () => {
      try {
        setCompradores(await compradorApi.listAll())
      } catch {
        setCompradores([])
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const descricao = descricaoFilter.trim().toLowerCase()
    const idText = idFilter.trim().toLowerCase()
    const comprador = compradorFilter.trim().toLowerCase()
    const status = statusFilter.trim().toUpperCase()

    return items.filter((item) => {
      const okDescricao = descricao ? item.descricao.toLowerCase().includes(descricao) : true
      const okId = idText ? String(item.id || "").toLowerCase().includes(idText) : true
      const compradorText = String(item.compradorDescricao || "").toLowerCase()
      const okComprador = comprador ? compradorText.includes(comprador) : true
      const okStatus = status ? String(item.status || "").toUpperCase() === status : true
      return okDescricao && okId && okComprador && okStatus
    })
  }, [items, descricaoFilter, idFilter, compradorFilter, statusFilter])

  const handleDelete = async (item: ProdutoResponse) => {
    if (!confirm(`Deseja realmente excluir o produto "${item.descricao}"?`)) return
    if (!confirm("Deseja realmente excluir o registro?")) return

    try {
      await produtoApi.delete(item.id)
      toast({ title: "Sucesso", description: "Produto excluído com sucesso." })
      await load()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível excluir o produto.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Cadastro e gerenciamento de produtos por grupo empresarial</p>
        </div>
        <div />
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Filtros</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-4">
              <Input className="h-10 border-gray-200 bg-white pl-3 shadow-sm" placeholder="Descrição" value={descricaoFilter} onChange={(e) => setDescricaoFilter(e.target.value)} disabled={loading} />
              <Input className="h-10 border-gray-200 bg-white pl-3 shadow-sm" placeholder="ID" value={idFilter} onChange={(e) => setIdFilter(e.target.value)} disabled={loading} />
              <Select value={compradorFilter || "__all__"} onValueChange={(value) => setCompradorFilter(value === "__all__" ? "" : value)}>
                <SelectTrigger className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                  <SelectValue placeholder="Comprador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">
                    Todos os compradores
                  </SelectItem>
                  {compradores.map((c) => (
                    <SelectItem key={c.id} value={c.descricao.toLowerCase()} className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">
                      {c.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter || "__all__"} onValueChange={(value) => setStatusFilter(value === "__all__" ? "" : value)}>
                <SelectTrigger className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">Todos</SelectItem>
                  <SelectItem value="ATIVO" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">Ativo</SelectItem>
                  <SelectItem value="INATIVO" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={load} disabled={loading} className="btn-primary-custom">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>             
              <Link href="/produtos/novo">
                <Button className="btn-primary-custom">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Filtre por descrição, ID, comprador e status.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando produtos...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Nenhum produto encontrado.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <div key={item.id} className="flex flex-col gap-4 rounded-lg border p-4 hover:bg-gray-50 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900">{item.descricao}</p>
                        <Badge
                          className={
                            item.status === "INATIVO"
                              ? "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
                              : "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                          }
                        >
                          {item.status === "INATIVO" ? "Inativo" : "Ativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">ID: {item.id}</p>
                      <p className="text-sm text-gray-600">Comprador: {item.compradorDescricao || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/produtos/${item.id}/editar`}>
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
