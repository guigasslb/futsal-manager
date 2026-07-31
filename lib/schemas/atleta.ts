import { z } from "zod";
import type { Posicao } from "@prisma/client";

export const atletaSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres").max(100),
  escalaoId: z.string().cuid("Escalão inválido"),
  dataNascimento: z.coerce.date().optional(),
  posicao: z.enum(["GUARDA_REDES", "FIXO", "ALA", "PIVO", "UNIVERSAL"]).optional(),
  numero: z
    .number()
    .int()
    .min(1, "O número deve estar entre 1 e 99")
    .max(99, "O número deve estar entre 1 e 99")
    .optional(),
  observacoes: z.string().max(1000).optional(),
});

export type AtletaInput = z.infer<typeof atletaSchema>;

export const LABEL_POSICAO: Record<Posicao, string> = {
  GUARDA_REDES: "Guarda-redes",
  FIXO: "Fixo",
  ALA: "Ala",
  PIVO: "Pivô",
  UNIVERSAL: "Universal",
};

export const ABREV_POSICAO: Record<Posicao, string> = {
  GUARDA_REDES: "GR",
  FIXO: "Fixo",
  ALA: "Ala",
  PIVO: "Pivô",
  UNIVERSAL: "Univ.",
};
