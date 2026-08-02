"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { modeloJogoSchema } from "@/lib/schemas/modeloJogo";
import type { MomentoJogo, ModeloJogo } from "@prisma/client";

const PATH = "/modelo-jogo";

export async function listarModelosJogo(
  momento?: MomentoJogo,
): Promise<Resultado<ModeloJogo[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const modelos = await prisma.modeloJogo.findMany({
    where: { clubeProprietarioId: clubeId, ...(momento ? { momento } : {}) },
    orderBy: [{ momento: "asc" }, { nome: "asc" }],
  });
  return ok(modelos);
}

export async function obterModeloJogo(id: string): Promise<Resultado<ModeloJogo>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const modelo = await prisma.modeloJogo.findFirst({
    where: { id, clubeProprietarioId: clubeId },
  });
  if (!modelo) return erro("Modelo de jogo não encontrado");
  return ok(modelo);
}

export async function criarModeloJogo(dados: unknown): Promise<Resultado<ModeloJogo>> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  const perm = await exigirCapacidade("MODELO_JOGO_GERIR");
  if (!perm.ok) return erro(perm.erro);

  const parsed = modeloJogoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const modelo = await prisma.modeloJogo.create({
    data: {
      autorId: session.user.id,
      proprietario: "CLUBE",
      clubeProprietarioId: perm.ctx.clube.id,
      nome: parsed.data.nome,
      momento: parsed.data.momento,
      principios: parsed.data.principios ?? null,
      diagrama: parsed.data.diagrama ?? undefined,
    },
  });
  revalidatePath(PATH);
  return ok(modelo);
}

export async function atualizarModeloJogo(
  id: string,
  dados: unknown,
): Promise<Resultado<ModeloJogo>> {
  const perm = await exigirCapacidade("MODELO_JOGO_GERIR");
  if (!perm.ok) return erro(perm.erro);

  const parsed = modeloJogoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.modeloJogo.findFirst({
    where: { id, clubeProprietarioId: perm.ctx.clube.id },
  });
  if (!existe) return erro("Modelo de jogo não encontrado");

  const modelo = await prisma.modeloJogo.update({
    where: { id },
    data: {
      nome: parsed.data.nome,
      momento: parsed.data.momento,
      principios: parsed.data.principios ?? null,
      diagrama: parsed.data.diagrama ?? undefined,
    },
  });
  revalidatePath(PATH);
  revalidatePath(`${PATH}/${id}`);
  return ok(modelo);
}

export async function apagarModeloJogo(id: string): Promise<Resultado<void>> {
  const perm = await exigirCapacidade("MODELO_JOGO_GERIR");
  if (!perm.ok) return erro(perm.erro);

  const existe = await prisma.modeloJogo.findFirst({
    where: { id, clubeProprietarioId: perm.ctx.clube.id },
  });
  if (!existe) return erro("Modelo de jogo não encontrado");

  await prisma.modeloJogo.delete({ where: { id } });
  revalidatePath(PATH);
  return ok(undefined);
}
