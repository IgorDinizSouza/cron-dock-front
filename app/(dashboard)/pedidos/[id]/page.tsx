"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { pedidoApi, type PedidoDetalheResponse, type PedidoItemResponse } from "@/lib/pedido"

function formatValue(value: any) {
  if (value == null || value === "") return "-"
  return String(value)
}

function formatNumber(value: any) {
  if (value == null || value === "") return "-"
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value)
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(n)
}

function getItemDescription(item: PedidoItemResponse) {
  return item.produto || item.descricao || formatValue(item.codigo)
}

export default function VisualizarPedidoPage() {
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const pedidoId = params?.id

  const [loading, setLoading] = useState(true)
  const [pedido, setPedido] = useState<PedidoDetalheResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!pedidoId) return
      try {
        setLoading(true)
        setLoadError(null)
        const data = await pedidoApi.getByNumeroPedido(pedidoId)
        setPedido(data)
      } catch (error: any) {
        const message = error?.message || "Não foi possível carregar o pedido."
        setLoadError(message)
        toast({ title: "Erro", description: message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [pedidoId, toast])

  if (loading) return <div className="py-12 text-center text-gray-500">Carregando pedido...</div>
  if (!pedido) return <div className="py-12 text-center text-gray-500">Pedido não encontrado.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pedidos">
          <Button size="sm" className="btn-primary-custom">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Visualizar pedido</h1>
            <p className="text-gray-600">Consulta dos dados do pedido e seus itens</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do pedido</CardTitle>
        </CardHeader>
        <CardContent>
          {loadError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {loadError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">ID</p>
              <p className="mt-1 text-sm text-gray-900">{formatValue(pedido.id)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pedido</p>
              <p className="mt-1 text-sm text-gray-900">{formatValue(pedido.pedido)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</p>
              <p className="mt-1">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                    {
                      Pendente: "bg-yellow-100 text-yellow-800",
                      Enviado: "bg-blue-100 text-blue-800",
                      Recebido: "bg-green-100 text-green-800",
                    }[pedido.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {formatValue(pedido.status)}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Filial</p>
              <p className="mt-1 text-sm text-gray-900">{formatValue(pedido.filial)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Fornecedor</p>
              <p className="mt-1 text-sm text-gray-900">{formatValue(pedido.fornecedor)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Comprador</p>
              <p className="mt-1 text-sm text-gray-900">{formatValue(pedido.comprador)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Data de criação</p>
              <p className="mt-1 text-sm text-gray-900">{formatValue(pedido.dataCriacao)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens do pedido ({pedido.itens.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pedido.itens.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Nenhum item encontrado para este pedido.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4">ID</th>
                    <th className="py-3 pr-4">Seq.</th>
                    <th className="py-3 pr-4">Produto ID</th>
                    <th className="py-3 pr-4">Produto</th>
                    <th className="py-3 pr-4">Qtd. pedida</th>
                    <th className="py-3 pr-4">Qtd. recebida</th>
                    <th className="py-3 pr-4">Data entrega</th>
                    <th className="py-3 pr-4">Carga palet</th>
                    <th className="py-3 pr-4">ABC</th>
                    <th className="py-3 pr-4">Participação (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.itens.map((item) => (
                    <tr key={`${item.id}-${item.sequencia ?? ""}`} className="border-b last:border-b-0">
                      <td className="whitespace-nowrap py-3 pr-4">{formatValue(item.id)}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{formatValue(item.sequencia)}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{formatValue(item.produtoId)}</td>
                      <td className="min-w-[220px] py-3 pr-4">{formatValue(getItemDescription(item))}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{formatNumber(item.qtdPedida ?? item.quantidade)}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{formatNumber(item.qtdRecebida)}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{formatValue(item.dataEntrega)}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{formatNumber(item.cargaPalet)}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{formatValue(item.abc)}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{formatNumber(item.participacaoItem)}</td>
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
