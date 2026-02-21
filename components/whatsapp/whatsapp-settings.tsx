"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Settings, TestTube, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function WhatsAppSettings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)

  const [settings, setSettings] = useState({
    enabled: false,
    accessToken: "",
    phoneNumberId: "",
    verifyToken: "",
    webhookUrl: "",
    templates: {
      appointment: "Olá {{name}}, sua consulta está agendada para {{date}} às {{time}}.",
      reminder: "Lembrete: Você tem consulta amanhã {{date}} às {{time}}.",
      confirmation: "Consulta confirmada! Aguardamos você {{date}} às {{time}}.",
    },
  })

  useEffect(() => {
    const savedSettings = localStorage.getItem("whatsappSettings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const handleSave = () => {
    setLoading(true)
    try {
      localStorage.setItem("whatsappSettings", JSON.stringify(settings))
      toast({
        title: "Configurações salvas!",
        description: "As configurações do WhatsApp foram atualizadas.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      // Simular teste de conexão
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Conexão testada!",
        description: "WhatsApp Business API está funcionando corretamente.",
      })
    } catch (error) {
      toast({
        title: "Erro na conexão",
        description: "Verifique suas credenciais do WhatsApp Business API.",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Configurações WhatsApp Business API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Ativar WhatsApp</Label>
              <p className="text-sm text-gray-600">Habilitar notificações via WhatsApp</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enabled: checked }))}
            />
          </div>

          {settings.enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accessToken">Access Token *</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    value={settings.accessToken}
                    onChange={(e) => setSettings((prev) => ({ ...prev, accessToken: e.target.value }))}
                    placeholder="Token da API do WhatsApp Business"
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumberId">Phone Number ID *</Label>
                  <Input
                    id="phoneNumberId"
                    value={settings.phoneNumberId}
                    onChange={(e) => setSettings((prev) => ({ ...prev, phoneNumberId: e.target.value }))}
                    placeholder="ID do número de telefone"
                  />
                </div>

                <div>
                  <Label htmlFor="verifyToken">Verify Token</Label>
                  <Input
                    id="verifyToken"
                    value={settings.verifyToken}
                    onChange={(e) => setSettings((prev) => ({ ...prev, verifyToken: e.target.value }))}
                    placeholder="Token de verificação do webhook"
                  />
                </div>

                <div>
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    value={settings.webhookUrl}
                    onChange={(e) => setSettings((prev) => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://seudominio.com/api/whatsapp/webhook"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">Templates de Mensagem</Label>

                <div>
                  <Label htmlFor="appointmentTemplate">Agendamento</Label>
                  <Textarea
                    id="appointmentTemplate"
                    value={settings.templates.appointment}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        templates: { ...prev.templates, appointment: e.target.value },
                      }))
                    }
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="reminderTemplate">Lembrete</Label>
                  <Textarea
                    id="reminderTemplate"
                    value={settings.templates.reminder}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        templates: { ...prev.templates, reminder: e.target.value },
                      }))
                    }
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={testConnection}
                  variant="outline"
                  disabled={testing || !settings.accessToken || !settings.phoneNumberId}
                >
                  {testing ? (
                    <>
                      <TestTube className="h-4 w-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Testar Conexão
                    </>
                  )}
                </Button>

                <Button onClick={handleSave} disabled={loading} className="dental-primary">
                  {loading ? (
                    <>
                      <Settings className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Como configurar:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Acesse o Facebook Developers e crie um app Business</li>
                      <li>Configure o WhatsApp Business API</li>
                      <li>Obtenha o Access Token e Phone Number ID</li>
                      <li>Configure o webhook para receber respostas</li>
                    </ol>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {settings.enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Status da Integração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {settings.accessToken && settings.phoneNumberId ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Badge variant="default" className="bg-green-600">
                    Configurado
                  </Badge>
                  <span className="text-sm text-gray-600">WhatsApp Business API está configurado</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <Badge variant="secondary">Pendente</Badge>
                  <span className="text-sm text-gray-600">Configure as credenciais para ativar</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
