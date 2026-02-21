export const formatters = {
  // Formatação de CPF: 000.000.000-00
  cpf: (value: string): string => {
    const numbers = value.replace(/\D/g, "").slice(0, 11)
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  },

  // Formatação de telefone: (00) 00000-0000
  phone: (value: string): string => {
    const numbers = value.replace(/\D/g, "").slice(0, 11)
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2")
    }
    return numbers.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2")
  },

  // Formatação de CNPJ: 00.000.000/0000-00
  cnpj: (value: string): string => {
    const numbers = value.replace(/\D/g, "").slice(0, 14)
    return numbers
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
  },

  // Formatação de CEP: 00000-000
  cep: (value: string): string => {
    const numbers = value.replace(/\D/g, "").slice(0, 8)
    return numbers.replace(/(\d{5})(\d{1,3})$/, "$1-$2")
  },

  // Formatação de CRO: CRO/XX 00000
  cro: (value: string): string => {
    const clean = value.replace(/[^A-Z0-9]/g, "").toUpperCase()
    if (clean.startsWith("CRO")) {
      const withoutCro = clean.slice(3)
      if (withoutCro.length >= 2) {
        const state = withoutCro.slice(0, 2)
        const number = withoutCro.slice(2).replace(/\D/g, "").slice(0, 5)
        return `CRO/${state}${number ? " " + number : ""}`
      }
      return `CRO/${withoutCro}`
    }
    return clean.length >= 2
      ? `CRO/${clean.slice(0, 2)}${clean.slice(2) ? " " + clean.slice(2).replace(/\D/g, "").slice(0, 5) : ""}`
      : `CRO/${clean}`
  },

  currency: (value: string | number): string => {
    // Remove tudo que não é dígito
    const numbers = String(value).replace(/\D/g, "")

    // Se não há números, retorna vazio
    if (!numbers) return ""

    // Converte para centavos (últimos 2 dígitos são decimais)
    const cents = Number.parseInt(numbers, 10)
    const reais = cents / 100

    // Formata como moeda brasileira
    return reais.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  },

  currencyInput: (value: string | number): string => {
    const numbers = String(value).replace(/\D/g, "")
    if (!numbers) return ""

    const cents = Number.parseInt(numbers, 10)
    const reais = cents / 100

    return reais.toFixed(2).replace(".", ",")
  },
}

export const validators = {
  // Validação de CPF
  cpf: (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, "")
    if (numbers.length !== 11) return false

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(numbers)) return false

    // Validação do primeiro dígito verificador
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += Number.parseInt(numbers[i]) * (10 - i)
    }
    let digit1 = 11 - (sum % 11)
    if (digit1 > 9) digit1 = 0

    // Validação do segundo dígito verificador
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += Number.parseInt(numbers[i]) * (11 - i)
    }
    let digit2 = 11 - (sum % 11)
    if (digit2 > 9) digit2 = 0

    return Number.parseInt(numbers[9]) === digit1 && Number.parseInt(numbers[10]) === digit2
  },

  // Validação de CNPJ
  cnpj: (cnpj: string): boolean => {
    const numbers = cnpj.replace(/\D/g, "")
    if (numbers.length !== 14) return false

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(numbers)) return false

    // Validação do primeiro dígito verificador
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += Number.parseInt(numbers[i]) * weights1[i]
    }
    const digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11)

    // Validação do segundo dígito verificador
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum = 0
    for (let i = 0; i < 13; i++) {
      sum += Number.parseInt(numbers[i]) * weights2[i]
    }
    const digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11)

    return Number.parseInt(numbers[12]) === digit1 && Number.parseInt(numbers[13]) === digit2
  },

  // Validação de telefone
  phone: (phone: string): boolean => {
    const numbers = phone.replace(/\D/g, "")
    return numbers.length >= 10 && numbers.length <= 11
  },

  // Validação de CEP
  cep: (cep: string): boolean => {
    const numbers = cep.replace(/\D/g, "")
    return numbers.length === 8
  },

  currency: (value: string | number): boolean => {
    const numbers = String(value).replace(/\D/g, "")
    if (!numbers) return false

    const cents = Number.parseInt(numbers, 10)
    return cents > 0 && cents <= 999999999 // Máximo R$ 9.999.999,99
  },
}

export const parseCurrency = (formattedValue: string): number => {
  const numbers = formattedValue.replace(/\D/g, "")
  if (!numbers) return 0

  const cents = Number.parseInt(numbers, 10)
  return cents / 100
}
