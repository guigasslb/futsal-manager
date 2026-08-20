import { z } from "zod";

export const reuniaoSchema = z
  .object({
    titulo: z.string().min(1, "O título é obrigatório").max(150),
    data: z.coerce.date(),
    ambito: z.enum(["CLUBE", "ESCALAO"]),
    escalaoId: z.string().cuid().nullable().optional(),
    participantes: z.string().max(1000).optional(),
    ordemTrabalhos: z.string().max(3000).optional(),
    ata: z.string().max(10000).optional(),
    afixada: z.boolean().optional().default(false),
  })
  .refine((d) => d.ambito !== "ESCALAO" || !!d.escalaoId, {
    message: "Seleciona o escalão para uma reunião de escalão",
    path: ["escalaoId"],
  });

export type ReuniaoInput = z.infer<typeof reuniaoSchema>;

export const LABEL_AMBITO_REUNIAO = {
  CLUBE: "Clube",
  ESCALAO: "Escalão",
} as const;
