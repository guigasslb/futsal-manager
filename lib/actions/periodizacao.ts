"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade, podeLerEscalao, escaloesLegiveis } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { planeamentoSchema } from "@/lib/schemas/planeamento";
import { Prisma, type Planeamento } from "@prisma/client";

const PATH = "/treinos/periodizacao";

const INCLUDE = {
  escalao: { select: { id: true, nome: true } },
  _count: { select: { sessoes: true } },
} as const;

export type PlaneamentoComRelacoes = Prisma.PlaneamentoGetPayload<{ include: typeof INCLUDE }>;

export async function listarPlaneamentos(
  escalaoId?: string,
): Promise<Resultado<PlaneamentoComRelacoes[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");
  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const legiveis = await escaloesLegiveis();
  let filtro: Prisma.PlaneamentoWhereInput = {};
  if (escalaoId) {
    if (!(await podeLerEscalao(escalaoId))) return ok([]);
    filtro = { escalaoId };
  } else if (legiveis !== "TODOS") {
    filtro = { escalaoId: { in: legiveis } };
  }

  const planeamentos = await prisma.planeamento.findMany({
    where: { epocaId: epoca.id, escalao: { clubeId }, ...filtro },
    include: INCLUDE,
    orderBy: { dataInicio: "desc" },
  });
  return ok(planeamentos);
}

export async function criarPlaneamento(dados: unknown): Promise<Resultado<Planeamento>> {
  const parsed = planeamentoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const perm = await exigirCapacidade("PERIODIZACAO_GERIR", parsed.data.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const escalao = await prisma.escalao.findFirst({
    where: { id: parsed.data.escalaoId, clubeId: perm.ctx.clube.id },
  });
  if (!escalao) return erro("O escalão selecionado não existe");

  const planeamento = await prisma.planeamento.create({
    data: {
      clubeId: perm.ctx.clube.id,
      escalaoId: parsed.data.escalaoId,
      epocaId: epoca.id,
      tipo: parsed.data.tipo,
      periodo: parsed.data.periodo ?? null,
      mesociclo: parsed.data.mesociclo ?? null,
      microciclo: parsed.data.microciclo ?? null,
      dataInicio: parsed.data.dataInicio,
      dataFim: parsed.data.dataFim,
      objetivos: parsed.data.objetivos ?? null,
    },
  });
  revalidatePath(PATH);
  return ok(planeamento);
}

export async function atualizarPlaneamento(
  id: string,
  dados: unknown,
): Promise<Resultado<Planeamento>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = planeamentoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.planeamento.findFirst({
    where: { id, escalao: { clubeId } },
  });
  if (!existe) return erro("Planeamento não encontrado");

  const perm = await exigirCapacidade("PERIODIZACAO_GERIR", existe.escalaoId);
  if (!perm.ok) return erro(perm.erro);
  if (parsed.data.escalaoId !== existe.escalaoId) {
    const permDestino = await exigirCapacidade("PERIODIZACAO_GERIR", parsed.data.escalaoId);
    if (!permDestino.ok) return erro(permDestino.erro);
  }

  const planeamento = await prisma.planeamento.update({
    where: { id },
    data: {
      escalaoId: parsed.data.escalaoId,
      tipo: parsed.data.tipo,
      periodo: parsed.data.periodo ?? null,
      mesociclo: parsed.data.mesociclo ?? null,
      microciclo: parsed.data.microciclo ?? null,
      dataInicio: parsed.data.dataInicio,
      dataFim: parsed.data.dataFim,
      objetivos: parsed.data.objetivos ?? null,
    },
  });
  revalidatePath(PATH);
  return ok(planeamento);
}

export async function apagarPlaneamento(id: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const existe = await prisma.planeamento.findFirst({
    where: { id, escalao: { clubeId } },
  });
  if (!existe) return erro("Planeamento não encontrado");

  const perm = await exigirCapacidade("PERIODIZACAO_GERIR", existe.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  // As sessões ligadas não são apagadas; apenas se desligam do planeamento.
  await prisma.$transaction([
    prisma.sessao.updateMany({ where: { planeamentoId: id }, data: { planeamentoId: null } }),
    prisma.planeamento.delete({ where: { id } }),
  ]);
  revalidatePath(PATH);
  return ok(undefined);
}
