"use client"

import { useEffect, useMemo, useState } from "react"
import { MoreHorizontal, Calendar, Edit, Trash2, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { patientsApi } from "@/lib/api"
import { useRouter } from "next/navigation"

interface Patient {
  id: string
  nome: string
  cpf: string
  telefone: string
  email: string
  dataNascimento: string
  endereco: string
  historicoMedico?: string
  alergias?: string
  medicamentos?: string
  observacoes?: string
  status?: string
  ultimaConsulta?: string
  proximaConsulta?: string
}

interface PatientsTableProps {
  searchQuery: string
  filters: {
    status?: string
    ageRange?: string
    lastVisit?: string
    city?: string
  }
  onExportData: (data: Patient[]) => void
}

const PAGE_SIZE = 10

export function PatientsTable({ searchQuery, filters, onExportData }: PatientsTableProps) {
  const router = useRouter()
  const [all, setAll] = useState<Patient[]>([])
  const [pageItems, setPageItems] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPatients, setTotalPatients] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  // ------- Busca base (lista tudo ou busca) -------
  async function fetchBase() {
    try {
      setLoading(true)
      const q = (searchQuery || "").trim()
      const data: Patient[] = q ? await patientsApi.search(q) : await patientsApi.getAll()
      setAll(Array.isArray(data) ? data : [])
      setCurrentPage(1)
    } catch (e) {
      console.error(e)
      toast({ title: "Erro", description: "Não foi possível carregar os pacientes", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBase()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // ------- Filtros no cliente -------
  const filtered = useMemo(() => {
    const statusFilter = (p: Patient) => {
      const wanted = (filters.status || "").toLowerCase()
      if (!wanted) return true
      return (p.status || "").toLowerCase() === wanted
    }

    const ageFromBirth = (birth?: string) => {
      if (!birth) return undefined
      const d = new Date(birth)
      if (isNaN(d.getTime())) return undefined
      const today = new Date()
      let age = today.getFullYear() - d.getFullYear()
      const md = today.getMonth() - d.getMonth()
      if (md < 0 || (md === 0 && today.getDate() < d.getDate())) age--
      return age
    }

    const ageFilter = (p: Patient) => {
      const r = (filters.ageRange || "").trim()
      if (!r) return true
      const age = ageFromBirth(p.dataNascimento)
      if (age == null) return false
      if (r.endsWith("+")) {
        const min = parseInt(r.replace("+", ""), 10)
        return age >= min
      }
      const [minS, maxS] = r.split("-")
      const min = parseInt(minS || "0", 10)
      const max = parseInt(maxS || "999", 10)
      return age >= min && age <= max
    }

    const cityFilter = (p: Patient) => {
      const city = (filters.city || "").trim().toLowerCase()
      if (!city) return true
      return (p.endereco || "").toLowerCase().includes(city)
    }

    const lastVisitFilter = (p: Patient) => {
      const lv = (filters.lastVisit || "").trim()
      if (!lv) return true
      if (!p.ultimaConsulta) return false
      const d = new Date(p.ultimaConsulta)
      if (isNaN(d.getTime())) return false
      const match = lv.match(/^(\d+)\s*d$/i) // 7d, 30d...
      if (!match) return true
      const days = parseInt(match[1], 10)
      const since = new Date()
      since.setDate(since.getDate() - days)
      return d >= since
    }

    return all.filter((p) => statusFilter(p) && ageFilter(p) && cityFilter(p) && lastVisitFilter(p))
  }, [all, filters])

  // ------- Paginação no cliente -------
  useEffect(() => {
    const total = filtered.length
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const safePage = Math.min(Math.max(1, currentPage), pages)
    const start = (safePage - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE

    setTotalPatients(total)
    setTotalPages(pages)
    setCurrentPage(safePage)
    setPageItems(filtered.slice(start, end))
    onExportData(filtered)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, currentPage])

  // ------- Ações -------
  const handleDeletePatient = async (patientId: string) => {
    if (!confirm("Tem certeza que deseja excluir este paciente?")) return
    try {
      await patientsApi.delete(patientId)
      toast({ title: "Sucesso", description: "Paciente excluído com sucesso" })
      fetchBase()
    } catch {
      toast({ title: "Erro", description: "Não foi possível excluir o paciente", variant: "destructive" })
    }
  }

  const formatDate = (date?: string) => (!date ? "Não informado" : new Date(date).toLocaleDateString("pt-BR"))

  const ageLabel = (birth?: string) => {
    const now = new Date()
    const d = birth ? new Date(birth) : undefined
    if (!d || isNaN(d.getTime())) return "—"
    let a = now.getFullYear() - d.getFullYear()
    const md = now.getMonth() - d.getMonth()
    if (md < 0 || (md === 0 && now.getDate() < d.getDate())) a--
    return `${a} anos`
  }

  if (loading) {
    return (
      <div className="dental-card p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-600" />
        <p className="text-gray-600">Carregando pacientes...</p>
      </div>
    )
  }

  return (
    <>
      <div className="dental-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Idade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Consulta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhum paciente encontrado
                  </td>
                </tr>
              ) : (
                pageItems.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center">
                          <span className="text-cyan-600 font-medium text-sm">
                            {p.nome.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{p.nome}</div>
                          <div className="text-sm text-gray-500">{p.cpf}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{p.telefone || "—"}</div>
                      <div className="text-sm text-gray-500">{p.email || "—"}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ageLabel(p.dataNascimento)}</td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(p.ultimaConsulta)}</td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (p.status || "").toLowerCase() === "ativo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {p.status ? (p.status.toLowerCase() === "ativo" ? "Ativo" : "Inativo") : "—"}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* FICHA DO PACIENTE (acesso rápido) */}
                          <DropdownMenuItem onClick={() => router.push(`/pacientes/${p.id}/ficha?nome=${encodeURIComponent(p.nome)}`)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Ficha do Paciente
                          </DropdownMenuItem>

                          {/* EDITAR */}
                          <DropdownMenuItem onClick={() => router.push(`/pacientes/editar/${p.id}`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>

                          {/* AGENDAR CONSULTA */}
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/agendamentos/novo?pacienteId=${p.id}&nome=${encodeURIComponent(p.nome)}`)
                            }
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Agendar Consulta
                          </DropdownMenuItem>

                          {/* EXCLUIR */}
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeletePatient(p.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="bg-white px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando{" "}
              <span className="font-medium">{pageItems.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}</span> a{" "}
              <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, totalPatients)}</span> de{" "}
              <span className="font-medium">{totalPatients}</span> pacientes
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Próximo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
