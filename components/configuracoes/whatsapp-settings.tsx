"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Send, TestTube, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function WhatsAppSettings() {
  const { toast } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const [whatsappConfig, setWhatsappConfig] = useState({
    enabled: false,
    accessToken: "",
    phoneNumberId: "",
    businessAccountId: "",
    webhookVerifyToken: "",
    webhookUrl: "",
    templates: {
      appointmentReminder:
        "Olá {{name}}, lembramos que você tem consulta agendada para {{date}} às {{time}}. Confirme sua presença respondendo SIM.",
      appointmentConfirmation: "Consulta confirmada para {{name}} em {{date}} às {{time}}. Aguardamos você!",
      paymentReminder:
        "Olá {{name}}, você possui um pagamento pendente de R$ {{amount}}. Entre em contato para regularizar.",
      birthdayMessage: "Parabéns {{name}}! 🎉 Desejamos um feliz aniversário! Que tal agendar sua consulta de rotina?",
    },
    automation: {
      appointmentReminders: true,
      paymentReminders: true,
      birthdayMessages: false,
      confirmationRequests: true,
      reminderHours: 24,
    },
  })

  const testConnection = async () => {
    setIsTesting(true)
    try {
      // Simular teste de conexão
      await new Promise((resolve) => setTimeout(resolve, 2000))

      if (whatsappConfig.accessToken && whatsappConfig.phoneNumberId) {
        setIsConnected(true)
        toast({
          title: "Conexão bem-sucedida!",
          description: "WhatsApp Business API conectado com sucesso.",
        })
      } else {
        throw new Error("Dados incompletos")
      }
    } catch (error) {
      setIsConnected(false)
      toast({
        title: "Erro na conexão",
        description: "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const sendTestMessage = async () => {
    if (!isConnected) {
      toast({
        title: "Erro",
        description: "Configure e teste a conexão primeiro.",
        variant: "destructive",
      })
      return
    }

    try {
      // Simular envio de mensagem de teste
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Mensagem enviada!",
        description: "Mensagem de teste enviada com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro no envio",
        description: "Não foi possível enviar a mensagem de teste.",
        variant: "destructive",
      })
    }
  }

  const saveSettings = () => {
    localStorage.setItem("whatsappSettings", JSON.stringify(whatsappConfig))
    toast({
      title: "Sucesso",
      description: "Configurações do WhatsApp salvas com sucesso!",
    })
  }

  return (
    <div className="space-y-6">
      {/* Status da Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            WhatsApp Business API
            {isConnected ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Ativar WhatsApp Business</Label>
              <p className="text-sm text-gray-500">Habilitar integração com WhatsApp</p>
            </div>
            <Switch
              checked={whatsappConfig.enabled}
              onCheckedChange={(checked) => setWhatsappConfig((prev) => ({ ...prev, enabled: checked }))}
            />
          </div>

          {whatsappConfig.enabled && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accessToken">Token de Acesso</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="EAAxxxxxxxxxx..."
                    value={whatsappConfig.accessToken}
                    onChange={(e) => setWhatsappConfig((prev) => ({ ...prev, accessToken: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumberId">ID do Número de Telefone</Label>
                  <Input
                    id="phoneNumberId"
                    placeholder="123456789012345"
                    value={whatsappConfig.phoneNumberId}
                    onChange={(e) => setWhatsappConfig((prev) => ({ ...prev, phoneNumberId: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessAccountId">ID da Conta Business</Label>
                  <Input
                    id="businessAccountId"
                    placeholder="123456789012345"
                    value={whatsappConfig.businessAccountId}
                    onChange={(e) => setWhatsappConfig((prev) => ({ ...prev, businessAccountId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="webhookVerifyToken">Token de Verificação Webhook</Label>
                  <Input
                    id="webhookVerifyToken"
                    placeholder="meu_token_secreto"
                    value={whatsappConfig.webhookVerifyToken}
                    onChange={(e) => setWhatsappConfig((prev) => ({ ...prev, webhookVerifyToken: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="webhookUrl">URL do Webhook</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://meusite.com/api/whatsapp/webhook"
                  value={whatsappConfig.webhookUrl}
                  onChange={(e) => setWhatsappConfig((prev) => ({ ...prev, webhookUrl: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">URL onde o WhatsApp enviará as respostas dos pacientes</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={testConnection} disabled={isTesting} variant="outline">
                  <TestTube className="w-4 h-4 mr-2" />
                  {isTesting ? "Testando..." : "Testar Conexão"}
                </Button>
                {isConnected && (
                  <Button onClick={sendTestMessage} variant="outline">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Teste
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Templates de Mensagem */}
      {whatsappConfig.enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Templates de Mensagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="appointmentReminder">Lembrete de Consulta</Label>
              <Textarea
                id="appointmentReminder"
                placeholder="Template para lembrete de consulta..."
                value={whatsappConfig.templates.appointmentReminder}
                onChange={(e) =>
                  setWhatsappConfig((prev) => ({
                    ...prev,
                    templates: { ...prev.templates, appointmentReminder: e.target.value },
                  }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Variáveis: {"{"}
                {"{"} name {"}"}
                {"}"}, {"{"}
                {"{"} date {"}"}
                {"}"}, {"{"}
                {"{"} time {"}"}
                {"}"}
              </p>
            </div>

            <div>
              <Label htmlFor="appointmentConfirmation">Confirmação de Consulta</Label>
              <Textarea
                id="appointmentConfirmation"
                placeholder="Template para confirmação de consulta..."
                value={whatsappConfig.templates.appointmentConfirmation}
                onChange={(e) =>
                  setWhatsappConfig((prev) => ({
                    ...prev,
                    templates: { ...prev.templates, appointmentConfirmation: e.target.value },
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="paymentReminder">Lembrete de Pagamento</Label>
              <Textarea
                id="paymentReminder"
                placeholder="Template para lembrete de pagamento..."
                value={whatsappConfig.templates.paymentReminder}
                onChange={(e) =>
                  setWhatsappConfig((prev) => ({
                    ...prev,
                    templates: { ...prev.templates, paymentReminder: e.target.value },
                  }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Variáveis: {"{"}
                {"{"} name {"}"}
                {"}"}, {"{"}
                {"{"} amount {"}"}
                {"}"}
              </p>
            </div>

            <div>
              <Label htmlFor="birthdayMessage">Mensagem de Aniversário</Label>
              <Textarea
                id="birthdayMessage"
                placeholder="Template para mensagem de aniversário..."
                value={whatsappConfig.templates.birthdayMessage}
                onChange={(e) =>
                  setWhatsappConfig((prev) => ({
                    ...prev,
                    templates: { ...prev.templates, birthdayMessage: e.target.value },
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Automações */}
      {whatsappConfig.enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Automações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Lembretes de Consulta</Label>
                <p className="text-sm text-gray-500">Enviar lembretes automáticos</p>
              </div>
              <Switch
                checked={whatsappConfig.automation.appointmentReminders}
                onCheckedChange={(checked) =>
                  setWhatsappConfig((prev) => ({
                    ...prev,
                    automation: { ...prev.automation, appointmentReminders: checked },
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Lembretes de Pagamento</Label>
                <p className="text-sm text-gray-500">Cobranças automáticas</p>
              </div>
              <Switch
                checked={whatsappConfig.automation.paymentReminders}
                onCheckedChange={(checked) =>
                  setWhatsappConfig((prev) => ({
                    ...prev,
                    automation: { ...prev.automation, paymentReminders: checked },
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Mensagens de Aniversário</Label>
                <p className="text-sm text-gray-500">Parabenizar pacientes</p>
              </div>
              <Switch
                checked={whatsappConfig.automation.birthdayMessages}
                onCheckedChange={(checked) =>
                  setWhatsappConfig((prev) => ({
                    ...prev,
                    automation: { ...prev.automation, birthdayMessages: checked },
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Solicitações de Confirmação</Label>
                <p className="text-sm text-gray-500">Pedir confirmação de presença</p>
              </div>
              <Switch
                checked={whatsappConfig.automation.confirmationRequests}
                onCheckedChange={(checked) =>
                  setWhatsappConfig((prev) => ({
                    ...prev,
                    automation: { ...prev.automation, confirmationRequests: checked },
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="reminderHours">Antecedência do Lembrete (horas)</Label>
              <Select
                value={whatsappConfig.automation.reminderHours.toString()}
                onValueChange={(value) =>
                  setWhatsappConfig((prev) => ({
                    ...prev,
                    automation: { ...prev.automation, reminderHours: Number.parseInt(value) },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hora antes</SelectItem>
                  <SelectItem value="2">2 horas antes</SelectItem>
                  <SelectItem value="4">4 horas antes</SelectItem>
                  <SelectItem value="12">12 horas antes</SelectItem>
                  <SelectItem value="24">24 horas antes</SelectItem>
                  <SelectItem value="48">48 horas antes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações sobre Custos */}
      <Card>
        <CardHeader>
          <CardTitle>Informações sobre Custos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>💰 Custos da WhatsApp Business API:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Mensagens de template: ~R$ 0,10 - R$ 0,30 por mensagem</li>
              <li>Mensagens de resposta (24h): Gratuitas</li>
              <li>Mensagens iniciadas pelo negócio: Cobradas</li>
              <li>Respostas dos clientes: Gratuitas</li>
            </ul>
            <p className="text-xs text-gray-500 mt-2">
              Os preços podem variar conforme o provedor (Meta, Twilio, etc.)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={saveSettings}>
          <MessageCircle className="w-4 h-4 mr-2" />
          Salvar Configurações WhatsApp
        </Button>
      </div>
    </div>
  )
}
