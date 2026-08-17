import { z } from "zod";
import type { PeriodoEpoca, TipoPlaneamento } from "@prisma/client";

// Modo de detalhe de uma SEMANA formalizada (§8.9.1). Só se aplica a
// Planeamento.tipo = SEMANAL. Definido localmente (como os restantes enums de UI)
// para não acoplar os schemas à geração do cliente Prisma.
export const MODOS_SEMANA = ["ESTRUTURADO", "TEXTO_LIVRE"] as const;
export type ModoSemana = (typeof MODOS_SEMANA)[number];

export const LABEL_MODO_SEMANA: Record<ModoSemana, string> = {
  ESTRUTURADO: "Estruturado (dias MD-X)",
  TEXTO_LIVRE: "Texto livre",
};

export const planeamentoSchema = z
  .object({
    escalaoId: z.string().cuid("Escalão inválido"),
    tipo: z.enum(["SEMANAL", "MENSAL"]),
    // §8.9.1: nome livre da semana formalizada ("Semana do torneio",
    // "Pré-jogo Benfica"), com fallback numérico automático na UI.
    nome: z.string().max(100).optional(),
    // §8.9.1: modo de detalhe da semana formalizada.
    modoSemana: z.enum(MODOS_SEMANA).default("TEXTO_LIVRE"),
    // §8.9.1: campo aberto opcional do modo TEXTO_LIVRE.
    notaSemana: z.string().max(500).optional(),
    periodo: z.enum(["PREPARATORIO", "COMPETITIVO", "TRANSICAO"]).optional(),
    mesociclo: z.number().int().min(1).max(99).optional(),
    microciclo: z.number().int().min(1).max(99).optional(),
    dataInicio: z.coerce.date(),
    dataFim: z.coerce.date(),
    objetivos: z.string().max(2000).optional(),
  })
  .refine((d) => d.dataFim >= d.dataInicio, {
    message: "A data de fim deve ser igual ou posterior ao início",
    path: ["dataFim"],
  });

export type PlaneamentoInput = z.infer<typeof planeamentoSchema>;

export const LABEL_TIPO_PLANEAMENTO: Record<TipoPlaneamento, string> = {
  SEMANAL: "Semanal",
  MENSAL: "Mensal",
};

export const LABEL_PERIODO: Record<PeriodoEpoca, string> = {
  PREPARATORIO: "Preparatório",
  COMPETITIVO: "Competitivo",
  TRANSICAO: "Transição",
};
