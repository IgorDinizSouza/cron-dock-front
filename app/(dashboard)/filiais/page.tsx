"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { filialApi, type FilialResponse } from "@/lib/filial"
import { Edit, Plus, Search, Store, Trash2 } from "lucide-react"

export default function FiliaisPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<FilialResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [descricaoFilter, setDescricaoFilter] = useState("")
  const [cnpjFilter, setCnpjFilter] = useState("")
  const [ufFilter, setUfFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const load = async () => {
    try {
      setLoading(true)
      setItems(await filialApi.listByGrupoEmpresarial())
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar as filiais.",
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
    const descricao = descricaoFilter.trim().toLowerCase()
    const cnpj = cnpjFilter.trim().toLowerCase()
    const uf = ufFilter.trim().toLowerCase()
    const status = statusFilter.trim().toUpperCase()

    return items.filter((item) => {
      const okDescricao = descricao ? item.descricao.toLowerCase().includes(descricao) : true
      const okCnpj = cnpj ? item.cnpj.toLowerCase().includes(cnpj) : true
      const okUf = uf ? (item.uf || "").toLowerCase().includes(uf) : true
      const okStatus = status ? String(item.status || "").toUpperCase() === status : true
      return okDescricao && okCnpj && okUf && okStatus
    })
  }, [items, descricaoFilter, cnpjFilter, ufFilter, statusFilter])

  const handleDelete = async (item: FilialResponse) => {
    if (!confirm(`Deseja realmente excluir a filial "${item.descricao}"?`)) return
    if (!confirm("Deseja realmente excluir o registro?")) return

    try {
      await filialApi.delete(item.id)
      toast({ title: "Sucesso", description: "Filial excluída com sucesso." })
      await load()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível excluir a filial.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Filiais</h1>
          <p className="text-gray-600">Cadastro e gerenciamento de filiais por grupo empresarial</p>
        </div>
        <div />
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Filtros</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-4">
              <Input
                className="h-10 border-gray-200 bg-white pl-3 shadow-sm"
                placeholder="Descrição"
                value={descricaoFilter}
                onChange={(e) => setDescricaoFilter(e.target.value)}
                disabled={loading}
              />
              <Input
                className="h-10 border-gray-200 bg-white pl-3 shadow-sm"
                placeholder="CNPJ"
                value={cnpjFilter}
                onChange={(e) => setCnpjFilter(e.target.value)}
                disabled={loading}
              />
              <Input
                className="h-10 border-gray-200 bg-white pl-3 uppercase shadow-sm"
                placeholder="UF"
                value={ufFilter}
                onChange={(e) => setUfFilter(e.target.value.toUpperCase().slice(0, 2))}
                disabled={loading}
                maxLength={2}
              />
              <Select value={statusFilter || "__all__"} onValueChange={(value) => setStatusFilter(value === "__all__" ? "" : value)}>
                <SelectTrigger className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">
                    Todos
                  </SelectItem>
                  <SelectItem value="ATIVO" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">
                    Ativo
                  </SelectItem>
                  <SelectItem value="INATIVO" className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700">
                    Inativo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={load} disabled={loading} className="btn-primary-custom">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
              <Link href="/filiais/novo">
                <Button className="btn-primary-custom">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Filtre por descrição, CNPJ, UF e status.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filiais ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando filiais...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Nenhuma filial encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4">Descrição</th>
                    <th className="py-3 pr-4">CNPJ</th>
                    <th className="py-3 pr-4">UF</th>
                    <th className="py-3 pr-4">CD</th>
                    <th className="py-3 pr-4">WMS</th>
                    <th className="py-3 pr-4">Regional</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="min-w-[220px] py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-orange-100 text-orange-700">
                            <Store className="h-4 w-4" />
                          </span>
                          <span className="font-medium">{item.descricao}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4">{item.cnpj || "-"}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{item.uf || "-"}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{item.cd ?? "-"}</td>
                      <td className="whitespace-nowrap py-3 pr-4">{item.wms ?? "-"}</td>
                      <td className="py-3 pr-4">{item.descricaoRegional || "-"}</td>
                      <td className="py-3 pr-4">
                        <Badge
                          className={
                            item.status === "INATIVO"
                              ? "border-red-200 bg-red-100 text-red-800 hover:bg-red-100"
                              : "border-green-200 bg-green-100 text-green-800 hover:bg-green-100"
                          }
                        >
                          {item.status === "INATIVO" ? "Inativo" : "Ativo"}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-2">
                          <Link href={`/filiais/${item.id}/editar`}>
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
