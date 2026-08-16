import { z } from "zod";

// Wizard «Nova Época» (secção 8.21 da bíblia).
// Transição de época guiada: herda o portátil/configurado e zera o específico da
// época anterior. Cobre os cenários A (mesmo clube/escalão), B (mesmo clube,
// escalão diferente, com promoções confirmadas) e C (novo clube individual).
//
// Fonte única de validação (cliente + servidor). Helpers puros (idade/promoção)
// vivem aqui para serem testáveis sem tocar em prisma/auth.

const corHex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (ex: #1A2FD4)");

const numeroCamisola = z
  .number()
  .int()
  .min(1, "O número deve estar entre 1 e 999")
  .max(999, "O número deve estar entre 1 e 999");

// ─────────────────────────────────────────────────────────────────────────────
// Passo 2 — plantel: quem transita para a nova época
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transição de um atleta para a nova época.
 * `transitaParaNova` = false mantém o atleta fora da nova época (saiu do plantel).
 * `novoNumero` opcional permite renumerar; quando ausente herda o número anterior.
 */
export const transicaoAtletaSchema = z.object({
  atletaId: z.string().cuid("Atleta inválido"),
  transitaParaNova: z.boolean(),
  novoNumero: numeroCamisola.nullable().optional(),
});

export const transicaoPlantelSchema = z.object({
  atletas: z.array(transicaoAtletaSchema),
});

// ─────────────────────────────────────────────────────────────────────────────
// Passo 1 — dados da nova época
// ─────────────────────────────────────────────────────────────────────────────

// Base sem refine para poder ser estendida (o `.refine` produz um ZodEffects,
// que já não expõe `.extend`).
const novaEpocaStep1Base = z.object({
  nome: z.string().min(1, "Nome obrigatório").max(20),
  dataInicio: z.coerce.date({ required_error: "Data de início obrigatória" }),
  dataFim: z.coerce.date({ required_error: "Data de fim obrigatória" }),
  escalaoIds: z
    .array(z.string().cuid("Escalão inválido"))
    .min(1, "Seleciona pelo menos um escalão que continua"),
});

const datasCoerentes = (d: { dataInicio: Date; dataFim: Date }) =>
  d.dataFim > d.dataInicio;
const datasMsg = {
  message: "Data de fim deve ser posterior ao início",
  path: ["dataFim"],
};

export const novaEpocaStep1Schema = novaEpocaStep1Base.refine(
  datasCoerentes,
  datasMsg,
);

// ─────────────────────────────────────────────────────────────────────────────
// Cenário B — promoções entre escalões (confirmação individual obrigatória)
// ─────────────────────────────────────────────────────────────────────────────

export const promocaoEscalaoSchema = z
  .object({
    escalaoOrigemId: z.string().cuid("Escalão de origem inválido"),
    escalaoDestinoId: z.string().cuid("Escalão de destino inválido"),
    atletasParaPromover: z.array(transicaoAtletaSchema),
  })
  .refine((d) => d.escalaoOrigemId !== d.escalaoDestinoId, {
    message: "O escalão de destino deve ser diferente do de origem",
    path: ["escalaoDestinoId"],
  });

// ─────────────────────────────────────────────────────────────────────────────
// Cenário A/B — input combinado do rollover (mesmo clube)
// ─────────────────────────────────────────────────────────────────────────────

// Combina o passo 1 (nova época) com o passo 2 (plantel) e, opcionalmente, as
// promoções do cenário B. As promoções sobrepõem-se às transições regulares
// (um atleta promovido é colocado no escalão de destino, não no de origem).
export const novaEpocaRolloverSchema = novaEpocaStep1Base
  .extend({
    atletas: z.array(transicaoAtletaSchema).default([]),
    promocoes: z.array(promocaoEscalaoSchema).default([]),
  })
  .refine(datasCoerentes, datasMsg);

// ─────────────────────────────────────────────────────────────────────────────
// Cenário C — novo clube (licença individual)
// ─────────────────────────────────────────────────────────────────────────────

export const novoClubeSchema = z.object({
  nomeClube: z.string().min(2, "Nome do clube obrigatório").max(100),
  corClube: corHex,
  escalaoNome: z.string().min(1, "Nome do escalão obrigatório").max(50),
  // O que transportar do clube anterior (spec 8.21 — todos «sim» por defeito).
  importarExercicios: z.boolean().default(true),
  importarModelosTaticos: z.boolean().default(true),
  importarMetricas: z.boolean().default(true),
});

// Escalão de origem para sugestão de promoções (cenário B).
export const escalaoOrigemPromocaoSchema = z
  .string()
  .cuid("Escalão inválido");

// ─────────────────────────────────────────────────────────────────────────────
// Helpers puros (idade / promoção) — testáveis isoladamente
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Idade completa (anos) de um atleta numa data de referência.
 * Devolve 0 para datas de nascimento no futuro face à referência.
 */
export function calcularIdade(dataNascimento: Date, referencia: Date): number {
  let idade = referencia.getFullYear() - dataNascimento.getFullYear();
  const aindaNaoFezAnos =
    referencia.getMonth() < dataNascimento.getMonth() ||
    (referencia.getMonth() === dataNascimento.getMonth() &&
      referencia.getDate() < dataNascimento.getDate());
  if (aindaNaoFezAnos) idade -= 1;
  return idade < 0 ? 0 : idade;
}

/**
 * Regra de sugestão de promoção (cenário B): o atleta ultrapassou o limite de
 * idade do escalão de origem na data de referência (tipicamente o início da nova
 * época). Sem `dataNascimento` ou sem `idadeMax` definido, nunca sugere — a
 * transição é sempre de confirmação manual (nunca automática, secção 8.21).
 */
export function deveSerPromovido(
  dataNascimento: Date | null,
  idadeMax: number | null,
  referencia: Date,
): boolean {
  if (!dataNascimento || idadeMax == null) return false;
  return calcularIdade(dataNascimento, referencia) > idadeMax;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos inferidos
// ─────────────────────────────────────────────────────────────────────────────

export type TransicaoAtletaInput = z.infer<typeof transicaoAtletaSchema>;
export type NovaEpocaStep1Input = z.infer<typeof novaEpocaStep1Schema>;
export type PromocaoEscalaoInput = z.infer<typeof promocaoEscalaoSchema>;
export type NovaEpocaRolloverInput = z.infer<typeof novaEpocaRolloverSchema>;
export type NovoClubeInput = z.infer<typeof novoClubeSchema>;
