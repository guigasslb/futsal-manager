"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CAMPO_W, CAMPO_H, LinhasCampo, ElementoSVG } from "./desenho";
import type { DiagramaCampo, ElementoCampo } from "@/lib/schemas/exercicio";

type Pos = { x: number; y: number };

// Cada passo captura TODAS as posições dos elementos-ponto → é um keyframe completo.
// Sem passos: cena estática (só a base). Com passos: playback passo[0] → passo[1] → …
function construirKeyframes(diagrama: DiagramaCampo): Map<string, Pos>[] {
  const base = new Map<string, Pos>();
  for (const el of diagrama.elementos) {
    if ("x" in el && "y" in el) base.set(el.id, { x: el.x, y: el.y });
  }
  const passos = [...(diagrama.passos ?? [])].sort((a, b) => a.ordem - b.ordem);
  if (passos.length === 0) return [base];

  return passos.map((passo) => {
    const m = new Map(base);
    for (const p of passo.posicoes) m.set(p.elementoId, { x: p.x, y: p.y });
    return m;
  });
}

const DURACAO_PADRAO = 900;

export function CampoAnimado({ diagrama, className }: { diagrama: DiagramaCampo; className?: string }) {
  const keyframes = construirKeyframes(diagrama);
  const temAnimacao = keyframes.length > 1;
  const [posicoes, setPosicoes] = useState<Map<string, Pos>>(keyframes[0]);
  const [aPlay, setAPlay] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!aPlay) return;
    let segmento = 0;
    let inicio = performance.now();

    const passos = [...(diagrama.passos ?? [])].sort((a, b) => a.ordem - b.ordem);

    function frame(agora: number) {
      const dur = passos[segmento]?.duracaoMs ?? DURACAO_PADRAO;
      const t = Math.min(1, (agora - inicio) / dur);
      const de = keyframes[segmento];
      const para = keyframes[segmento + 1];
      const interp = new Map<string, Pos>();
      for (const [id, p] of para) {
        const p0 = de.get(id) ?? p;
        interp.set(id, { x: p0.x + (p.x - p0.x) * t, y: p0.y + (p.y - p0.y) * t });
      }
      setPosicoes(interp);

      if (t >= 1) {
        segmento++;
        if (segmento >= keyframes.length - 1) {
          setAPlay(false);
          return;
        }
        inicio = agora;
      }
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aPlay]);

  function reiniciar() {
    setAPlay(false);
    setPosicoes(keyframes[0]);
  }

  // Aplica posições animadas aos elementos-ponto.
  const elementos: ElementoCampo[] = diagrama.elementos.map((el) => {
    if ("x" in el && "y" in el) {
      const p = posicoes.get(el.id);
      return p ? { ...el, x: p.x, y: p.y } : el;
    }
    return el;
  });

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${CAMPO_W} ${CAMPO_H}`}
        className={className ?? "w-full h-auto rounded-md"}
        role="img"
        aria-label="Diagrama animado de campo de futsal"
      >
        <LinhasCampo />
        {elementos.map((el) => (
          <ElementoSVG key={el.id} elemento={el} />
        ))}
      </svg>

      {temAnimacao && (
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => (aPlay ? setAPlay(false) : (reiniciar(), setAPlay(true)))}>
            {aPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {aPlay ? "Pausar" : "Reproduzir"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={reiniciar}>
            <RotateCcw className="h-4 w-4" />
            Reiniciar
          </Button>
          <span className="text-legenda text-cinza-500">{keyframes.length - 1} passo(s)</span>
        </div>
      )}
    </div>
  );
}
