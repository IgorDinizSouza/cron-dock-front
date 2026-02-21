"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";
import { ConsultorioLoginResponse, useAuth } from "@/contexts/auth-context";
import { persistAuth } from "@/lib/auth";

type LoginApiResponse = {
  token: string;
  expiresIn: number;
  nome: string;
  perfil: string;
  consultorioId?: number;
  consultorio?:  ConsultorioLoginResponse
};

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { setSession } = useAuth(); 

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState<{ email: string; senha: string }>({ email: "", senha: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);

    
    try {
      const resp = (await authApi.login({
        email: form.email,
        senha: form.senha,
      })) as LoginApiResponse;

      if (!resp?.token) throw new Error("Resposta sem token");
      
      setSession(
        {
          token: resp.token,
          expiresIn: resp.expiresIn,
          nome: resp.nome,
          perfil: resp.perfil,
          consultorioId: resp.consultorioId ?? null,
          consultorio: resp.consultorio ?? null,
        },
        { persist: true }
      );

      persistAuth(resp.token, { consultorioId: resp.consultorioId })


      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });

      const dest = sessionStorage.getItem("postLoginRedirect") || "/";
      sessionStorage.removeItem("postLoginRedirect");
      router.replace(dest);
    } catch (err: any) {
      const status = Number(err?.status ?? err?.payload?.status ?? 0);
      const message =
        status === 401 || status === 400 || status === 403 || status === 422 || status === 500
          ? "E-mail ou senha inválidos."
          : err?.payload?.message || err?.message || "Erro no servidor. Tente novamente em instantes.";

      setErrorMsg(message);
      toast({ title: "Erro no login", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {errorMsg && (
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" value={form.email} onChange={handleChange} required autoComplete="username" />
      </div>

      <div>
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          name="senha"
          type="password"
          value={form.senha}
          onChange={handleChange}
          required
          autoComplete="current-password"
        />
      </div>

      <Button type="submit" className="w-full dental-primary" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />}
        Entrar
      </Button>

      <div className="text-center text-sm text-gray-600">
        Não tem conta?{" "}
        <Link href="/cadastro" className="text-cyan-700 hover:underline">
          Cadastre-se
        </Link>
      </div>
    </form>
  );
}
