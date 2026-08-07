// lib/schemas/integracao.ts
// Schemas Zod da integração com calendário externo (bíblia §3.12).

import { z } from "zod";

/** Parâmetros do callback OAuth do Google (`?code=...&state=...`). */
export const googleCallbackSchema = z.object({
  code: z.string().min(1, "Código de autorização em falta"),
  state: z.string().min(1, "Estado (utilizador) em falta"),
});

export type GoogleCallback = z.infer<typeof googleCallbackSchema>;

/** Tipo de entidade sincronizável com o calendário. */
export const tipoSincronizacaoSchema = z.enum(["SESSAO", "JOGO"]);

export type TipoSincronizacao = z.infer<typeof tipoSincronizacaoSchema>;
