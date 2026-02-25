"use client"

import { ClipboardList } from "lucide-react"
import { SimpleDescricaoListPage } from "@/components/configuracoes/simple-descricao-crud"
import { motivoOcorrenciaApi } from "@/lib/motivo-ocorrencia"

export default function MotivosOcorrenciaPage() {
  return (
    <SimpleDescricaoListPage
      config={{
        titulo: "Motivo de ocorrência",
        tituloPlural: "Motivos de ocorrência",
        descricaoListagem: "Cadastro de motivos de ocorrência",
        rotaBase: "/configuracoes/motivos/ocorrencias",
        cardTitle: "Dados do motivo de ocorrência",
        api: motivoOcorrenciaApi,
        icon: ClipboardList,
        descricaoMax: 100,
      }}
    />
  )
}

