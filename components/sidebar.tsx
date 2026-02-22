"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building, Calendar, Home, KeyRound, Settings, Shield, ShoppingCart, Stethoscope, UsersIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
import { useAuth } from "@/contexts/auth-context";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Grupo empresarial", href: "/grupos-empresariais", icon: Building },
  { name: "Pedidos", href: "/pedidos", icon: ShoppingCart },
  { name: "Agendamentos", href: "/agendamentos", icon: Calendar },
  { name: "Usuarios", href: "/usuarios", icon: UsersIcon },
  { name: "Perfis", href: "/perfis", icon: Shield },
  { name: "Roles", href: "/roles", icon: KeyRound },
  { name: "Configuracoes", href: "/configuracoes", icon: Settings },
];

function getInitials(fullName?: string) {
  if (!fullName) return "U";
  const letters = fullName
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return (letters[0] || "") + (letters[1] || "");
}

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebar();
  const { user, perfis, roles } = useAuth();

  const userName = user?.descricao || user?.email || "Usuario";
  const userRole = perfis[0]?.descricao || roles[0]?.nome || "";
  const initials = useMemo(() => getInitials(userName), [userName]);

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Menu lateral"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
            <div className="flex items-center space-x-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-600">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-serif text-lg font-bold leading-tight text-gray-900">Cron</h1>
                <p className="-mt-1 text-xs font-medium text-cyan-600">Dock</p>
              </div>
            </div>
            <button className="rounded-md p-2 hover:bg-gray-100 lg:hidden" onClick={toggle} aria-label="Fechar menu">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-cyan-50 text-cyan-700 border-r-2 border-cyan-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                  onClick={() => {
                    if (typeof window !== "undefined" && window.innerWidth < 1024) toggle();
                  }}
                >
                  <item.icon className={cn("mr-3 h-5 w-5", active ? "text-cyan-600" : "text-gray-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-red-400 font-semibold text-white">{initials}</div>
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
          "fixed inset-0 bg-black/40 z-30 transition-opacity lg:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={toggle}
        aria-hidden="true"
      />
    </>
  );
}
