"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade, podeLerEscalao, escaloesLegiveis } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { competicaoSchema } from "@/lib/schemas/competicao";
import { Prisma, type Competicao } from "@prisma/client";

const PATH = "/jogos/competicoes";

const INCLUDE = {
  escalao: { select: { id: true, nome: true } },
  _count: { select: { jogos: true } },
} as const;

export type CompeticaoComRelacoes = Prisma.CompeticaoGetPayload<{ include: typeof INCLUDE }>;

export async function listarCompeticoes(
  escalaoId?: string,
): Promise<Resultado<CompeticaoComRelacoes[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");
  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const legiveis = await escaloesLegiveis();
  let filtro: Prisma.CompeticaoWhereInput = {};
  if (escalaoId) {
    if (!(await podeLerEscalao(escalaoId))) return ok([]);
    filtro = { escalaoId };
  } else if (legiveis !== "TODOS") {
    filtro = { escalaoId: { in: legiveis } };
  }

  const competicoes = await prisma.competicao.findMany({
    where: { epocaId: epoca.id, clubeId, ...filtro },
    include: INCLUDE,
    orderBy: { criadoEm: "desc" },
  });
  return ok(competicoes);
}

export async function criarCompeticao(dados: unknown): Promise<Resultado<Competicao>> {
  const parsed = competicaoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const perm = await exigirCapacidade("COMPETICOES_GERIR", parsed.data.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const escalao = await prisma.escalao.findFirst({
    where: { id: parsed.data.escalaoId, clubeId: perm.ctx.clube.id },
  });
  if (!escalao) return erro("O escalão selecionado não existe");

  const competicao = await prisma.competicao.create({
    data: {
      clubeId: perm.ctx.clube.id,
      escalaoId: parsed.data.escalaoId,
      epocaId: epoca.id,
      nome: parsed.data.nome,
      tipo: parsed.data.tipo,
    },
  });
  revalidatePath(PATH);
  return ok(competicao);
}

export async function apagarCompeticao(id: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const existe = await prisma.competicao.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Competição não encontrada");

  const perm = await exigirCapacidade("COMPETICOES_GERIR", existe.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  // Desliga os jogos da competição (não os apaga)
  await prisma.$transaction([
    prisma.jogo.updateMany({ where: { competicaoId: id }, data: { competicaoId: null } }),
    prisma.competicao.delete({ where: { id } }),
  ]);
  revalidatePath(PATH);
  return ok(undefined);
}
