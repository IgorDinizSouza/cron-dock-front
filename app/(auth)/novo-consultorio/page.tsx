"use client"

import type React from "react"
import { useState } from "react"
import { formatters, validators } from "@/lib/formatters"
import { toast } from "react-toastify"

const NovoConsultorioPage = () => {
  const [formData, setFormData] = useState({
    consultorio: {
      cnpj: "",
      telefone: "",
    },
    endereco: {
      cep: "",
    },
    responsavel: {
      cpf: "",
      telefone: "",
      cro: "",
    },
  })

  const handleInputChange = (section: "consultorio" | "endereco" | "responsavel", field: string, value: string) => {
    let formattedValue = value

    if (field === "cnpj") {
      formattedValue = formatters.cnpj(value)
    } else if (field === "telefone") {
      formattedValue = formatters.phone(value)
    } else if (field === "cep") {
      formattedValue = formatters.cep(value)
    } else if (field === "cpf") {
      formattedValue = formatters.cpf(value)
    } else if (field === "cro") {
      formattedValue = formatters.cro(value)
    }

    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: formattedValue,
      },
    }))
  }

  const validateForm = (): boolean => {
    if (!validators.cnpj(formData.consultorio.cnpj)) {
      toast({
        title: "Erro de Validação",
        description: "CNPJ inválido. Verifique os dados informados.",
        variant: "destructive",
      })
      return false
    }

    if (!validators.phone(formData.consultorio.telefone)) {
      toast({
        title: "Erro de Validação",
        description: "Telefone do consultório inválido.",
        variant: "destructive",
      })
      return false
    }

    if (!validators.cep(formData.endereco.cep)) {
      toast({
        title: "Erro de Validação",
        description: "CEP inválido. Deve conter 8 dígitos.",
        variant: "destructive",
      })
      return false
    }

    if (!validators.cpf(formData.responsavel.cpf)) {
      toast({
        title: "Erro de Validação",
        description: "CPF do responsável inválido.",
        variant: "destructive",
      })
      return false
    }

    if (!validators.phone(formData.responsavel.telefone)) {
      toast({
        title: "Erro de Validação",
        description: "Telefone do responsável inválido.",
        variant: "destructive",
      })
      return false
    }

    if (!formData.responsavel.cro.match(/^CRO\/[A-Z]{2}\s\d{1,5}$/)) {
      toast({
        title: "Erro de Validação",
        description: "CRO do responsável inválido. Use o formato CRO/XX 12345.",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Implementando lógica de envio do formulário
    try {
      // Aqui você pode adicionar a lógica para enviar os dados do formulário
      console.log("Formulário enviado:", formData)
    } catch (error) {
      toast({
        title: "Erro ao Enviar",
        description: "Ocorreu um erro ao enviar o formulário.",
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      {/* Implementando formulário aqui */}
      <form onSubmit={handleSubmit}>
        {/* Campos para consultório */}
        <div>
          <label htmlFor="cnpj">CNPJ:</label>
          <input
            type="text"
            id="cnpj"
            name="cnpj"
            value={formData.consultorio.cnpj}
            onChange={(e) => handleInputChange("consultorio", "cnpj", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="telefone">Telefone:</label>
          <input
            type="text"
            id="telefone"
            name="telefone"
            value={formData.consultorio.telefone}
            onChange={(e) => handleInputChange("consultorio", "telefone", e.target.value)}
          />
        </div>

        {/* Campos para endereço */}
        <div>
          <label htmlFor="cep">CEP:</label>
          <input
            type="text"
            id="cep"
            name="cep"
            value={formData.endereco.cep}
            onChange={(e) => handleInputChange("endereco", "cep", e.target.value)}
          />
        </div>

        {/* Campos para responsável */}
        <div>
          <label htmlFor="cpf">CPF:</label>
          <input
            type="text"
            id="cpf"
            name="cpf"
            value={formData.responsavel.cpf}
            onChange={(e) => handleInputChange("responsavel", "cpf", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="responsavelTelefone">Telefone:</label>
          <input
            type="text"
            id="responsavelTelefone"
            name="responsavelTelefone"
            value={formData.responsavel.telefone}
            onChange={(e) => handleInputChange("responsavel", "telefone", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="cro">CRO:</label>
          <input
            type="text"
            id="cro"
            name="cro"
            value={formData.responsavel.cro}
            onChange={(e) => handleInputChange("responsavel", "cro", e.target.value)}
          />
        </div>

        <button type="submit">Enviar</button>
      </form>
    </div>
  )
}

export default NovoConsultorioPage
