"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Download, RefreshCw } from "lucide-react"
import Link from "next/link"
import { dentistasApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface DentistasHeaderProps {
  onSearch: (term: string) => void
  onRefresh: () => void
  totalDentistas: number
}

export function DentistasHeader({ onSearch, onRefresh, totalDentistas }: DentistasHeaderProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchTerm)
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const dentistas = await dentistasApi.export()

      const csvContent = [
        ["Nome", "CRO", "Especialidades", "Telefone", "Email", "Status", "Data Cadastro"].join(","),
        ...dentistas.map((d) =>
          [
            d.nome,
            d.cro,
            d.especialidades.join("; "),
            d.telefone,
            d.email,
            d.ativo ? "Ativo" : "Inativo",
            new Date(d.createdAt).toLocaleDateString("pt-BR"),
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `dentistas_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Sucesso",
        description: "Relatório de dentistas exportado com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dentistas</h1>
          <p className="text-gray-600">Gerencie os dentistas do consultório ({totalDentistas} cadastrados)</p>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, CRO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </form>

          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exportando..." : "Exportar"}
          </Button>

          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>

          <Link href="/dentistas/novo">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Dentista
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
