"use client"

import { ClipboardList } from "lucide-react"
import { SimpleDescricaoCreatePage } from "@/components/configuracoes/simple-descricao-crud"
import { motivoOcorrenciaApi } from "@/lib/motivo-ocorrencia"

export default function NovoMotivoOcorrenciaPage() {
  return (
    <SimpleDescricaoCreatePage
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

