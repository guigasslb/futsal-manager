import { z } from "zod";

// Schemas Zod do backoffice interno da plataforma (Fase 2 — gestão de licenças
// cross-tenant). Fonte única partilhada cliente/servidor (convenção do projeto).
//
// Nota: estas operações são cross-tenant (operador do produto Mister), ao
// contrário das actions club-scoped de `lib/schemas/licenciamento.ts`.

/**
 * Mudança manual do estado de uma licença. EXPIRADA é EXCLUÍDA de propósito:
 * é um estado DERIVADO (calculado a partir de `dataFim`), nunca definido à mão.
 */
export const AlterarEstadoLicencaSchema = z.object({
  licencaId: z.string().cuid("Licença inválida"),
  estado: z.enum(["ATIVA", "SUSPENSA", "CANCELADA"]),
});

export type AlterarEstadoLicencaInput = z.infer<typeof AlterarEstadoLicencaSchema>;

/**
 * Edição da data de fim de uma licença. `null` = sem expiração (licença
 * perpétua/aberta).
 */
export const EditarDataFimLicencaSchema = z.object({
  licencaId: z.string().cuid("Licença inválida"),
  dataFim: z.coerce.date().nullable(),
});

export type EditarDataFimLicencaInput = z.infer<typeof EditarDataFimLicencaSchema>;
