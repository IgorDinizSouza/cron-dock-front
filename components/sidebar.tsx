"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRightLeft,
  Ban,
  Calendar,
  CalendarDays,
  CalendarPlus,
  ChartPie,
  Clock3,
  CloudDownload,
  Layers,
  MapPin,
  Plug,
  Star,
  TriangleAlert,
  CarFront,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ClipboardCheck,
  Boxes,
  Factory,
  FileText,
  FileSpreadsheet,
  FolderOpen,
  KeyRound,
  ListChecks,
  Package,
  Settings,
  Shield,
  SlidersHorizontal,
  Stethoscope,
  Store,
  Truck,
  User,
  UsersIcon,
  Wrench,
  Building,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
import { useAuth } from "@/contexts/auth-context";

type MenuItem = {
  name: string;
  href: string;
  icon: any;
};

type MenuSection = {
  title: string;
  icon: any;
  items: MenuItem[];
};

const topNavigation: MenuItem[] = [{ name: "Principal", href: "/", icon: ChartPie }];

const montagemCargasNavigation: MenuItem[] = [
  { name: "Listagem de Pedidos", href: "/pedidos", icon: ClipboardList },
  { name: "Listagem Cargas Montadas", href: "/montagem-cargas/cargas-montadas", icon: ListChecks },
  { name: "Montagem e Agendamento da Carga", href: "/montagem-cargas/montagem-agendamento", icon: Wrench },
  { name: "Agendamento por planilha", href: "/montagem-cargas/planilha", icon: FileSpreadsheet },
  { name: "Cargas para Agendar", href: "/montagem-cargas/cargas-para-agendar", icon: CalendarPlus },
];

const centralAgendamentosNavigation: MenuItem[] = [
  { name: "Calendário", href: "/agendamentos", icon: Calendar },
  { name: "Monitor de aprovação", href: "/agendamentos/monitor-aprovacao", icon: ClipboardCheck },
  { name: "Aprovação de usuarios", href: "/agendamentos/aprovacao-usuarios", icon: UsersIcon },
  { name: "Listagem de cargas agendadas", href: "/agendamentos/cargas-agendadas", icon: ListChecks },
  { name: "Ajustes de saldo p/ cargas", href: "/agendamentos/ajustes-saldo-cargas", icon: SlidersHorizontal },
];

const recebimentoNavigation: MenuItem[] = [
  { name: "Monitor de Recebimento", href: "/recebimento/monitor", icon: Truck },
  { name: "Monitor de Patio", href: "/recebimento/monitor-patio", icon: Package },
  { name: "Check-in de Cargas S/Agendamento Previo", href: "/recebimento/checkin-sem-agendamento", icon: ClipboardCheck },
];

const relatoriosNavigation: MenuItem[] = [
  { name: "Cargas Agendadas", href: "/relatorios/cargas-agendadas", icon: ListChecks },
  { name: "Cargas Agendadas por Produto", href: "/relatorios/cargas-agendadas-por-produto", icon: Package },
  { name: "Exportacao de Pedidos", href: "/relatorios/exportacao-pedidos", icon: ClipboardList },
  { name: "Pedidos Aguardando Agendamento", href: "/relatorios/pedidos-aguardando-agendamento", icon: ClipboardCheck },
];

const cadastroNavigation: MenuItem[] = [
  { name: "Grupo empresarial", href: "/grupos-empresariais", icon: Building },
  { name: "Transportador", href: "/transportadores", icon: Truck },
  { name: "Fornecedor", href: "/fornecedores", icon: Factory },
  { name: "Filial", href: "/filiais", icon: Store },
  { name: "Comprador", href: "/compradores", icon: User },
  { name: "Produto", href: "/produtos", icon: Package },
];

