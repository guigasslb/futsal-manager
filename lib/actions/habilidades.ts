"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { habilidadeSchema } from "@/lib/schemas/habilidade";
import type { Habilidade, NivelHabilidade } from "@prisma/client";

const PATH = "/definicoes/habilidades";

export async function listarHabilidades(): Promise<Resultado<Habilidade[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const habilidades = await prisma.habilidade.findMany({
    where: { clubeId },
    orderBy: [{ nivel: "asc" }, { ordem: "asc" }],
  });
  return ok(habilidades);
}

export async function criarHabilidade(dados: unknown): Promise<Resultado<Habilidade>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

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
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = habilidadeSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.habilidade.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Habilidade não encontrada");

  const habilidade = await prisma.habilidade.update({ where: { id }, data: parsed.data });
  revalidatePath(PATH);
  return ok(habilidade);
}

export async function apagarHabilidade(id: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const existe = await prisma.habilidade.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Habilidade não encontrada");

  await prisma.habilidade.delete({ where: { id } });
  revalidatePath(PATH);
  return ok(undefined);
}

export async function moverHabilidade(
  id: string,
  direcao: "subir" | "descer",
): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

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
