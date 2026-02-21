import { LoginForm } from "@/components/auth/login-form"

const ConnectOdontoLogo = () => (
  <div className="flex flex-col items-center gap-2 mb-8">
    <h1 className="text-5xl font-bold tracking-tight">
      <span className="text-cyan-400">Conect</span> <span className="text-blue-500">Odonto</span>
    </h1>
    <p className="text-white/90 text-sm font-medium tracking-wide">Sistema de Gestão Odontológica Inteligente</p>
  </div>
)

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/modern-dental-office-equipment-only.jpg')`,
        }}
      />
      <div className="absolute inset-0 bg-slate-900/70" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center">
          <ConnectOdontoLogo />
        </div>

        <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-8">
          <LoginForm />
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-white/80">© 2025 Conect Odonto. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}
