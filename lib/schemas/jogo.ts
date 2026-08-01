import { z } from "zod";

export const jogoSchema = z.object({
  data: z.coerce.date(),
  adversario: z.string().min(1, "Indica o adversário").max(100),
  casaFora: z.enum(["CASA", "FORA"]),
  tipo: z.enum(["OFICIAL", "AMIGAVEL"]).default("OFICIAL"),
  escalaoId: z.string().cuid("Escalão inválido"),
  competicao: z.string().max(100).optional(),
  competicaoId: z.string().cuid().nullable().optional(),
  local: z.string().max(100).optional(),
  golosMarcados: z.number().int().min(0).max(99).nullable().optional(),
  golosSofridos: z.number().int().min(0).max(99).nullable().optional(),
  faltas1aParte: z.number().int().min(0).max(50).nullable().optional(),
  faltas2aParte: z.number().int().min(0).max(50).nullable().optional(),
  videoUrl: z
    .string()
    .url("URL inválido")
    .max(300)
    .optional()
    .or(z.literal("")),
});

export type JogoInput = z.infer<typeof jogoSchema>;

export const eventoJogoSchema = z.object({
  parte: z.number().int().min(1).max(2),
  minuto: z.number().int().min(0).max(60).nullable().optional(),
  tipo: z.enum([
    "GOLO",
    "ASSISTENCIA",
    "FALTA",
    "CARTAO_AMARELO",
    "CARTAO_VERMELHO",
    "SUBSTITUICAO",
    "DEFESA",
    "GOLO_SOFRIDO",
    "TIMEOUT",
  ]),
  atletaId: z.string().cuid().nullable().optional(),
  atletaSecundarioId: z.string().cuid().nullable().optional(),
});

export type EventoJogoInput = z.infer<typeof eventoJogoSchema>;

export const LABEL_EVENTO: Record<string, string> = {
  GOLO: "Golo",
  ASSISTENCIA: "Assistência",
  FALTA: "Falta",
  CARTAO_AMARELO: "Cartão amarelo",
  CARTAO_VERMELHO: "Cartão vermelho",
  SUBSTITUICAO: "Substituição",
  DEFESA: "Defesa",
  GOLO_SOFRIDO: "Golo sofrido",
  TIMEOUT: "Timeout",
};

export const LABEL_TIPO_JOGO: Record<"OFICIAL" | "AMIGAVEL", string> = {
  OFICIAL: "Oficial",
  AMIGAVEL: "Amigável",
};

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
