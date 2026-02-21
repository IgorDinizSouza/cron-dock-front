"use client"

import Image from "next/image"
import { Menu, Bell, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface HeaderProps {
  toggle: () => void
}

// Text logo using brand palette (Cron in blue, Dock in orange)
const CronDockLogo = () => (
  <div className="flex items-center select-none">
    <div className="flex items-center gap-2">
      <span className="text-3xl font-extrabold text-[#0B66C2] leading-none">Cron Dock</span>
    </div>
  </div>
)

export function Header({ toggle }: HeaderProps) {
  const router = useRouter()

  const doLogout = () => {
    clearAuth()
    router.replace("/login")
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar menu" className="hover:bg-gray-100">
            <Menu className="h-5 w-5 text-gray-700" />
          </Button>
          <CronDockLogo />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Notificações">
            <Bell className="h-5 w-5 text-gray-600 relative" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Configurações"
            onClick={() => router.push("/configuracoes")}
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={doLogout}
            className="ml-1 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  )
}
