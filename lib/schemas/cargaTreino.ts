import { z } from "zod";

// P4.8 (§8.20) — Carga de treino (RPE / ACWR).
// RPE (Rate of Perceived Exertion) na escala CR10 (1-10). Fonte única partilhada
// cliente/servidor. A carga da sessão (sRPE) = duracaoMin × rpe.

/** RPE individual de um atleta para uma sessão. */
export const registarRpeSchema = z.object({
  sessaoId: z.string().cuid("Sessão inválida"),
  rpe: z
    .number({ invalid_type_error: "Indica um valor de RPE" })
    .int("O RPE tem de ser um número inteiro")
    .min(1, "O RPE mínimo é 1")
    .max(10, "O RPE máximo é 10"),
});

export type RegistarRpeInput = z.infer<typeof registarRpeSchema>;

/** RPE da sessão atribuído pelo treinador. */
export const registarRpeSessaoSchema = z.object({
  sessaoId: z.string().cuid("Sessão inválida"),
  rpeSessao: z
    .number({ invalid_type_error: "Indica um valor de RPE" })
    .int("O RPE tem de ser um número inteiro")
    .min(1, "O RPE mínimo é 1")
    .max(10, "O RPE máximo é 10"),
});

export type RegistarRpeSessaoInput = z.infer<typeof registarRpeSessaoSchema>;

/** Número de semanas por omissão na curva de carga do escalão. */
export const SEMANAS_CARGA_DEFAULT = 8;

/**
 * Número de semanas por omissão no ACWR individual por atleta (F2.1, §8.20):
 * 4 semanas de carga crónica + 2 de contexto imediato.
 */
export const SEMANAS_CARGA_ATLETA_DEFAULT = 6;

/** Input da leitura de carga/ACWR individual por atleta de um escalão. */
export const obterCargaAtletasSchema = z.object({
  escalaoId: z.string().cuid("Escalão inválido"),
  semanas: z
    .number({ invalid_type_error: "Indica o número de semanas" })
    .int("As semanas têm de ser um número inteiro")
    .min(1, "Mínimo de 1 semana")
    .max(52, "Máximo de 52 semanas")
    .optional(),
});

export type ObterCargaAtletasInput = z.infer<typeof obterCargaAtletasSchema>;
