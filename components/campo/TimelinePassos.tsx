"use client";

import { ChevronUp, ChevronDown, X } from "lucide-react";
import type { PassoAnimacao } from "@/lib/schemas/exercicio";
import { DURACAO_PADRAO } from "./animacao";

export interface TimelinePassosProps {
  passos: PassoAnimacao[];
  keyframeActivo: number; // índice (-1 = base / "Início")
  onChange: (passos: PassoAnimacao[]) => void;
  onKeyframeChange: (idx: number) => void;
}

// Reindexa `ordem` sequencialmente (0..N-1) após eliminar/reordenar.
function reindexar(passos: PassoAnimacao[]): PassoAnimacao[] {
  return passos.map((p, idx) => ({ ...p, ordem: idx }));
}

export function TimelinePassos({
  passos,
  keyframeActivo,
  onChange,
  onKeyframeChange,
}: TimelinePassosProps) {
  const ordenados = [...passos].sort((a, b) => a.ordem - b.ordem);

  function eliminar(idx: number) {
    const novos = reindexar(ordenados.filter((_, i) => i !== idx));
    onChange(novos);
    // Ajusta o keyframe activo à nova lista.
    if (keyframeActivo === idx) onKeyframeChange(idx - 1);
    else if (keyframeActivo > idx) onKeyframeChange(keyframeActivo - 1);
  }

  function trocar(i: number, j: number) {
    if (j < 0 || j >= ordenados.length) return;
    const novos = [...ordenados];
    [novos[i], novos[j]] = [novos[j], novos[i]];
    onChange(reindexar(novos));
    // O keyframe activo acompanha o passo que foi movido.
    if (keyframeActivo === i) onKeyframeChange(j);
    else if (keyframeActivo === j) onKeyframeChange(i);
  }

  function definirDuracao(idx: number, valor: string) {
    const ms = Number(valor);
    const duracaoMs = Number.isFinite(ms)
      ? Math.max(100, Math.min(10000, Math.round(ms)))
      : undefined;
    onChange(ordenados.map((p, i) => (i === idx ? { ...p, duracaoMs } : p)));
  }

  return (
    <div className="space-y-2">
      <div
        className="flex items-stretch gap-2 overflow-x-auto pb-1"
        role="listbox"
        aria-label="Passos da animação"
      >
        {/* Chip "Início" (base, keyframe -1) */}
        <button
          type="button"
          role="option"
          aria-selected={keyframeActivo === -1}
          onClick={() => onKeyframeChange(-1)}
          className={`flex min-h-11 flex-shrink-0 items-center rounded-md border px-3 text-corpo-sec transition-colors ${
            keyframeActivo === -1
              ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/40"
              : "border-cinza-200 text-cinza-700 hover:bg-cinza-50"
          }`}
        >
          Início
        </button>

        {ordenados.map((passo, idx) => {
          const activo = keyframeActivo === idx;
          return (
            <div
              key={passo.id}
              className={`flex min-h-11 flex-shrink-0 flex-col gap-1 rounded-md border p-2 ${
                activo
                  ? "border-primary bg-primary/5 ring-2 ring-primary/40"
                  : "border-cinza-200"
              }`}
            >
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  role="option"
                  aria-selected={activo}
                  onClick={() => onKeyframeChange(idx)}
                  className={`rounded px-2 py-1 text-corpo-sec font-medium ${
                    activo ? "text-primary" : "text-cinza-700"
                  }`}
                >
                  Passo {idx + 1}
                </button>
                <button
                  type="button"
                  onClick={() => trocar(idx, idx - 1)}
                  disabled={idx === 0}
                  aria-label={`Mover passo ${idx + 1} para trás`}
                  className="flex h-6 w-6 items-center justify-center rounded text-cinza-500 hover:bg-cinza-100 disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => trocar(idx, idx + 1)}
                  disabled={idx === ordenados.length - 1}
                  aria-label={`Mover passo ${idx + 1} para a frente`}
                  className="flex h-6 w-6 items-center justify-center rounded text-cinza-500 hover:bg-cinza-100 disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => eliminar(idx)}
                  aria-label={`Eliminar passo ${idx + 1}`}
                  className="flex h-6 w-6 items-center justify-center rounded text-vermelho-600 hover:bg-vermelho-600/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <label className="flex items-center gap-1 text-legenda text-cinza-500">
                <span>ms</span>
                <input
                  type="number"
                  min={100}
                  max={10000}
                  step={100}
                  value={passo.duracaoMs ?? ""}
                  placeholder={String(DURACAO_PADRAO)}
                  onChange={(e) => definirDuracao(idx, e.target.value)}
                  aria-label={`Duração do passo ${idx + 1} em milissegundos`}
                  className="w-20 rounded border border-cinza-200 px-1.5 py-0.5 text-corpo-sec"
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
