import { z } from "zod";

export const competicaoSchema = z.object({
  nome: z.string().min(1, "O nome é obrigatório").max(100),
  tipo: z.enum(["OFICIAL", "AMIGAVEL"]).default("OFICIAL"),
  escalaoId: z.string().cuid("Escalão inválido"),
});

export type CompeticaoInput = z.infer<typeof competicaoSchema>;

export const observacaoAdversarioSchema = z.object({
  equipa: z.string().min(1, "Indica a equipa").max(100),
  escalaoId: z.string().cuid().nullable().optional(),
  jogoObservado: z.string().max(100).optional(),
  competicao: z.string().max(100).optional(),
  sistemaTatico: z.string().max(100).optional(),
  pontosFortes: z.string().max(2000).optional(),
  pontosFracos: z.string().max(2000).optional(),
  notas: z.string().max(2000).optional(),
});

export type ObservacaoAdversarioInput = z.infer<typeof observacaoAdversarioSchema>;
