"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const TODOS = "__todos__";

interface EscalaoOpcao {
  id: string;
  nome: string;
}

/**
 * Filtro por escalão da agenda do clube (P2.2 — bíblia §8.x).
 * Escreve `?escalaoId=<id>` na URL — a página é um Server Component e volta a
 * chamar `obterAgendaClube` com o filtro. «Todos os escalões» limpa o filtro
 * (comportamento por defeito). O `useTransition` dá o estado de carregamento
 * enquanto a página recalcula no servidor.
 */
export function FiltroEscalaoAgenda({
  escaloes,
  escalaoId,
}: {
  escaloes: EscalaoOpcao[];
  escalaoId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function definir(valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor === TODOS) params.delete("escalaoId");
    else params.set("escalaoId", valor);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 print:hidden">
      <div className="space-y-1.5">
        <Label htmlFor="filtro-escalao-agenda">Escalão</Label>
        <Select
          value={escalaoId ?? TODOS}
          onValueChange={definir}
          disabled={pending}
        >
          <SelectTrigger id="filtro-escalao-agenda" className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os escalões</SelectItem>
            {escaloes.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {pending && (
        <p className="pb-3 text-legenda text-cinza-500" role="status">
          A atualizar…
        </p>
      )}
    </div>
  );
}
