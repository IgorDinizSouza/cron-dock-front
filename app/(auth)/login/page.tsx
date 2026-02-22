import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh w-full items-start justify-center overflow-hidden p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/login.png')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/15 via-slate-900/25 to-slate-950/45" />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center pt-10 sm:pt-12 md:pt-14">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl drop-shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
            <span className="text-[#0B4FA8]">Cron</span>
            <span className="text-[#F97316]">Dock</span>
          </h1>
          <p className="mt-1 text-xl font-semibold italic text-slate-600 sm:text-2xl md:text-3xl">
            Agendas e pátio
          </p>
        </div>

        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/25 bg-white/92 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
