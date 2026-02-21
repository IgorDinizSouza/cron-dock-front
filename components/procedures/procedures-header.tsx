"use client"

import { Plus, Search, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useState } from "react"

interface Props {
  onSearch: (term: string) => void
  onCategoryChange: (category: string) => void
}

export function ProceduresHeader({ onSearch, onCategoryChange }: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [term, setTerm] = useState("")

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Procedimentos</h1>
          <p className="text-gray-600">Gerencie todos os procedimentos oferecidos pela clínica</p>
        </div>
        <Link href="/procedimentos/novo">
          <Button className="dental-primary">
            <Plus className="h-4 w-4 mr-2" />
            Novo Procedimento
          </Button>
        </Link>
      </div>

      <div className="dental-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar procedimentos..."
                className="pl-10 bg-white"
                value={term}
                onChange={(e) => {
                  setTerm(e.target.value)
                  onSearch(e.target.value)
                }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select defaultValue="all" onValueChange={onCategoryChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Especialidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Especilidades</SelectItem>
                <SelectItem value="preventivo">Preventivo</SelectItem>
                <SelectItem value="restaurador">Restaurador</SelectItem>
                <SelectItem value="cirurgico">Cirúrgico</SelectItem>
                <SelectItem value="ortodontia">Ortodontia</SelectItem>
                <SelectItem value="protese">Prótese</SelectItem>
                <SelectItem value="estetico">Estético</SelectItem>
                <SelectItem value="periodontia">Periodontia</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border border-gray-200 rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
