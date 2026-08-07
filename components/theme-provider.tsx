"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Fornecedor de tema (F14 — §12.0/§12.1).
 *
 * O **tema escuro é a base do produto** (`defaultTheme="dark"`), fiel à direção
 * visual da bíblia. Mantém-se, no entanto, uma **alternância claro/escuro**
 * (botão lua/sol na barra de topo) com a preferência persistida em
 * `localStorage` (gerido pelo `next-themes` através do atributo `class`).
 *
 * `enableSystem={false}` — a escolha é explícita do utilizador; o produto não
 * segue automaticamente o SO (o default é o escuro da marca).
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="futsalcoach-tema"
      themes={["light", "dark"]}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
