"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Limites alinhados com `subprincipiosSchema` (bíblia §3.6). */
const MAX_SUBPRINCIPIOS = 50;
const MAX_CARACTERES = 300;

/**
 * Editor de subprincípios táticos de um momento (chips editáveis).
 * O valor é um array de textos curtos, guardado em `ModeloJogo.subprincipios`.
 */
export function EditorSubprincipios({
  valor,
  onChange,
  erro,
}: {
  valor: string[];
  onChange: (lista: string[]) => void;
  erro?: string;
}) {
  const [rascunho, setRascunho] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  const cheio = valor.length >= MAX_SUBPRINCIPIOS;

  function adicionar() {
    const texto = rascunho.trim().slice(0, MAX_CARACTERES);
    if (!texto) return;
    if (cheio) {
      setAviso(`Máximo de ${MAX_SUBPRINCIPIOS} subprincípios.`);
      return;
    }
    if (valor.some((v) => v.toLowerCase() === texto.toLowerCase())) {
      setAviso("Esse subprincípio já está na lista.");
      setRascunho("");
      return;
    }
    setAviso(null);
    onChange([...valor, texto]);
    setRascunho("");
  }

  function remover(indice: number) {
    setAviso(null);
    onChange(valor.filter((_, i) => i !== indice));
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={rascunho}
          maxLength={MAX_CARACTERES}
          placeholder="ex: Sair a jogar pelo GR com apoios curtos"
          aria-label="Novo subprincípio"
          onChange={(e) => setRascunho(e.target.value)}
          onKeyDown={(e) => {
            // Enter adiciona sem submeter o formulário que envolve o editor.
            if (e.key === "Enter") {
              e.preventDefault();
              adicionar();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={adicionar}
          disabled={!rascunho.trim() || cheio}
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {aviso && <p className="text-legenda text-cinza-600">{aviso}</p>}
      {erro && <p className="text-legenda text-vermelho-600">{erro}</p>}

      {valor.length === 0 ? (
        <p className="text-legenda text-cinza-400">
          Sem subprincípios. Escreve um comportamento concreto e adiciona.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {valor.map((s, i) => (
            <li
              key={`${s}-${i}`}
              className="flex min-h-11 items-center gap-1.5 rounded-full border border-cinza-200 bg-cinza-50 py-1 pl-3 pr-1 text-corpo-sec text-cinza-800"
            >
              <span className="max-w-xs truncate">{s}</span>
              <button
                type="button"
                onClick={() => remover(i)}
                aria-label={`Remover subprincípio ${s}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-cinza-500 transition-colors hover:bg-vermelho-600/10 hover:text-vermelho-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-legenda text-cinza-400">
        {valor.length}/{MAX_SUBPRINCIPIOS} subprincípios
      </p>
    </div>
  );
}
