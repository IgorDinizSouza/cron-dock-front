"use client";

import type React from "react";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Calculator,
  Save,
  FileText,
  GripVertical,
  Search,
  Printer,
  UserRound,
  Loader2,
  Circle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { proceduresApi, patientsApi, budgetsApi } from "@/lib/api";
import { formatters } from "@/lib/formatters";
import { pdf, Document, Page, Text, View, StyleSheet, Svg, Path, Rect } from "@react-pdf/renderer";
import { useAuth } from "@/contexts/auth-context";
import BudgetPDFDoc from "../pdf/BudgetPDFDoc";

/** ==== Helpers de moeda (formatters.currency espera centavos) ==== */
const toCents = (v: number | null | undefined) => Math.round(((v ?? 0) as number) * 100);
const money = (v: number | null | undefined) => formatters.currency(String(toCents(v ?? 0)));

type ProcedureItem = {
  id: string | number;
  nome: string;
  categoria?: string | null;
  preco: number;
  descricao?: string | null;
};

type BudgetItem = {
  id: string | number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  discount: number;
  total: number;
};

type Patient = {
  id: string | number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  cpf?: string | null;
};

type BudgetHistoryItem = {
  id: number;
  data: string;
  total: number;
  itens: Array<{ nomeProcedimento: string; quantidade: number; total: number }>;
  observacoes?: string | null;
};

type ClinicInfo = {
  name: string;
  address?: string;
  phone?: string;
};

