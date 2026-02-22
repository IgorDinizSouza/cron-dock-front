"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Printer } from "lucide-react"

type AnyAppointment = {
  id?: string | number
  pacienteNome?: string
  patient?: string
  dentistaNome?: string
  dentist?: string
  procedimentoNome?: string
  procedure?: string
  dataHora?: string 
  date?: string     
  time?: string     
  duracao?: number  
  price?: number
  preco?: number
}

export interface ReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: AnyAppointment
  clinic?: { nome?: string; cnpj?: string; endereco?: string; cidadeUf?: string; telefone?: string }
}

function formatCurrencyBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(isFinite(v) ? v : 0)
}
function formatCPF(value: string) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2")
}

function printReceipt({
  pacienteNome,
  cpf,
  valor,
  data,
  descricao,
  dentistaNome,
  procedimentoNome,
  clinic,
}: {
  pacienteNome: string
  cpf: string
  valor: number
  data: string // yyyy-MM-dd
  descricao: string
  dentistaNome?: string
  procedimentoNome?: string
  clinic?: ReceiptDialogProps["clinic"]
}) {
  const dataBR = (() => {
    try {
      const [y, m, d] = data.split("-").map((n) => parseInt(n, 10))
      return new Date(y, m - 1, d).toLocaleDateString("pt-BR")
    } catch {
      return data
    }
  })()

  const win = window.open("", "_blank", "width=900,height=1000")
  if (!win) return

  const css = `
    *{box-sizing:border-box}
    body{font-family:ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#111827; margin:0}
    .sheet{width:210mm; min-height:297mm; padding:20mm; margin:0 auto; background:#fff}
    .header{display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px}
    .title{font-size:22px; font-weight:700; letter-spacing:.5px}
    .muted{color:#6b7280; font-size:12px}
    .box{border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-top:12px}
    .row{display:flex; gap:12px; margin-top:8px}
    .col{flex:1}
    .label{font-size:12px; color:#6b7280; margin-bottom:4px}
    .val{font-size:14px; font-weight:600}
    .big{font-size:18px}
    .footer{margin-top:28mm; display:flex; justify-content:space-between; align-items:center}
    .sign{width:60mm; border-top:1px solid #9ca3af; text-align:center; padding-top:6px; font-size:12px; color:#374151}
    @media print{
      @page { size: A4; margin: 10mm }
      .noprint{display:none!important}
    }
  `

  const html = `
  <!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>Recibo</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="sheet">
        <div class="header">
          <div>
            <div class="title">RECIBO</div>
            <div class="muted">Data: ${dataBR}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:600">${clinic?.nome ?? "Clínica Odontológica"}</div>
            ${clinic?.cnpj ? `<div class="muted">CNPJ: ${clinic.cnpj}</div>` : ""}
            ${clinic?.endereco ? `<div class="muted">${clinic.endereco}</div>` : ""}
            ${clinic?.cidadeUf ? `<div class="muted">${clinic.cidadeUf}</div>` : ""}
            ${clinic?.telefone ? `<div class="muted">Tel: ${clinic.telefone}</div>` : ""}
          </div>
        </div>

        <div class="box">
          <div class="label">Recebemos de</div>
          <div class="val big">${pacienteNome || "-"}</div>
          ${cpf ? `<div class="muted">CPF: ${formatCPF(cpf)}</div>` : ""}
        </div>

        <div class="row">
          <div class="box col">
            <div class="label">Valor pago</div>
            <div class="val big">${formatCurrencyBRL(valor)}</div>
          </div>
          <div class="box col">
            <div class="label">Dentista</div>
            <div class="val">${dentistaNome ?? "-"}</div>
            <div class="label" style="margin-top:8px">Procedimento</div>
            <div class="val">${procedimentoNome ?? "-"}</div>
          </div>
        </div>

        <div class="box">
          <div class="label">Referente a</div>
          <div class="val">${descricao || procedimentoNome || "Serviços odontológicos"}</div>
        </div>

        <div class="footer">
          <div class="muted">Válido como comprovante para fins de reembolso/contábil.</div>
          <div class="sign">${clinic?.nome ?? "Clínica Odontológica"}</div>
        </div>

        <div class="noprint" style="margin-top:16px; text-align:right">
          <button onclick="window.print()" style="padding:10px 14px; border:1px solid #e5e7eb; border-radius:6px; background:#111827; color:#fff">Imprimir</button>
        </div>
      </div>
      <script>window.onload = () => { setTimeout(() => { window.print(); }, 150); }</script>
    </body>
  </html>
  `
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
}

export function ReceiptDialog({ open, onOpenChange, appointment, clinic }: ReceiptDialogProps) {
  const [valor, setValor] = React.useState<number>(Number(appointment.preco ?? appointment.price ?? 0) || 0)
  const [cpf, setCpf] = React.useState("")
  const [data, setData] = React.useState<string>(() => {
    const iso = (appointment.dataHora as string) || (appointment.date as string)
    if (iso && iso.length >= 10) return iso.slice(0, 10)
    return new Date().toISOString().slice(0, 10)
  })
  const [descricao, setDescricao] = React.useState(
    appointment.procedimentoNome || appointment.procedure || "Serviços odontológicos",
  )
  const [loading, setLoading] = React.useState(false)

  const pacienteNome = appointment.pacienteNome || appointment.patient || ""

  function handleGerar() {
    setLoading(true)
    try {
      printReceipt({
        pacienteNome,
        cpf,
        valor,
        data,
        descricao,
        dentistaNome: appointment.dentistaNome || appointment.dentist,
        procedimentoNome: appointment.procedimentoNome || appointment.procedure,
        clinic,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Gerar Recibo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Paciente</Label>
            <Input value={pacienteNome} readOnly />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>CPF do Paciente</Label>
              <Input
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            <div>
              <Label>Data do Pagamento</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Valor Pago (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={Number.isFinite(valor) ? valor : 0}
                onChange={(e) => setValor(parseFloat(e.target.value || "0"))}
              />
            </div>
            <div>
              <Label>Procedimento</Label>
              <Input
                value={appointment.procedimentoNome || appointment.procedure || ""}
                readOnly
                placeholder="—"
              />
            </div>
          </div>

          <div>
            <Label>Descrição / Observações</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Pagamento referente a consulta e limpeza."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGerar} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
              Pré-visualizar / PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
