"use client"

import { useEffect, useState } from "react"
import { Plus, Search, Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Props {
  onSearch: (q: string) => void
  onFilter: (partial: any) => void
  onExport: () => void
  searchQuery: string
  activeFilters: any
  loading?: boolean
}

export function PatientsHeader({ onSearch, onFilter, onExport, searchQuery, activeFilters, loading }: Props) {
  const [value, setValue] = useState(searchQuery)

  // mantém controlado se trocar de fora
  useEffect(() => setValue(searchQuery), [searchQuery])

  // debounce: dispara onSearch 300ms após parar de digitar
  useEffect(() => {
    const id = setTimeout(() => onSearch(value.trim()), 300)
    return () => clearTimeout(id)
  }, [value, onSearch])

  const clear = () => setValue("")

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-600">Gerencie todos os pacientes da clínica</p>
        </div>
        <Link href="/pacientes/novo">
          <Button className="dental-primary">
            <Plus className="h-4 w-4 mr-2" />
            Novo Paciente
          </Button>
        </Link>
      </div>

      <div className="dental-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Digite nome ou CPF..."
                className="pl-10 pr-24 bg-white"
                disabled={loading}
              />
              {value && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={clear}
                  disabled={loading}
                  title="Limpar"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onExport} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
