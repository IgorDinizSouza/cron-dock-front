"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Save, Bell, Clock, Palette, Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { WhatsAppSettings } from "./whatsapp-settings"

export function SystemSettings() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)

  const [systemData, setSystemData] = useState({
    timezone: "America/Sao_Paulo",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    language: "pt-BR",
    currency: "BRL",
    notifications: {
      email: true,
      sms: false,
      push: true,
      appointments: true,
      payments: true,
      reminders: true,
    },
    workingHours: {
      start: "08:00",
      end: "18:00",
      lunchStart: "12:00",
      lunchEnd: "13:00",
    },
    appointmentDuration: 30,
    autoBackup: true,
    backupFrequency: "daily",
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const saveSettings = () => {
    localStorage.setItem("systemSettings", JSON.stringify(systemData))
    toast({
      title: "Sucesso",
      description: "Configurações do sistema salvas com sucesso!",
    })
  }

  const getThemeIcon = (themeValue: string) => {
    switch (themeValue) {
      case "light":
        return <Sun className="h-4 w-4" />
      case "dark":
        return <Moon className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const getThemeLabel = (themeValue: string) => {
    switch (themeValue) {
      case "light":
        return "Claro"
      case "dark":
        return "Escuro"
      case "system":
        return "Sistema"
      default:
        return themeValue
    }
  }

  const handleThemeChange = (themeOption: string) => {
    setTheme(themeOption)
    if (themeOption === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    } else if (themeOption === "light") {
      document.documentElement.classList.add("light")
      document.documentElement.classList.remove("dark")
    } else {
      // Sistema - detecta preferência do usuário
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (isDark) {
        document.documentElement.classList.add("dark")
        document.documentElement.classList.remove("light")
      } else {
        document.documentElement.classList.add("light")
        document.documentElement.classList.remove("dark")
      }
    }

    toast({
      title: "Tema alterado",
      description: `Tema alterado para ${getThemeLabel(themeOption)}`,
    })
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      <WhatsAppSettings />

      {/* Aparência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Aparência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tema de Visualização</Label>
            <p className="text-sm text-gray-500 mb-3">Escolha como o sistema deve aparecer</p>
            <div className="grid grid-cols-3 gap-3">
              {["light", "dark", "system"].map((themeOption) => (
                <button
                  key={themeOption}
                  onClick={() => handleThemeChange(themeOption)}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105
                    ${
                      theme === themeOption
                        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950 shadow-md"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                    }
                  `}
                >
                  {getThemeIcon(themeOption)}
                  <span className="text-sm font-medium">{getThemeLabel(themeOption)}</span>
                  {theme === themeOption && <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Fuso Horário</Label>
              <Select
                value={systemData.timezone}
                onValueChange={(value) => setSystemData((prev) => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                  <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                  <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Formato de Data</Label>
              <Select
                value={systemData.dateFormat}
                onValueChange={(value) => setSystemData((prev) => ({ ...prev, dateFormat: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Formato de Hora</Label>
              <Select
                value={systemData.timeFormat}
                onValueChange={(value) => setSystemData((prev) => ({ ...prev, timeFormat: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 horas</SelectItem>
                  <SelectItem value="12h">12 horas (AM/PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Idioma</Label>
              <Select
                value={systemData.language}
                onValueChange={(value) => setSystemData((prev) => ({ ...prev, language: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horário de Funcionamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horário de Funcionamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workStart">Início do Expediente</Label>
              <Input
                id="workStart"
                type="time"
                value={systemData.workingHours.start}
                onChange={(e) =>
                  setSystemData((prev) => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, start: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="workEnd">Fim do Expediente</Label>
              <Input
                id="workEnd"
                type="time"
                value={systemData.workingHours.end}
                onChange={(e) =>
                  setSystemData((prev) => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, end: e.target.value },
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lunchStart">Início do Almoço</Label>
              <Input
                id="lunchStart"
                type="time"
                value={systemData.workingHours.lunchStart}
                onChange={(e) =>
                  setSystemData((prev) => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, lunchStart: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="lunchEnd">Fim do Almoço</Label>
              <Input
                id="lunchEnd"
                type="time"
                value={systemData.workingHours.lunchEnd}
                onChange={(e) =>
                  setSystemData((prev) => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, lunchEnd: e.target.value },
                  }))
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="appointmentDuration">Duração Padrão da Consulta (minutos)</Label>
            <Input
              id="appointmentDuration"
              type="number"
              min="15"
              max="120"
              step="15"
              value={systemData.appointmentDuration}
              onChange={(e) =>
                setSystemData((prev) => ({
                  ...prev,
                  appointmentDuration: Number.parseInt(e.target.value) || 30,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificações por Email</Label>
                <p className="text-sm text-gray-500">Receber notificações por email</p>
              </div>
              <Switch
                checked={systemData.notifications.email}
                onCheckedChange={(checked) =>
                  setSystemData((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: checked },
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Notificações Push</Label>
                <p className="text-sm text-gray-500">Notificações no navegador</p>
              </div>
              <Switch
                checked={systemData.notifications.push}
                onCheckedChange={(checked) =>
                  setSystemData((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, push: checked },
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Lembretes de Consultas</Label>
                <p className="text-sm text-gray-500">Lembrar sobre consultas agendadas</p>
              </div>
              <Switch
                checked={systemData.notifications.appointments}
                onCheckedChange={(checked) =>
                  setSystemData((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, appointments: checked },
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Notificações de Pagamento</Label>
                <p className="text-sm text-gray-500">Alertas sobre pagamentos pendentes</p>
              </div>
              <Switch
                checked={systemData.notifications.payments}
                onCheckedChange={(checked) =>
                  setSystemData((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, payments: checked },
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Automático</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Backup Automático</Label>
              <p className="text-sm text-gray-500">Fazer backup automático dos dados</p>
            </div>
            <Switch
              checked={systemData.autoBackup}
              onCheckedChange={(checked) =>
                setSystemData((prev) => ({
                  ...prev,
                  autoBackup: checked,
                }))
              }
            />
          </div>

          {systemData.autoBackup && (
            <div>
              <Label>Frequência do Backup</Label>
              <Select
                value={systemData.backupFrequency}
                onValueChange={(value) => setSystemData((prev) => ({ ...prev, backupFrequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={saveSettings}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
