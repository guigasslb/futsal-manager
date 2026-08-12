"use client";

import { useState } from "react";
import type { RankingMetrica } from "@/lib/actions/analise";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { n1 } from "./Cartao";

/**
 * Ranking de atletas por métrica configurável do clube (Nível 2 — bíblia §10.2).
 * Recebe os rankings já agregados por `obterAnaliticoEscalao` (um por métrica com
 * valores) e deixa o treinador escolher qual métrica ver. O valor mostrado por
 * atleta segue o `tipo` da métrica (NUMERO → Σ; BOOLEANO → nº registos; ESCALA →
 * média), calculado no servidor. Só deve ser renderizado quando há rankings.
 */
export function RankingsMetricas({ rankings }: { rankings: RankingMetrica[] }) {
  const [selecionada, setSelecionada] = useState(rankings[0]?.metrica ?? "");
  const atual = rankings.find((r) => r.metrica === selecionada) ?? rankings[0];
  if (!atual) return null;

  return (
    <div className="rounded-lg border border-cinza-200 bg-white p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <p className="text-legenda font-medium uppercase tracking-wide text-cinza-400">
          Ranking por métrica
        </p>
        {rankings.length > 1 && (
          <div className="space-y-1.5 print:hidden">
            <Label htmlFor="ranking-metrica" className="sr-only">
              Métrica
            </Label>
            <Select value={atual.metrica} onValueChange={setSelecionada}>
              <SelectTrigger id="ranking-metrica" className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rankings.map((r) => (
                  <SelectItem key={r.metrica} value={r.metrica}>
                    {r.metrica}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <p className="mb-2 text-corpo font-semibold text-cinza-900">{atual.metrica}</p>
      <ol className="divide-y divide-cinza-100">
        {atual.top.map((a, i) => (
          <li
            key={a.atletaId}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-5 text-legenda font-semibold text-cinza-400">
                {i + 1}
              </span>
              <span className="truncate text-corpo text-cinza-900">
                {a.atletaNome}
              </span>
            </div>
            <span className="text-corpo font-semibold text-primary">
              {n1(a.valor)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
