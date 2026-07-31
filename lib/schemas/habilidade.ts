import { z } from "zod";
import { NivelHabilidade } from "@prisma/client";

export const habilidadeSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório").max(80),
  descricao: z.string().max(300).optional(),
  nivel: z.nativeEnum(NivelHabilidade),
});

export type HabilidadeInput = z.infer<typeof habilidadeSchema>;

export const LABEL_NIVEL: Record<NivelHabilidade, string> = {
  BASICO: "Básico",
  INTERMEDIO: "Intermédio",
  AVANCADO: "Avançado",
};
