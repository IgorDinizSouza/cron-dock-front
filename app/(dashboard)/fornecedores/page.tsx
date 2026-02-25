"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Building2, Edit, Plus, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { fornecedorApi, type FornecedorResponse } from "@/lib/fornecedor"

export default function FornecedoresPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<FornecedorResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [razaoSocialFilter, setRazaoSocialFilter] = useState("")
  const [cnpjFilter, setCnpjFilter] = useState("")
  const [cidadeFilter, setCidadeFilter] = useState("")
  const [ufFilter, setUfFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const load = async () => {
    try {
      setLoading(true)
      setItems(await fornecedorApi.listByGrupoEmpresarial())
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar os fornecedores.",
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
    const razaoSocial = razaoSocialFilter.trim().toLowerCase()
    const cnpj = cnpjFilter.trim().toLowerCase()
    const cidade = cidadeFilter.trim().toLowerCase()
    const uf = ufFilter.trim().toLowerCase()
    const status = statusFilter.trim().toUpperCase()

    return items.filter((item) => {
      const okRazaoSocial = razaoSocial ? item.razaoSocial.toLowerCase().includes(razaoSocial) : true
      const okCnpj = cnpj ? item.cnpj.toLowerCase().includes(cnpj) : true
      const okCidade = cidade ? (item.cidade || "").toLowerCase().includes(cidade) : true
      const okUf = uf ? (item.uf || "").toLowerCase().includes(uf) : true
      const okStatus = status ? String(item.status || "").toUpperCase() === status : true
      return okRazaoSocial && okCnpj && okCidade && okUf && okStatus
    })
  }, [items, razaoSocialFilter, cnpjFilter, cidadeFilter, ufFilter, statusFilter])

  const handleDelete = async (item: FornecedorResponse) => {
    if (!confirm(`Deseja realmente excluir o fornecedor "${item.razaoSocial}"?`)) return
    if (!confirm("Deseja realmente excluir o registro?")) return

    try {
      await fornecedorApi.delete(item.id)
      toast({ title: "Sucesso", description: "Fornecedor excluído com sucesso." })
      await load()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível excluir o fornecedor.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-600">Cadastro e gerenciamento por grupo empresarial</p>
        </div>
        <div />
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Filtros</CardTitle>
          <div className="flex flex-col gap-3">
            <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
              <Input
                className="h-10 border-gray-200 bg-white pl-3 shadow-sm"
                placeholder="Razão social"
                value={razaoSocialFilter}
                onChange={(e) => setRazaoSocialFilter(e.target.value)}
                disabled={loading}
                maxLength={200}
              />
              <Input
                className="h-10 border-gray-200 bg-white pl-3 shadow-sm"
                placeholder="CNPJ"
                value={cnpjFilter}
                onChange={(e) => setCnpjFilter(e.target.value)}
                disabled={loading}
                maxLength={50}
              />
              <Input
                className="h-10 border-gray-200 bg-white pl-3 shadow-sm"
                placeholder="Cidade"
                value={cidadeFilter}
                onChange={(e) => setCidadeFilter(e.target.value)}
                disabled={loading}
                maxLength={120}
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

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={load} disabled={loading} className="btn-primary-custom">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
              <Link href="/fornecedores/novo">
                <Button className="btn-primary-custom">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Filtre por razão social, CNPJ, cidade, UF e status.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fornecedores ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-500">Carregando fornecedores...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">Nenhum fornecedor encontrado.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <div key={item.id} className="flex flex-col gap-4 rounded-lg border p-4 hover:bg-gray-50 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900">{item.razaoSocial}</p>
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
                      <p className="text-sm text-gray-600">CNPJ: {item.cnpj || "-"}</p>
                      <p className="text-sm text-gray-600">Cidade/UF: {[item.cidade, item.uf].filter(Boolean).join(" / ") || "-"}</p>
                      <p className="text-xs text-gray-500">Data de cadastro: {item.dataCadastro || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/fornecedores/${item.id}/editar`}>
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
