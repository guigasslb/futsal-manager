// lib/google-calendar.ts
// Integração com o Google Calendar (bíblia §3.12) — integração de TERCEIROS,
// distinta do login/autenticação da app. Módulo puro (sem "use server"),
// usado apenas em código de servidor (Server Actions e route handler do callback).
//
// Sincroniza treinos, jogos e reuniões com o calendário do treinador. A ligação
// idempotente é garantida pelo `googleEventId` guardado em Sessao/Jogo/Reuniao.

import { google, type Auth, type calendar_v3 } from "googleapis";

const FUSO_HORARIO = "Europe/Lisbon";
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

/** Representação neutra de um evento a sincronizar com o Google Calendar. */
export type EventoGoogle = {
  titulo: string;
  descricao?: string;
  inicio: Date;
  fim: Date;
  local?: string;
};

/** True se as credenciais OAuth do Google estiverem configuradas no ambiente. */
export function googleCalendarConfigurado(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** URI de redireccionamento do callback OAuth (tem de coincidir na Google Console). */
export function obterRedirectUri(): string {
  const base = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "";
  return `${base.replace(/\/$/, "")}/api/google/callback`;
}

/**
 * Cria um cliente OAuth2 do Google. Se `refreshToken` for fornecido, define-o
 * como credencial (para chamadas autenticadas à API do calendário).
 *
 * Lança erro claro se GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não estiverem
 * configurados — o chamador (Server Action) deve tratar e devolver `Resultado`
 * em vez de rebentar.
 */
export function criarClienteGoogle(refreshToken?: string): Auth.OAuth2Client {
  if (!googleCalendarConfigurado()) {
    throw new Error(
      "Integração Google Calendar não configurada (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET em falta).",
    );
  }

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    obterRedirectUri(),
  );

  if (refreshToken) {
    client.setCredentials({ refresh_token: refreshToken });
  }

  return client;
}

/**
 * Constrói o URL de consentimento OAuth para o utilizador autorizar o acesso
 * ao Google Calendar. `state` transporta o id do utilizador para o callback.
 */
export function obterUrlConsentimento(state: string): string {
  const client = criarClienteGoogle();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // força devolução de refresh_token
    scope: SCOPES,
    state,
  });
}

/**
 * Troca o `code` do callback OAuth pelos tokens. Devolve o refresh token
 * (necessário para chamadas futuras) — pode ser undefined se o Google não o
 * emitir (ex.: consentimento repetido sem prompt=consent).
 */
export async function trocarCodePorTokens(
  code: string,
): Promise<{ refreshToken?: string; accessToken?: string }> {
  const client = criarClienteGoogle();
  const { tokens } = await client.getToken(code);
  return {
    refreshToken: tokens.refresh_token ?? undefined,
    accessToken: tokens.access_token ?? undefined,
  };
}

function paraRecursoEvento(evento: EventoGoogle): calendar_v3.Schema$Event {
  return {
    summary: evento.titulo,
    description: evento.descricao,
    location: evento.local,
    start: { dateTime: evento.inicio.toISOString(), timeZone: FUSO_HORARIO },
    end: { dateTime: evento.fim.toISOString(), timeZone: FUSO_HORARIO },
  };
}

/** Cria um evento e devolve o id atribuído pelo Google Calendar. */
export async function criarEventoCalendario(
  client: Auth.OAuth2Client,
  calendarId: string,
  evento: EventoGoogle,
): Promise<string> {
  const calendar = google.calendar({ version: "v3", auth: client });
  const { data } = await calendar.events.insert({
    calendarId,
    requestBody: paraRecursoEvento(evento),
  });
  if (!data.id) {
    throw new Error("O Google Calendar não devolveu um id de evento.");
  }
  return data.id;
}

/** Actualiza um evento existente (idempotência via `eventId`). */
export async function actualizarEventoCalendario(
  client: Auth.OAuth2Client,
  calendarId: string,
  eventId: string,
  evento: EventoGoogle,
): Promise<void> {
  const calendar = google.calendar({ version: "v3", auth: client });
  await calendar.events.update({
    calendarId,
    eventId,
    requestBody: paraRecursoEvento(evento),
  });
}

/** Apaga um evento do calendário. */
export async function apagarEventoCalendario(
  client: Auth.OAuth2Client,
  calendarId: string,
  eventId: string,
): Promise<void> {
  const calendar = google.calendar({ version: "v3", auth: client });
  await calendar.events.delete({ calendarId, eventId });
}

/** Formata uma sessão de treino como evento do Google Calendar. */
export function eventoParaSessao(sessao: {
  titulo?: string;
  dataHora: Date;
  duracaoMinutos?: number;
  local?: string;
}): EventoGoogle {
  const duracao = sessao.duracaoMinutos && sessao.duracaoMinutos > 0 ? sessao.duracaoMinutos : 90;
  const inicio = sessao.dataHora;
  const fim = new Date(inicio.getTime() + duracao * 60_000);
  return {
    titulo: sessao.titulo?.trim() ? sessao.titulo.trim() : "Treino",
    inicio,
    fim,
    local: sessao.local,
  };
}

/** Formata um jogo como evento do Google Calendar. */
export function eventoParaJogo(jogo: {
  adversario: string;
  dataHora: Date;
  local?: string;
  casaOuFora?: string;
}): EventoGoogle {
  const duracao = 90; // duração estimada de um jogo (min)
  const inicio = jogo.dataHora;
  const fim = new Date(inicio.getTime() + duracao * 60_000);
  const contexto = jogo.casaOuFora
    ? ` (${jogo.casaOuFora.toLowerCase() === "fora" ? "Fora" : "Casa"})`
    : "";
  return {
    titulo: `Jogo vs ${jogo.adversario}${contexto}`,
    inicio,
    fim,
    local: jogo.local,
  };
}
