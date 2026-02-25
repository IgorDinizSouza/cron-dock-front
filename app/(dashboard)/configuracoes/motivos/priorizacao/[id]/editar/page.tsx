"use client"

import { Star } from "lucide-react"
import { SimpleDescricaoEditPage } from "@/components/configuracoes/simple-descricao-crud"
import { motivoPriorizacaoApi } from "@/lib/motivo-priorizacao"

export default function EditarMotivoPriorizacaoPage() {
  return (
    <SimpleDescricaoEditPage
      config={{
        titulo: "Motivo de priorização",
        tituloPlural: "Motivos de priorização",
        descricaoListagem: "Cadastro de motivos de priorização",
        rotaBase: "/configuracoes/motivos/priorizacao",
        cardTitle: "Dados do motivo de priorização",
        api: motivoPriorizacaoApi,
        icon: Star,
        descricaoMax: 100,
      }}
    />
  )
}

