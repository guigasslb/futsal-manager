import { z } from "zod";
import { TipoRelatorio } from "@prisma/client";

// Schemas de parâmetros dos analytics F9 (secção 15 / §16 fase 19 da bíblia).
// Fonte única de validação, partilhada cliente/servidor.

/** Nível 1 — analítico do atleta (por escalão ou vista conjunta). */
export const analiticoAtletaSchema = z.object({
  atletaId: z.string().cuid(),
  escalaoId: z.string().cuid().optional(),
  epocaId: z.string().cuid().optional(),
});

/** Nível 2 — analítico do escalão/equipa (opcionalmente filtrado por competição). */
export const analiticoEscalaoSchema = z.object({
  escalaoId: z.string().cuid(),
  epocaId: z.string().cuid().optional(),
  // P2.5: separa campeonato / taça / particulares no mesmo escalão (bíblia §10.2).
  competicaoId: z.string().cuid().optional(),
});

/** Lista de competições com jogos de um escalão/época (para o filtro do painel). */
export const competicoesEscalaoSchema = z.object({
  escalaoId: z.string().cuid(),
  epocaId: z.string().cuid().optional(),
});

/** Nível 3 — analítico do clube (transversal). */
export const analiticoClubeSchema = z.object({
  epocaId: z.string().cuid().optional(),
});

/**
 * Geração de relatório partilhável (secção 3.10 / 10.6).
 * Consoante o tipo, exige o alvo correspondente:
 *   EPOCA_ATLETA → atletaId · EPOCA_EQUIPA → escalaoId · EPOCA_CLUBE → nenhum.
 */
export const gerarRelatorioSchema = z
  .object({
    tipo: z.nativeEnum(TipoRelatorio),
    epocaId: z.string().cuid().optional(),
    escalaoId: z.string().cuid().optional(),
    atletaId: z.string().cuid().optional(),
    // Expiração opcional (bíblia §9 — «opcional expiraEm»).
    expiraEm: z.coerce.date().optional(),
  })
  .superRefine((dados, ctx) => {
    if (dados.tipo === "EPOCA_ATLETA" && !dados.atletaId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["atletaId"],
        message: "Indica o atleta do relatório",
      });
    }
    if (dados.tipo === "EPOCA_EQUIPA" && !dados.escalaoId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["escalaoId"],
        message: "Indica o escalão do relatório",
      });
    }
    if (dados.expiraEm && dados.expiraEm.getTime() <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiraEm"],
        message: "A data de expiração tem de ser no futuro",
      });
    }
  });

/**
 * F1.2 — export CSV do analítico de escalão. Reaproveita os parâmetros de
 * `analiticoEscalaoSchema` (sem `epocaId` — usa a época em contexto).
 */
export const exportarEscalaoCsvSchema = z.object({
  escalaoId: z.string().cuid(),
  competicaoId: z.string().cuid().optional(),
});

/** F1.2 — export CSV do analítico de atleta (num escalão de contexto). */
export const exportarAtletaCsvSchema = z.object({
  atletaId: z.string().cuid(),
  escalaoId: z.string().cuid(),
});

export type ExportarEscalaoCsvInput = z.infer<typeof exportarEscalaoCsvSchema>;
export type ExportarAtletaCsvInput = z.infer<typeof exportarAtletaCsvSchema>;

export type AnaliticoAtletaInput = z.infer<typeof analiticoAtletaSchema>;
export type AnaliticoEscalaoInput = z.infer<typeof analiticoEscalaoSchema>;
export type CompeticoesEscalaoInput = z.infer<typeof competicoesEscalaoSchema>;
export type AnaliticoClubeInput = z.infer<typeof analiticoClubeSchema>;
export type GerarRelatorioInput = z.infer<typeof gerarRelatorioSchema>;

export const LABEL_TIPO_RELATORIO: Record<TipoRelatorio, string> = {
  EPOCA_ATLETA: "Relatório do atleta",
  EPOCA_EQUIPA: "Relatório da equipa",
  EPOCA_CLUBE: "Relatório do clube",
};
