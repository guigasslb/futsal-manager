import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Epoca } from "@prisma/client";

export const COOKIE_EPOCA = "epoca_ativa";

/**
 * Clube do utilizador autenticado, resolvido pela adesão ATIVA (secção 4.3/5.4).
 * Mantém a assinatura usada pelas actions existentes (compatibilidade).
 * Devolve null se não houver sessão ou adesão ativa (modo individual sem clube).
 */
export const obterClubeIdAtual = cache(async (): Promise<string | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membro = await prisma.membroClube.findFirst({
    where: { utilizadorId: session.user.id, estado: "ATIVO" },
    select: { clubeId: true },
  });
  return membro?.clubeId ?? null;
});

/**
 * Resolve a época ativa (secção 5.4):
 *  1. Cookie `epoca_ativa` (validado contra o clube do utilizador).
 *  2. Época marcada como `ativa: true` na BD.
 * Devolve null se não houver época ativa definida.
 */
export const obterEpocaAtiva = cache(async (): Promise<Epoca | null> => {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return null;

  const cookieStore = await cookies();
  const epocaCookie = cookieStore.get(COOKIE_EPOCA)?.value;

  if (epocaCookie) {
    const epoca = await prisma.epoca.findFirst({
      where: { id: epocaCookie, clubeId },
    });
    if (epoca) return epoca;
    // cookie inválido/obsoleto → cai para o default abaixo
  }

  return prisma.epoca.findFirst({
    where: { clubeId, ativa: true },
  });
});
