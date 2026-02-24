"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, MapPin, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { estadoApi, type EstadoResponse } from "@/lib/estado"
import { municipioApi } from "@/lib/municipio"

type FormState = {
  descricao: string
  codigoIbge: string
  estadoId: string
}

export default function EditarMunicipioPage() {
  const MAX_DESCRICAO = 100
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const itemId = params?.id

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [estados, setEstados] = useState<EstadoResponse[]>([])
  const [formData, setFormData] = useState<FormState>({
    descricao: "",
    codigoIbge: "",
    estadoId: "",
  })
  const [original, setOriginal] = useState<FormState | null>(null)

  const hasChanges = useMemo(
    () => (original ? JSON.stringify(formData) !== JSON.stringify(original) : false),
    [formData, original],
  )

  useEffect(() => {
    const load = async () => {
      if (!itemId) return
      try {
        setLoadingData(true)
        const [item, estadosData] = await Promise.all([municipioApi.getById(itemId), estadoApi.listAll()])
        setEstados(
          [...estadosData].sort((a, b) => `${a.uf} ${a.descricao}`.localeCompare(`${b.uf} ${b.descricao}`, "pt-BR")),
        )
        const state: FormState = {
          descricao: item.descricao || "",
          codigoIbge: item.codigoIbge || "",
          estadoId: item.estado?.id ? String(item.estado.id) : "",
        }
        setFormData(state)
        setOriginal(state)
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Não foi possível carregar o município.",
          variant: "destructive",
        })
        router.push("/configuracoes/parametros-gerais/municipios")
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [itemId, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemId) return

    const descricaoTrim = formData.descricao.trim()
    const codigoIbgeTrim = formData.codigoIbge.trim()
    const estadoIdNum = Number(formData.estadoId)

    if (!descricaoTrim) {
      toast({ title: "Erro", description: "Descrição é obrigatória.", variant: "destructive" })
      return
    }
    if (descricaoTrim.length > MAX_DESCRICAO) {
      toast({ title: "Erro", description: `Descrição deve ter no máximo ${MAX_DESCRICAO} caracteres.`, variant: "destructive" })
      return
    }
    if (!codigoIbgeTrim) {
      toast({ title: "Erro", description: "Código IBGE é obrigatório.", variant: "destructive" })
      return
    }
    if (!formData.estadoId.trim() || Number.isNaN(estadoIdNum) || estadoIdNum <= 0) {
      toast({ title: "Erro", description: "Estado ID deve ser um número válido.", variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      await municipioApi.update(itemId, {
        descricao: descricaoTrim,
        codigoIbge: codigoIbgeTrim,
        estadoId: estadoIdNum,
      })
      toast({ title: "Sucesso", description: "Município atualizado com sucesso." })
      router.push("/configuracoes/parametros-gerais/municipios")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível atualizar o município.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) return <div className="py-12 text-center text-gray-500">Carregando município...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/configuracoes/parametros-gerais/municipios">
          <Button size="sm" className="btn-primary-custom">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar município</h1>
            <p className="text-gray-600">Atualize os dados do município</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados do município</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
                  maxLength={MAX_DESCRICAO}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="codigoIbge">Código IBGE *</Label>
                <Input
                  id="codigoIbge"
                  value={formData.codigoIbge}
                  onChange={(e) => setFormData((p) => ({ ...p, codigoIbge: e.target.value }))}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="estadoId">Estado *</Label>
                <Select
                  value={formData.estadoId}
                  onValueChange={(value) => setFormData((p) => ({ ...p, estadoId: value }))}
                  disabled={loading}
                >
                  <SelectTrigger id="estadoId" className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {estados.map((estado) => (
                      <SelectItem
                        key={estado.id}
                        value={String(estado.id)}
                        className="focus:bg-orange-50 focus:text-orange-700 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-700"
                      >
                        {estado.uf ? `${estado.uf} - ` : ""}
                        {estado.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-6">
          <Button type="submit" className="btn-primary-custom" disabled={loading || !hasChanges}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
