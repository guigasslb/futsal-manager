import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  CAPACIDADES_POR_ESCALAO,
  type Capacidade,
} from "@/lib/permissoes-catalogo";
import type { Clube, Perfil, Utilizador } from "@prisma/client";

export type UtilizadorSemHash = Omit<Utilizador, "passwordHash">;

export interface ContextoMembro {
  utilizadorId: string;
  membroId: string;
  clube: Clube;
  perfil: Perfil;
  capacidades: Capacidade[];
  ambito: "TODO_CLUBE" | "PROPRIOS_ESCALOES";
  escaloesAtribuidos: string[];
}

/** Utilizador autenticado (sem hash). Null se não houver sessão. */
export async function obterUtilizadorAtual(): Promise<UtilizadorSemHash | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const u = await prisma.utilizador.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      criadoEm: true,
      atualizadoEm: true,
    },
  });
  return u;
}

/**
 * Contexto do membro na adesão de clube ATIVA (secção 5.4).
 * Null se não autenticado ou sem clube (modo individual).
 */
export async function obterMembroAtual(): Promise<ContextoMembro | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membro = await prisma.membroClube.findFirst({
    where: { utilizadorId: session.user.id, estado: "ATIVO" },
    include: {
      clube: true,
      perfil: true,
      atribuicoes: { select: { escalaoId: true } },
    },
  });
  if (!membro) return null;

  return {
    utilizadorId: membro.utilizadorId,
    membroId: membro.id,
    clube: membro.clube,
    perfil: membro.perfil,
    capacidades: membro.perfil.capacidades as Capacidade[],
    ambito: membro.perfil.ambito,
    escaloesAtribuidos: membro.atribuicoes.map((a) => a.escalaoId),
  };
}

/** Clube ativo do utilizador (ou null no modo individual). */
export async function obterClubeAtivo(): Promise<Clube | null> {
  const ctx = await obterMembroAtual();
  return ctx?.clube ?? null;
}

export type ResultadoPermissao =
  | { ok: true; ctx: ContextoMembro }
  | { ok: false; erro: string };

/**
 * Verifica autenticação → adesão ativa → capacidade → âmbito sobre o escalão (secção 6.6).
 * Usar no início de cada Server Action de escrita.
 */
export async function exigirCapacidade(
  cap: Capacidade,
  escalaoId?: string,
): Promise<ResultadoPermissao> {
  const ctx = await obterMembroAtual();
  if (!ctx) return { ok: false, erro: "Sem acesso a este clube" };

  if (!ctx.capacidades.includes(cap)) {
    return { ok: false, erro: "Sem permissão" };
  }

  const limitadaPorEscalao =
    CAPACIDADES_POR_ESCALAO.includes(cap) && ctx.ambito === "PROPRIOS_ESCALOES";

  if (limitadaPorEscalao && escalaoId) {
    if (!ctx.escaloesAtribuidos.includes(escalaoId)) {
      return { ok: false, erro: "Sem permissão neste escalão" };
    }
  }

  return { ok: true, ctx };
}

/**
 * Pode ler os dados de um escalão? Verdadeiro se tem capacidade/âmbito para o gerir,
 * OU se o escalão está marcado como visível a outros treinadores (secção 6.4).
 */
export async function podeLerEscalao(escalaoId: string): Promise<boolean> {
  const ctx = await obterMembroAtual();
  if (!ctx) return false;

  if (ctx.ambito === "TODO_CLUBE") return true;
  if (ctx.escaloesAtribuidos.includes(escalaoId)) return true;

  const escalao = await prisma.escalao.findFirst({
    where: { id: escalaoId, clubeId: ctx.clube.id },
    select: { visivelOutrosTreinadores: true },
  });
  return escalao?.visivelOutrosTreinadores ?? false;
}

/**
 * IDs dos escalões que o membro atual pode LER.
 * Devolve "TODOS" quando o âmbito é todo o clube (sem restrição).
 * Devolve [] se não houver membro ativo.
 */
export async function escaloesLegiveis(): Promise<string[] | "TODOS"> {
  const ctx = await obterMembroAtual();
  if (!ctx) return [];
  if (ctx.ambito === "TODO_CLUBE") return "TODOS";

  const visiveis = await prisma.escalao.findMany({
    where: { clubeId: ctx.clube.id, visivelOutrosTreinadores: true },
    select: { id: true },
  });
  return [...new Set([...ctx.escaloesAtribuidos, ...visiveis.map((v) => v.id)])];
}
