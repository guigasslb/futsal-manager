"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registar } from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegistarForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erros, setErros] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErros({});
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await registar({
        nome: fd.get("nome"),
        email: fd.get("email"),
        password: fd.get("password"),
      });
      if (res.sucesso) {
        toast.success("Conta criada. Inicia sessão.");
        router.push("/login");
      } else {
        if (res.camposInvalidos) setErros(res.camposInvalidos);
        toast.error(res.erro);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" name="nome" required minLength={2} />
        {erros.nome && <p className="text-legenda text-vermelho-600">{erros.nome}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="treinador@clube.pt" />
        {erros.email && <p className="text-legenda text-vermelho-600">{erros.email}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required minLength={8} placeholder="••••••••" />
        {erros.password && <p className="text-legenda text-vermelho-600">{erros.password}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "A criar…" : "Criar conta"}
      </Button>
    </form>
  );
}
