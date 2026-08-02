import { z } from "zod";
import type { PeriodoEpoca, TipoPlaneamento } from "@prisma/client";

export const planeamentoSchema = z
  .object({
    escalaoId: z.string().cuid("Escalão inválido"),
    tipo: z.enum(["SEMANAL", "MENSAL"]),
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
