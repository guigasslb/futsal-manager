// Cálculo de preço de licença multi-secção (§17.1 / §17.3 da bíblia).
//
// Módulo PURO (sem imports de auth/prisma/next) — testável isoladamente e
// reutilizável no cliente (aviso suave de billing) e no servidor (criação/
// renovação de licença, adição de secção).
//
// Regras (decisão 2026-08-19 — fechada, §17.1):
//   - 1 secção  → preço do tier conforme a tabela (comportamento v6).
//   - 2+ secções → tier base + 50% por cada secção adicional.
//   - Individual → uma modalidade, preço mantém-se (não usa este cálculo).
//   - Parceiro   → pricing negociado (não calculável automaticamente → 0).

import type { CicloFaturacao, TierClube } from "@prisma/client";

/**
 * Preço base por tier e ciclo, em cêntimos (§17.1). O tier de um clube é
 * determinado pelo nº total de escalões (transversal às secções). O PARCEIRO é
 * negociado caso a caso, pelo que não tem preço tabelado (0 = não calculável).
 */
export const PRECO_BASE_CENTIMOS: Record<TierClube, Record<CicloFaturacao, number>> = {
  PEQUENO: { MENSAL: 1500, ANUAL: 14900 },
  MEDIO: { MENSAL: 1900, ANUAL: 19000 },
  GRANDE: { MENSAL: 3400, ANUAL: 34000 },
  PARCEIRO: { MENSAL: 0, ANUAL: 0 },
} as const;

/** Acréscimo por cada secção adicional além da primeira (§17.1: +50% do tier base). */
export const ACRESCIMO_POR_SECCAO_ADICIONAL = 0.5;

/**
 * Preço praticado de uma licença de Clube, em cêntimos, já com o acréscimo
 * multi-secção (§17.1).
 *
 * Fórmula: `base × (1 + 0.5 × (numSeccoes − 1))`, arredondado ao cêntimo.
 * Exemplos (tier PEQUENO, MENSAL, base €15,00):
 *   - numSeccoes = 1 → 1500 (€15,00)
 *   - numSeccoes = 2 → 2250 (€22,50)  (base × 1.5)
 *
 * PARCEIRO devolve 0 (pricing negociado — não calculável automaticamente).
 * `numSeccoes` é normalizado para o mínimo de 1 (defensivo).
 */
export function calcularPrecoLicenca(
  tier: TierClube,
  numSeccoes: number,
  ciclo: CicloFaturacao = "MENSAL",
): number {
  const base = PRECO_BASE_CENTIMOS[tier][ciclo];
  if (base === 0) return 0; // PARCEIRO — negociado.

  const seccoes = Math.max(1, Math.trunc(numSeccoes));
  const fator = 1 + ACRESCIMO_POR_SECCAO_ADICIONAL * (seccoes - 1);
  return Math.round(base * fator);
}
