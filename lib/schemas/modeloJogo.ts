import { z } from "zod";
import { diagramaSchema } from "@/lib/schemas/exercicio";
import type { MomentoJogo } from "@prisma/client";

export const modeloJogoSchema = z.object({
  nome: z.string().min(1, "O nome é obrigatório").max(100),
  momento: z.enum([
    "ORG_OFENSIVA",
    "ORG_DEFENSIVA",
    "TRANS_OFENSIVA",
    "TRANS_DEFENSIVA",
    "BOLAS_PARADAS",
  ]),
  principios: z.string().max(3000).optional(),
  diagrama: diagramaSchema.optional(),
});

export type ModeloJogoInput = z.infer<typeof modeloJogoSchema>;

export const LABEL_MOMENTO: Record<MomentoJogo, string> = {
  ORG_OFENSIVA: "Organização ofensiva",
  ORG_DEFENSIVA: "Organização defensiva",
  TRANS_OFENSIVA: "Transição ofensiva",
  TRANS_DEFENSIVA: "Transição defensiva",
  BOLAS_PARADAS: "Bolas paradas",
};

export const MOMENTOS = Object.keys(LABEL_MOMENTO) as MomentoJogo[];

// Quadro tático (por jogo)
export const quadroTaticoSchema = z.object({
  nome: z.string().min(1, "O nome é obrigatório").max(100),
  notas: z.string().max(2000).optional(),
  diagrama: diagramaSchema.optional(),
});

export type QuadroTaticoInput = z.infer<typeof quadroTaticoSchema>;
