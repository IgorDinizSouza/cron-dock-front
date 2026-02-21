"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      // guarda a rota para pós-login, se quiser
      sessionStorage.setItem("postLoginRedirect", pathname || "/")
      router.replace("/login")
      return
    }
    setReady(true)
  }, [router, pathname])

  if (!ready) return null
  return <>{children}</>
}
