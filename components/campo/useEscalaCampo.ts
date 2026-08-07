"use client";

import { useEffect, useState, type RefObject } from "react";
import { CAMPO_W } from "./desenho";

// Escala do campo em px por unidade (largura renderizada / CAMPO_W).
// Serve para converter alvos de toque (px) em unidades do viewBox.
export function useEscalaCampo(svgRef: RefObject<SVGSVGElement | null>) {
  const [escala, setEscala] = useState(1);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const largura = entry.contentRect.width;
      if (largura > 0) setEscala(largura / CAMPO_W);
    });
    ro.observe(svg);
    return () => ro.disconnect();
  }, [svgRef]);

  return escala;
}
