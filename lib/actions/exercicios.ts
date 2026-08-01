"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { exercicioSchema } from "@/lib/schemas/exercicio";
import type { CategoriaExercicio, Exercicio } from "@prisma/client";

const PATH = "/exercicios";

export async function listarExercicios(
  categoria?: CategoriaExercicio,
): Promise<Resultado<Exercicio[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const exercicios = await prisma.exercicio.findMany({
    where: {
      clubeId,
      ...(categoria ? { categoria } : {}),
    },
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });
  return ok(exercicios);
}

export async function obterExercicio(id: string): Promise<Resultado<Exercicio>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const exercicio = await prisma.exercicio.findFirst({
    where: { id, clubeId },
  });
  if (!exercicio) return erro("Exercício não encontrado");
  return ok(exercicio);
}

export async function criarExercicio(dados: unknown): Promise<Resultado<Exercicio>> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  const perm = await exigirCapacidade("EXERCICIOS_GERIR");
  if (!perm.ok) return erro(perm.erro);
  const clubeId = perm.ctx.clube.id;

  const parsed = exercicioSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const { diagrama, ...resto } = parsed.data;
  const exercicio = await prisma.exercicio.create({
    data: {
      ...resto,
      diagrama: diagrama ?? undefined,
      clubeId,
      criadorId: session.user.id,
    },
  });
  revalidatePath(PATH);
  return ok(exercicio);
}

export async function atualizarExercicio(
  id: string,
  dados: unknown,
): Promise<Resultado<Exercicio>> {
  const perm = await exigirCapacidade("EXERCICIOS_GERIR");
  if (!perm.ok) return erro(perm.erro);
  const clubeId = perm.ctx.clube.id;

  const parsed = exercicioSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.exercicio.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Exercício não encontrado");

  const exercicio = await prisma.exercicio.update({
    where: { id },
    data: {
      nome: parsed.data.nome,
      descricao: parsed.data.descricao ?? null,
      objetivo: parsed.data.objetivo ?? null,
      duracaoMin: parsed.data.duracaoMin ?? null,
      categoria: parsed.data.categoria ?? null,
      diagrama: parsed.data.diagrama ?? undefined,
    },
  });
  revalidatePath(PATH);
  revalidatePath(`${PATH}/${id}`);
  return ok(exercicio);
}

export async function apagarExercicio(id: string): Promise<Resultado<void>> {
  const perm = await exigirCapacidade("EXERCICIOS_GERIR");
  if (!perm.ok) return erro(perm.erro);
  const clubeId = perm.ctx.clube.id;

  const existe = await prisma.exercicio.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Exercício não encontrado");

  const emUso = await prisma.sessaoExercicio.count({ where: { exercicioId: id } });
  if (emUso > 0)
    return erro(
      `Este exercício está a ser usado em ${emUso} sessão(ões) de treino e não pode ser apagado.`,
    );

  await prisma.exercicio.delete({ where: { id } });
  revalidatePath(PATH);
  return ok(undefined);
}
