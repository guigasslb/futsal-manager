import type { Escalao, Modalidade, Seccao } from "@prisma/client";

/**
 * Helpers puros (sem acesso a dados) para relacionar escalões com a modalidade da
 * sua secção (§3.2). Usados pelos Server Components do plantel para enriquecer os
 * escalões com a modalidade sem tocar nas Server Actions.
 */

/** Mapa `escalaoId → modalidade` da secção do escalão. `null` se o escalão não
 * tem secção associada (backfill pendente — Apêndice C). */
export function mapaModalidadePorEscalao(
  escaloes: Pick<Escalao, "id" | "seccaoId">[],
  seccoes: Pick<Seccao, "id" | "modalidade">[],
): Map<string, Modalidade | null> {
  const modPorSeccao = new Map<string, Modalidade>(
    seccoes.map((s) => [s.id, s.modalidade]),
  );
  return new Map(
    escaloes.map((e) => [
      e.id,
      e.seccaoId ? (modPorSeccao.get(e.seccaoId) ?? null) : null,
    ]),
  );
}

/** Escalões enriquecidos com a modalidade da secção, para o `AtletaForm`. */
export function escaloesComModalidade(
  escaloes: Pick<Escalao, "id" | "nome" | "seccaoId">[],
  seccoes: Pick<Seccao, "id" | "modalidade">[],
): { id: string; nome: string; modalidade: Modalidade | null }[] {
  const mapa = mapaModalidadePorEscalao(escaloes, seccoes);
  return escaloes.map((e) => ({
    id: e.id,
    nome: e.nome,
    modalidade: mapa.get(e.id) ?? null,
  }));
}
