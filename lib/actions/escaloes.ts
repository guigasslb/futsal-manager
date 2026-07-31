"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { escalaoSchema } from "@/lib/schemas/escalao";
import type { Escalao } from "@prisma/client";

const PATH = "/definicoes/escaloes";

export async function listarEscaloes(): Promise<Resultado<Escalao[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const escaloes = await prisma.escalao.findMany({
    where: { clubeId },
    orderBy: { ordem: "asc" },
  });
  return ok(escaloes);
}

export async function criarEscalao(dados: unknown): Promise<Resultado<Escalao>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = escalaoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const ultimo = await prisma.escalao.findFirst({
    where: { clubeId },
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  const ordem = (ultimo?.ordem ?? -1) + 1;

  const escalao = await prisma.escalao.create({
    data: { ...parsed.data, ordem, clubeId },
  });
  revalidatePath(PATH);
  return ok(escalao);
}

export async function atualizarEscalao(id: string, dados: unknown): Promise<Resultado<Escalao>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = escalaoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.escalao.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Escalão não encontrado");

  const escalao = await prisma.escalao.update({
    where: { id },
    data: parsed.data,
  });
  revalidatePath(PATH);
  return ok(escalao);
}

export async function apagarEscalao(id: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const existe = await prisma.escalao.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Escalão não encontrado");

  // Bloqueado se tiver atletas associados (secção 12.8)
  const totalAtletas = await prisma.atleta.count({ where: { escalaoId: id } });
  if (totalAtletas > 0)
    return erro(`Não é possível apagar: este escalão tem ${totalAtletas} atleta(s) associado(s).`);

  await prisma.escalao.delete({ where: { id } });
  revalidatePath(PATH);
  return ok(undefined);
}

// Reordenação por troca com item adjacente
export async function moverEscalao(
  id: string,
  direcao: "subir" | "descer",
): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const todos = await prisma.escalao.findMany({
    where: { clubeId },
    orderBy: { ordem: "asc" },
  });
  const idx = todos.findIndex((e) => e.id === id);
  if (idx === -1) return erro("Escalão não encontrado");

  const idxAdj = direcao === "subir" ? idx - 1 : idx + 1;
  if (idxAdj < 0 || idxAdj >= todos.length) return ok(undefined);

  const atual = todos[idx];
  const adjacente = todos[idxAdj];

  await prisma.$transaction([
    prisma.escalao.update({ where: { id: atual.id }, data: { ordem: adjacente.ordem } }),
    prisma.escalao.update({ where: { id: adjacente.id }, data: { ordem: atual.ordem } }),
  ]);
  revalidatePath(PATH);
  return ok(undefined);
}
