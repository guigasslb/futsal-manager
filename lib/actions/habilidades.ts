"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { habilidadeSchema } from "@/lib/schemas/habilidade";
import type { Habilidade, Modalidade, NivelHabilidade } from "@prisma/client";

const PATH = "/definicoes/habilidades";

/**
 * Habilidades do clube (caderneta §8.14). Filtro opcional por modalidade (§3.8):
 * sem filtro devolve todas; com modalidade concreta inclui as universais
 * (`modalidade = null`), que servem as duas modalidades.
 */
export async function listarHabilidades(
  modalidade?: Modalidade,
): Promise<Resultado<Habilidade[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const habilidades = await prisma.habilidade.findMany({
    where: {
      clubeId,
      ...(modalidade ? { OR: [{ modalidade }, { modalidade: null }] } : {}),
    },
    orderBy: [{ nivel: "asc" }, { ordem: "asc" }],
  });
  return ok(habilidades);
}

export async function criarHabilidade(dados: unknown): Promise<Resultado<Habilidade>> {
  const perm = await exigirCapacidade("CATALOGO_HABILIDADES");
  if (!perm.ok) return erro(perm.erro);
  const clubeId = perm.ctx.clube.id;

  const parsed = habilidadeSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const ultimo = await prisma.habilidade.findFirst({
    where: { clubeId, nivel: parsed.data.nivel },
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  const ordem = (ultimo?.ordem ?? -1) + 1;

  const habilidade = await prisma.habilidade.create({
    data: { ...parsed.data, ordem, clubeId },
  });
  revalidatePath(PATH);
  return ok(habilidade);
}

export async function atualizarHabilidade(
  id: string,
  dados: unknown,
): Promise<Resultado<Habilidade>> {
  const perm = await exigirCapacidade("CATALOGO_HABILIDADES");
  if (!perm.ok) return erro(perm.erro);
  const clubeId = perm.ctx.clube.id;

  const parsed = habilidadeSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.habilidade.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Habilidade não encontrada");

  const habilidade = await prisma.habilidade.update({ where: { id }, data: parsed.data });
  revalidatePath(PATH);
  return ok(habilidade);
}

export async function apagarHabilidade(id: string): Promise<Resultado<void>> {
  const perm = await exigirCapacidade("CATALOGO_HABILIDADES");
  if (!perm.ok) return erro(perm.erro);

  const existe = await prisma.habilidade.findFirst({ where: { id, clubeId: perm.ctx.clube.id } });
  if (!existe) return erro("Habilidade não encontrada");

  // ProgressoHabilidade é Restrict — apagar com progressos lançaria P2003 (500).
  const totalProgressos = await prisma.progressoHabilidade.count({ where: { habilidadeId: id } });
  if (totalProgressos > 0)
    return erro(
      `Não é possível apagar: esta habilidade tem ${totalProgressos} registo(s) de progresso na caderneta.`,
    );

  await prisma.habilidade.delete({ where: { id } });
  revalidatePath(PATH);
  return ok(undefined);
}

export async function moverHabilidade(
  id: string,
  direcao: "subir" | "descer",
): Promise<Resultado<void>> {
  const perm = await exigirCapacidade("CATALOGO_HABILIDADES");
  if (!perm.ok) return erro(perm.erro);
  const clubeId = perm.ctx.clube.id;

  const habilidade = await prisma.habilidade.findFirst({ where: { id, clubeId } });
  if (!habilidade) return erro("Habilidade não encontrada");

  // Reordena apenas dentro do mesmo nível
  const todas = await prisma.habilidade.findMany({
    where: { clubeId, nivel: habilidade.nivel as NivelHabilidade },
    orderBy: { ordem: "asc" },
  });
  const idx = todas.findIndex((h) => h.id === id);
  const idxAdj = direcao === "subir" ? idx - 1 : idx + 1;
  if (idxAdj < 0 || idxAdj >= todas.length) return ok(undefined);

  await prisma.$transaction([
    prisma.habilidade.update({ where: { id: todas[idx].id }, data: { ordem: todas[idxAdj].ordem } }),
    prisma.habilidade.update({ where: { id: todas[idxAdj].id }, data: { ordem: todas[idx].ordem } }),
  ]);
  revalidatePath(PATH);
  return ok(undefined);
}
