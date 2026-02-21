"use client"

import { useState } from "react"
import { ClinicSettings } from "@/components/configuracoes/clinic-settings"
import { SystemSettings } from "@/components/configuracoes/system-settings"
import { Button } from "@/components/ui/button"
import { Building2, Settings } from "lucide-react"

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<"clinic" | "system">("clinic")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-1">Personalize o sistema de acordo com suas necessidades</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === "clinic" ? "default" : "outline"} onClick={() => setActiveTab("clinic")}>
            <Building2 className="w-4 h-4 mr-2" />
            Clínica
          </Button>
          <Button variant={activeTab === "system" ? "default" : "outline"} onClick={() => setActiveTab("system")}>
            <Settings className="w-4 h-4 mr-2" />
            Sistema
          </Button>
        </div>
      </div>

      {activeTab === "clinic" ? <ClinicSettings /> : <SystemSettings />}
    </div>
  )
}
