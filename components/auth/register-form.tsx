"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL, authApi } from "@/lib/api"
import { persistAuth } from "@/lib/auth"
import { Loader2, CreditCard, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { asaasApi } from "@/lib/asaas-api"

type Step = "dados" | "pagamento" | "confirmacao"

const UFs = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
]

// --------- Máscaras ----------
const formatCEP = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}
const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 10) {
    return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, (_m, a, b, c) =>
      [a && `(${a}`, b && `) ${b}`, c && `-${c}`].filter(Boolean).join(""),
    )
  }
  return d.replace(/(\d{0,2})(\d{0,5})(\d{0,4})/, (_m, a, b, c) =>
    [a && `(${a}`, b && `) ${b}`, c && `-${c}`].filter(Boolean).join(""),
  )
}
const formatCpfCnpj = (v: string) => {
  const d = v.replace(/\D/g, "")
  if (d.length <= 11) {
    return d.slice(0, 11).replace(
      /(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/,
      (_m, a, b, c, e) => [a, b && `.${b}`, c && `.${c}`, e && `-${e}`].filter(Boolean).join(""),
    )
  }
  return d.slice(0, 14).replace(
    /(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})/,
    (_m, a, b, c, d4, e) => [a, b && `.${b}`, c && `.${c}`, d4 && `/${d4}`, e && `-${e}`].filter(Boolean).join(""),
  )
}
// -----------------------------

type Office = {
  nome: string; cnpj: string; telefone: string; cep: string; estado: string;
  cidade: string; bairro: string; rua: string; numero: string; complemento: string;
}
type User = { nome: string; email: string; senha: string; perfil: "ADMIN" }

type FieldErrors = {
  office?: Partial<Record<keyof Office, string>>;
  user?: Partial<Record<keyof User, string>>;
}

