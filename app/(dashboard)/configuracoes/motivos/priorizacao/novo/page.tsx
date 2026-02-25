"use client"

import { Star } from "lucide-react"
import { SimpleDescricaoCreatePage } from "@/components/configuracoes/simple-descricao-crud"
import { motivoPriorizacaoApi } from "@/lib/motivo-priorizacao"

export default function NovoMotivoPriorizacaoPage() {
  return (
    <SimpleDescricaoCreatePage
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

