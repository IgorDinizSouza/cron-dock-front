"use client"

import { Ban } from "lucide-react"
import { SimpleDescricaoListPage } from "@/components/configuracoes/simple-descricao-crud"
import { motivoCancelamentoApi } from "@/lib/motivo-cancelamento"

export default function MotivosCancelamentoPage() {
  return (
    <SimpleDescricaoListPage
      config={{
        titulo: "Motivo de cancelamento",
        tituloPlural: "Motivos de cancelamento",
        descricaoListagem: "Cadastro de motivos de cancelamento",
        rotaBase: "/configuracoes/motivos/cancelamento",
        cardTitle: "Dados do motivo de cancelamento",
        api: motivoCancelamentoApi,
        icon: Ban,
        descricaoMax: 100,
      }}
    />
  )
}

