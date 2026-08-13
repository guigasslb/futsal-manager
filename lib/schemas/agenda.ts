import { z } from "zod";

// F3.2 (§8.16) — Pré-verificação de conflitos de pavilhão na agenda.
// Fonte única partilhada cliente/servidor. A verificação é NÃO-BLOQUEANTE:
// serve apenas para avisar a UI antes de submeter a criação/edição.

/** Input da pré-verificação de conflito de agenda. `data` aceita Date ou ISO. */
export const verificarConflitoSchema = z.object({
  data: z.coerce.date({ invalid_type_error: "Data inválida" }),
  duracaoMin: z
    .number({ invalid_type_error: "Duração inválida" })
    .int("A duração tem de ser um número inteiro")
    .positive("A duração tem de ser positiva")
    .optional(),
  local: z.string(),
  tipo: z.enum(["TREINO", "JOGO"], { invalid_type_error: "Tipo inválido" }),
  excluirId: z.string().cuid("Identificador inválido").optional(),
  escalaoId: z.string().cuid("Escalão inválido"),
});

export type VerificarConflitoInput = z.input<typeof verificarConflitoSchema>;
