// components/pdf/BudgetPDFDoc.tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import DentalPdfHeader from "./DentalPdfHeader";

export type PdfClinicInfo = { name?: string; address?: string; phone?: string };
export type PdfPatient = { nome: string; cpf?: string | null; email?: string | null; telefone?: string | null };
export type PdfItem = { name: string; category: string; quantity: number; price: number; discount: number; total: number };

export type BudgetPDFDocProps = {
  clinic?: PdfClinicInfo;
  patient: PdfPatient;
  items: PdfItem[];
  notes?: string;
  number: string;
  date: string;
  subtotal: number;
  discount: number;
  total: number;
};

const brand = {
  bg: "#E6F6FD",
  primary: "#06B6D4",
  ink: "#0F172A",
  text: "#1F2937",
  muted: "#64748B",
  line: "#E5E7EB",
  head: "#0EA5B7",
  zebra: "#F8FAFC",
};

const styles = StyleSheet.create({
  page: { padding: 24, fontFamily: "Helvetica", color: brand.text, fontSize: 10 },

  // bloco infos
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: brand.primary },
  metaCol: { width: "48%" },
  label: { color: brand.muted },

  // tabela
  table: { marginTop: 12, borderWidth: 1, borderColor: brand.line, borderRadius: 8, overflow: "hidden" },
  row: { flexDirection: "row" },
  th: { backgroundColor: brand.head, color: "#FFFFFF", fontWeight: "bold" },
  cell: { paddingVertical: 8, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: brand.line },
  td: { borderBottomWidth: 1, borderBottomColor: brand.line },
  colName: { width: "38%" },
  colCat: { width: "18%" },
  colQty: { width: "8%", textAlign: "center" },
  colUnit: { width: "14%", textAlign: "right" },
  colDisc: { width: "10%", textAlign: "right" },
  colTotal: { width: "12%", textAlign: "right" },
  zebra: { backgroundColor: brand.zebra },

  // totais
  totalsWrap: { marginTop: 12, alignSelf: "flex-end", width: "46%", borderWidth: 1, borderColor: brand.line, borderRadius: 8, overflow: "hidden" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: brand.line },
  totalsLast: { borderBottomWidth: 0, backgroundColor: brand.bg },
  totalsStrong: { fontWeight: "bold", color: brand.ink },

  // observações
  notes: { marginTop: 10, padding: 10, backgroundColor: brand.zebra, borderLeftWidth: 4, borderLeftColor: brand.primary },
  notesTitle: { fontWeight: "bold", marginBottom: 4 },

  // rodapé
  footer: { marginTop: 16, textAlign: "justify", color: brand.muted },
});

const currencyBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

export default function BudgetPDFDoc({
  clinic,
  patient,
  items,
  notes,
  number,
  date,
  subtotal,
  discount,
  total,
}: BudgetPDFDocProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER REUTILIZÁVEL */}
        <DentalPdfHeader
          title="Orçamento Odontológico"
          rightText={clinic?.name}
          primary={brand.primary}
          accentBg={brand.bg}
        />

        {/* Metadados */}
        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text><Text style={styles.label}>Paciente: </Text>{patient.nome}</Text>
            {!!patient.cpf && <Text><Text style={styles.label}>CPF: </Text>{patient.cpf}</Text>}
            {(patient.email || patient.telefone) && (
              <Text>
                <Text style={styles.label}>Contato: </Text>
                {[patient.email ?? "—", patient.telefone ?? "—"].filter(Boolean).join(" • ")}
              </Text>
            )}
          </View>
          <View style={styles.metaCol}>
            {!!clinic?.address && <Text><Text style={styles.label}>Endereço: </Text>{clinic.address}</Text>}
            {!!clinic?.phone && <Text><Text style={styles.label}>Telefone: </Text>{clinic.phone}</Text>}
            <Text><Text style={styles.label}>Data: </Text>{date}</Text>
            <Text><Text style={styles.label}>Nº: </Text>{number}</Text>
            <Text><Text style={styles.label}>Orçamento feito em:</Text>{date} • {new Date().toLocaleTimeString("pt-BR")}</Text>
          </View>
        </View>

        {/* Tabela */}
        <View style={styles.table}>
          <View style={[styles.row, styles.th]}>
            <Text style={[styles.cell, styles.colName]}>Procedimento</Text>
            <Text style={[styles.cell, styles.colCat]}>Categoria</Text>
            <Text style={[styles.cell, styles.colQty]}>Qtd</Text>
            <Text style={[styles.cell, styles.colUnit]}>Preço Unit.</Text>
            <Text style={[styles.cell, styles.colDisc]}>Desc %</Text>
            <Text style={[styles.cell, styles.colTotal]}>Total</Text>
          </View>

          {items.map((i, idx) => (
            <View key={String(i.name) + idx} style={[styles.row, styles.td, idx % 2 ? styles.zebra : undefined]}>
              <Text style={[styles.cell, styles.colName]}>{i.name}</Text>
              <Text style={[styles.cell, styles.colCat]}>{i.category}</Text>
              <Text style={[styles.cell, styles.colQty]}>{i.quantity}</Text>
              <Text style={[styles.cell, styles.colUnit]}>{currencyBRL(i.price)}</Text>
              <Text style={[styles.cell, styles.colDisc]}>{Math.round(i.discount)}%</Text>
              <Text style={[styles.cell, styles.colTotal]}>{currencyBRL(i.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totais */}
        <View style={styles.totalsWrap}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{currencyBRL(subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Desconto</Text>
            <Text>- {currencyBRL(discount)}</Text>
          </View>
          <View style={[styles.totalsRow, styles.totalsLast]}>
            <Text style={styles.totalsStrong}>TOTAL GERAL</Text>
            <Text style={styles.totalsStrong}>{currencyBRL(total)}</Text>
          </View>
        </View>

        {/* Observações */}
        {!!notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Observações</Text>
            <Text>{notes}</Text>
          </View>
        )}

        {/* Rodapé */}
    
      </Page>
    </Document>
  );
}
