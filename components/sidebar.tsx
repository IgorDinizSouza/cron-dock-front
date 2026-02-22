"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CalendarDays,
  CarFront,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Factory,
  FolderOpen,
  KeyRound,
  ListChecks,
  Package,
  PackageCheck,
  Settings,
  Shield,
  SlidersHorizontal,
  Stethoscope,
  Store,
  Truck,
  User,
  UsersIcon,
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

const topNavigation: MenuItem[] = [{ name: "Pedidos", href: "/pedidos", icon: PackageCheck }];

const centralAgendamentosNavigation: MenuItem[] = [
  { name: "Calendario", href: "/agendamentos", icon: Calendar },
  { name: "Monitor de aprovacao", href: "/agendamentos/monitor-aprovacao", icon: ClipboardCheck },
  { name: "Aprovacao de usuarios", href: "/agendamentos/aprovacao-usuarios", icon: UsersIcon },
  { name: "Listagem de cargas agendadas", href: "/agendamentos/cargas-agendadas", icon: ListChecks },
  { name: "Ajustes de saldo p/ cargas", href: "/agendamentos/ajustes-saldo-cargas", icon: SlidersHorizontal },
];

const cadastroNavigation: MenuItem[] = [
  { name: "Grupo empresarial", href: "/grupos-empresariais", icon: Building },
  { name: "Usuarios", href: "/usuarios", icon: UsersIcon },
  { name: "Perfis", href: "/perfis", icon: Shield },
  { name: "Permissoes", href: "/roles", icon: KeyRound },
  { name: "Transportador", href: "/transportadores", icon: Truck },
  { name: "Fornecedor", href: "/fornecedores", icon: Factory },
  { name: "Filial", href: "/filiais", icon: Store },
  { name: "Comprador", href: "/compradores", icon: User },
  { name: "Produto", href: "/produtos", icon: Package },
];

const configuracoesNavigation: MenuItem[] = [{ name: "Tipo de veiculo", href: "/tipos-veiculo", icon: CarFront }];

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

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle, setIsOpen } = useSidebar();
  const { user, perfis, roles } = useAuth();
  const asideRef = useRef<HTMLElement | null>(null);
  const [centralOpen, setCentralOpen] = useState(false);
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

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
            <SubmenuBlock
              title="Central de agendamentos"
              icon={CalendarDays}
              items={centralAgendamentosNavigation}
              pathname={pathname}
              toggle={toggle}
              isOpen={centralOpen}
              onToggle={() => setCentralOpen((v) => !v)}
            />

            <NavLink item={topNavigation[0]} pathname={pathname} toggle={toggle} />

            <SubmenuBlock
              title="Cadastros"
              icon={FolderOpen}
              items={cadastroNavigation}
              pathname={pathname}
              toggle={toggle}
              isOpen={cadastrosOpen}
              onToggle={() => setCadastrosOpen((v) => !v)}
            />

            <SubmenuBlock
              title="Configurações"
              icon={Settings}
              items={configuracoesNavigation}
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
