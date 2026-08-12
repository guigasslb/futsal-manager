"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { obterMembroAtual, exigirCapacidade } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { perfilSchema } from "@/lib/schemas/membro";
import {
  criarRegistoCarreiraSchema,
  atualizarRegistoCarreiraSchema,
  idRegistoCarreiraSchema,
} from "@/lib/schemas/perfil";
import type { Perfil, RegistoCarreira } from "@prisma/client";

const PATH = "/definicoes/perfis";
const PATH_PERFIL = "/perfil";

export async function listarPerfis(): Promise<Resultado<Perfil[]>> {
  const ctx = await obterMembroAtual();
  if (!ctx) return erro("Sem acesso a este clube");

  const perfis = await prisma.perfil.findMany({
    where: { clubeId: ctx.clube.id },
    orderBy: { criadoEm: "asc" },
  });
  return ok(perfis);
}

export async function criarPerfil(dados: unknown): Promise<Resultado<Perfil>> {
  const perm = await exigirCapacidade("CLUBE_PERFIS");
  if (!perm.ok) return erro(perm.erro);

  const parsed = perfilSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const perfil = await prisma.perfil.create({
    data: {
      clubeId: perm.ctx.clube.id,
      nome: parsed.data.nome,
      descricao: parsed.data.descricao ?? null,
      ambito: parsed.data.ambito,
      capacidades: parsed.data.capacidades,
      sistema: false,
    },
  });
  revalidatePath(PATH);
  return ok(perfil);
}

export async function atualizarPerfil(id: string, dados: unknown): Promise<Resultado<Perfil>> {
  const perm = await exigirCapacidade("CLUBE_PERFIS");
  if (!perm.ok) return erro(perm.erro);

  const parsed = perfilSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.perfil.findFirst({
    where: { id, clubeId: perm.ctx.clube.id },
  });
  if (!existe) return erro("Perfil não encontrado");

  const perfil = await prisma.perfil.update({
    where: { id },
    data: {
      nome: parsed.data.nome,
      descricao: parsed.data.descricao ?? null,
      ambito: parsed.data.ambito,
      capacidades: parsed.data.capacidades,
    },
  });
  revalidatePath(PATH);
  return ok(perfil);
}

export async function apagarPerfil(id: string): Promise<Resultado<void>> {
  const perm = await exigirCapacidade("CLUBE_PERFIS");
  if (!perm.ok) return erro(perm.erro);

  const existe = await prisma.perfil.findFirst({
    where: { id, clubeId: perm.ctx.clube.id },
  });
  if (!existe) return erro("Perfil não encontrado");

  const emUso = await prisma.membroClube.count({ where: { perfilId: id } });
  if (emUso > 0)
    return erro(`Este perfil está atribuído a ${emUso} membro(s). Reatribui-os primeiro.`);

  await prisma.perfil.delete({ where: { id } });
  revalidatePath(PATH);
  return ok(undefined);
}

// ─────────────────────────────────────────────────────────────────────────────
// P2.4 (§8.17) — Perfil do treinador / histórico de carreira
//
// O histórico de carreira pertence à PESSOA (Utilizador), não ao clube: é
// portátil e viaja com o treinador entre clubes (§17.3). Por isso estas actions
// filtram por `utilizadorId` (do utilizador autenticado) e NÃO por clube/época.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lista os registos de carreira do utilizador autenticado, do mais recente
 * para o mais antigo (por `ordem` desc, desempate por criação desc).
 */
export async function obterRegistosCarreira(): Promise<
  Resultado<RegistoCarreira[]>
> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  const registos = await prisma.registoCarreira.findMany({
    where: { utilizadorId: session.user.id },
    orderBy: [{ ordem: "desc" }, { createdAt: "desc" }],
  });
  return ok(registos);
}

/**
 * Cria um registo de carreira para o utilizador autenticado. A `ordem` é
 * atribuída acima do máximo atual (o novo registo fica no topo da lista).
 */
