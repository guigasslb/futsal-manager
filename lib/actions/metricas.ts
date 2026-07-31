"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { metricaSchema } from "@/lib/schemas/metrica";
import type { MetricaConfig } from "@prisma/client";

const PATH = "/definicoes/metricas";

export async function listarMetricas(apenasAtivas = false): Promise<Resultado<MetricaConfig[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const metricas = await prisma.metricaConfig.findMany({
    where: { clubeId, ...(apenasAtivas ? { ativa: true } : {}) },
    orderBy: { ordem: "asc" },
  });
  return ok(metricas);
}

export async function criarMetrica(dados: unknown): Promise<Resultado<MetricaConfig>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = metricaSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const ultimo = await prisma.metricaConfig.findFirst({
    where: { clubeId },
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  const ordem = (ultimo?.ordem ?? -1) + 1;

  const metrica = await prisma.metricaConfig.create({
    data: { ...parsed.data, ordem, clubeId },
  });
  revalidatePath(PATH);
  return ok(metrica);
}

export async function alternarMetrica(id: string, ativa: boolean): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const existe = await prisma.metricaConfig.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Métrica não encontrada");

  await prisma.metricaConfig.update({ where: { id }, data: { ativa } });
  revalidatePath(PATH);
  return ok(undefined);
}

export async function moverMetrica(
  id: string,
  direcao: "subir" | "descer",
): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const todas = await prisma.metricaConfig.findMany({
    where: { clubeId },
    orderBy: { ordem: "asc" },
  });
  const idx = todas.findIndex((m) => m.id === id);
  if (idx === -1) return erro("Métrica não encontrada");

  const idxAdj = direcao === "subir" ? idx - 1 : idx + 1;
  if (idxAdj < 0 || idxAdj >= todas.length) return ok(undefined);

  await prisma.$transaction([
    prisma.metricaConfig.update({ where: { id: todas[idx].id }, data: { ordem: todas[idxAdj].ordem } }),
    prisma.metricaConfig.update({ where: { id: todas[idxAdj].id }, data: { ordem: todas[idx].ordem } }),
  ]);
  revalidatePath(PATH);
  return ok(undefined);
}
