"use client"

import { useState } from "react"
import { BudgetList } from "@/components/orcamentos/budget-list"
import { Button } from "@/components/ui/button"
import { Plus, List } from "lucide-react"

export default function OrcamentosPage() {
  const [activeTab, setActiveTab] = useState<"list" | "create">("list")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orcamentos</h1>
          <p className="mt-1 text-gray-600">Crie e gerencie orcamentos de forma intuitiva</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === "list" ? "default" : "outline"} onClick={() => setActiveTab("list")}>
            <List className="w-4 h-4 mr-2" />
            Lista
          </Button>
          <Button variant={activeTab === "create" ? "default" : "outline"} onClick={() => setActiveTab("create")}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Orcamento
          </Button>
        </div>
      </div>

      {activeTab === "list" ? (
        <BudgetList />
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Criacao de orcamento removida desta versao.
        </div>
      )}
    </div>
  )
}