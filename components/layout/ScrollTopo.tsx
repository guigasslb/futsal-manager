"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Faz scroll para o topo do contentor de conteúdo sempre que a rota muda.
 *
 * O contentor de scroll da app é o `<main class="app-surface">` (não a janela),
 * por isso o scroll é aplicado a esse elemento. Respeita `prefers-reduced-motion`
 * usando um salto instantâneo (sem animação).
 */
export function ScrollTopo() {
  const pathname = usePathname();

  useEffect(() => {
    const main = document.querySelector<HTMLElement>("main.app-surface");
    if (main) {
      main.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
