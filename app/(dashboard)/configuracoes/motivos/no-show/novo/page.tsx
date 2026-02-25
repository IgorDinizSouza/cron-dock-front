"use client"

import { X } from "lucide-react"
import { SimpleDescricaoCreatePage } from "@/components/configuracoes/simple-descricao-crud"
import { motivoNoShowApi } from "@/lib/motivo-no-show"

export default function NovoMotivoNoShowPage() {
  return (
    <SimpleDescricaoCreatePage
      config={{
        titulo: "Motivo de no show",
        tituloPlural: "Motivos de no show",
        descricaoListagem: "Cadastro de motivos de no show",
        rotaBase: "/configuracoes/motivos/no-show",
        cardTitle: "Dados do motivo de no show",
        api: motivoNoShowApi,
        icon: X,
        descricaoMax: 100,
      }}
    />
  )
}

