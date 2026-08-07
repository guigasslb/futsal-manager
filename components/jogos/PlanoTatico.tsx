"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { definirPlanoTatico } from "@/lib/actions/jogos";
import { LABEL_POSICAO } from "@/lib/schemas/atleta";
import type { Posicao } from "@prisma/client";

type Convocado = {
  id: string;
  nome: string;
  numero: number | null;
  posicoes: Posicao[];
};

type LinhaPlano = { posicaoPrevista: Posicao | null; titularPrevisto: boolean };

const POSICOES: Posicao[] = ["GUARDA_REDES", "FIXO", "ALA", "PIVO", "UNIVERSAL"];

/** Linhas de formação (dia de jogo): agrupamento das posições por sector. */
const LINHAS: { titulo: string; posicoes: Posicao[] }[] = [
  { titulo: "Guarda-redes", posicoes: ["GUARDA_REDES"] },
  { titulo: "Defesa", posicoes: ["FIXO"] },
  { titulo: "Meio", posicoes: ["ALA", "UNIVERSAL"] },
  { titulo: "Avançado", posicoes: ["PIVO"] },
];

export function PlanoTatico({
  jogoId,
  convocados,
  planoInicial,
}: {
  jogoId: string;
  convocados: Convocado[];
  planoInicial: Record<string, LinhaPlano>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [plano, setPlano] = useState<Record<string, LinhaPlano>>(() => {
    const inicial: Record<string, LinhaPlano> = {};
    for (const c of convocados) {
      inicial[c.id] = planoInicial[c.id] ?? {
        posicaoPrevista: c.posicoes[0] ?? null,
        titularPrevisto: false,
      };
    }
    return inicial;
  });

  const linhaDe = (id: string): LinhaPlano =>
    plano[id] ?? { posicaoPrevista: null, titularPrevisto: false };

  function definirPosicao(id: string, posicao: Posicao | null) {
    setPlano((prev) => ({ ...prev, [id]: { ...linhaDe(id), posicaoPrevista: posicao } }));
  }

  function definirTitular(id: string, titular: boolean) {
    setPlano((prev) => ({ ...prev, [id]: { ...linhaDe(id), titularPrevisto: titular } }));
  }

  function guardar() {
    const payload = convocados.map((c) => {
      const l = linhaDe(c.id);
      return {
        convocadoId: c.id,
        posicaoPrevista: l.posicaoPrevista,
        titularPrevisto: l.titularPrevisto,
      };
    });
    startTransition(async () => {
      const res = await definirPlanoTatico(jogoId, payload);
      if (res.sucesso) {
        toast.success("Plano tático guardado");
        router.refresh();
      } else {
        toast.error(res.erro);
      }
    });
  }

  if (convocados.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-cinza-300 p-4 text-center text-corpo-sec text-cinza-500">
        Define a convocatória primeiro para preparar o plano de dia de jogo.
      </p>
    );
  }

  const titulares = convocados.filter((c) => linhaDe(c.id).titularPrevisto);

  return (
    <div className="space-y-5">
      {/* Formação visual (titulares por linha) */}
      <div className="rounded-lg border border-cinza-200 bg-cinza-50 p-4">
        <p className="mb-3 text-legenda font-medium uppercase tracking-wide text-cinza-500">
          Formação prevista ({titulares.length} titular
          {titulares.length === 1 ? "" : "es"})
        </p>
        {titulares.length === 0 ? (
          <p className="text-corpo-sec text-cinza-500">
            Marca os titulares para veres a formação.
          </p>
        ) : (
          <div className="space-y-3">
            {LINHAS.map((linha) => {
              const daLinha = titulares.filter((c) => {
                const pos = linhaDe(c.id).posicaoPrevista;
                return pos != null && linha.posicoes.includes(pos);
              });
              if (daLinha.length === 0) return null;
              return (
                <div key={linha.titulo} className="flex flex-wrap items-center gap-2">
                  <span className="w-24 flex-shrink-0 text-legenda text-cinza-500">
                    {linha.titulo}
                  </span>
                  {daLinha.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-legenda font-medium text-primary-foreground"
                    >
                      {c.numero != null && <span className="opacity-80">#{c.numero}</span>}
                      {c.nome}
                    </span>
                  ))}
                </div>
              );
            })}
            {/* Titulares sem posição atribuída */}
            {(() => {
              const semPosicao = titulares.filter(
                (c) => linhaDe(c.id).posicaoPrevista == null,
              );
              if (semPosicao.length === 0) return null;
              return (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-24 flex-shrink-0 text-legenda text-cinza-500">
                    Sem posição
                  </span>
                  {semPosicao.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1 rounded-full bg-cinza-200 px-3 py-1 text-legenda font-medium text-cinza-700"
                    >
                      {c.numero != null && <span className="opacity-80">#{c.numero}</span>}
                      {c.nome}
                    </span>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Editor por convocado */}
      <ul className="space-y-2">
        {convocados.map((c) => {
          const l = linhaDe(c.id);
          return (
            <li
              key={c.id}
              className="flex flex-col gap-2 rounded-md border border-cinza-200 bg-white p-3 shadow-card sm:flex-row sm:items-center"
            >
              <span className="flex-1 text-corpo text-cinza-900">
                {c.numero != null && <span className="mr-1 text-cinza-400">#{c.numero}</span>}
                {c.nome}
              </span>
              <div className="flex items-center gap-2">
                <Select
                  value={l.posicaoPrevista ?? "none"}
                  onValueChange={(v) =>
                    definirPosicao(c.id, v === "none" ? null : (v as Posicao))
                  }
                >
                  <SelectTrigger className="h-11 w-40">
                    <SelectValue placeholder="Posição" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— sem posição —</SelectItem>
                    {POSICOES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {LABEL_POSICAO[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div
                  role="group"
                  aria-label="Titular ou suplente"
                  className="flex overflow-hidden rounded-md border border-cinza-200"
                >
                  <button
                    type="button"
                    onClick={() => definirTitular(c.id, true)}
                    aria-pressed={l.titularPrevisto}
                    className={`h-11 min-w-[68px] px-3 text-corpo-sec transition-colors ${
                      l.titularPrevisto
                        ? "bg-primary text-primary-foreground"
                        : "bg-white text-cinza-600 hover:bg-cinza-50"
                    }`}
                  >
                    Titular
                  </button>
                  <button
                    type="button"
                    onClick={() => definirTitular(c.id, false)}
                    aria-pressed={!l.titularPrevisto}
                    className={`h-11 min-w-[68px] border-l border-cinza-200 px-3 text-corpo-sec transition-colors ${
                      !l.titularPrevisto
                        ? "bg-cinza-700 text-white"
                        : "bg-white text-cinza-600 hover:bg-cinza-50"
                    }`}
                  >
                    Suplente
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex justify-end">
        <Button onClick={guardar} disabled={pending}>
          <Check className="h-4 w-4" />
          {pending ? "A guardar…" : "Guardar plano"}
        </Button>
      </div>
    </div>
  );
}
