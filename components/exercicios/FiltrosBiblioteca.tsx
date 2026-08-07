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
import { PARTES_TREINO, LABEL_PARTE_TREINO } from "@/lib/schemas/exercicio";
import {
  CATEGORIAS_PRINCIPAIS,
  LABEL_CATEGORIA_PRINCIPAL,
} from "@/lib/schemas/subcategoria";

const TODOS = "__todos__";

/**
 * Filtros da biblioteca de exercícios (parte do treino + categoria principal).
 * Escrevem na URL — a página é um Server Component e refaz a query no servidor.
 */
export function FiltrosBiblioteca({
  parteTreino,
  categoria,
}: {
  parteTreino?: string;
  categoria?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function definir(chave: "parte" | "categoria", valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor === TODOS) params.delete(chave);
    else params.set(chave, valor);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="filtro-parte">Parte do treino</Label>
        <Select
          value={parteTreino ?? TODOS}
          onValueChange={(v) => definir("parte", v)}
          disabled={pending}
        >
          <SelectTrigger id="filtro-parte" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas as partes</SelectItem>
            {PARTES_TREINO.map((p) => (
              <SelectItem key={p} value={p}>
                {LABEL_PARTE_TREINO[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filtro-categoria">Categoria</Label>
        <Select
          value={categoria ?? TODOS}
          onValueChange={(v) => definir("categoria", v)}
          disabled={pending}
        >
          <SelectTrigger id="filtro-categoria" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas as categorias</SelectItem>
            {CATEGORIAS_PRINCIPAIS.map((c) => (
              <SelectItem key={c} value={c}>
                {LABEL_CATEGORIA_PRINCIPAL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
