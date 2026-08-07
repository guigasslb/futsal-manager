"use client";

import { Backpack, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROPRIEDADES_CONTEUDO, type PropriedadeConteudoValor } from "@/lib/schemas/exercicio";

const OPCOES: {
  valor: PropriedadeConteudoValor;
  titulo: string;
  icone: typeof Backpack;
}[] = [
  { valor: "TREINADOR", titulo: "Biblioteca pessoal", icone: Backpack },
  { valor: "CLUBE", titulo: "Biblioteca do clube", icone: Landmark },
];

/**
 * Toggle de propriedade do conteúdo metodológico (secção 4.2 — decisão definitiva):
 * o treinador escolhe, na criação, se o conteúdo é 🎒 pessoal (portátil, default)
 * ou 🏛️ do clube (fica no clube, partilhado com a equipa técnica).
 */
export function ToggleBiblioteca({
  valor,
  onChange,
  disabled,
  legenda = "Onde fica guardado",
}: {
  valor: PropriedadeConteudoValor;
  onChange: (valor: PropriedadeConteudoValor) => void;
  disabled?: boolean;
  legenda?: string;
}) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="mb-2 text-corpo font-medium text-cinza-900">{legenda}</legend>
      <div
        role="radiogroup"
        aria-label={legenda}
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {OPCOES.map(({ valor: v, titulo, icone: Icone }) => {
          const ativo = valor === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={ativo}
              disabled={disabled}
              onClick={() => onChange(v)}
              className={cn(
                "flex min-h-[44px] items-center gap-2 rounded-md border px-3 py-2.5 text-left text-corpo font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50",
                ativo
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-cinza-200 text-cinza-600 hover:border-cinza-300 hover:text-cinza-900",
              )}
            >
              <Icone className="h-4 w-4 flex-shrink-0" />
              <span>{titulo}</span>
            </button>
          );
        })}
      </div>
      <p className="text-legenda text-cinza-500">
        Pessoal: leva contigo se mudares de clube. Do clube: partilhada com toda a
        equipa técnica.
      </p>
    </fieldset>
  );
}

/** Reexportado por conveniência para quem só precisa das opções válidas. */
export { PROPRIEDADES_CONTEUDO };
