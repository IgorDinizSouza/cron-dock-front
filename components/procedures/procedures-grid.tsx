"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, DollarSign, MoreHorizontal, Edit, Trash2, Eye, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ProcedureDetailsModal } from "./procedure-details-modal"
import { proceduresApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ProceduresGridProps {
  searchQuery: string
  selectedCategory: string // "all" | "preventivo" | ...
}

type Procedure = {
  id: string
  nome: string
  especialidade: string
  descricao?: string
  duracao?: number
  preco?: number
  ativo?: boolean
  // adicione campos se seu backend retornar mais
}

export function ProceduresGrid({ searchQuery, selectedCategory }: ProceduresGridProps) {
  const [items, setItems] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState<Procedure | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const pageSize = 12

  async function fetchPage(p = 1) {
    try {
      setLoading(true)

      // Se uma categoria foi escolhida, use o endpoint de categoria (sem paginação)
      if (selectedCategory && selectedCategory !== "all") {
        const resp = await proceduresApi.getBySpecialty(selectedCategory)
        const list: Procedure[] = Array.isArray(resp) ? resp : resp?.content ?? []
        setItems(list)
        setTotalPages(1)
        setPage(1)
        return
      }

      // Caso normal: página 0-based no backend
      const resp = await proceduresApi.getAll(p - 1, pageSize, searchQuery || "")
      const list: Procedure[] = Array.isArray(resp) ? resp : resp?.content ?? []
      setItems(list)
      setTotalPages(Array.isArray(resp) ? 1 : resp?.totalPages ?? 1)
      setPage(p)
    } catch (e: any) {
      console.error(e)
      toast({
        title: "Erro",
        description: e?.message || "Não foi possível carregar os procedimentos.",
        variant: "destructive",
      })
      setItems([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // primeira carga e quando filtros mudarem
    fetchPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory])

  const handleViewDetails = (proc: Procedure) => {
    setSelected(proc)
    setDetailsOpen(true)
  }

  const handleEdit = (id: string) => {
    router.push(`/procedimentos/${id}/editar`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este procedimento?")) return
    try {
      await proceduresApi.delete(id)
      toast({ title: "Excluído", description: "Procedimento removido com sucesso." })
      fetchPage(page)
    } catch (e: any) {
      toast({
        title: "Erro ao excluir",
        description: e?.message || "Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="dental-card p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-cyan-600" />
        <p className="text-gray-600">Carregando procedimentos...</p>
      </div>
    )
  }

  // Empty
  if ((items ?? []).length === 0) {
    return <div className="dental-card p-8 text-center text-gray-600">Nenhum procedimento encontrado.</div>
  }

  // Helpers de visual
  const categoryPill = (c?: string) => {
    switch ((c || "").toLowerCase()) {
      case "preventivo":
        return "bg-green-100 text-green-800"
      case "restaurador":
        return "bg-blue-100 text-blue-800"
      case "cirurgico":
        return "bg-red-100 text-red-800"
      case "ortodontia":
        return "bg-orange-100 text-orange-800"
      case "protese":
        return "bg-cyan-100 text-cyan-800"
      case "estetico":
        return "bg-pink-100 text-pink-800"
      case "periodontia":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(items ?? []).map((p) => (
          <div key={p.id} className="dental-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{p.nome}</h3>
                <Badge className={categoryPill(p.especialidade)}>{p.especialidade ?? "—"}</Badge>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewDetails(p)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(p.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(p.id)} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-3">{p.descricao || "—"}</p>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1 text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{p.duracao ?? "—"} min</span>
              </div>
              <div className="flex items-center space-x-1 text-green-600 font-semibold">
                <DollarSign className="h-4 w-4" />
                <span>{p.preco != null ? `R$ ${Number(p.preco).toFixed(2)}` : "—"}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={() => handleViewDetails(p)}>
                  Ver Detalhes
                </Button>
                <Button size="sm" className="dental-primary flex-1" onClick={() => handleEdit(p.id)}>
                  Editar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginação (se vier paginado do backend) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => fetchPage(page - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => fetchPage(page + 1)}>
            Próxima
          </Button>
        </div>
      )}

      <ProcedureDetailsModal procedure={selected} isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} />
    </>
  )
}
