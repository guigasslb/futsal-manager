import { z } from "zod";
import { TipoMetrica } from "@prisma/client";

export const metricaSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório").max(60, "Máximo 60 caracteres"),
  tipo: z.nativeEnum(TipoMetrica),
});

export type MetricaInput = z.infer<typeof metricaSchema>;

export const LABEL_TIPO: Record<TipoMetrica, string> = {
  NUMERO: "Número",
  BOOLEANO: "Sim/Não",
  ESCALA: "Escala 1-5",
};