export function RegisterForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>("dados")
  const [paymentData, setPaymentData] = useState({ paymentId: "", status: "pending", qrCode: "", pixCode: "" })

  // CONSULTÓRIO
  const [office, setOffice] = useState<Office>({
    nome: "", cnpj: "", telefone: "", cep: "", estado: "", cidade: "", bairro: "", rua: "", numero: "", complemento: "",
  })

  // USUÁRIO (ADMIN INICIAL)
  const [user, setUser] = useState<User>({ nome: "", email: "", senha: "", perfil: "ADMIN" })

  const [errors, setErrors] = useState<FieldErrors>({ office: {}, user: {} })
  const inputErrorClass = "border-red-500 focus-visible:ring-red-500"

  // ----------------- handlers de input -----------------
  const handleOffice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === "cep") setOffice((p) => ({ ...p, cep: formatCEP(value) }))
    else if (name === "telefone") setOffice((p) => ({ ...p, telefone: formatPhone(value) }))
    else if (name === "cnpj") setOffice((p) => ({ ...p, cnpj: formatCpfCnpj(value) }))
    else setOffice((p) => ({ ...p, [name]: value }))
  }
  const handleUser = (e: React.ChangeEvent<HTMLInputElement>) =>
    setUser((p) => ({ ...p, [e.target.name]: e.target.value }))

  // ----------------- validações -----------------
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const BASE = API_BASE_URL
      if (!BASE) return false
      const path = "/auth/check-email"
      const urlGet = `${BASE}${path}?email=${encodeURIComponent(email)}`
      const urlPost = `${BASE}${path}`
      let resp = await fetch(urlGet, { method: "GET" })
      if (resp.ok) {
        const data = await resp.json().catch(() => ({}))
        return Boolean(data?.exists)
      }
      if (resp.status === 404) {
        resp = await fetch(urlPost, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        })
        if (resp.ok) {
          const data = await resp.json().catch(() => ({}))
          return Boolean(data?.exists)
        }
      }
      return false
    } catch {
      return false
    }
  }

  const validateField = async (group: "office" | "user", key: string): Promise<string | undefined> => {
    const o = office, u = user
    const val = (group === "office" ? (o as any)[key] : (u as any)[key])?.toString().trim() ?? ""

    // OFFICE
    if (group === "office") {
      if (key === "nome" && !val) return "Informe o nome do consultório."
      if (key === "cnpj") {
        const digits = val.replace(/\D/g, "")
        if (!(digits.length === 11 || digits.length === 14)) return "Informe um CPF (11) ou CNPJ (14) válido."
      }
      if (key === "telefone") {
        const d = val.replace(/\D/g, "")
        if (d.length < 10 || d.length > 11) return "Telefone inválido. Deve ter 10 ou 11 dígitos."
      }
      if (key === "cep" && val) {
        const d = val.replace(/\D/g, "")
        if (d.length !== 8) return "CEP inválido. Deve ter 8 dígitos."
      }
      if (key === "estado" && val && !UFs.includes(val)) return "UF inválida."
      // outros campos do endereço são opcionais
    }

    // USER
    if (group === "user") {
      if (key === "nome" && !val) return "Informe o nome do usuário."
      if (key === "email") {
        if (!emailRegex.test(val)) return "E-mail inválido."
        const exists = await checkEmailExists(val)
        if (exists) return "Este e-mail já está cadastrado."
      }
      if (key === "senha") {
        if (val.length < 6) return "A senha deve ter pelo menos 6 caracteres."
      }
    }

    return undefined
  }

  const validateAll = async (): Promise<boolean> => {
    const next: FieldErrors = { office: {}, user: {} }

    // obrigatórios do consultório
    next.office!.nome = await validateField("office", "nome")
    next.office!.cnpj = await validateField("office", "cnpj")
    next.office!.telefone = await validateField("office", "telefone")
    // opcionais com regra
    next.office!.cep = await validateField("office", "cep")
    next.office!.estado = await validateField("office", "estado")

    // usuário
    next.user!.nome = await validateField("user", "nome")
    next.user!.email = await validateField("user", "email")
    next.user!.senha = await validateField("user", "senha")

    // remove undefined
    for (const g of ["office","user"] as const) {
      for (const k of Object.keys(next[g]!) as (keyof typeof next[typeof g])[]) {
        if ((next[g] as any)[k] === undefined) delete (next[g] as any)[k]
      }
    }

    setErrors(next)
    const firstError = Object.values(next.office!).concat(Object.values(next.user!)).find(Boolean) as string | undefined
    if (firstError) {
      toast({ title: "Validação", description: firstError, variant: "destructive" })
      return false
    }
    return true
  }

  const blurAndToast = async (group: "office" | "user", key: keyof Office | keyof User) => {
    const msg = await validateField(group, key as string)
    setErrors((prev) => ({
      ...prev,
      [group]: { ...(prev[group] || {}), [key]: msg },
    }))
    if (msg) toast({ title: "Validação", description: msg, variant: "destructive" })
  }

  // ----------------- pagamento / submit -----------------
  const processPayment = async () => {
    const isValid = await validateAll()
    if (!isValid) return

    setLoading(true)
    try {
      const payment = await asaasApi.createPayment({
        customer: { name: user.nome, email: user.email, cpfCnpj: office.cnpj.replace(/\D/g, "") },
        billingType: "PIX",
        value: 100.0,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        description: "Ativação do sistema OdontoCareSys",
      })

      if (payment.success) {
        setPaymentData({
          paymentId: payment.data.id, status: payment.data.status, qrCode: payment.data.qrCode, pixCode: payment.data.pixCode,
        })
        setCurrentStep("pagamento")
        toast({ title: "Pagamento gerado", description: "QR Code PIX gerado com sucesso. Efetue o pagamento para continuar." })
      } else {
        throw new Error(payment.message || "Erro ao processar pagamento")
      }
    } catch (err: any) {
      toast({
        title: "Erro no pagamento",
        description: err?.message || "Não foi possível processar o pagamento. Verifique os dados e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    try {
      const result = await asaasApi.checkPayment(paymentData.paymentId)
      if (result.success && result.data.status === "RECEIVED") {
        setPaymentData((prev) => ({ ...prev, status: "RECEIVED" }))
        setCurrentStep("confirmacao")
        await completeRegistration()
      }
    } catch (err) {
      console.error("Erro ao verificar pagamento:", err)
    }
  }

  const completeRegistration = async () => {
    try {
      const resp: any = await authApi.registerOfficeAndAdmin({
        nome: office.nome,
        cnpj: office.cnpj.replace(/\D/g, ""),
        telefone: office.telefone.replace(/\D/g, ""),
        cep: office.cep.replace(/\D/g, ""),
        estado: office.estado,
        cidade: office.cidade,
        bairro: office.bairro,
        rua: office.rua,
        numero: office.numero,
        complemento: office.complemento,
        adminNome: user.nome,
        adminEmail: user.email,
        adminSenha: user.senha,
        paymentId: paymentData.paymentId,
      })

      const token = resp?.token
      const consultorioId = resp?.consultorioId
      if (!token) throw new Error("Token não retornado pelo servidor.")

      persistAuth(token, { consultorioId })
      toast({ title: "Bem-vindo!", description: "Conta criada com sucesso." })
      setTimeout(() => router.replace("/"), 2000)
    } catch (err: any) {
      toast({ title: "Erro no cadastro", description: err?.message || "Não foi possível criar a conta.", variant: "destructive" })
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep === "dados") await processPayment()
  }

  // ----------------- render -----------------
  const renderStepContent = () => {
    switch (currentStep) {
      case "dados":
        return (
          <form onSubmit={onSubmit} className="space-y-6">
            {/* CONSULTÓRIO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <h3 className="font-semibold text-gray-900">Dados do Consultório</h3>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="nome">Nome do Consultório *</Label>
                <Input
                  id="nome" name="nome" value={office.nome} onChange={handleOffice}
                  onBlur={() => blurAndToast("office","nome")}
                  required className={errors.office?.nome ? inputErrorClass : ""}
                  aria-invalid={!!errors.office?.nome}
                />
                {errors.office?.nome && <p className="text-xs text-red-600 mt-1">{errors.office?.nome}</p>}
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ/CPF *</Label>
                <Input
                  id="cnpj" name="cnpj" inputMode="numeric" value={office.cnpj} onChange={handleOffice}
                  onBlur={() => blurAndToast("office","cnpj")}
                  placeholder="00.000.000/0000-00 ou 000.000.000-00" required
                  className={errors.office?.cnpj ? inputErrorClass : ""} aria-invalid={!!errors.office?.cnpj}
                />
                {errors.office?.cnpj && <p className="text-xs text-red-600 mt-1">{errors.office?.cnpj}</p>}
              </div>

              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone" name="telefone" inputMode="numeric" value={office.telefone} onChange={handleOffice}
                  onBlur={() => blurAndToast("office","telefone")}
                  placeholder="(00) 00000-0000" required
                  className={errors.office?.telefone ? inputErrorClass : ""} aria-invalid={!!errors.office?.telefone}
                />
                {errors.office?.telefone && <p className="text-xs text-red-600 mt-1">{errors.office?.telefone}</p>}
              </div>

              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep" name="cep" inputMode="numeric" value={office.cep} onChange={handleOffice}
                  onBlur={() => blurAndToast("office","cep")}
                  placeholder="00000-000"
                  className={errors.office?.cep ? inputErrorClass : ""} aria-invalid={!!errors.office?.cep}
                />
                {errors.office?.cep && <p className="text-xs text-red-600 mt-1">{errors.office?.cep}</p>}
              </div>

              <div>
                <Label htmlFor="estado">Estado (UF)</Label>
                <Select
                  value={office.estado}
                  onValueChange={(v) => { setOffice((p) => ({ ...p, estado: v })); blurAndToast("office","estado") }}
                >
                  <SelectTrigger className={errors.office?.estado ? inputErrorClass : ""} aria-invalid={!!errors.office?.estado}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {UFs.map((uf) => (<SelectItem key={uf} value={uf}>{uf}</SelectItem>))}
                  </SelectContent>
                </Select>
                {errors.office?.estado && <p className="text-xs text-red-600 mt-1">{errors.office?.estado}</p>}
              </div>

              <div className="md:col-span-1">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" name="cidade" value={office.cidade} onChange={handleOffice} placeholder="Cidade" />
              </div>

              <div className="md:col-span-1">
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" name="bairro" value={office.bairro} onChange={handleOffice} placeholder="Bairro" />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="rua">Rua / Logradouro</Label>
                <Input id="rua" name="rua" value={office.rua} onChange={handleOffice} placeholder="Rua Exemplo" />
              </div>

              <div>
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" name="numero" value={office.numero} onChange={handleOffice} placeholder="Nº" />
              </div>

              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento" name="complemento" value={office.complemento} onChange={handleOffice}
                  placeholder="Sala, bloco, etc."
                />
              </div>
            </div>

            {/* USUÁRIO ADMIN */}
            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <h3 className="font-semibold text-gray-900">Dados do Usuário (Admin)</h3>
              </div>

              <div>
                <Label htmlFor="nomeUser">Nome *</Label>
                <Input
                  id="nomeUser" name="nome" value={user.nome} onChange={handleUser}
                  onBlur={() => blurAndToast("user","nome")}
                  required className={errors.user?.nome ? inputErrorClass : ""} aria-invalid={!!errors.user?.nome}
                />
                {errors.user?.nome && <p className="text-xs text-red-600 mt-1">{errors.user?.nome}</p>}
              </div>

              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email" name="email" type="email" value={user.email} onChange={handleUser}
                  onBlur={() => blurAndToast("user","email")}
                  required className={errors.user?.email ? inputErrorClass : ""} aria-invalid={!!errors.user?.email}
                />
                {errors.user?.email && <p className="text-xs text-red-600 mt-1">{errors.user?.email}</p>}
              </div>

              <div>
                <Label htmlFor="senha">Senha *</Label>
                <Input
                  id="senha" name="senha" type="password" value={user.senha} onChange={handleUser}
                  onBlur={() => blurAndToast("user","senha")}
                  required className={errors.user?.senha ? inputErrorClass : ""} aria-invalid={!!errors.user?.senha}
                />
                {errors.user?.senha && <p className="text-xs text-red-600 mt-1">{errors.user?.senha}</p>}
              </div>

              <div>
                <Label>Perfil</Label>
                <Select value="ADMIN" disabled>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ADMIN">Administrador</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Ativação do Sistema</h4>
                    <p className="text-sm text-blue-700">Taxa de ativação mensal: <span className="font-bold">R$ 100,00</span></p>
                    <p className="text-xs text-blue-600 mt-1">Pagamento via PIX • Liberação imediata após confirmação</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full dental-primary" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              Continuar para Pagamento
            </Button>
          </form>
        )

      case "pagamento":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pagamento via PIX</h3>
              <p className="text-gray-600">Escaneie o QR Code ou copie o código PIX</p>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-center">R$ 100,00</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {paymentData.qrCode && (
                  <div className="flex justify-center">
                    <img src={`data:image/png;base64,${paymentData.qrCode}`} alt="QR Code PIX" className="w-48 h-48 border rounded-lg" />
                  </div>
                )}

                {paymentData.pixCode && (
                  <div>
                    <Label>Código PIX (Copia e Cola)</Label>
                    <div className="flex gap-2">
                      <Input value={paymentData.pixCode} readOnly className="font-mono text-xs" />
                      <Button type="button" variant="outline" onClick={() => {
                        navigator.clipboard.writeText(paymentData.pixCode)
                        toast({ title: "Copiado!", description: "Código PIX copiado para a área de transferência" })
                      }}>Copiar</Button>
                    </div>
                  </div>
                )}

                <div className="text-center space-y-2">
                  <Badge variant="secondary">Aguardando Pagamento</Badge>
                  <p className="text-sm text-gray-600">O pagamento será verificado automaticamente</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setCurrentStep("dados")} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              <Button type="button" onClick={checkPaymentStatus} disabled={loading} className="flex-1 dental-primary">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Verificar Pagamento
              </Button>
            </div>
          </div>
        )

      case "confirmacao":
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pagamento Confirmado!</h3>
              <p className="text-gray-600">Sua conta está sendo criada. Você será redirecionado em instantes...</p>
            </div>
            <Badge variant="default" className="bg-green-600">Conta Ativada com Sucesso</Badge>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Passos */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center ${currentStep === "dados" ? "text-blue-600" : currentStep !== "dados" ? "text-green-600" : "text-gray-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === "dados" ? "bg-blue-100" : "bg-green-100"}`}>1</div>
          <span className="ml-2 text-sm font-medium">Dados</span>
        </div>
        <div className="w-8 h-px bg-gray-300" />
        <div className={`flex items-center ${currentStep === "pagamento" ? "text-blue-600" : currentStep === "confirmacao" ? "text-green-600" : "text-gray-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === "pagamento" ? "bg-blue-100" : currentStep === "confirmacao" ? "bg-green-100" : "bg-gray-100"}`}>2</div>
          <span className="ml-2 text-sm font-medium">Pagamento</span>
        </div>
        <div className="w-8 h-px bg-gray-300" />
        <div className={`flex items-center ${currentStep === "confirmacao" ? "text-green-600" : "text-gray-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === "confirmacao" ? "bg-green-100" : "bg-gray-100"}`}>3</div>
          <span className="ml-2 text-sm font-medium">Confirmação</span>
        </div>
      </div>

      {renderStepContent()}

      {currentStep === "dados" && (
        <p className="text-center text-sm text-gray-600">
          Já possui conta?{" "}
          <a href="/login" className="text-cyan-700 hover:underline">Entrar</a>
        </p>
      )}
    </div>
  )
}
