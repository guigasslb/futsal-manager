import { z } from "zod";
import { TipoJogo, FormatoCompeticao } from "@prisma/client";

// ─────────────────────────────────────────────
// Competição (F6 — Fase 16)
// ─────────────────────────────────────────────

export const criarCompeticaoSchema = z.object({
  nome: z.string().min(1, "O nome é obrigatório").max(100),
  tipo: z.nativeEnum(TipoJogo).default(TipoJogo.OFICIAL),
  formato: z.nativeEnum(FormatoCompeticao).default(FormatoCompeticao.LIGA),
  escalaoId: z.string().cuid("Escalão inválido"),
  epocaId: z.string().cuid().optional(), // default = época ativa
});

export const atualizarCompeticaoSchema = criarCompeticaoSchema.partial().extend({
  id: z.string().cuid(),
});

export const registarResultadoExternoSchema = z.object({
  competicaoId: z.string().cuid(),
  equipaCasa: z.string().min(1, "Indica a equipa da casa").max(100),
  equipaFora: z.string().min(1, "Indica a equipa visitante").max(100),
  golosCasa: z.number().int().min(0).max(99),
  golosFora: z.number().int().min(0).max(99),
  data: z.coerce.date().optional(),
});

export const LABEL_FORMATO_COMPETICAO: Record<FormatoCompeticao, string> = {
  LIGA: "Liga",
  TORNEIO: "Torneio",
  TACA: "Taça",
};

/**
 * Alias retrocompatível: código anterior a F6 importa `competicaoSchema`.
 * Aponta para o schema de criação (superset com defaults — nome/tipo/escalaoId
 * mantêm-se, `formato` e `epocaId` são opcionais/têm default).
 */
export const competicaoSchema = criarCompeticaoSchema;

export type CriarCompeticaoInput = z.infer<typeof criarCompeticaoSchema>;
export type AtualizarCompeticaoInput = z.infer<typeof atualizarCompeticaoSchema>;
export type RegistarResultadoExternoInput = z.infer<typeof registarResultadoExternoSchema>;
/** Alias retrocompatível do tipo de input de competição. */
export type CompeticaoInput = CriarCompeticaoInput;

// ─────────────────────────────────────────────
// Scouting (mantido — usado por lib/actions/scouting.ts)
// ─────────────────────────────────────────────

export const observacaoAdversarioSchema = z.object({
  equipa: z.string().min(1, "Indica a equipa").max(100),
  escalaoId: z.string().cuid().nullable().optional(),
  // F5 (M15): scouting contextualizado num jogo específico (dia de jogo) ou avulso.
  jogoId: z.string().cuid().nullable().optional(),
  jogoObservado: z.string().max(100).optional(),
  competicao: z.string().max(100).optional(),
  sistemaTatico: z.string().max(100).optional(),
  pontosFortes: z.string().max(2000).optional(),
  pontosFracos: z.string().max(2000).optional(),
  notas: z.string().max(2000).optional(),
});

export type ObservacaoAdversarioInput = z.infer<typeof observacaoAdversarioSchema>;
