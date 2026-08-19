import { z } from "zod";

// Campos base partilhados entre criação e atualização de escalão.
const escalaoBase = z.object({
  nome: z.string().min(1, "Nome obrigatório").max(50, "Máximo 50 caracteres"),
  idadeMin: z.coerce
    .number()
    .int()
    .min(0)
    .max(99)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  idadeMax: z.coerce
    .number()
    .int()
    .min(0)
    .max(99)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  visivelOutrosTreinadores: z.boolean().optional(),
});

// Regra partilhada: idade máxima ≥ mínima (quando ambas definidas).
const idadeCoerente = (d: { idadeMin: number | null; idadeMax: number | null }) =>
  d.idadeMin == null || d.idadeMax == null || d.idadeMax >= d.idadeMin;

const mensagemIdade = { message: "Idade máxima deve ser ≥ mínima", path: ["idadeMax"] };

export const escalaoSchema = escalaoBase.refine(idadeCoerente, mensagemIdade);

// 🔁 v7 (§8.1.1): na criação, o escalão pode indicar a secção (modalidade) a que
// pertence. Opcional: quando ausente, a action garante a secção da modalidade
// por defeito (FUTSAL) via `garantirSeccaoParaModalidade`.
export const criarEscalaoSchema = escalaoBase
  .extend({ seccaoId: z.string().optional() })
  .refine(idadeCoerente, mensagemIdade);

export type EscalaoInput = z.infer<typeof escalaoSchema>;
export type CriarEscalaoInput = z.infer<typeof criarEscalaoSchema>;
