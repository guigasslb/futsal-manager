import { z } from "zod";

export const ESTADOS_HABILIDADE = ["NAO_INICIADO", "EM_PROGRESSO", "DESBLOQUEADO"] as const;

export const atualizarProgressoSchema = z.object({
  atletaId: z.string().cuid("Atleta inválido"),
  habilidadeId: z.string().cuid("Habilidade inválida"),
  estado: z.enum(ESTADOS_HABILIDADE),
  notas: z.string().max(1000).optional(),
});

export type AtualizarProgressoInput = z.infer<typeof atualizarProgressoSchema>;
