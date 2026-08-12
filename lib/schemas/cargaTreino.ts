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
