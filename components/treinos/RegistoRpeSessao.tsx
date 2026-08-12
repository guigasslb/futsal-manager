"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Activity } from "lucide-react";
import { registarRpeSessao } from "@/lib/actions/cargaTreino";

const VALORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Cor da escala CR10 — verde (leve) → âmbar → vermelho (máximo). */
function corEscala(v: number): string {
  if (v <= 3) return "#1E9E5A";
  if (v <= 6) return "#E0900A";
  return "#D33A3A";
}

/**
 * Regista o RPE da sessão (1-10, escala CR10) atribuído pelo treinador (§8.20).
 * Guarda ao clicar; usado no cálculo semanal de carga/ACWR.
 */
export function RegistoRpeSessao({
  sessaoId,
  rpeInicial,
}: {
  sessaoId: string;
  rpeInicial: number | null;
}) {
  const [valor, setValor] = useState<number | null>(rpeInicial);
  const [pending, startTransition] = useTransition();

  function selecionar(v: number) {
    const anterior = valor;
    setValor(v);
    startTransition(async () => {
      const res = await registarRpeSessao(sessaoId, v);
      if (!res.sucesso) {
        setValor(anterior);
        toast.error(res.erro);
      } else {
        toast.success(`RPE da sessão registado: ${v}/10`);
      }
    });
  }

  return (
    <section className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="text-corpo font-semibold text-cinza-900">Carga da sessão (RPE)</h2>
      </div>
      <p className="mt-1 text-corpo-sec text-cinza-500">
        Esforço percebido da sessão na escala 1–10 (CR10). Alimenta a análise de carga
        e o ACWR do escalão.
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="RPE da sessão">
        {VALORES.map((v) => {
          const ativo = valor === v;
          return (
            <button
              key={v}
              type="button"
              disabled={pending}
              aria-pressed={ativo}
              onClick={() => selecionar(v)}
              className="flex h-11 w-11 items-center justify-center rounded-md border text-corpo font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
              style={
                ativo
                  ? { background: corEscala(v), borderColor: corEscala(v), color: "#fff" }
                  : { borderColor: "#E4E1DB", color: "#3A3A3A" }
              }
            >
              {v}
            </button>
          );
        })}
      </div>

      {valor !== null && (
        <p className="mt-3 text-legenda text-cinza-500">
          Registado: <span className="font-semibold text-cinza-900">{valor}/10</span>
        </p>
      )}
    </section>
  );
}
