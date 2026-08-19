import { z } from "zod";

// P2.1 (§3.15/§8.19) — sistema de Lembretes/Tarefas persistido.
//
// NOTA: `destinatarioIds` são IDs de `Utilizador` (a pessoa/membro do clube), não
// de `Perfil` — no Mister o `Perfil` é um pacote de capacidades (papel).
// O estado `visto` é registado por pessoa, pelo que os destinatários são pessoas.

export const criarLembreteSchema = z.object({
  titulo: z.string().min(2, "O título é obrigatório").max(200),
  descricao: z.string().max(1000).optional(),
  dataLimite: z.coerce.date().optional(),
  destinatarioIds: z.array(z.string().cuid()).min(0),
});

export const atualizarLembreteSchema = criarLembreteSchema.partial().extend({
  id: z.string().cuid(),
  concluido: z.boolean().optional(),
});

export const idLembreteSchema = z.object({ id: z.string().cuid() });

export type CriarLembreteInput = z.infer<typeof criarLembreteSchema>;
export type AtualizarLembreteInput = z.infer<typeof atualizarLembreteSchema>;
