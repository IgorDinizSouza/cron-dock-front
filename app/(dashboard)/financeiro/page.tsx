"use client"

import { useState } from "react"
import { FinancialDashboard } from "@/components/financeiro/financial-dashboard"
import { CashFlow } from "@/components/financeiro/cash-flow"
import { Button } from "@/components/ui/button"
import { BarChart3, DollarSign } from "lucide-react"

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "cashflow">("dashboard")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600 mt-1">Controle completo das finanças do consultório</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === "dashboard" ? "default" : "outline"} onClick={() => setActiveTab("dashboard")}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button variant={activeTab === "cashflow" ? "default" : "outline"} onClick={() => setActiveTab("cashflow")}>
            <DollarSign className="w-4 h-4 mr-2" />
            Fluxo de Caixa
          </Button>
        </div>
      </div>

      {activeTab === "dashboard" ? <FinancialDashboard /> : <CashFlow />}
    </div>
  )
}
