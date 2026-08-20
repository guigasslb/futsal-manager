// Wrapper client do GraficoBarrasH para uso em Server Components.
// Next.js 15 não permite `dynamic(..., { ssr: false })` em Server Components;
// isolar o dynamic import aqui mantém o carregamento client-only do gráfico.
"use client";

import dynamic from "next/dynamic";

export const GraficoBarrasH = dynamic(
  () => import("@/components/graficos/GraficoBarrasH").then((m) => ({ default: m.GraficoBarrasH })),
  { ssr: false },
);
