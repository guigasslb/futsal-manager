import { z } from "zod";

export const escalaoSchema = z
  .object({
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
  })
  .refine(
    (d) =>
      d.idadeMin == null || d.idadeMax == null || d.idadeMax >= d.idadeMin,
    { message: "Idade máxima deve ser ≥ mínima", path: ["idadeMax"] },
  );

export type EscalaoInput = z.infer<typeof escalaoSchema>;