const configuracoesSections: MenuSection[] = [
  {
    title: "Gestão de acesso",
    icon: Shield,
    items: [
      { name: "Usuários", href: "/usuarios", icon: UsersIcon },
      { name: "Perfis", href: "/perfis", icon: Shield },
      { name: "Permissões", href: "/roles", icon: KeyRound },
    ],
  },
  {
    title: "Grupos",
    icon: Layers,
    items: [
      { name: "Regionais", href: "/configuracoes/grupos/regionais", icon: MapPin },
      { name: "Grupos de fornecedores", href: "/configuracoes/grupos/fornecedores", icon: Factory },
      { name: "Grupos de transportadoras", href: "/configuracoes/grupos/transportadoras", icon: Truck },
      { name: "Grupos de unidades", href: "/configuracoes/grupos/unidades", icon: Building },
    ],
  },
  {
    title: "Parâmetros de carga",
    icon: Package,
    items: [
      { name: "Tipo de carga", href: "/tipos-carga", icon: Package },
      { name: "Tipo de veículo", href: "/tipos-veiculo", icon: CarFront },
      { name: "Espécie de carga", href: "/especies-carga", icon: Boxes },
    ],
  },
  {
    title: "Parâmetros gerais",
    icon: SlidersHorizontal,
    items: [
      { name: "Municípios", href: "/configuracoes/parametros-gerais/municipios", icon: MapPin },
      { name: "Tempos de Descarregamento", href: "/configuracoes/parametros-gerais/tempos-descarregamento", icon: Clock3 },
      { name: "Fator Conversão", href: "/configuracoes/parametros-gerais/fator-conversao", icon: ArrowRightLeft },
    ],
  },
  {
    title: "Motivos",
    icon: TriangleAlert,
    items: [
      { name: "Motivos de Ocorrências", href: "/configuracoes/motivos/ocorrencias", icon: ClipboardList },
      { name: "Motivos de Cancelamento", href: "/configuracoes/motivos/cancelamento", icon: Ban },
      { name: "Motivos de No Show", href: "/configuracoes/motivos/no-show", icon: X },
      { name: "Motivos de Priorização", href: "/configuracoes/motivos/priorizacao", icon: Star },
    ],
  },
  {
    title: "Interfaces",
    icon: Plug,
    items: [{ name: "Acompanhar Importação", href: "/configuracoes/interfaces/importacao", icon: CloudDownload }],
  },
];

function getInitials(fullName?: string) {
  if (!fullName) return "U";
  const letters = fullName
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return (letters[0] || "") + (letters[1] || "");
}

function NavLink({
  item,
  pathname,
  toggle,
  compactIndent = false,
}: {
  item: MenuItem;
  pathname: string;
  toggle: () => void;
  compactIndent?: boolean;
}) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        compactIndent ? "text-[13px]" : "",
        active ? "border-r-2 border-orange-500 bg-orange-50 text-orange-700" : "text-gray-600 hover:bg-orange-50 hover:text-orange-700",
      )}
      onClick={() => {
        if (typeof window !== "undefined" && window.innerWidth < 1024) toggle();
      }}
    >
      <item.icon className={cn("mr-3 h-5 w-5", active ? "text-orange-500" : "text-gray-400")} />
      {item.name}
    </Link>
  );
}

