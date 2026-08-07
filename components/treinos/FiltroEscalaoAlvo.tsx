"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TODOS = "__todos__";

/** Filtro por escalão alvo dos templates de sessão (escreve na URL). */
export function FiltroEscalaoAlvo({
  valor,
  opcoes,
}: {
  valor?: string;
  opcoes: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function definir(novo: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (novo === TODOS) params.delete("escalaoAlvo");
    else params.set("escalaoAlvo", novo);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="filtro-escalao-alvo">Escalão alvo</Label>
      <Select value={valor ?? TODOS} onValueChange={definir} disabled={pending}>
        <SelectTrigger id="filtro-escalao-alvo" className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos os escalões</SelectItem>
          {opcoes.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
