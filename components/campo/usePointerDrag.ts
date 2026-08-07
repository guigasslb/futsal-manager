"use client";

import { useRef, type RefObject, type PointerEvent as ReactPointerEvent } from "react";
import { CAMPO_W, CAMPO_H } from "./desenho";
import { raioHitEfetivo, type Pos } from "./animacao";
import type { DiagramaCampo } from "@/lib/schemas/exercicio";

// Encapsula a mecânica de arrastar no editor:
//  - conversão coords cliente → viewBox (clamp ao campo);
//  - setPointerCapture ao iniciar (corrige B1: drag perde-se fora do SVG em tablet);
//  - snapshot pré-drag para o undo (corrige B2: undo tem de reverter o drag).
export function usePointerDrag(
  svgRef: RefObject<SVGSVGElement | null>,
  escala: number,
) {
  // Snapshot do diagrama ANTES do drag começar (para o histórico de undo).
  // Diagrama completo (não só elementos) porque o drag pode editar a base
  // (keyframe 0) ou o delta de um passo de animação — o undo tem de reverter
  // qualquer um dos casos.
  const snapshotRef = useRef<DiagramaCampo | null>(null);

  function paraCoordenadas(e: ReactPointerEvent): Pos | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const x = ((e.clientX - rect.left) / rect.width) * CAMPO_W;
    const y = ((e.clientY - rect.top) / rect.height) * CAMPO_H;
    return {
      x: Math.max(0, Math.min(CAMPO_W, x)),
      y: Math.max(0, Math.min(CAMPO_H, y)),
    };
  }

  function iniciarCaptura(e: ReactPointerEvent) {
    svgRef.current?.setPointerCapture(e.pointerId);
  }

  function terminarCaptura(e: ReactPointerEvent) {
    try {
      svgRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // O ponteiro pode já ter sido libertado; ignorar.
    }
  }

  return {
    paraCoordenadas,
    iniciarCaptura,
    terminarCaptura,
    snapshotRef,
    // Raio de hit em unidades (alvo ≥32px mesmo em ecrãs pequenos).
    raioHit: raioHitEfetivo(escala),
  };
}
