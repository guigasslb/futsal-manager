"use client";

import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MomentoJogo } from "@prisma/client";

const SENTINEL_TODOS = "__todos__";

/**
 * Filtro de escalão da listagem do modelo de jogo. Os valores atuais chegam por
 * props (a página é um Server Component), evitando `useSearchParams`.
 */
export function FiltroEscalaoModelo({
  escaloes,
  escalaoId,
  momento,
}: {
  escaloes: { id: string; nome: string }[];
  escalaoId?: string;
  momento?: MomentoJogo;
}) {
  const router = useRouter();

  function alterar(valor: string) {
    const params = new URLSearchParams();
    if (valor !== SENTINEL_TODOS) params.set("escalaoId", valor);
    if (momento) params.set("momento", momento);
    const qs = params.toString();
    router.push(qs ? `/modelo-jogo?${qs}` : "/modelo-jogo");
  }

  return (
    <div className="flex max-w-xs flex-col gap-1.5">
      <Label htmlFor="filtro-escalao">Escalão</Label>
      <Select value={escalaoId ?? SENTINEL_TODOS} onValueChange={alterar}>
        <SelectTrigger id="filtro-escalao" className="h-11">
          <SelectValue placeholder="Todos os escalões" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SENTINEL_TODOS}>Todos os escalões</SelectItem>
          {escaloes.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
