"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, Loader2, MapPin, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { estadoApi, type EstadoResponse } from "@/lib/estado"
import { municipioApi } from "@/lib/municipio"

export default function NovoMunicipioPage() {
  const MAX_DESCRICAO = 100
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingEstados, setLoadingEstados] = useState(true)
  const [estados, setEstados] = useState<EstadoResponse[]>([])
  const [descricao, setDescricao] = useState("")
  const [codigoIbge, setCodigoIbge] = useState("")
  const [estadoId, setEstadoId] = useState("")

  useEffect(() => {
    const loadEstados = async () => {
      try {
        setLoadingEstados(true)
        const data = await estadoApi.listAll()
        setEstados(
          [...data].sort((a, b) => `${a.uf} ${a.descricao}`.localeCompare(`${b.uf} ${b.descricao}`, "pt-BR")),
        )
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error?.message || "Não foi possível carregar os estados.",
          variant: "destructive",
        })
      } finally {
        setLoadingEstados(false)
      }
    }
    loadEstados()
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const descricaoTrim = descricao.trim()
    const codigoIbgeTrim = codigoIbge.trim()
    const estadoIdNum = Number(estadoId)

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
    if (!estadoId.trim() || Number.isNaN(estadoIdNum) || estadoIdNum <= 0) {
      toast({ title: "Erro", description: "Estado ID deve ser um número válido.", variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      await municipioApi.create({
        descricao: descricaoTrim,
        codigoIbge: codigoIbgeTrim,
        estadoId: estadoIdNum,
      })
      toast({ title: "Sucesso", description: "Município criado com sucesso." })
      router.push("/configuracoes/parametros-gerais/municipios")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível criar o município.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Novo município</h1>
            <p className="text-gray-600">Cadastre um novo município</p>
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
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  maxLength={MAX_DESCRICAO}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  disabled={loading || loadingEstados}
                />
              </div>

              <div>
                <Label htmlFor="codigoIbge">Código IBGE *</Label>
                <Input
                  id="codigoIbge"
                  value={codigoIbge}
                  onChange={(e) => setCodigoIbge(e.target.value)}
                  className="h-10 border-gray-200 bg-white shadow-sm"
                  disabled={loading || loadingEstados}
                />
              </div>

              <div>
                <Label htmlFor="estadoId">Estado *</Label>
                <Select value={estadoId} onValueChange={setEstadoId} disabled={loading || loadingEstados}>
                  <SelectTrigger id="estadoId" className="h-10 border-orange-200 bg-white shadow-sm focus:border-orange-400 focus:ring-orange-500">
                    <SelectValue placeholder={loadingEstados ? "Carregando estados..." : "Selecione o estado"} />
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
          <Button type="submit" className="btn-primary-custom" disabled={loading || loadingEstados}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Criar município
          </Button>
        </div>
      </form>
    </div>
  )
}
