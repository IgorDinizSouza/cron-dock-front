"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, Save, X, Building2, ImageIcon } from "lucide-react"
import { useNotification } from "@/contexts/notification-context"
import { consultoriosApi, type ConsultorioResponse } from "@/lib/api"

type ClinicForm = {
  id?: number
  nome: string
  telefone?: string
  email?: string
  cep?: string
  estado?: string
  cidade?: string
  bairro?: string
  rua?: string
  numero?: string
  complemento?: string
  website?: string // visual
  description?: string // visual
}

export function ClinicSettings() {
  const { showSuccess, showError } = useNotification()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [clinicData, setClinicData] = useState<ClinicForm>({
    nome: "",
    telefone: "",
    email: "",
    cep: "",
    estado: "",
    cidade: "",
    bairro: "",
    rua: "",
    numero: "",
    complemento: "",
    website: "",
    description: "",
  })

  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // Carrega dados do consultório + logo
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const me: ConsultorioResponse = await consultoriosApi.me()
        if (cancelled) return

        const payload: ClinicForm = {
          id: me?.id,
          nome: me?.nome ?? "",
          telefone: me?.telefone ?? "",
          email: me?.email ?? "",
          cep: me?.cep ?? "",
          estado: me?.estado ?? "",
          cidade: me?.cidade ?? "",
          bairro: me?.bairro ?? "",
          rua: me?.rua ?? "",
          numero: me?.numero ?? "",
          complemento: me?.complemento ?? "",
          website: "",
          description: "",
        }
        setClinicData(payload)

        if (me?.id) {
          const dataUrl = await consultoriosApi.getLogoDataUrl(me.id)
          if (!cancelled) setLogoPreview(dataUrl)
        }
      } catch (err: any) {
        showError("Erro", err?.message || "Não foi possível carregar os dados da clínica")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [showError])

  const handleLogoUpload: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      showError("Arquivo muito grande", "O arquivo deve ter no máximo 2MB")
      return
    }
    if (!/^image\/(png|jpeg|jpg|webp|svg\+xml)$/.test(file.type) && !file.type.startsWith("image/")) {
      showError("Formato inválido", "Use PNG, JPG, WEBP ou SVG")
      return
    }

    try {
      await consultoriosApi.uploadLogo(file)
      setLogoFile(file)

      const reader = new FileReader()
      reader.onload = (e) => setLogoPreview(e.target?.result as string)
      reader.readAsDataURL(file)

      showSuccess("Logo carregada", "Logomarca atualizada com sucesso!")
    } catch (err: any) {
      showError("Erro ao enviar logo", err?.message || "Não foi possível salvar a logomarca")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeLogo = async () => {
    try {
      await consultoriosApi.deleteLogo()
      setLogoPreview(null)
      setLogoFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      showSuccess("Logo removida", "Logomarca removida com sucesso!")
    } catch (err: any) {
      showError("Erro", err?.message || "Não foi possível remover a logomarca")
    }
  }

  const triggerFileInput = () => fileInputRef.current?.click()

  const saveSettings = async () => {
    try {
      if (!clinicData.nome.trim()) {
        showError("Campo obrigatório", "Nome da clínica é obrigatório")
        return
      }
      if (clinicData.email && !clinicData.email.includes("@")) {
        showError("Email inválido", "Digite um email válido")
        return
      }
      if (!clinicData.id) {
        showError("Consultório não identificado", "Recarregue a página")
        return
      }

      setSaving(true)
      const payload = {
        nome: clinicData.nome,
        telefone: clinicData.telefone || null,
        email: clinicData.email || null,
        cep: clinicData.cep || null,
        estado: clinicData.estado || null,
        cidade: clinicData.cidade || null,
        bairro: clinicData.bairro || null,
        rua: clinicData.rua || null,
        numero: clinicData.numero || null,
        complemento: clinicData.complemento || null,
      }

      await consultoriosApi.update(clinicData.id, payload)

      showSuccess("Configurações salvas", "As informações da clínica foram atualizadas!")
    } catch (error: any) {
      showError("Erro ao salvar", error?.message || "Não foi possível salvar as configurações")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Informações da Clínica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500">Carregando dados da clínica...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Informações da Clínica
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Upload de Logo */}
        <div>
          <Label className="text-sm font-medium">Logomarca</Label>
          <div className="mt-2">
            {logoPreview ? (
              <div className="relative inline-block">
                <img
                  src={logoPreview || "/placeholder.svg"}
                  alt="Logo preview"
                  className="w-32 h-32 object-contain border border-gray-200 rounded-lg bg-white p-2"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                  onClick={removeLogo}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                onClick={triggerFileInput}
              >
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-xs text-gray-500">Clique para enviar</span>
              </Button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Formatos: PNG, JPG, WEBP, SVG (máx. 2MB)</p>

          {logoPreview && (
            <Button type="button" variant="outline" size="sm" className="mt-2 bg-transparent" onClick={triggerFileInput}>
              <ImageIcon className="w-4 h-4 mr-2" />
              Trocar Logomarca
            </Button>
          )}
        </div>

        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clinicName">Nome da Clínica *</Label>
            <Input
              id="clinicName"
              value={clinicData.nome}
              onChange={(e) => setClinicData((prev) => ({ ...prev, nome: e.target.value }))}
              placeholder="Nome da sua clínica"
              required
            />
          </div>
          <div>
            <Label htmlFor="clinicPhone">Telefone</Label>
            <Input
              id="clinicPhone"
              value={clinicData.telefone || ""}
              onChange={(e) => setClinicData((prev) => ({ ...prev, telefone: e.target.value }))}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clinicEmail">Email *</Label>
            <Input
              id="clinicEmail"
              type="email"
              value={clinicData.email || ""}
              onChange={(e) => setClinicData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="contato@clinica.com.br"
              required
            />
          </div>
          <div>
            <Label htmlFor="clinicWebsite">Website</Label>
            <Input
              id="clinicWebsite"
              value={clinicData.website || ""}
              onChange={(e) => setClinicData((prev) => ({ ...prev, website: e.target.value }))}
              placeholder="www.clinica.com.br"
            />
          </div>
        </div>

        {/* Endereço */}
        <div>
          <Label htmlFor="clinicAddress">Rua</Label>
          <Input
            id="clinicAddress"
            value={clinicData.rua || ""}
            onChange={(e) => setClinicData((prev) => ({ ...prev, rua: e.target.value }))}
            placeholder="Rua, avenida..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="clinicNumber">Número / Complemento</Label>
            <div className="flex gap-2">
              <Input
                id="clinicNumber"
                value={clinicData.numero || ""}
                onChange={(e) => setClinicData((prev) => ({ ...prev, numero: e.target.value }))}
                placeholder="123"
              />
              <Input
                id="clinicComplement"
                value={clinicData.complemento || ""}
                onChange={(e) => setClinicData((prev) => ({ ...prev, complemento: e.target.value }))}
                placeholder="Sala, bloco..."
              />
            </div>
          </div>
          <div>
            <Label htmlFor="clinicDistrict">Bairro</Label>
            <Input
              id="clinicDistrict"
              value={clinicData.bairro || ""}
              onChange={(e) => setClinicData((prev) => ({ ...prev, bairro: e.target.value }))}
              placeholder="Centro"
            />
          </div>
          <div>
            <Label htmlFor="clinicZip">CEP</Label>
            <Input
              id="clinicZip"
              value={clinicData.cep || ""}
              onChange={(e) => setClinicData((prev) => ({ ...prev, cep: e.target.value }))}
              placeholder="01234-567"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="clinicCity">Cidade</Label>
            <Input
              id="clinicCity"
              value={clinicData.cidade || ""}
              onChange={(e) => setClinicData((prev) => ({ ...prev, cidade: e.target.value }))}
              placeholder="São Paulo"
            />
          </div>
          <div>
            <Label htmlFor="clinicState">Estado</Label>
            <Input
              id="clinicState"
              value={clinicData.estado || ""}
              onChange={(e) => setClinicData((prev) => ({ ...prev, estado: e.target.value }))}
              placeholder="SP"
            />
          </div>
          <div>
            <Label htmlFor="clinicDescription">Descrição</Label>
            <Textarea
              id="clinicDescription"
              value={clinicData.description || ""}
              onChange={(e) => setClinicData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Breve descrição da clínica..."
              rows={1}
            />
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={saveSettings} className="dental-primary" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