export async function criarRegistoCarreira(
  dados: unknown,
): Promise<Resultado<RegistoCarreira>> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  const parsed = criarRegistoCarreiraSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const topo = await prisma.registoCarreira.findFirst({
    where: { utilizadorId: session.user.id },
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  const proximaOrdem = (topo?.ordem ?? 0) + 1;

  const registo = await prisma.registoCarreira.create({
    data: {
      utilizadorId: session.user.id,
      clube: parsed.data.clube,
      escalao: parsed.data.escalao,
      epocaInicio: parsed.data.epocaInicio,
      epocaFim: parsed.data.epocaFim ?? null,
      conquistas: parsed.data.conquistas ?? null,
      notas: parsed.data.notas ?? null,
      ordem: proximaOrdem,
    },
  });

  revalidatePath(PATH_PERFIL);
  return ok(registo);
}

/**
 * Atualiza um registo de carreira. Verifica que o registo pertence ao
 * utilizador autenticado (ownership) antes de escrever.
 */
export async function atualizarRegistoCarreira(
  id: unknown,
  dados: unknown,
): Promise<Resultado<RegistoCarreira>> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  const idParsed = idRegistoCarreiraSchema.safeParse(id);
  if (!idParsed.success) return erro("Registo inválido");

  const parsed = atualizarRegistoCarreiraSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.registoCarreira.findUnique({
    where: { id: idParsed.data },
    select: { id: true, utilizadorId: true },
  });
  if (!existe || existe.utilizadorId !== session.user.id) {
    return erro("Registo não encontrado");
  }

  const registo = await prisma.registoCarreira.update({
    where: { id: existe.id },
    data: {
      ...(parsed.data.clube !== undefined ? { clube: parsed.data.clube } : {}),
      ...(parsed.data.escalao !== undefined
        ? { escalao: parsed.data.escalao }
        : {}),
      ...(parsed.data.epocaInicio !== undefined
        ? { epocaInicio: parsed.data.epocaInicio }
        : {}),
      ...(parsed.data.epocaFim !== undefined
        ? { epocaFim: parsed.data.epocaFim ?? null }
        : {}),
      ...(parsed.data.conquistas !== undefined
        ? { conquistas: parsed.data.conquistas ?? null }
        : {}),
      ...(parsed.data.notas !== undefined
        ? { notas: parsed.data.notas ?? null }
        : {}),
    },
  });

  revalidatePath(PATH_PERFIL);
  return ok(registo);
}

// ─────────────────────────────────────────────────────────────────────────────
// P4.5 (§8.17) — Métricas de carreira agregadas
//
// Evolução sobre P2.4: resumo do percurso do treinador calculado em JS sobre o
// resultado do `findMany` (sem query SQL complexa). Mantém-se a fronteira de
// P2.4 — filtra por `utilizadorId` do utilizador autenticado, não por clube/época.
// ─────────────────────────────────────────────────────────────────────────────

export type ResumoCarreira = {
  /** Nº de entradas no histórico. */
  totalRegistos: number;
  /** Nomes únicos de clubes (case-insensitive, após trim). */
  clubesDistintos: number;
  /** Registos sem `epocaFim` (passagens em curso). */
  epocasAtivas: number;
  /** Registos com `conquistas` não nulas/não vazias. */
  conquistasTotal: number;
  /** `epocaInicio` mais antiga (ordem lexicográfica de "AAAA/AAAA"), ou null. */
  primeiraEpoca: string | null;
};

/**
 * Resumo agregado do histórico de carreira do utilizador autenticado (P4.5).
 * Calcula as métricas em memória sobre o `findMany` — sem SQL de agregação.
 */
export async function obterResumoCarreira(): Promise<Resultado<ResumoCarreira>> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  const registos = await prisma.registoCarreira.findMany({
    where: { utilizadorId: session.user.id },
    select: { clube: true, epocaInicio: true, epocaFim: true, conquistas: true },
  });

  const clubes = new Set(
    registos.map((r) => r.clube.trim().toLowerCase()).filter((c) => c.length > 0),
  );

  const epocasInicio = registos
    .map((r) => r.epocaInicio.trim())
    .filter((e) => e.length > 0);

  const resumo: ResumoCarreira = {
    totalRegistos: registos.length,
    clubesDistintos: clubes.size,
    epocasAtivas: registos.filter((r) => !r.epocaFim).length,
    conquistasTotal: registos.filter(
      (r) => r.conquistas != null && r.conquistas.trim().length > 0,
    ).length,
    primeiraEpoca:
      epocasInicio.length > 0
        ? epocasInicio.reduce((a, b) => (a <= b ? a : b))
        : null,
  };

  return ok(resumo);
}

/**
 * Elimina um registo de carreira. Verifica ownership antes de apagar.
 */
export async function eliminarRegistoCarreira(
  id: unknown,
): Promise<Resultado<void>> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  const idParsed = idRegistoCarreiraSchema.safeParse(id);
  if (!idParsed.success) return erro("Registo inválido");

  const existe = await prisma.registoCarreira.findUnique({
    where: { id: idParsed.data },
    select: { id: true, utilizadorId: true },
  });
  if (!existe || existe.utilizadorId !== session.user.id) {
    return erro("Registo não encontrado");
  }

  await prisma.registoCarreira.delete({ where: { id: existe.id } });

  revalidatePath(PATH_PERFIL);
  return ok(undefined);
}
