import { z } from "zod";

export const TIPOS_SESSAO = ["NORMAL", "ABERTO", "CAPTACAO", "EVENTO"] as const;

export const LABEL_TIPO_SESSAO: Record<(typeof TIPOS_SESSAO)[number], string> = {
  NORMAL: "Treino normal",
  ABERTO: "Treino aberto",
  CAPTACAO: "Captação",
  EVENTO: "Evento",
};

/**
 * Só sessões do tipo NORMAL podem ligar a periodização (secção 16, Grupo B):
 * um jogo/evento/captação/treino aberto com `planeamentoId` corromperia os
 * dados de periodização. Regra imposta via superRefine (schema) e reforçada
 * por uma guarda nas actions (dupla validação).
 */
export const sessaoSchema = z
  .object({
    data: z.coerce.date(),
    escalaoId: z.string().cuid("Escalão inválido"),
    tipoSessao: z.enum(TIPOS_SESSAO).default("NORMAL"),
    planeamentoId: z.string().cuid().nullable().optional(),
    duracaoMin: z.number().int().min(1).max(300).optional(),
    objetivo: z.string().max(500).optional(),
    local: z.string().max(100).optional(),
    notas: z.string().max(2000).optional(),
  })
  .superRefine((dados, ctx) => {
    if (dados.tipoSessao !== "NORMAL" && dados.planeamentoId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["planeamentoId"],
        message: "Só treinos normais podem estar associados a uma periodização.",
      });
    }
  });

export type SessaoInput = z.infer<typeof sessaoSchema>;

export const ESTADOS_PRESENCA = [
  "PRESENTE",
  "FALTA",
  "FALTA_JUSTIFICADA",
  "LESIONADO",
  "ATRASADO",
] as const;

export const MOTIVOS_FALTA = ["LESAO", "DOENCA", "OUTRO", "SEM_JUSTIFICACAO"] as const;

export const LABEL_MOTIVO_FALTA: Record<(typeof MOTIVOS_FALTA)[number], string> = {
  LESAO: "Lesão",
  DOENCA: "Doença",
  OUTRO: "Outro",
  SEM_JUSTIFICACAO: "Sem justificação",
};

export const presencaSchema = z.object({
  atletaId: z.string().cuid(),
  estado: z.enum(ESTADOS_PRESENCA),
  // Motivo da falta (F1 — lesões como motivo, secção 8.5).
  motivo: z.enum(MOTIVOS_FALTA).nullable().optional(),
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
