// Schemas do gerador de comunicações (bíblia §3.9, §8.12).
// Fonte única de validação, partilhada cliente/servidor.

import { z } from "zod";

export const TIPOS_COMUNICACAO = [
  "CONVOCATORIA",
  "CANCELAMENTO",
  "MUDANCA_HORARIO",
  "MUDANCA_LOCAL",
  "RESULTADO",
  "AVISO_GERAL",
  "CALENDARIO_MENSAL",
] as const;

export type TipoComunicacaoValor = (typeof TIPOS_COMUNICACAO)[number];

export const LABEL_TIPO_COMUNICACAO: Record<TipoComunicacaoValor, string> = {
  CONVOCATORIA: "Convocatória",
  CANCELAMENTO: "Cancelamento",
  MUDANCA_HORARIO: "Mudança de horário",
  MUDANCA_LOCAL: "Mudança de local",
  RESULTADO: "Resultado",
  AVISO_GERAL: "Aviso geral",
  CALENDARIO_MENSAL: "Calendário mensal",
};

export const tipoComunicacaoSchema = z.enum(TIPOS_COMUNICACAO, {
  errorMap: () => ({ message: "Tipo de comunicação inválido" }),
});

/** Geração de texto: tipo + pares chave/valor que substituem os placeholders do template. */
export const gerarTextoComunicacaoSchema = z.object({
  tipo: tipoComunicacaoSchema,
  contexto: z.record(z.string().max(5000, "Valor demasiado longo")),
  modeloId: z.string().cuid("Modelo inválido").optional(),
});

export type GerarTextoComunicacaoInput = z.infer<typeof gerarTextoComunicacaoSchema>;

/** Edição de um modelo personalizado do clube. */
export const editarModeloComunicacaoSchema = z.object({
  id: z.string().cuid("Modelo inválido"),
  nome: z.string().min(1, "O nome é obrigatório").max(100, "Máximo 100 caracteres"),
  template: z
    .string()
    .min(1, "O template é obrigatório")
    .max(5000, "Máximo 5000 caracteres"),
});

export type EditarModeloComunicacaoInput = z.infer<typeof editarModeloComunicacaoSchema>;

/** Calendário mensal: mês (1–12) e ano. */
export const calendarioTextoSchema = z.object({
  mes: z.coerce
    .number()
    .int("Mês inválido")
    .min(1, "Mês inválido")
    .max(12, "Mês inválido"),
  ano: z.coerce
    .number()
    .int("Ano inválido")
    .min(2000, "Ano inválido")
    .max(2100, "Ano inválido"),
});

export type CalendarioTextoInput = z.infer<typeof calendarioTextoSchema>;
