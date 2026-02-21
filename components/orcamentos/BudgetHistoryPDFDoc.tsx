import { Document, Page, Text, View, StyleSheet, Image, pdf } from "@react-pdf/renderer"
import DentalPdfHeaderNew from "../pdf/DentalPdfHeader"

export type ClinicInfo = {
  id?: number
  name: string
  email?: string
  phone?: string
  cep?: string
  estado?: string
  cidade?: string
  bairro?: string
  rua?: string
  numero?: string
  complemento?: string
  address?: string
  logoDataUrl?: string | null
}

export type BudgetItem = {
  id: number
  dente?: string
  procedimentoNome: string
  especialidade?: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  realizado?: boolean
}

export type BudgetPDF = {
  id: number
  pacienteNome: string
  dataEmissao: string
  status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED"
  observacoes?: string
  itens: BudgetItem[]
}

const brand = {
  bg: "#E6F6FD",
  primary: "#06B6D4",
  ink: "#0F172A",
  text: "#1F2937",
  muted: "#64748B",
  line: "#E5E7EB",
  head: "#0EA5B7",
  zebra: "#F8FAFC",
}

const styles = StyleSheet.create({
  page: { padding: 24, fontFamily: "Helvetica", color: brand.text, fontSize: 10 },

  clinicRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  clinicBox: { flex: 1, paddingRight: 12 },
  clinicLine: { marginTop: 2, color: brand.muted },
  logo: { width: 120, height: 60, objectFit: "contain" },

  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: brand.primary },
  metaCol: { width: "48%" },
  label: { color: brand.muted },

  table: { marginTop: 12, borderWidth: 1, borderColor: brand.line, borderRadius: 8, overflow: "hidden" },
  row: { flexDirection: "row" },
  th: { backgroundColor: brand.zebra, fontWeight: "bold" },
  cell: { paddingVertical: 8, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: brand.line },
  td: { borderBottomWidth: 1, borderBottomColor: brand.line },
  colTooth: { width: "8%" },
  colSpec: { width: "20%" },
  colName: { width: "34%" },
  colQty: { width: "8%", textAlign: "center" },
  colUnit: { width: "14%", textAlign: "right" },
  colDisc: { width: "12%", textAlign: "right" },
  colTotal: { width: "12%", textAlign: "right" },

  totalsWrap: { marginTop: 12, alignSelf: "flex-end", width: "46%", borderWidth: 1, borderColor: brand.line, borderRadius: 8, overflow: "hidden" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: brand.line },
  totalsLast: { borderBottomWidth: 0, backgroundColor: brand.bg },
  totalsStrong: { fontWeight: "bold", color: brand.ink },

  notes: { marginTop: 10, padding: 10, backgroundColor: brand.zebra, borderLeftWidth: 4, borderLeftColor: brand.primary },
  notesTitle: { fontWeight: "bold", marginBottom: 4 },

  signature: { marginTop: 18, alignItems: "center" },
  signatureLine: { height: 22, borderBottomWidth: 1, borderBottomColor: brand.muted, width: "60%", marginBottom: 4 },
  signatureName: { color: brand.muted },

  footer: { marginTop: 12, textAlign: "center", color: brand.muted },
})

const currencyBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(isFinite(n) ? n : 0)

const buildAddressLines = (c?: ClinicInfo | null) => {
  if (!c) return []
  if (c.address && c.address.trim())
    return [c.address, [c.cidade, c.estado].filter(Boolean).join(" - "), c.cep ? `CEP: ${c.cep}` : ""].filter(Boolean)
  const l1 = [c.rua, c.numero].filter(Boolean).join(", ")
  const l2 = [c.bairro, c.cidade, c.estado].filter(Boolean).join(" • ")
  const l3 = [c.cep ? `CEP: ${c.cep}` : "", c.complemento].filter(Boolean).join(" • ")
  return [l1, l2, l3].filter(Boolean)
}

