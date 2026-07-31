import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Epoca } from "@prisma/client";

export const COOKIE_EPOCA = "epoca_ativa";

/**
 * Obtém o clube do utilizador autenticado.
 * Todas as queries DEVEM filtrar por este clube (secção 23.5).
 * Devolve null se não houver sessão.
 */
export async function obterClubeIdAtual(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const utilizador = await prisma.utilizador.findUnique({
    where: { id: session.user.id },
    select: { clubeId: true },
  });
  return utilizador?.clubeId ?? null;
}

/**
 * Resolve a época ativa (secção 4.2):
 *  1. Cookie `epoca_ativa` (validado contra o clube do utilizador).
 *  2. Época marcada como `ativa: true` na BD.
 * Devolve null se não houver época ativa definida (secção 22.9).
 */
export async function obterEpocaAtiva(): Promise<Epoca | null> {
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
}
