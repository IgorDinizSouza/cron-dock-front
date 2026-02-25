"use client"

import { X } from "lucide-react"
import { SimpleDescricaoListPage } from "@/components/configuracoes/simple-descricao-crud"
import { motivoNoShowApi } from "@/lib/motivo-no-show"

export default function MotivosNoShowPage() {
  return (
    <SimpleDescricaoListPage
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

