import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-cover bg-top bg-no-repeat"
        style={{
          backgroundImage: `url('/login.png')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/35 via-slate-900/45 to-slate-950/60" />

      <div className="relative z-10 mt-28 w-full max-w-md sm:mt-32 md:mt-36">
        <div className="rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
