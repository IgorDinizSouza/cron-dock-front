"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { login } from "@/lib/login";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { setSession } = useAuth();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{ usuario: string; senha: string }>({ usuario: "", senha: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const user = await login({
        usuario: form.usuario,
        senha: form.senha,
      });

      setSession(
        {
          user,
          nome: user.descricao,
          perfil: user.perfis?.[0]?.descricao,
          perfis: user.perfis,
          roles: user.perfis.flatMap((perfil) => perfil.roles || []),
          authenticatedAt: new Date().toISOString(),
        },
        { persist: true },
      );

      if (typeof window !== "undefined") {
        if (user.grupoEmpresarialId != null) {
          localStorage.setItem("grupoEmpresarialId", String(user.grupoEmpresarialId));
        } else {
          localStorage.removeItem("grupoEmpresarialId");
        }
      }

      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });

      const dest = sessionStorage.getItem("postLoginRedirect") || "/";
      sessionStorage.removeItem("postLoginRedirect");
      router.replace(dest);
    } catch (err: any) {
      const status = Number(err?.status ?? err?.payload?.status ?? 0);
      const rawMessage = String(err?.payload?.message || err?.message || "");
      const lower = rawMessage.toLowerCase();
      const isNetworkError = lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("fetch");

      const message = isNetworkError
        ? "Não foi possível realizar o login, tente novamente mais tarde"
        : status === 401 || status === 400 || status === 403 || status === 422
          ? "Usuario ou senha invalidos."
          : status === 500
            ? "Falha ao autenticar. Verifique o backend."
            : rawMessage || "Erro no servidor. Tente novamente em instantes.";

      toast({ title: "Erro no login", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="usuario">Usuário</Label>
        <Input
          id="usuario"
          name="usuario"
          value={form.usuario}
          onChange={handleChange}
          required
          autoComplete="username"
        />
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

      <Button type="submit" className="w-full btn-primary-custom" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
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
