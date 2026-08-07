// Regras de visibilidade das bibliotecas 🎒 pessoal / 🏛️ clube (secções 3.3, 3.4 e 4.2).
// Módulo PURO (só constrói cláusulas Prisma) — partilhado pelas Server Actions de
// exercícios e de templates de sessão, que não podem exportar funções síncronas.

import type { Prisma } from "@prisma/client";

/** Origem de um item da biblioteca, para a UI distinguir 🎒 de 🏛️. */
export type OrigemBiblioteca = "PESSOAL" | "CLUBE";

/**
 * Exercícios visíveis para um membro:
 *  1. 🎒 pessoais do próprio (proprietario = TREINADOR, autorId = utilizador) —
 *     portáteis, viajam com o treinador entre clubes;
 *  2. 🏛️ do clube ativo (proprietario = CLUBE);
 *  3. 🏛️ pessoais de qualquer treinador partilhados neste clube (PartilhaExercicioClube).
 *
 * Nota (fase expand F3/M5): enquanto o backfill M6 não corre, os exercícios
 * existentes têm `clubeProprietarioId = null` e só o `clubeId` legado preenchido —
 * daí a terceira alternativa, que os mantém visíveis.
 */
export function filtroExerciciosVisiveis(
  clubeId: string,
  utilizadorId: string,
): Prisma.ExercicioWhereInput {
  return {
    OR: [
      { proprietario: "TREINADOR", autorId: utilizadorId },
      { proprietario: "CLUBE", clubeProprietarioId: clubeId },
      { proprietario: "CLUBE", clubeProprietarioId: null, clubeId },
      { partilhasClube: { some: { clubeId } } },
    ],
  };
}

/**
 * Templates de sessão visíveis: 🎒 pessoais do próprio + 🏛️ do clube ativo.
 * (Não há partilha pontual de templates — a contribuição transfere a propriedade.)
 */
export function filtroModelosSessaoVisiveis(
  clubeId: string,
  utilizadorId: string,
): Prisma.ModeloSessaoWhereInput {
  return {
    OR: [
      { proprietario: "TREINADOR", autorId: utilizadorId },
      { proprietario: "CLUBE", clubeProprietarioId: clubeId },
    ],
  };
}

/** Classifica um item como 🎒 pessoal (do próprio) ou 🏛️ do clube. */
export function origemDoItem(
  item: { proprietario: "CLUBE" | "TREINADOR"; autorId: string | null },
  utilizadorId: string,
): OrigemBiblioteca {
  return item.proprietario === "TREINADOR" && item.autorId === utilizadorId
    ? "PESSOAL"
    : "CLUBE";
}
