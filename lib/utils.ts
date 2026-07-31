import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

/** Merge de classes Tailwind (shadcn/ui). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─────────────────────────────────────────────
// Tipo de resultado consistente (secção 10.1)
// ─────────────────────────────────────────────

export type Resultado<T> =
  | { sucesso: true; dados: T }
  | { sucesso: false; erro: string; camposInvalidos?: Record<string, string> };

/** Constrói um resultado de sucesso. */
export function ok<T>(dados: T): Resultado<T> {
  return { sucesso: true, dados };
}

/** Constrói um resultado de erro genérico. */
export function erro<T = never>(
  mensagem: string,
  camposInvalidos?: Record<string, string>,
): Resultado<T> {
  return { sucesso: false, erro: mensagem, camposInvalidos };
}

/**
 * Converte os erros de um ZodError no formato camposInvalidos
 * (campo -> mensagem) usado pelo Resultado<T>.
 */
export function erroDeValidacao<T = never>(
  error: z.ZodError,
  mensagem = "Dados inválidos",
): Resultado<T> {
  const camposInvalidos = Object.fromEntries(
    error.issues.map((i) => [i.path.join("."), i.message]),
  );
  return { sucesso: false, erro: mensagem, camposInvalidos };
}
