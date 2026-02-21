"use client"

import { useState } from "react"
import { PatientsHeader } from "@/components/patients/patients-header"
import { PatientsTable } from "@/components/patients/patients-table"
import { useToast } from "@/hooks/use-toast"

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    status: "",
    ageRange: "",
    lastVisit: "",
    city: "",
  })
  const [patientsData, setPatientsData] = useState([])
  const { toast } = useToast()

  const handleExport = () => {
    if (patientsData.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar",
        variant: "destructive",
      })
      return
    }

    try {
      // Preparar dados para CSV
      const csvData = patientsData.map((patient) => ({
        Nome: patient.nome,
        CPF: patient.cpf,
        Telefone: patient.telefone,
        Email: patient.email,
        "Data Nascimento": new Date(patient.dataNascimento).toLocaleDateString("pt-BR"),
        Endereco: patient.endereco,
        Status: patient.status === "ativo" ? "Ativo" : "Inativo",
        "Histórico Médico": patient.historicoMedico || "",
        Alergias: patient.alergias || "",
        Medicamentos: patient.medicamentos || "",
        Observacoes: patient.observacoes || "",
      }))

      // Converter para CSV
      const headers = Object.keys(csvData[0])
      const csvContent = [
        headers.join(","),
        ...csvData.map((row) => headers.map((header) => `"${row[header] || ""}"`).join(",")),
      ].join("\n")

      // Download do arquivo
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `pacientes_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Sucesso",
        description: "Dados exportados com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível exportar os dados",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <PatientsHeader
        onSearch={setSearchQuery}
        onFilter={setFilters}
        onExport={handleExport}
        searchQuery={searchQuery}
        activeFilters={filters}
      />
      <PatientsTable searchQuery={searchQuery} filters={filters} onExportData={setPatientsData} />
    </div>
  )
}
