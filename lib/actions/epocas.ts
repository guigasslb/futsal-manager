"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { obterClubeIdAtual, COOKIE_EPOCA } from "@/lib/epoca-context";
import { exigirCapacidade } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import type { Epoca } from "@prisma/client";

const schemaEpoca = z.object({
  nome: z.string().min(1, "Nome obrigatório").max(20),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
}).refine((d) => d.dataFim > d.dataInicio, {
  message: "Data de fim deve ser posterior ao início",
  path: ["dataFim"],
});

export async function listarEpocas(): Promise<Resultado<Epoca[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const epocas = await prisma.epoca.findMany({
    where: { clubeId },
    orderBy: { dataInicio: "desc" },
  });
  return ok(epocas);
}

export async function criarEpoca(dados: unknown): Promise<Resultado<Epoca>> {
  const perm = await exigirCapacidade("CLUBE_EPOCAS");
  if (!perm.ok) return erro(perm.erro);
  const clubeId = perm.ctx.clube.id;

  const parsed = schemaEpoca.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const epoca = await prisma.epoca.create({
    data: { ...parsed.data, clubeId },
  });
  revalidatePath("/definicoes/epocas");
  return ok(epoca);
}

// Marca ativa=true na BD e desmarca as outras (secção 12.1) — usada em Definições > Épocas
export async function definirEpocaAtiva(id: string): Promise<Resultado<void>> {
  const perm = await exigirCapacidade("CLUBE_EPOCAS");
  if (!perm.ok) return erro(perm.erro);
  const clubeId = perm.ctx.clube.id;

  const epoca = await prisma.epoca.findFirst({ where: { id, clubeId } });
  if (!epoca) return erro("Época não encontrada");

  await prisma.$transaction([
    prisma.epoca.updateMany({ where: { clubeId }, data: { ativa: false } }),
    prisma.epoca.update({ where: { id }, data: { ativa: true } }),
  ]);

  // Sincroniza o cookie com a nova época ativa
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_EPOCA, id, { path: "/", httpOnly: false, maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
  return ok(undefined);
}

// Apenas seleciona a época no cookie (sem alterar a BD) — usado pelo SeletorEpoca
export async function selecionarEpoca(id: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const epoca = await prisma.epoca.findFirst({ where: { id, clubeId } });
  if (!epoca) return erro("Época não encontrada");

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_EPOCA, id, { path: "/", httpOnly: false, maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
  return ok(undefined);
}
