"use client"

import type { ReactNode } from "react"
import { AuthGate } from "@/components/auth/auth-gate"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context"
import { cn } from "@/lib/utils"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    //<AuthGate>
      <SidebarProvider>
        <DashboardShell>{children}</DashboardShell>
      </SidebarProvider>
    //<AuthGate>
  )
}

function DashboardShell({ children }: { children: ReactNode }) {
  const { isOpen, toggle } = useSidebar()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header toggle={toggle} />

      <div className="flex">
        {/* Agora o Sidebar não precisa de prop: usa o contexto internamente */}
        <Sidebar />

        {/* Em mobile, sempre ml-0; em desktop alterna entre 16 e 64 */}
        <main
          className={cn(
            "flex-1 p-6 transition-[margin] duration-200",
            "ml-0",                  // mobile
            isOpen ? "lg:ml-64" : "lg:ml-16", // desktop
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
