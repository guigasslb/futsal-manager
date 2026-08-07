import { z } from "zod";
import type { Posicao } from "@prisma/client";
import { TIPOS_PARTICIPACAO } from "@/lib/schemas/participacao";

const posicaoEnum = z.enum(["GUARDA_REDES", "FIXO", "ALA", "PIVO", "UNIVERSAL"]);

/**
 * Dados PESSOAIS do atleta (F1 — o atleta pertence ao clube, não ao escalão).
 * Escalão e número de camisola pertencem à participação (AtletaEscalao),
 * validados em `lib/schemas/participacao.ts`.
 */
export const atletaPessoalSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres").max(100),
  dataNascimento: z.coerce.date().optional(),
  // Data de ingresso no clube (secção 10/22.3): divisor da taxa de presença.
  // Se ausente, usa-se criadoEm.
  dataIngresso: z.coerce.date().optional(),
  posicoes: z.array(posicaoEnum).default([]),
  observacoes: z.string().max(1000).optional(),
  fotoUrl: z.string().url("URL inválido").max(500).optional().or(z.literal("")),
  encarregadoNome: z.string().max(100).optional(),
  encarregadoContacto: z.string().max(40).optional(),
  encarregadoEmail: z.string().email("Email inválido").optional().or(z.literal("")),
});

/** Edição de atleta: só dados pessoais. */
export const atualizarAtletaSchema = atletaPessoalSchema;

/** Criação de atleta: dados pessoais + participação inicial (escalão + número). */
export const criarAtletaSchema = atletaPessoalSchema.extend({
  participacaoInicial: z.object({
    escalaoId: z.string().cuid("Escalão inválido"),
    numero: z
      .number()
      .int()
      .min(1, "O número deve estar entre 1 e 999")
      .max(999, "O número deve estar entre 1 e 999")
      .optional(),
    tipo: z.enum(TIPOS_PARTICIPACAO).default("PRINCIPAL"),
  }),
});

export type AtletaPessoalInput = z.infer<typeof atletaPessoalSchema>;
export type CriarAtletaInput = z.infer<typeof criarAtletaSchema>;

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
