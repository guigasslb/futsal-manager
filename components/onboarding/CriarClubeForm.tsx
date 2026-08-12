"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarClube } from "@/lib/actions/onboarding";

export function CriarClubeForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [corPrimaria, setCorPrimaria] = useState("#1A2FD4");
  const [corSecundaria, setCorSecundaria] = useState("#FFD700");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    startTransition(async () => {
      const res = await criarClube({
        nome: fd.get("nome"),
        corPrimaria,
        corSecundaria,
      });
      if (res.sucesso) {
        toast.success("Clube criado");
        router.push("/onboarding");
        router.refresh();
      } else {
        setErro(res.erro);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {erro && <p className="text-corpo-sec text-vermelho-600">{erro}</p>}
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome do clube *</Label>
        <Input id="nome" name="nome" required minLength={2} maxLength={100} placeholder="ex: Juventude Sport Clube" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Cor primária</Label>
          <input
            type="color"
            value={corPrimaria}
            onChange={(e) => setCorPrimaria(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border border-cinza-200"
            aria-label="Cor primária"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Cor secundária</Label>
          <input
            type="color"
            value={corSecundaria}
            onChange={(e) => setCorSecundaria(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border border-cinza-200"
            aria-label="Cor secundária"
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "A criar…" : "Criar clube"}
      </Button>
    </form>
  );
}
