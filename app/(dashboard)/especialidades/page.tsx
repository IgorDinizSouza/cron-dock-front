"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, Users, FileText } from "lucide-react"
import { especialidadesApi } from "@/lib/api"
import { useNotification } from "@/contexts/notification-context"

interface Especialidade {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
  totalProcedimentos: number
  totalDentistas: number
  criadoEm: string
}

export default function EspecialidadesPage() {
  const router = useRouter()
  const { showSuccess, showError } = useNotification()

  const [especialidades, setEspecialidades] = useState<Especialidade[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchEspecialidades = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true)
      const response = await especialidadesApi.getAll(page - 1, 12, searchTerm)
      const content = response?.content ?? []
      setEspecialidades(content)
      setTotalPages(response?.totalPages ?? 1)
    } catch (error) {
      showError("Erro", "Não foi possível carregar as especialidades")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEspecialidades(currentPage, search)
  }, [currentPage, search])

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir a especialidade "${nome}"?`)) return

    try {
      await especialidadesApi.delete(id)
      showSuccess("Sucesso", "Especialidade excluída com sucesso")
      fetchEspecialidades(currentPage, search)
    } catch (error) {
      showError("Erro", "Não foi possível excluir a especialidade")
    }
  }

  const filteredEspecialidades = especialidades.filter((esp) => esp.nome.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Especialidades</h1>
          <p className="text-gray-600">Gerencie as especialidades odontológicas do consultório</p>
        </div>
        <Button onClick={() => router.push("/especialidades/novo")} className="dental-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nova Especialidade
        </Button>
      </div>

      {/* Filtros */}
      <Card className="dental-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar especialidades..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Especialidades */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="dental-card animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEspecialidades.length === 0 ? (
        <Card className="dental-card">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma especialidade encontrada</h3>
            <p className="text-gray-600 mb-4">
              {search ? "Tente ajustar os filtros de busca" : "Comece cadastrando sua primeira especialidade"}
            </p>
            <Button onClick={() => router.push("/especialidades/novo")} className="dental-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nova Especialidade
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEspecialidades.map((especialidade) => (
            <Card key={especialidade.id} className="dental-card hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-serif text-gray-900 mb-1">{especialidade.nome}</CardTitle>
                    <Badge
                      variant={especialidade.ativo ? "default" : "secondary"}
                      className={especialidade.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {especialidade.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/especialidades/${especialidade.id}/editar`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(especialidade.id, especialidade.nome)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {especialidade.descricao && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{especialidade.descricao}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{especialidade.totalProcedimentos} procedimentos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{especialidade.totalDentistas} dentistas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  )
}
