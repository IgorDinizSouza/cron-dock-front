export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean
  message?: string
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  firstError?: string
}

export class Validator {
  static validate(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string> = {}

    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field]
      const error = this.validateField(value, rule, field)
      if (error) {
        errors[field] = error
      }
    }

    const isValid = Object.keys(errors).length === 0
    const firstError = Object.values(errors)[0]

    return { isValid, errors, firstError }
  }

  private static validateField(value: any, rule: ValidationRule, fieldName: string): string | null {
    // Required validation
    if (rule.required && (!value || (typeof value === "string" && !value.trim()))) {
      return rule.message || `${fieldName} é obrigatório`
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === "string" && !value.trim())) {
      return null
    }

    // String validations
    if (typeof value === "string") {
      // Min length
      if (rule.minLength && value.length < rule.minLength) {
        return rule.message || `${fieldName} deve ter pelo menos ${rule.minLength} caracteres`
      }

      // Max length
      if (rule.maxLength && value.length > rule.maxLength) {
        return rule.message || `${fieldName} deve ter no máximo ${rule.maxLength} caracteres`
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message || `${fieldName} tem formato inválido`
      }
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      return rule.message || `${fieldName} é inválido`
    }

    return null
  }
}

export const ValidationSchemas = {
  user: {
    nome: {
      required: true,
      minLength: 2,
      maxLength: 100,
      message: "Nome deve ter entre 2 e 100 caracteres",
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Email deve ter um formato válido",
    },
    senha: {
      required: true,
      minLength: 6,
      message: "Senha deve ter pelo menos 6 caracteres",
    },
    confirmarSenha: {
      required: true,
      custom: (value: string, data?: Record<string, any>) => {
        return data?.senha === value
      },
      message: "Senhas não coincidem",
    },
  },

  patient: {
    nome: {
      required: true,
      minLength: 3,
      message: "Nome deve ter pelo menos 3 caracteres",
    },
    cpf: {
      required: true,
      custom: (value: string) => {
        const numbers = value.replace(/\D/g, "")
        if (numbers.length !== 11) return false
        if (/^(\d)\1{10}$/.test(numbers)) return false

        // Validação dos dígitos verificadores
        let sum = 0
        for (let i = 0; i < 9; i++) {
          sum += Number.parseInt(numbers[i]) * (10 - i)
        }
        let digit1 = 11 - (sum % 11)
        if (digit1 > 9) digit1 = 0

        sum = 0
        for (let i = 0; i < 10; i++) {
          sum += Number.parseInt(numbers[i]) * (11 - i)
        }
        let digit2 = 11 - (sum % 11)
        if (digit2 > 9) digit2 = 0

        return Number.parseInt(numbers[9]) === digit1 && Number.parseInt(numbers[10]) === digit2
      },
      message: "CPF inválido",
    },
    telefone: {
      required: true,
      custom: (value: string) => {
        const numbers = value.replace(/\D/g, "")
        return numbers.length >= 10 && numbers.length <= 11
      },
      message: "Telefone deve ter 10 ou 11 dígitos",
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Email deve ter um formato válido",
    },
    dataNascimento: {
      required: true,
      custom: (value: string) => {
        const date = new Date(value)
        const today = new Date()
        return !isNaN(date.getTime()) && date <= today
      },
      message: "Data de nascimento inválida ou futura",
    },
  },

  dentist: {
    nome: { required: true, minLength: 2 },
    cro: {
      required: true,
      pattern: /^CRO\/[A-Z]{2}\s\d{1,5}$/,
      message: "CRO deve seguir o formato CRO/XX 12345",
    },
    telefone: {
      required: true,
      custom: (value: string) => {
        const numbers = value.replace(/\D/g, "")
        return numbers.length >= 10 && numbers.length <= 11
      },
      message: "Telefone inválido",
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Email inválido",
    },
  },

  procedure: {
    nome: { required: true, minLength: 2 },
    especialidade: { required: true },
    descricao: { required: true, minLength: 10 },
    duracao: {
      required: true,
      custom: (value: string | number) => Number(value) > 0,
      message: "Duração deve ser maior que zero",
    },
    preco: {
      required: true,
      custom: (value: string | number) => Number(value) > 0,
      message: "Preço deve ser maior que zero",
    },
  },
}

export const validateWithToast = (
  data: Record<string, any>,
  schema: ValidationSchema,
  toast: (options: { title: string; description: string; variant?: "destructive" }) => void,
): boolean => {
  const result = Validator.validate(data, schema)

  if (!result.isValid && result.firstError) {
    toast({
      title: "Erro de Validação",
      description: result.firstError,
      variant: "destructive",
    })
  }

  return result.isValid
}
