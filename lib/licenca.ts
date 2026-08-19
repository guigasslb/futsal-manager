import { prisma } from "@/lib/db";
import type { Licenca } from "@prisma/client";

// ─────────────────────────────────────────────
// Guarda de licença (§3.11 / §17) — enforcement de acesso à plataforma.
//
// Separado da autenticação (Auth.js): a autenticação diz QUEM é o utilizador;
// a licença diz SE o clube/utilizador tem subscrição válida para usar a app.
//
// NOTA sobre "trial": o enum EstadoLicenca (schema) não tem um estado TRIAL —
// tem ATIVA | EXPIRADA | CANCELADA | SUSPENSA. Um período experimental é, no
// modelo, uma licença ATIVA com `dataFim` no futuro; quando essa data passa, a
// licença deixa de ser válida mesmo que o estado ainda não tenha transitado
// para EXPIRADA (transição essa que dependerá do billing, ainda deferido).
// Por isso a validade considera SEMPRE o par (estado, dataFim).
// ─────────────────────────────────────────────

/** Campos mínimos necessários para avaliar a validade de uma licença. */
export type LicencaAvaliavel = Pick<Licenca, "estado" | "dataFim">;

/**
 * Função PURA (sem infra) — testável isoladamente.
 *
 * Uma licença dá acesso à plataforma quando:
 *   1. está ATIVA, e
 *   2. não tem `dataFim`, OU essa data ainda não passou (trial/renovação válidos).
 *
 * `null` (sem licença) → inválida. Qualquer estado != ATIVA → inválido.
 */
export function licencaValida(
  licenca: LicencaAvaliavel | null | undefined,
  agora: Date = new Date(),
): boolean {
  if (!licenca) return false;
  if (licenca.estado !== "ATIVA") return false;
  if (licenca.dataFim && licenca.dataFim.getTime() < agora.getTime()) return false;
  return true;
}

/**
 * Verdadeiro se o clube OU o utilizador têm uma licença válida.
 *
 * A licença de Clube vive no `clube`; a licença Individual vive no `utilizador`
 * (suportada por um clube técnico invisível, §3.1). Ambas as vias dão acesso, por
 * isso a guarda aceita qualquer uma. `clubeId` e `utilizadorId` são `@unique` em
 * Licenca — no máximo uma licença por titular.
 */
export async function temLicencaValida(
  clubeId: string,
  utilizadorId: string,
): Promise<boolean> {
  const [licencaClube, licencaIndividual] = await Promise.all([
    prisma.licenca.findUnique({
      where: { clubeId },
      select: { estado: true, dataFim: true },
    }),
    prisma.licenca.findUnique({
      where: { utilizadorId },
      select: { estado: true, dataFim: true },
    }),
  ]);

  const agora = new Date();
  return licencaValida(licencaClube, agora) || licencaValida(licencaIndividual, agora);
}
