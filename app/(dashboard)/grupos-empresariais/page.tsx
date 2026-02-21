"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Search, Eraser } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { grupoEmpresarialApi, type GrupoEmpresarialResponse as GrupoEmpresa } from "@/lib/grupoempresarial"

export default function GrupoEmpresaPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [items, setItems] = useState<GrupoEmpresa[]>([])
  const [loading, setLoading] = useState(true)
  const [codigoFilter, setCodigoFilter] = useState("")
  const [descricaoFilter, setDescricaoFilter] = useState("")
  const [cnpjFilter, setCnpjFilter] = useState("")
  const [ativoFilter, setAtivoFilter] = useState("")

  const load = async (term?: string) => {
    setLoading(true)
    try {
      const data = await grupoEmpresarialApi.list(term || "")

      setItems(data || [])
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e?.message || "Não foi possível carregar os grupos de empresa.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // filtra localmente pelos campos de filtro
  const filtered = useMemo(() => {
    const cCodigo = codigoFilter.trim().toLowerCase()
    const cDesc = descricaoFilter.trim().toLowerCase()
    const cCnpj = cnpjFilter.trim().toLowerCase()
    const cAtivo = ativoFilter.trim().toLowerCase()

    if (!cCodigo && !cDesc && !cCnpj && !cAtivo) return items

    return items.filter((x) => {
      const matchesCodigo = cCodigo ? (x.id?.toString() || "").toLowerCase().includes(cCodigo) : true
      const matchesDesc = cDesc ? ((x.descricao || "").toLowerCase().includes(cDesc)) : true
      const matchesCnpj = cCnpj ? ((x.cnpj || "").toLowerCase().includes(cCnpj)) : true
      const ativoText = x.ativo ? "ativo" : "inativo"
      const matchesAtivo = cAtivo ? ativoText.includes(cAtivo) : true

      return matchesCodigo && matchesDesc && matchesCnpj && matchesAtivo
    })
  }, [items, codigoFilter, descricaoFilter, cnpjFilter, ativoFilter])

  const handleEdit = (id: number) => router.push(`/grupos-empresariais/${id}`)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grupo Empresarial</h1>
          <p className="text-gray-600">Cadastro e gerenciamento de grupos</p>
        </div>

        <div />
      </div>

      <Card>
        <CardHeader className="space-y-3">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 w-full">
              <Input
                className="pl-3 shadow-sm border-gray-200 bg-white h-10 placeholder:font-italic"
                value={codigoFilter}
                onChange={(e) => setCodigoFilter(e.target.value)}
                placeholder="Código"
                disabled={loading}
              />
              <Input
                className="pl-3 shadow-sm border-gray-200 bg-white h-10 placeholder:font-italic"
                value={descricaoFilter}
                onChange={(e) => setDescricaoFilter(e.target.value)}
                placeholder="Descrição"
                disabled={loading}
              />
              <Input
                className="pl-3 shadow-sm border-gray-200 bg-white h-10 placeholder:font-italic"
                value={cnpjFilter}
                onChange={(e) => setCnpjFilter(e.target.value)}
                placeholder="CNPJ"
                disabled={loading}
              />
              <div>
                <select
                  value={ativoFilter}
                  onChange={(e) => setAtivoFilter(e.target.value)}
                  className="border-input rounded-md px-2 py-2 bg-white w-full h-10 shadow-sm border-gray-200"
                  disabled={loading}
                >
                  <option value="">Todos</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => load()} disabled={loading} className="btn-primary-custom">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button
                onClick={() => {
                  setCodigoFilter("")
                  setDescricaoFilter("")
                  setCnpjFilter("")
                  setAtivoFilter("")
                }}
                className="btn-primary-custom"
              >
                <Eraser className="h-4 w-4 mr-2" />
                Limpar
              </Button>

              <Link href="/grupos-empresariais/novo">
                <Button className="btn-primary-custom">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-gray-500 py-10 text-center">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-500 py-10 text-center">Nenhum grupo cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-3 pr-4">Código</th>
                    <th className="py-3 pr-4">Descrição</th>
                    <th className="py-3 pr-4">CNPJ</th>
                    <th className="py-3 pr-4">Ativo</th>
                    <th className="py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((g) => (
                    <tr key={g.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 whitespace-nowrap">{g.id}</td>
                      <td className="py-3 pr-4 min-w-[260px]">{g.descricao}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">{g.cnpj}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            g.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {g.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/grupos-empresariais/${g.id}`}>
                          <Button variant="outline" size="sm" className="btn-primary-custom">
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
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
