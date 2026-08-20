import { z } from "zod";
import { TipoJogo, FormatoCompeticao, FormatoJogo } from "@prisma/client";

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

// Golos opcionais/nullable: consistente com o schema Prisma (golosCasa/golosFora
// passaram a Int?) — um resultado pode ser registado sem golos (jogo agendado).
// A action deriva o `estado` (AGENDADO | REALIZADO) a partir da presença dos golos.
export const registarResultadoExternoSchema = z.object({
  competicaoId: z.string().cuid(),
  equipaCasa: z.string().min(1, "Indica a equipa da casa").max(100),
  equipaFora: z.string().min(1, "Indica a equipa visitante").max(100),
  golosCasa: z.number().int().min(0).max(99).nullable().optional(),
  golosFora: z.number().int().min(0).max(99).nullable().optional(),
  data: z.coerce.date().optional(),
});

/** Alias retrocompatível para o nome curto usado noutros contextos. */
export const registarResultadoSchema = registarResultadoExternoSchema;

// ─────────────────────────────────────────────
// Equipas + quadro competitivo + agendamento
// ─────────────────────────────────────────────

/** Equipa participante numa competição (base do quadro competitivo). */
export const equipaCompeticaoSchema = z.object({
  nome: z.string().trim().min(1, "Indica o nome da equipa").max(100),
  posicao: z.number().int().positive().optional(),
});

/**
 * Jogo pré-agendado (usado no wizard de criação e no update de agendamento).
 * `ronda` = jornada (LIGA) ou fase eliminatória (TORNEIO/TAÇA). `dataHora` opcional
 * (null = por definir).
 */
export const jogoAgendadoSchema = z.object({
  equipaCasa: z.string().trim().min(1, "Indica a equipa da casa"),
  equipaFora: z.string().trim().min(1, "Indica a equipa visitante"),
  ronda: z.number().int().positive().optional(),
  dataHora: z.coerce.date().optional().nullable(),
});

/** Criação completa de uma competição a partir do wizard (base + equipas + jogos). */
export const criarCompeticaoCompletaSchema = z.object({
  nome: z.string().trim().min(1, "O nome é obrigatório").max(100),
  tipo: z.nativeEnum(TipoJogo).default(TipoJogo.OFICIAL),
  formato: z.nativeEnum(FormatoCompeticao).default(FormatoCompeticao.LIGA),
  formatoJogo: z.nativeEnum(FormatoJogo).optional(),
  escalaoId: z.string().cuid("Escalão inválido"),
  equipas: z.array(equipaCompeticaoSchema).min(2, "Mínimo 2 equipas"),
  jogos: z.array(jogoAgendadoSchema).optional().default([]),
  duasMaos: z.boolean().default(false), // só LIGA
});

/** Atualização do agendamento (data/hora) de um jogo do quadro. */
export const atualizarAgendamentoSchema = z.object({
  resultadoId: z.string().cuid(),
  dataHora: z.coerce.date().optional().nullable(),
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
export type EquipaCompeticaoInput = z.infer<typeof equipaCompeticaoSchema>;
export type JogoAgendadoInput = z.infer<typeof jogoAgendadoSchema>;
export type CriarCompeticaoCompletaInput = z.infer<typeof criarCompeticaoCompletaSchema>;
export type AtualizarAgendamentoInput = z.infer<typeof atualizarAgendamentoSchema>;
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
