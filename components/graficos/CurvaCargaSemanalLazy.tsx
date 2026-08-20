// Wrapper client do CurvaCargaSemanal para uso em Server Components.
// Next.js 15 não permite `dynamic(..., { ssr: false })` em Server Components;
// isolar o dynamic import aqui mantém o carregamento client-only do gráfico.
"use client";

import dynamic from "next/dynamic";

export const CurvaCargaSemanal = dynamic(
  () =>
    import("@/components/graficos/CurvaCargaSemanal").then((m) => ({
      default: m.CurvaCargaSemanal,
    })),
  { ssr: false },
);