export function BudgetBuilder({ clinic }: { clinic?: ClinicInfo }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);

  const { session, isAuthenticated, signOut } = useAuth();

  const pdfClinic = useMemo(() => {
    const c = (session as any)?.consultorio;
    if (!c) return clinic;

    const addressParts = [
      [c.rua, c.numero].filter(Boolean).join(", "),
      c.bairro,
      [c.cidade, c.estado].filter(Boolean).join("-"),
      c.cep ? `CEP ${c.cep}` : undefined,
    ].filter(Boolean);

    return {
      name: c.nome ?? "",
      address: addressParts.join(" • "),
      phone: c.telefone ?? undefined,
    } as any;
  }, [session, clinic]);

  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [showPatientList, setShowPatientList] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const patientBoxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!patientBoxRef.current) return;
      if (!patientBoxRef.current.contains(e.target as Node)) setShowPatientList(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = patientQuery.trim();
    if (q.length < 2) {
      setPatientResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setPatientLoading(true);
        const res = await patientsApi.search(q);
        const arr = (Array.isArray(res) ? res : []).map((p: any) => ({
          id: p.id ?? p._id ?? "",
          nome: p.nome ?? p.name ?? "",
          email: p.email ?? null,
          telefone: p.telefone ?? p.celular ?? null,
          cpf: p.cpf ?? null,
        })) as Patient[];
        setPatientResults(arr);
        setShowPatientList(true);
      } catch (e) {
        console.error(e);
        toast({ title: "Erro", description: "Falha ao buscar pacientes.", variant: "destructive" });
      } finally {
        setPatientLoading(false);
      }
    }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientQuery]);

  const [history, setHistory] = useState<BudgetHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = async (pacienteId: string | number) => {
    if (pacienteId == null || pacienteId === "") return;
    setHistoryLoading(true);
    try {
      const pid = Number(pacienteId);
      const page = await budgetsApi.listByPatient(pid);
      setHistory(
        (page?.content ?? []).map((r: any) => ({
          id: r.id,
          data: r.criadoEm,
          total: r.total,
          itens: r.itens ?? [],
          observacoes: r.observacoes,
        }))
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePickPatient = (p: Patient) => {
    setSelectedPatient(p);
    setPatientQuery(p.nome + (p.cpf ? ` — ${p.cpf}` : ""));
    setShowPatientList(false);
    loadHistory(p.id);
  };

  const [allProcedures, setAllProcedures] = useState<ProcedureItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedItem, setDraggedItem] = useState<ProcedureItem | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const page1 = await proceduresApi.getAll(0, 200, "");
        const content = Array.isArray(page1?.content) ? page1.content : [];
        const mapped = content.map((r: any) => ({
          id: r.id,
          nome: r.nome,
          categoria: r.especialidade ?? r.categoria ?? null,
          preco: Number(r.preco ?? 0),
          descricao: r.descricao ?? null,
        })) as ProcedureItem[];
        setAllProcedures(mapped);
      } catch (e) {
        console.error(e);
        toast({ title: "Erro", description: "Falha ao carregar procedimentos.", variant: "destructive" });
      }
    })();
  }, [toast]);

  const filteredProcedures = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allProcedures;
    return allProcedures.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.categoria ?? "").toLowerCase().includes(q) ||
        (p.descricao ?? "").toLowerCase().includes(q)
    );
  }, [allProcedures, searchTerm]);

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetNotes, setBudgetNotes] = useState("");
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, procedure: ProcedureItem) => {
    setDraggedItem(procedure);
    e.dataTransfer.effectAllowed = "copy";
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem) {
      addToBudget(draggedItem);
      setDraggedItem(null);
    }
  };

  const addToBudget = (proc: ProcedureItem) => {
    const existing = budgetItems.find((i) => String(i.id) === String(proc.id));
    if (existing) {
      setBudgetItems((prev) =>
        prev.map((i) =>
          String(i.id) === String(proc.id)
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price * (1 - i.discount / 100) }
            : i
        )
      );
    } else {
      const item: BudgetItem = {
        id: proc.id,
        name: proc.nome,
        category: proc.categoria ?? "—",
        price: proc.preco,
        quantity: 1,
        discount: 0,
        total: proc.preco,
      };
      setBudgetItems((prev) => [...prev, item]);
    }
  };

  const updateBudgetItem = (id: string | number, field: keyof BudgetItem, value: number) => {
    setBudgetItems((prev) =>
      prev.map((i) => {
        if (String(i.id) === String(id)) {
          const upd = { ...i, [field]: value };
          upd.total = upd.quantity * upd.price * (1 - upd.discount / 100);
          return upd;
        }
        return i;
      })
    );
  };

  const removeBudgetItem = (id: string | number) =>
    setBudgetItems((prev) => prev.filter((i) => String(i.id) !== String(id)));

  // ==== Totais ====
  const calculateSubtotal = () => budgetItems.reduce((s, i) => s + i.quantity * i.price, 0);
  const calculateDiscount = () => budgetItems.reduce((s, i) => s + (i.quantity * i.price * i.discount) / 100, 0);
  const calculateTotal = () => budgetItems.reduce((s, i) => s + i.total, 0);

  // ==== Salvar ====
  const saveBudget = async () => {
    if (!selectedPatient) {
      toast({
        title: "Atenção",
        description: "Selecione um paciente (busque por nome ou CPF).",
        variant: "destructive",
      });
      return;
    }
    if (budgetItems.length === 0) {
      toast({ title: "Atenção", description: "Adicione pelo menos um procedimento.", variant: "destructive" });
      return;
    }

    const payload = {
      pacienteId: selectedPatient.id,
      observacoes: budgetNotes || null,
      itens: budgetItems.map((i) => ({
        procedimentoId: i.id,
        nomeProcedimento: i.name,
        categoria: i.category,
        quantidade: i.quantity,
        descontoPercent: i.discount,
        precoUnit: i.price,
      })),
    };

    try {
      setSaving(true);
      const saved = await budgetsApi.create(payload);
      toast({ title: "Salvo", description: `Orçamento #${saved?.id ?? ""} salvo com sucesso.` });
      await loadHistory(selectedPatient.id);
      setBudgetItems([]);
      setBudgetNotes("");
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Erro",
        description: e?.message || "Não foi possível salvar o orçamento.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ==== Gerar PDF (sem janela de impressão) ====
  const printBudget = async () => {
    console.log(session);

    if (!selectedPatient || budgetItems.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione o paciente e adicione itens para gerar o PDF.",
        variant: "destructive",
      });
      return;
    }

    setPrinting(true);
    try {
      const number = `PREV-${Date.now()}`;
      const dateBR = new Date().toLocaleDateString("pt-BR");

      const pdfItems = budgetItems.map((i) => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        price: i.price,
        discount: i.discount,
        total: i.total,
      }));

      const blob = await pdf(
        <BudgetPDFDoc
          clinic={pdfClinic}
          patient={{
            nome: selectedPatient.nome,
            cpf: selectedPatient.cpf ?? null,
            email: selectedPatient.email ?? null,
            telefone: selectedPatient.telefone ?? null,
          }}
          items={pdfItems}
          notes={budgetNotes || undefined}
          number={number}
          date={dateBR}
          subtotal={calculateSubtotal()}
          discount={calculateDiscount()}
          total={calculateTotal()}
        />
      ).toBlob();

      const fileName = `orcamento_${selectedPatient.nome.replace(/\s+/g, "_")}_${number}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({ title: "PDF gerado", description: "O orçamento foi baixado com sucesso." });
    } catch (e) {
      console.error(e);
      toast({ title: "Erro", description: "Falha ao gerar o PDF.", variant: "destructive" });
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de Procedimentos (backend) */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Procedimentos Disponíveis
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar procedimentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredProcedures.map((p) => (
              <div
                key={String(p.id)}
                draggable
                onDragStart={(e) => handleDragStart(e, p)}
                className="p-3 border border-gray-200 rounded-lg cursor-grab hover:border-primary hover:shadow-md transition-all bg-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{p.nome}</div>
                    {p.descricao && <div className="text-xs text-gray-500">{p.descricao}</div>}
                    <Badge variant="secondary" className="text-xs mt-1">
                      {p.categoria ?? "—"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    {/* AJUSTE: usar money(preco) */}
                    <div className="font-bold text-primary">{money(p.preco ?? 0)}</div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addToBudget(p)}
                      className="h-6 px-2 text-xs"
                      title="Adicionar ao orçamento"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredProcedures.length === 0 && (
              <div className="text-sm text-gray-500 py-4 text-center">Nenhum procedimento encontrado.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Construtor de Orçamento */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Construtor de Orçamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Paciente: campo único (nome ou CPF) */}
          <div className="p-4 bg-gray-50 rounded-lg" ref={patientBoxRef}>
            <div className="flex items-center gap-2 mb-2">
              <UserRound className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Paciente (digite nome ou CPF)</span>
            </div>
            <div className="relative">
              <Input
                placeholder="Ex.: Maria Silva ou 123.456.789-00"
                value={patientQuery}
                onChange={(e) => {
                  setPatientQuery(e.target.value);
                  setSelectedPatient(null);
                  setHistory([]);
                }}
                onFocus={() => {
                  if (patientResults.length > 0) setShowPatientList(true);
                }}
              />
              {patientLoading && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </span>
              )}

              {showPatientList && (
                <div className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-white shadow-lg">
                  {patientResults.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Nenhum paciente encontrado</div>
                  ) : (
                    patientResults.map((p) => (
                      <button
                        key={String(p.id)}
                        type="button"
                        onClick={() => handlePickPatient(p)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50"
                        title={[p.email, p.telefone].filter(Boolean).join(" • ")}
                      >
                        <div className="text-sm font-medium">{p.nome}</div>
                        <div className="text-xs text-gray-500">
                          {p.cpf ? `${p.cpf} • ` : ""}
                          {p.email ?? "—"} • {p.telefone ?? "—"}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {selectedPatient && (
                <div className="mt-2 text-xs text-gray-600">
                  Selecionado: <b>{selectedPatient.nome}</b>
                  {selectedPatient.cpf ? ` — ${selectedPatient.cpf}` : ""}{" "}
                  <span className="text-gray-500">
                    ({selectedPatient.email ?? "—"} • {selectedPatient.telefone ?? "—"})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Área de Drop / Itens */}
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`min-h-32 border-2 border-dashed rounded-lg p-4 transition-colors ${
              draggedItem ? "border-primary bg-primary/5" : "border-gray-300 bg-gray-50"
            }`}
          >
            {budgetItems.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Arraste procedimentos aqui</p>
                <p className="text-sm">ou clique no botão + em cada procedimento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {budgetItems.map((item) => (
                  <div key={String(item.id)} className="budget-item">
                    <div className="flex items-center gap-4">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">Qtd:</div>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateBudgetItem(item.id, "quantity", Number(e.target.value) || 1)}
                          className="w-16 h-8 text-center"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">Desc %:</div>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => updateBudgetItem(item.id, "discount", Number(e.target.value) || 0)}
                          className="w-16 h-8 text-center"
                        />
                      </div>
                      <div className="text-right min-w-24">
                        {/* AJUSTE: usar money(total) e money(price) */}
                        <div className="font-bold text-primary">{money(item.total)}</div>
                        <div className="text-xs text-gray-500">{money(item.price)} cada</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeBudgetItem(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium mb-2">Observações</label>
            <Textarea
              placeholder="Observações adicionais sobre o orçamento..."
              value={budgetNotes}
              onChange={(e) => setBudgetNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Resumo Financeiro */}
          {budgetItems.length > 0 && (
            <div className="border-t pt-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  {/* AJUSTE: usar money(subtotal) */}
                  <span>{money(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Desconto:</span>
                  {/* AJUSTE: usar money(desconto) */}
                  <span>- {money(calculateDiscount())}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  {/* AJUSTE: usar money(total) */}
                  <span className="text-primary">{money(calculateTotal())}</span>
                </div>
              </div>
            </div>
          )}

          {/* Ações: Salvar e Imprimir */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={saveBudget} variant="outline" className="flex-1 bg-transparent" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
            <Button
              onClick={printBudget}
              className="flex-1"
              disabled={printing || !selectedPatient || budgetItems.length === 0}
            >
              {printing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
              {printing ? "Gerando Orçamento..." : "Gerar Orçamento"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Orçamentos */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Histórico de Orçamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedPatient ? (
            <div className="text-sm text-gray-500">Selecione um paciente para ver o histórico.</div>
          ) : historyLoading ? (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : history.length === 0 ? (
            <div className="text-sm text-gray-500">Nenhum orçamento encontrado.</div>
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="border p-3 rounded-md">
                  <div className="flex justify-between text-sm">
                    <div>
                      # {h.id} — {new Date(h.data).toLocaleDateString("pt-BR")}
                    </div>
                    {/* AJUSTE: h.total já vem em reais -> formatar como money(reais) */}
                    <div className="font-semibold">{money(h.total)}</div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {Array.isArray(h.itens) && h.itens.length > 0
                      ? h.itens
                          .slice(0, 3)
                          .map((it) => `${it.quantidade}x ${it.nomeProcedimento}`)
                          .join(" • ")
                      : "—"}
                    {Array.isArray(h.itens) && h.itens.length > 3 ? " • ..." : ""}
                  </div>
                  {h.observacoes && <div className="text-xs text-gray-500 mt-1">Obs: {h.observacoes}</div>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
