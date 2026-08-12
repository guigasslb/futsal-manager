import { z } from "zod";

// P2.4 (§8.17) — Perfil do treinador / histórico de carreira.
//
// Um RegistoCarreira é uma passagem na carreira do treinador (clube, escalão,
// épocas, conquistas). Pertence à PESSOA (Utilizador), é portátil e independente
// de qualquer clube — por isso `clube` é texto livre (o treinador pode ter
// treinado em clubes fora do sistema). Âncora do argumento "o que crias é teu
// para toda a carreira" (§17.3).

export const criarRegistoCarreiraSchema = z.object({
  clube: z.string().trim().min(2, "O clube é obrigatório").max(120),
  escalao: z.string().trim().min(1, "O escalão é obrigatório").max(80),
  epocaInicio: z.string().trim().min(1, "A época de início é obrigatória").max(20),
  epocaFim: z.string().trim().max(20).optional(),
  conquistas: z.string().trim().max(500).optional(),
  notas: z.string().trim().max(1000).optional(),
});

export const atualizarRegistoCarreiraSchema = criarRegistoCarreiraSchema.partial();

export const idRegistoCarreiraSchema = z.string().cuid();

export type CriarRegistoCarreiraInput = z.infer<typeof criarRegistoCarreiraSchema>;
export type AtualizarRegistoCarreiraInput = z.infer<
  typeof atualizarRegistoCarreiraSchema
>;