export function BudgetHistoryPDFDoc({ clinic, budget }: { clinic?: ClinicInfo | null; budget: BudgetPDF }) {
  const addressLines = buildAddressLines(clinic)

  const subtotal = budget.itens.reduce((a, it) => a + (it.quantidade || 1) * (it.valorUnitario || 0), 0)
  const total = budget.itens.reduce((a, it) => a + (it.valorTotal || 0), 0)
  const discount = Math.max(0, subtotal - total)

  const showDiscount =
    discount > 0.0001 ||
    (budget.itens ?? []).some((it) => {
      const qtd = Number(it.quantidade || 1)
      const unit = Number(it.valorUnitario || 0)
      const totalItem = Number(it.valorTotal || unit * qtd)
      return unit * qtd - totalItem > 0.0001
    })

  const colNameDynamic = [styles.cell, styles.colName, !showDiscount && { width: "46%" }]
  const now = new Date()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <DentalPdfHeaderNew
          title={clinic?.name || ""}
          rightText={""}
          primary={brand.primary}
          accentBg={brand.bg}
        />

        {(addressLines.length || clinic?.phone || clinic?.email || clinic?.logoDataUrl) ? (
          <View style={styles.clinicRow}>
            <View style={styles.clinicBox}>
              {addressLines.map((l, i) => (<Text key={i} style={styles.clinicLine}>{l}</Text>))}
              {clinic?.phone ? (<Text style={styles.clinicLine}>Tel: {clinic.phone}</Text>) : null}
              {clinic?.email ? (<Text style={styles.clinicLine}>{clinic.email}</Text>) : null}
            </View>
            {clinic?.logoDataUrl ? <Image style={styles.logo} src={clinic.logoDataUrl as string} /> : null}
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text><Text style={styles.label}>Paciente: </Text>{budget.pacienteNome}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text><Text style={styles.label}>Data de Emissão: </Text>{new Date(budget.dataEmissao).toLocaleDateString("pt-BR")}</Text>
            <Text><Text style={styles.label}>Orçamento Nº: </Text>{String(budget.id)}</Text>
            <Text><Text style={styles.label}>Impresso em: </Text>{now.toLocaleDateString("pt-BR")} • {now.toLocaleTimeString("pt-BR")}</Text>
          </View>
        </View>

        {/* tabela */}
        <View style={styles.table}>
          <View style={[styles.row, styles.th]}>
            <Text style={[styles.cell, styles.colTooth]}>Dente</Text>
            <Text style={[styles.cell, styles.colSpec]}>Especialidade</Text>
            <Text style={colNameDynamic}>Procedimento</Text>
            <Text style={[styles.cell, styles.colQty]}>Qtd</Text>
            <Text style={[styles.cell, styles.colUnit]}>Valor unit.</Text>
            {showDiscount && <Text style={[styles.cell, styles.colDisc]}>Desconto</Text>}
            <Text style={[styles.cell, styles.colTotal]}>Total</Text>
          </View>

          {budget.itens.map((it) => {
            const qtd = it.quantidade || 1
            const unit = it.valorUnitario || 0
            const totalItem = it.valorTotal || unit * qtd
            const descR$ = Math.max(0, unit * qtd - totalItem)
            return (
              <View key={it.id} style={[styles.row, styles.td]}>
                <Text style={[styles.cell, styles.colTooth]}>{it.dente || "-"}</Text>
                <Text style={[styles.cell, styles.colSpec]}>{it.especialidade || "-"}</Text>
                <Text style={colNameDynamic}>{it.procedimentoNome}</Text>
                <Text style={[styles.cell, styles.colQty]}>{qtd}</Text>
                <Text style={[styles.cell, styles.colUnit]}>{currencyBRL(unit)}</Text>
                {showDiscount && <Text style={[styles.cell, styles.colDisc]}>{currencyBRL(descR$)}</Text>}
                <Text style={[styles.cell, styles.colTotal]}>{currencyBRL(totalItem)}</Text>
              </View>
            )
          })}
        </View>

        {/* Totais */}
        <View style={styles.totalsWrap}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{currencyBRL(subtotal)}</Text>
          </View>

          {showDiscount && (
            <View style={styles.totalsRow}>
              <Text>Desconto</Text>
              <Text>- {currencyBRL(discount)}</Text>
            </View>
          )}

          <View style={[styles.totalsRow, styles.totalsLast]}>
            <Text style={styles.totalsStrong}>TOTAL GERAL</Text>
            <Text style={styles.totalsStrong}>{currencyBRL(total)}</Text>
          </View>
        </View>

        {budget.observacoes ? (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Observações</Text>
            <Text>{budget.observacoes}</Text>
          </View>
        ) : null}

        <View style={styles.signature}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>{budget.pacienteNome}</Text>
        </View>

        <Text style={styles.footer}>Este orçamento é válido por 30 dias a partir da data de emissão.</Text>
      </Page>
    </Document>
  )
}

export const budgetToPDFInput = (b: any, patientName: string): BudgetPDF => ({
  id: Number(b.id),
  pacienteNome: patientName,
  dataEmissao: b.dataEmissao ?? b.criadoEm ?? new Date().toISOString(),
  status: (b.status as BudgetPDF["status"]) ?? "DRAFT",
  observacoes: b.observacoes ?? undefined,
  itens: Array.isArray(b.itens)
    ? b.itens.map((it: any, idx: number) => ({
        id: Number(it.id ?? idx + 1),
        dente: it.dente ?? it.toothNumber ?? it.tooth ?? undefined,
        procedimentoNome: it.nomeProcedimento ?? it.procedimentoNome ?? "",
        especialidade: it.categoria ?? it.especialidade ?? undefined,
        quantidade: Number(it.quantidade ?? 1),
        valorUnitario: Number(it.precoUnit ?? it.precoUnitario ?? it.valorUnitario ?? 0),
        valorTotal: Number(
          it.totalItem ??
            Number(it.quantidade ?? 1) *
              Number(it.precoUnit ?? it.precoUnitario ?? it.valorUnitario ?? 0) *
              (1 - Number(it.descontoPercent ?? 0) / 100)
        ),
        realizado: Boolean(it.realizado ?? false),
      }))
    : [],
})

export async function printBudgetWithPDF(
  budget: any,
  clinic: ClinicInfo | null | undefined,
  patientName: string
) {
  const input = budgetToPDFInput(budget, patientName)
  const blob = await pdf(<BudgetHistoryPDFDoc clinic={clinic} budget={input} />).toBlob()
  const url = URL.createObjectURL(blob)
  window.open(url, "_blank")
}
