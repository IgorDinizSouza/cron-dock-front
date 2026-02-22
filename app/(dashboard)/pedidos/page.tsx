"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Search, Eraser } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { pedidoApi, type PedidoResponse as Pedido } from "@/lib/pedido"

export default function PedidosPage() {
  const { toast } = useToast()

  const [items, setItems] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filialFilter, setFilialFilter] = useState("")
  const [fornecedorFilter, setFornecedorFilter] = useState("")
  const [pedidoFilter, setPedidoFilter] = useState("")
  const [compradorFilter, setCompradorFilter] = useState("")
  const [dataCriacaoFilter, setDataCriacaoFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const load = async (term?: string) => {
    setLoading(true)
    try {
      const grupoId = typeof window !== "undefined" ? localStorage.getItem("grupoEmpresarialId") || "1" : "1"
      const data = (await pedidoApi.listByGrupoEmpresarial(grupoId)) as Pedido[]

      const t = (term || "").trim().toLowerCase()
      const filtered = t
        ? data.filter((d) => [d.filial, d.pedido, d.fornecedor, d.comprador, d.dataCriacao, d.status].join(" ").toLowerCase().includes(t))
        : data

      setItems(filtered)
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Nao foi possivel carregar os pedidos.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load("")
  }, [])

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase()
    return items.filter((x) => {
      if (t) {
        const all = [x.filial, x.pedido, x.fornecedor, x.comprador, x.dataCriacao, x.status].join(" ").toLowerCase()
        if (!all.includes(t)) return false
      }

      if (filialFilter && !String(x.filial || "").toLowerCase().includes(filialFilter.toLowerCase())) return false
      if (fornecedorFilter && !String(x.fornecedor || "").toLowerCase().includes(fornecedorFilter.toLowerCase())) return false
      if (pedidoFilter && !String(x.pedido || "").toLowerCase().includes(pedidoFilter.toLowerCase())) return false
      if (compradorFilter && !String(x.comprador || "").toLowerCase().includes(compradorFilter.toLowerCase())) return false
      if (dataCriacaoFilter && !String(x.dataCriacao || "").includes(dataCriacaoFilter)) return false
      if (statusFilter && statusFilter !== "" && statusFilter !== "Todos" && x.status !== statusFilter) return false

      return true
    })
  }, [items, search, filialFilter, fornecedorFilter, pedidoFilter, compradorFilter, dataCriacaoFilter, statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600">Gerenciamento de pedidos</p>
        </div>
        <div />
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Filtros</CardTitle>
          <div className="flex items-center gap-2">
            <div className="w-full space-y-2">
              <div className="grid w-full grid-cols-1 gap-1 sm:grid-cols-4 sm:gap-2">
                <Input
                  className="h-10 border-gray-200 bg-white pl-3 shadow-sm"
                  value={filialFilter}
                  onChange={(e) => setFilialFilter(e.target.value)}
                  placeholder="Filial"
                  disabled={loading}
                />

                <Input
                  className="h-10 border-gray-200 bg-white pl-3 shadow-sm"
                  value={fornecedorFilter}
                  onChange={(e) => setFornecedorFilter(e.target.value)}
                  placeholder="Fornecedor"
                  disabled={loading}
                />

                <Input
                  className="h-10 border-gray-200 bg-white pl-3 shadow-sm"
                  value={compradorFilter}
                  onChange={(e) => setCompradorFilter(e.target.value)}
                  placeholder="Comprador"
                  disabled={loading}
                />

                <div className="hidden sm:block" />
              </div>

              <div className="grid w-full grid-cols-1 items-center gap-1 sm:grid-cols-4 sm:gap-2">
                <Input
                  className="h-10 border-gray-200 bg-white pl-3 shadow-sm"
                  value={pedidoFilter}
                  onChange={(e) => setPedidoFilter(e.target.value)}
                  placeholder="Pedido"
                  disabled={loading}
                />

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border-input h-10 w-full rounded-md border border-gray-200 bg-white px-2 py-2 shadow-sm"
                    disabled={loading}
                  >
                    <option value="">Todos</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Enviado">Enviado</option>
                    <option value="Recebido">Recebido</option>
                  </select>
                </div>

                <div>
                  <Input
                    className="h-10 border-gray-200 bg-white shadow-sm"
                    type="date"
                    value={dataCriacaoFilter}
                    onChange={(e) => setDataCriacaoFilter(e.target.value)}
                    placeholder="Data criacao"
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button onClick={() => load(search)} disabled={loading} className="btn-primary-custom">
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </Button>
                  <Button
                    onClick={() => {
                      setSearch("")
                      setFilialFilter("")
                      setFornecedorFilter("")
                      setPedidoFilter("")
                      setCompradorFilter("")
                      setDataCriacaoFilter("")
                      setStatusFilter("")
                    }}
                    className="btn-primary-custom"
                  >
                    <Eraser className="mr-2 h-4 w-4" />
                    Limpar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Use os filtros acima para localizar os pedidos.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando pedidos...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Nenhum pedido encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4">Filial</th>
                    <th className="py-3 pr-4">Pedido</th>
                    <th className="py-3 pr-4">Fornecedor</th>
                    <th className="py-3 pr-4">Comprador</th>
                    <th className="py-3 pr-4">Data criação</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((g) => (
                    <tr key={g.id} className="border-b last:border-b-0">
                      <td className="whitespace-nowrap py-3 pr-4">{g.filial}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{g.pedido}</td>
                      <td className="min-w-[200px] py-3 pr-4">{g.fornecedor}</td>
                      <td className="min-w-[160px] py-3 pr-4">{g.comprador}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{g.dataCriacao}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            {
                              Pendente: "bg-yellow-100 text-yellow-800",
                              Enviado: "bg-blue-100 text-blue-800",
                              Recebido: "bg-green-100 text-green-800",
                            }[g.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {g.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/pedidos/${encodeURIComponent(String(g.pedido ?? g.id))}`}>
                          <Button size="sm" className="btn-primary-custom">
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar pedido
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
