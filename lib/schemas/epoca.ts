import { z } from "zod";

export const epocaSchema = z
  .object({
    nome: z.string().min(1, "Nome obrigatório").max(20),
    dataInicio: z.coerce.date({ required_error: "Data de início obrigatória" }),
    dataFim: z.coerce.date({ required_error: "Data de fim obrigatória" }),
  })
  .refine((d) => d.dataFim > d.dataInicio, {
    message: "Data de fim deve ser posterior ao início",
    path: ["dataFim"],
  });

export type EpocaInput = z.infer<typeof epocaSchema>;
