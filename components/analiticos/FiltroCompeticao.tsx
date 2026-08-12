"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { CompeticaoOpcao } from "@/lib/actions/analise";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const TODAS = "__todas__";

/**
 * Filtro por competição do painel de escalão (P2.5 — bíblia §10.2).
 * Escreve `?competicao=<id>` na URL — a página é um Server Component e volta a
 * chamar `obterAnaliticoEscalao` com `competicaoId`. «Todas» limpa o filtro
 * (comportamento por defeito, mistura todos os contextos). O `useTransition`
 * dá o estado de carregamento enquanto a página recalcula no servidor.
 */
export function FiltroCompeticao({
  competicoes,
  competicaoId,
}: {
  competicoes: CompeticaoOpcao[];
  competicaoId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function definir(valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor === TODAS) params.delete("competicao");
    else params.set("competicao", valor);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 print:hidden">
      <div className="space-y-1.5">
        <Label htmlFor="filtro-competicao">Competição</Label>
        <Select
          value={competicaoId ?? TODAS}
          onValueChange={definir}
          disabled={pending}
        >
          <SelectTrigger id="filtro-competicao" className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas as competições</SelectItem>
            {competicoes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
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
