import { z } from "zod";

export const sessaoSchema = z.object({
  data: z.coerce.date(),
  escalaoId: z.string().cuid("Escalão inválido"),
  duracaoMin: z.number().int().min(1).max(300).optional(),
  objetivo: z.string().max(500).optional(),
  local: z.string().max(100).optional(),
  notas: z.string().max(2000).optional(),
});

export type SessaoInput = z.infer<typeof sessaoSchema>;

export const ESTADOS_PRESENCA = [
  "PRESENTE",
  "FALTA",
  "FALTA_JUSTIFICADA",
  "LESIONADO",
  "ATRASADO",
] as const;

export const presencaSchema = z.object({
  atletaId: z.string().cuid(),
  estado: z.enum(ESTADOS_PRESENCA),
  justificacao: z.string().max(300).optional(),
});

export const marcarPresencasSchema = z.array(presencaSchema);

export const LABEL_PRESENCA: Record<(typeof ESTADOS_PRESENCA)[number], string> = {
  PRESENTE: "Presente",
  FALTA: "Falta",
  FALTA_JUSTIFICADA: "Falta justificada",
  LESIONADO: "Lesionado",
  ATRASADO: "Atrasado",
};
