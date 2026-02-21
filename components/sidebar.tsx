"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building, Calendar, Home, KeyRound, Settings, Shield, ShoppingCart, Stethoscope, UsersIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/contexts/sidebar-context"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Grupo empresarial", href: "/grupos-empresariais", icon: Building },
  { name: "Pedidos", href: "/pedidos", icon: ShoppingCart },
  { name: "Agendamentos", href: "/agendamentos", icon: Calendar },
  { name: "Usuarios", href: "/usuarios", icon: UsersIcon },
  { name: "Perfis", href: "/perfis", icon: Shield },
  { name: "Roles", href: "/roles", icon: KeyRound },
  { name: "Configuracoes", href: "/configuracoes", icon: Settings },
]

function readJwtPayload(): any | null {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem("authToken")
  if (!token) return null
  const parts = token.split(".")
  if (parts.length !== 3) return null
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const json = typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("utf-8")
    return JSON.parse(json)
  } catch {
    return null
  }
}

function getInitials(fullName?: string) {
  if (!fullName) return "U"
  const letters = fullName
    .trim()
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
  return (letters[0] || "") + (letters[1] || "")
}

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebar()

  const [userName, setUserName] = useState<string>("Usuario")
  const [userRole, setUserRole] = useState<string>("")
  const initials = useMemo(() => getInitials(userName), [userName])

  useEffect(() => {
    const p = readJwtPayload()
    const nome = p?.nome || p?.name || p?.email || "Usuario"
    const perfil = p?.perfil || p?.role || ""
    setUserName(String(nome))
    setUserRole(String(perfil))
  }, [])

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Menu lateral"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-cyan-600 rounded-lg grid place-items-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-lg text-gray-900 leading-tight">Conect</h1>
                <p className="text-xs text-cyan-600 font-medium -mt-1">Odonto</p>
              </div>
            </div>
            <button className="lg:hidden p-2 rounded-md hover:bg-gray-100" onClick={toggle} aria-label="Fechar menu">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    active
                      ? "bg-cyan-50 text-cyan-700 border-r-2 border-cyan-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                  onClick={() => {
                    if (typeof window !== "undefined" && window.innerWidth < 1024) toggle()
                  }}
                >
                  <item.icon className={cn("mr-3 h-5 w-5", active ? "text-cyan-600" : "text-gray-400")} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-400 text-white rounded-full grid place-items-center font-semibold">{initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                {userRole && <p className="text-xs text-gray-500 truncate">{userRole}</p>}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={toggle}
        aria-hidden="true"
      />
    </>
  )
}

