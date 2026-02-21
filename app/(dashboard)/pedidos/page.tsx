"use client"

import { useEffect, useMemo, useState } from "react"
// Link removed (no top buttons)
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Search, Eraser } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { pedidoApi, type PedidoResponse as Pedido } from "@/lib/pedido"

export default function PedidosPage() {
	const router = useRouter()
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
				? data.filter((d) =>
						[d.filial, d.pedido, d.fornecedor, d.comprador, d.dataCriacao, d.status]
							.join(" ")
							.toLowerCase()
							.includes(t),
					)
				: data

			setItems(filtered)
		} catch (e: any) {
			toast({ title: "Erro", description: e?.message || "Não foi possível carregar os pedidos.", variant: "destructive" })
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		load("")
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const filtered = useMemo(() => {
		const t = search.trim().toLowerCase()
		return items.filter((x) => {
			if (t) {
				const all = [x.filial, x.pedido, x.fornecedor, x.comprador, x.dataCriacao, x.status]
					.join(" ")
					.toLowerCase()
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

	const handleEdit = (id: number) => router.push(`/pedidos/${id}`)
	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
					<p className="text-gray-600">Gerenciamento de pedidos</p>
				</div>

				{/* Top actions removed per design */}
			</div>

			<Card>
				<CardHeader className="space-y-3">

					<div className="flex items-center gap-2">
						<div className="w-full space-y-2">
							<div className="grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-2 w-full">
								<Input
									className="pl-3 shadow-sm border-gray-200 bg-white h-10 placeholder:font-italic"
									value={filialFilter}
									onChange={(e) => setFilialFilter(e.target.value)}
									placeholder="Filial"
									disabled={loading}
								/>

								<Input
									className="pl-3 shadow-sm border-gray-200 bg-white h-10 placeholder:font-italic"
									value={fornecedorFilter}
									onChange={(e) => setFornecedorFilter(e.target.value)}
									placeholder="Fornecedor"
									disabled={loading}
								/>

								<Input
									className="pl-3 shadow-sm border-gray-200 bg-white h-10 placeholder:font-italic"
									value={compradorFilter}
									onChange={(e) => setCompradorFilter(e.target.value)}
									placeholder="Comprador"
									disabled={loading}
								/>

								<div className="hidden sm:block" />
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-2 items-center w-full">
								<Input
									className="pl-3 shadow-sm border-gray-200 bg-white h-10 placeholder:font-italic"
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
										className="border-input rounded-md px-2 py-2 bg-white w-full h-10"
										disabled={loading}
									>
										<option value="">Todos</option>
										<option value="Pendente">Pendente</option>
										<option value="Enviado">Enviado</option>
										<option value="Recebido">Recebido</option>
									</select>
								</div>

								<div>
									<Input className="shadow-sm border-gray-200 bg-white h-10" type="date" value={dataCriacaoFilter} onChange={(e) => setDataCriacaoFilter(e.target.value)} placeholder="Data criação" disabled={loading} />
								</div>

								<div className="flex justify-end items-center gap-2">
									<Button onClick={() => load(search)} disabled={loading} className="btn-primary-custom">
										<Search className="h-4 w-4 mr-2" />
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
										<Eraser className="h-4 w-4 mr-2" />
										Limpar
									</Button>
								</div>
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent>
					{loading ? (
						<div className="text-gray-500 py-10 text-center">Carregando pedidos...</div>
					) : filtered.length === 0 ? (
						<div className="text-gray-500 py-10 text-center">Nenhum pedido encontrado.</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="text-left border-b">
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
											<td className="py-3 pr-4 whitespace-nowrap">{g.filial}</td>
											<td className="py-3 pr-4 whitespace-nowrap">{g.pedido}</td>
											<td className="py-3 pr-4 min-w-[200px]">{g.fornecedor}</td>
											<td className="py-3 pr-4 min-w-[160px]">{g.comprador}</td>
											<td className="py-3 pr-4 whitespace-nowrap">{g.dataCriacao}</td>
											<td className="py-3 pr-4">
												<span
													className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
														{ "Pendente": "bg-yellow-100 text-yellow-800", "Enviado": "bg-blue-100 text-blue-800", "Recebido": "bg-green-100 text-green-800" }[
															g.status
														] || "bg-gray-100 text-gray-700"
													}`}
												>
													{g.status}
												</span>
											</td>
											<td className="py-3 text-right">
												<Button size="sm" onClick={() => handleEdit(g.id)} className="btn-primary-custom">
													<Pencil className="h-4 w-4 mr-2" />
													Editar
												</Button>
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
