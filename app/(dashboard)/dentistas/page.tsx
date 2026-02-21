"use client"

import { useEffect, useMemo, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { dentistasApi } from "@/lib/api"
import { DentistasHeader } from "@/components/dentists/dentistas-header"
import { DentistasTable } from "@/components/dentists/dentistas-table"
import { Button } from "@/components/ui/button"

export type Dentista = {
  id: string
  nome: string
  cro: string
  telefone: string
  email: string
  ativo: boolean
  especialidades: string[]
  createdAt?: string
}

export default function DentistasPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Dentista[]>([])
  const [page, setPage] = useState(1) // UI 1-based
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [search, setSearch] = useState("")

  const pageIndex = useMemo(() => Math.max(page - 1, 0), [page]) // API 0-based

  const fetchDentistas = async () => {
    setLoading(true)
    try {
      const resp = await dentistasApi.getAll(pageIndex, 10, search)

      // resp pode ser Page<T> ou array (defendi nos apis). Normalizamos:
      const content: Dentista[] = Array.isArray(resp?.content)
        ? resp.content
        : Array.isArray(resp)
        ? (resp as Dentista[])
        : []

      const pages =
        typeof resp?.totalPages === "number"
          ? Math.max(resp.totalPages, 1)
          : 1

      const total =
        typeof resp?.totalElements === "number" ? resp.totalElements : content.length

      setItems(content)
      setTotalPages(pages)
      setTotalElements(total)
    } catch (err: any) {
      // Mostra o motivo do 500 (quando backend envia payload/message)
      const msg =
        err?.payload?.message ||
        err?.message ||
        "Erro ao carregar dentistas. Tente novamente."
      toast({ title: "Erro", description: msg, variant: "destructive" })
      // zera lista para não ficar com dados “velhos”
      setItems([])
      setTotalPages(1)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDentistas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, search])

  const handleSearch = (term: string) => {
    setPage(1)
    setSearch(term)
  }

  const handleRefresh = () => {
    fetchDentistas()
  }

  const handleDelete = async (id: string) => {
    try {
      setLoading(true)
      await dentistasApi.delete(id)
      toast({ title: "Removido", description: "Dentista excluído com sucesso." })
      // recarrega a página atual (ou volta uma se ficou vazia)
      await fetchDentistas()
      if (items.length === 1 && page > 1) setPage(page - 1)
    } catch (err: any) {
      const msg =
        err?.payload?.message || err?.message || "Não foi possível excluir o dentista."
      toast({ title: "Erro", description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <DentistasHeader
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        totalDentistas={totalElements}
      />

      {(!loading && items.length === 0) ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-600">
          {search
            ? "Nenhum dentista encontrado para a busca."
            : "Nenhum dentista cadastrado ainda."}
          <div className="mt-4">
            <Button variant="outline" onClick={handleRefresh}>Tentar novamente</Button>
          </div>
        </div>
      ) : (
        <DentistasTable
          dentistas={items}
          loading={loading}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
