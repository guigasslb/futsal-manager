"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { iniciarSessao } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erros, setErros] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErros({});
    const form = new FormData(e.currentTarget);
    const dados = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    startTransition(async () => {
      const res = await iniciarSessao(dados);
      if (res.sucesso) {
        router.push("/dashboard");
        router.refresh();
      } else {
        if (res.camposInvalidos) setErros(res.camposInvalidos);
        toast.error(res.erro);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="treinador@clube.pt"
          aria-invalid={!!erros.email}
        />
        {erros.email && (
          <p className="text-legenda text-vermelho-600">{erros.email}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!erros.password}
        />
        {erros.password && (
          <p className="text-legenda text-vermelho-600">{erros.password}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "A entrar…" : "Entrar"}
      </Button>
    </form>
  );
}
