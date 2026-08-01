import { z } from "zod";
import type { Posicao } from "@prisma/client";

const posicaoEnum = z.enum(["GUARDA_REDES", "FIXO", "ALA", "PIVO", "UNIVERSAL"]);

export const atletaSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres").max(100),
  escalaoId: z.string().cuid("Escalão inválido"),
  escalaoSecundarioId: z.string().cuid().nullable().optional(),
  dataNascimento: z.coerce.date().optional(),
  posicoes: z.array(posicaoEnum).default([]),
  numero: z
    .number()
    .int()
    .min(1, "O número deve estar entre 1 e 99")
    .max(99, "O número deve estar entre 1 e 99")
    .optional(),
  observacoes: z.string().max(1000).optional(),
  fotoUrl: z.string().url("URL inválido").max(500).optional().or(z.literal("")),
  encarregadoNome: z.string().max(100).optional(),
  encarregadoContacto: z.string().max(40).optional(),
  encarregadoEmail: z.string().email("Email inválido").optional().or(z.literal("")),
})
  .refine((d) => !d.escalaoSecundarioId || d.escalaoSecundarioId !== d.escalaoId, {
    message: "O escalão secundário deve ser diferente do principal",
    path: ["escalaoSecundarioId"],
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
