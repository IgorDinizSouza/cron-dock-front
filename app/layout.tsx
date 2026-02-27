import type React from "react"
import type { Metadata } from "next"
import { Open_Sans } from "next/font/google"
import "./globals.css"
import { NotificationProvider } from "@/contexts/notification-context"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-open-sans",
})

export const metadata: Metadata = {
  title: "Cron Dock", 
  description: "Sistema de agendamento e controle de pátio",
  generator: "Cron Dock",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${openSans.variable} antialiased`}>
      <body className="font-sans bg-white text-gray-900">
        <NotificationProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </NotificationProvider>
      </body>
    </html>
  )
}
