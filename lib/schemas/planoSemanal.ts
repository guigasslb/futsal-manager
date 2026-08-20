import { z } from "zod";
import { TIPOS_SESSAO } from "@/lib/schemas/treino";

/**
 * §8.8.1 — Plano semanal de treinos.
 *
 * Schemas Zod para o horário recorrente de um escalão numa época. O plano só
 * AGENDA (dias da semana + hora/local/tipo por dia); o CONTEÚDO (exercícios,
 * presenças) vive na `Sessao`. Fonte única de validação partilhada cliente/servidor.
 */

/**
 * Alcance da edição de uma sessão ligada a um plano (§8.8.1):
 *  - SO_ESTA: altera apenas esta sessão e marca-a `personalizada`.
 *  - ESTA_E_FUTURAS: atualiza o baseline do dia e propaga às futuras não-personalizadas.
 */
export const alcanceSchema = z.enum(["SO_ESTA", "ESTA_E_FUTURAS"]);
export type Alcance = z.infer<typeof alcanceSchema>;

/**
 * Modo de apagar um plano (§8.8.1):
 *  - DESVINCULAR: mantém as sessões, apenas remove a ligação ao plano.
 *  - APAGAR_FUTURAS_VAZIAS: apaga as sessões futuras sem conteúdo e desvincula as restantes.
 */
export const modoApagarSchema = z.enum(["DESVINCULAR", "APAGAR_FUTURAS_VAZIAS"]);
export type ModoApagar = z.infer<typeof modoApagarSchema>;

/** Baseline de UM dia do plano (dia ISO + horário + local + tipo de sessão). */
export const planoSemanalDiaSchema = z
  .object({
    diaSemana: z.number().int().min(1).max(7), // ISO: 1=segunda … 7=domingo
    horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida (HH:MM)"), // "HH:MM"
    horaFim: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida (HH:MM)"),
    local: z.string().max(200).optional(),
    tipoSessao: z.enum(TIPOS_SESSAO).default("NORMAL"),
  })
  .refine((d) => d.horaFim > d.horaInicio, {
    message: "Hora de fim deve ser posterior à hora de início",
    path: ["horaFim"],
  });

export type PlanoSemanalDiaInput = z.infer<typeof planoSemanalDiaSchema>;

/** Criar um plano semanal: escalão + dias configurados + início da geração. */
export const criarPlanoSemanalSchema = z.object({
  escalaoId: z.string().cuid("Escalão inválido"),
  nome: z.string().max(100).optional(),
  dataInicioGeracao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)"), // "YYYY-MM-DD"
  dias: z
    .array(planoSemanalDiaSchema)
    .min(1, "Seleciona pelo menos um dia")
    .refine((dias) => new Set(dias.map((d) => d.diaSemana)).size === dias.length, {
      message: "Dias da semana não podem repetir",
    }),
});

export type CriarPlanoSemanalInput = z.infer<typeof criarPlanoSemanalSchema>;

/** Atualizar um plano: renomear, ativar/desativar e/ou substituir o conjunto de dias. */
export const atualizarPlanoSemanalSchema = z.object({
  nome: z.string().max(100).optional(),
  ativo: z.boolean().optional(),
  dias: z.array(planoSemanalDiaSchema).optional(),
});

export type AtualizarPlanoSemanalInput = z.infer<typeof atualizarPlanoSemanalSchema>;
