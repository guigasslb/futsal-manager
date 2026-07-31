import { z } from "zod";

export const jogoSchema = z.object({
  data: z.coerce.date(),
  adversario: z.string().min(1, "Indica o adversário").max(100),
  casaFora: z.enum(["CASA", "FORA"]),
  escalaoId: z.string().cuid("Escalão inválido"),
  competicao: z.string().max(100).optional(),
  local: z.string().max(100).optional(),
  golosMarcados: z.number().int().min(0).max(99).nullable().optional(),
  golosSofridos: z.number().int().min(0).max(99).nullable().optional(),
});

export type JogoInput = z.infer<typeof jogoSchema>;

export const estatisticaSchema = z.object({
  atletaId: z.string().cuid(),
  utilizacao: z.enum(["TITULAR", "UTILIZADO", "NAO_UTILIZADO"]),
  minutos: z.number().int().min(0).max(60).nullable().optional(),
  golos: z.number().int().min(0).default(0),
  assistencias: z.number().int().min(0).default(0),
  defesas: z.number().int().min(0).nullable().optional(),
  golosSofridosGR: z.number().int().min(0).nullable().optional(),
  faltasCometidas: z.number().int().min(0).nullable().optional(),
  valoresMetricas: z
    .array(z.object({ metricaId: z.string().cuid(), valor: z.number().int() }))
    .optional(),
});

export const guardarEstatisticasSchema = z.array(estatisticaSchema);
export type EstatisticaInput = z.infer<typeof estatisticaSchema>;

export const LABEL_UTILIZACAO: Record<
  "TITULAR" | "UTILIZADO" | "NAO_UTILIZADO",
  string
> = {
  TITULAR: "Titular",
  UTILIZADO: "Utilizado",
  NAO_UTILIZADO: "Não utilizado",
};

export const LABEL_CASA_FORA: Record<"CASA" | "FORA", string> = {
  CASA: "Casa",
  FORA: "Fora",
};
