"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProceduresHeader } from "@/components/procedures/procedures-header"
import { ProceduresGrid } from "@/components/procedures/procedures-grid"
import { proceduresApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useNotification } from "@/contexts/notification-context"

export interface Procedure {
  id: string
  nome: string
  especialidade: string
  descricao?: string
  duracao: number
  preco: number
  materiaisNecessarios?: string[]
  instrucoesPre?: string
  instrucoesPos?: string
  contraindicacoes?: string
  ativo: boolean
  consultorioId: number
  criadoEm?: string
  atualizadoEm?: string
}

const PAGE_SIZE = 12

export default function ProcedimentosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { showNotification } = useNotification()

  const [items, setItems] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1) // UI 1-based
  const [totalPages, setTotalPages] = useState(1)

  async function fetchPage(page1: number, term: string) {
    try {
      setLoading(true)
      const resp = await proceduresApi.getAll(page1 - 1, PAGE_SIZE, term)
      const content = resp?.content ?? (Array.isArray(resp) ? resp : [])
      // se quiser filtrar por categoria na UI:
      const filtered =
        category === "all" ? content : content.filter((p: Procedure) => p.especialidade?.toLowerCase() === category)
      setItems(filtered)
      setTotalPages(resp?.totalPages ?? 1)
    } catch {
      toast({ title: "Erro", description: "Não foi possível carregar os procedimentos.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPage(currentPage, search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search]) // category filtramos no client; se quiser no server, crie endpoint combinado

  const handleEdit = (id: string) => router.push(`/procedimentos/${id}/editar`)

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este procedimento?")) return
    try {
      await proceduresApi.delete(id)
      showNotification("Procedimento excluído com sucesso!", "success")
      fetchPage(currentPage, search)
    } catch (error) {
      showNotification("Não foi possível excluir o procedimento. Verifique se não há agendamentos vinculados.", "error")
    }
  }

  return (
    <div className="space-y-6">
      <ProceduresHeader onSearch={setSearch} onCategoryChange={setCategory} />
      <ProceduresGrid
        procedures={items}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