function SubmenuBlock({
  title,
  icon: Icon,
  items,
  pathname,
  toggle,
  isOpen,
  onToggle,
}: {
  title: string;
  icon: any;
  items: MenuItem[];
  pathname: string;
  toggle: () => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const anyActive = items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "mb-2 flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
          anyActive ? "bg-orange-50 text-orange-700" : "text-gray-700",
          "hover:bg-orange-50 hover:text-orange-700",
        )}
      >
        <Icon className="mr-3 h-5 w-5 text-orange-500" />
        {title}
        <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isOpen ? "rotate-180 text-orange-500" : "text-gray-400")} />
      </button>

      {isOpen && (
        <div className="space-y-1 pl-2">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "border-r-2 border-orange-500 bg-orange-50 text-orange-700" : "text-gray-600 hover:bg-orange-50 hover:text-orange-700",
                )}
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 1024) toggle();
                }}
              >
                <ChevronRight className={cn("mr-2 h-4 w-4", active ? "text-orange-500" : "text-gray-400")} />
                <item.icon className={cn("mr-2 h-4 w-4", active ? "text-orange-500" : "text-gray-400")} />
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NestedSubmenuBlock({
  title,
  icon: Icon,
  sections,
  pathname,
  toggle,
  isOpen,
  onToggle,
}: {
  title: string;
  icon: any;
  sections: Array<MenuSection & { isOpen: boolean; onToggle: () => void }>;
  pathname: string;
  toggle: () => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const anyActive = sections.some((section) =>
    section.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );

  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "mb-2 flex w-full items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
          anyActive ? "bg-orange-50 text-orange-700" : "text-gray-700",
          "hover:bg-orange-50 hover:text-orange-700",
        )}
      >
        <Icon className="mr-3 h-5 w-5 text-orange-500" />
        {title}
        <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isOpen ? "rotate-180 text-orange-500" : "text-gray-400")} />
      </button>

      {isOpen && (
        <div className="space-y-1 pl-2">
          {sections.map((section) => (
            <SubmenuBlock
              key={section.title}
              title={section.title}
              icon={section.icon}
              items={section.items}
              pathname={pathname}
              toggle={toggle}
              isOpen={section.isOpen}
              onToggle={section.onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle, setIsOpen } = useSidebar();
  const { user, perfis, roles } = useAuth();
  const asideRef = useRef<HTMLElement | null>(null);
  const [montagemOpen, setMontagemOpen] = useState(false);
  const [centralOpen, setCentralOpen] = useState(false);
  const [recebimentoOpen, setRecebimentoOpen] = useState(false);
  const [relatoriosOpen, setRelatoriosOpen] = useState(false);
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [configGestaoAcessoOpen, setConfigGestaoAcessoOpen] = useState(false);
  const [configGruposOpen, setConfigGruposOpen] = useState(false);
  const [configParametrosCargaOpen, setConfigParametrosCargaOpen] = useState(false);
  const [configParametrosGeraisOpen, setConfigParametrosGeraisOpen] = useState(false);
  const [configMotivosOpen, setConfigMotivosOpen] = useState(false);
  const [configInterfacesOpen, setConfigInterfacesOpen] = useState(false);

  const userName = user?.descricao || user?.email || "Usuario";
  const userRole = perfis[0]?.descricao || roles[0]?.nome || "";
  const initials = useMemo(() => getInitials(userName), [userName]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (asideRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [isOpen, setIsOpen]);

  return (
    <>
      <aside
        ref={asideRef}
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-gray-200 bg-white transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Menu lateral"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
            <div className="flex items-center space-x-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-orange-500">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold leading-tight text-orange-600">CronDock - Agendamentos e pátios</h1>
              </div>
            </div>
            <button className="rounded-md p-2 hover:bg-gray-100 lg:hidden" onClick={toggle} aria-label="Fechar menu">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-3 overflow-y-auto px-4 py-6">
            <NavLink item={topNavigation[0]} pathname={pathname} toggle={toggle} />

            <SubmenuBlock
              title="Montagem de cargas"
              icon={Boxes}
              items={montagemCargasNavigation}
              pathname={pathname}
              toggle={toggle}
              isOpen={montagemOpen}
              onToggle={() => setMontagemOpen((v) => !v)}
            />

            <SubmenuBlock
              title="Central de agendamentos"
              icon={CalendarDays}
              items={centralAgendamentosNavigation}
              pathname={pathname}
              toggle={toggle}
              isOpen={centralOpen}
              onToggle={() => setCentralOpen((v) => !v)}
            />

            <SubmenuBlock
              title="Recebimento"
              icon={Truck}
              items={recebimentoNavigation}
              pathname={pathname}
              toggle={toggle}
              isOpen={recebimentoOpen}
              onToggle={() => setRecebimentoOpen((v) => !v)}
            />

            <SubmenuBlock
              title="Relatórios"
              icon={FileText}
              items={relatoriosNavigation}
              pathname={pathname}
              toggle={toggle}
              isOpen={relatoriosOpen}
              onToggle={() => setRelatoriosOpen((v) => !v)}
            />

            <SubmenuBlock
              title="Cadastros"
              icon={FolderOpen}
              items={cadastroNavigation}
              pathname={pathname}
              toggle={toggle}
              isOpen={cadastrosOpen}
              onToggle={() => setCadastrosOpen((v) => !v)}
            />

            <NestedSubmenuBlock
              title="Configurações"
              icon={Settings}
              sections={[
                {
                  ...configuracoesSections[0],
                  isOpen: configGestaoAcessoOpen,
                  onToggle: () => setConfigGestaoAcessoOpen((v) => !v),
                },
                {
                  ...configuracoesSections[1],
                  isOpen: configGruposOpen,
                  onToggle: () => setConfigGruposOpen((v) => !v),
                },
                {
                  ...configuracoesSections[2],
                  isOpen: configParametrosCargaOpen,
                  onToggle: () => setConfigParametrosCargaOpen((v) => !v),
                },
                {
                  ...configuracoesSections[3],
                  isOpen: configParametrosGeraisOpen,
                  onToggle: () => setConfigParametrosGeraisOpen((v) => !v),
                },
                {
                  ...configuracoesSections[4],
                  isOpen: configMotivosOpen,
                  onToggle: () => setConfigMotivosOpen((v) => !v),
                },
                {
                  ...configuracoesSections[5],
                  isOpen: configInterfacesOpen,
                  onToggle: () => setConfigInterfacesOpen((v) => !v),
                },
              ]}
              pathname={pathname}
              toggle={toggle}
              isOpen={configOpen}
              onToggle={() => setConfigOpen((v) => !v)}
            />
          </nav>

          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-orange-400 font-semibold text-white">{initials}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{userName}</p>
                {userRole && <p className="truncate text-xs text-gray-500">{userRole}</p>}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
    </>
  );
}
