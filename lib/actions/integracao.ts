"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { ok, erro, type Resultado } from "@/lib/utils";
import { desencriptar } from "@/lib/crypto";
import {
  googleCalendarConfigurado,
  obterUrlConsentimento,
  criarClienteGoogle,
  criarEventoCalendario,
  actualizarEventoCalendario,
  eventoParaSessao,
  eventoParaJogo,
} from "@/lib/google-calendar";
import type { IntegracaoCalendario } from "@prisma/client";

const PATH = "/definicoes/integracao";
const MSG_NAO_CONFIGURADO =
  "A integração com o Google Calendar não está configurada neste ambiente.";

/**
 * Constrói o URL de autorização OAuth para o utilizador autenticado ligar o
 * seu Google Calendar. O `state` transporta o id do utilizador para o callback.
 */
export async function obterUrlAutorizacaoCalendario(): Promise<Resultado<string>> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  if (!googleCalendarConfigurado()) return erro(MSG_NAO_CONFIGURADO);

  try {
    const url = obterUrlConsentimento(session.user.id);
    return ok(url);
  } catch (e) {
    console.error("[integracao] obterUrlAutorizacaoCalendario:", e);
    return erro("Não foi possível gerar o link de autorização do Google Calendar.");
  }
}

/** Estado atual da integração do utilizador autenticado (null se não existir). */
export async function obterIntegracaoCalendario(): Promise<
  Resultado<IntegracaoCalendario | null>
> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  const integracao = await prisma.integracaoCalendario.findUnique({
    where: { utilizadorId: session.user.id },
  });
  return ok(integracao);
}

/** Remove a integração do utilizador autenticado (apaga do DB). */
export async function desconectarGoogleCalendar(): Promise<Resultado<void>> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  await prisma.integracaoCalendario.deleteMany({
    where: { utilizadorId: session.user.id },
  });
  revalidatePath(PATH);
  return ok(undefined);
}

/**
 * Sincroniza um treino ou jogo com o Google Calendar do utilizador autenticado.
 *
 * Fire-and-forget: NÃO deve bloquear nem fazer falhar a action principal que a
 * invoca (criar/atualizar sessão ou jogo). Qualquer erro é registado no log e
 * engolido. Idempotente via `googleEventId`.
 */
export async function sincronizarComCalendario(
  tipo: "SESSAO" | "JOGO",
  id: string,
): Promise<void> {
  try {
    if (!googleCalendarConfigurado()) return;

    const session = await auth();
    if (!session?.user?.id) return;

    const integracao = await prisma.integracaoCalendario.findUnique({
      where: { utilizadorId: session.user.id },
    });
    if (!integracao || !integracao.ativa) return;

    const clubeId = await obterClubeIdAtual();
    if (!clubeId) return;

    const client = criarClienteGoogle(desencriptar(integracao.refreshToken));
    const calendarId = integracao.calendarioId ?? "primary";

    if (tipo === "SESSAO") {
      const sessao = await prisma.sessao.findFirst({
        where: { id, escalao: { clubeId } },
        select: {
          id: true,
          data: true,
          duracaoMin: true,
          objetivo: true,
          local: true,
          googleEventId: true,
        },
      });
      if (!sessao) return;

      const evento = eventoParaSessao({
        titulo: sessao.objetivo ?? undefined,
        dataHora: sessao.data,
        duracaoMinutos: sessao.duracaoMin ?? undefined,
        local: sessao.local ?? undefined,
      });

      if (sessao.googleEventId) {
        await actualizarEventoCalendario(client, calendarId, sessao.googleEventId, evento);
      } else {
        const eventId = await criarEventoCalendario(client, calendarId, evento);
        await prisma.sessao.update({ where: { id: sessao.id }, data: { googleEventId: eventId } });
      }
      return;
    }

    // tipo === "JOGO"
    const jogo = await prisma.jogo.findFirst({
      where: { id, escalao: { clubeId } },
      select: {
        id: true,
        data: true,
        adversario: true,
        casaFora: true,
        local: true,
        googleEventId: true,
      },
    });
    if (!jogo) return;

    const evento = eventoParaJogo({
      adversario: jogo.adversario,
      dataHora: jogo.data,
      local: jogo.local ?? undefined,
      casaOuFora: jogo.casaFora,
    });

    if (jogo.googleEventId) {
      await actualizarEventoCalendario(client, calendarId, jogo.googleEventId, evento);
    } else {
      const eventId = await criarEventoCalendario(client, calendarId, evento);
      await prisma.jogo.update({ where: { id: jogo.id }, data: { googleEventId: eventId } });
    }
  } catch (e) {
    // Fire-and-forget: nunca propaga o erro para a action principal.
    console.error(`[integracao] sincronizarComCalendario(${tipo}, ${id}):`, e);
  }
}
