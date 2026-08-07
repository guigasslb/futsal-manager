"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade, podeLerEscalao, escaloesLegiveis } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import {
  criarCompeticaoSchema,
  atualizarCompeticaoSchema,
  registarResultadoExternoSchema,
} from "@/lib/schemas/competicao";
import { calcularClassificacao, type LinhaClassificacao } from "@/lib/classificacao";
import { Prisma, type Competicao, type ResultadoCompeticao } from "@prisma/client";

export type { LinhaClassificacao } from "@/lib/classificacao";

const PATH = "/jogos/competicoes";

// ─────────────────────────────────────────────
// Tipos de leitura
// ─────────────────────────────────────────────

const INCLUDE_RESUMO = {
  escalao: { select: { id: true, nome: true } },
  _count: { select: { jogos: true, resultados: true } },
} as const;

const ORDER_RESULTADOS: Prisma.ResultadoCompeticaoOrderByWithRelationInput[] = [
  { data: "asc" },
  { criadoEm: "asc" },
];

const INCLUDE_DETALHE = {
  escalao: { select: { id: true, nome: true } },
  resultados: { orderBy: ORDER_RESULTADOS },
  jogos: {
    select: {
      id: true,
      data: true,
      adversario: true,
      casaFora: true,
      golosMarcados: true,
      golosSofridos: true,
    },
    orderBy: { data: "asc" },
  },
  _count: { select: { jogos: true, resultados: true } },
} as const;

export type CompeticaoResumo = Prisma.CompeticaoGetPayload<{ include: typeof INCLUDE_RESUMO }>;
export type CompeticaoDetalhe = Prisma.CompeticaoGetPayload<{ include: typeof INCLUDE_DETALHE }>;

/** Alias retrocompatível (usado pela UI anterior a F6). */
export type CompeticaoComRelacoes = CompeticaoResumo;

// ─────────────────────────────────────────────
// CRUD de competições
// ─────────────────────────────────────────────

export async function listarCompeticoes(
  escalaoId?: string,
): Promise<Resultado<CompeticaoResumo[]>> {
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
    include: INCLUDE_RESUMO,
    orderBy: { criadoEm: "desc" },
  });
  return ok(competicoes);
}

export async function obterCompeticao(id: string): Promise<Resultado<CompeticaoDetalhe>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const competicao = await prisma.competicao.findFirst({
    where: { id, clubeId },
    include: INCLUDE_DETALHE,
  });
  if (!competicao) return erro("Competição não encontrada");
  if (!(await podeLerEscalao(competicao.escalaoId)))
    return erro("Sem permissão neste escalão");

  return ok(competicao);
}

export async function criarCompeticao(dados: unknown): Promise<Resultado<Competicao>> {
  const parsed = criarCompeticaoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const perm = await exigirCapacidade("COMPETICOES_GERIR", parsed.data.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const clubeId = perm.ctx.clube.id;

  // Época: a indicada (validada contra o clube) ou a época ativa.
  let epocaId = parsed.data.epocaId ?? null;
  if (epocaId) {
    const epoca = await prisma.epoca.findFirst({ where: { id: epocaId, clubeId } });
    if (!epoca) return erro("A época selecionada não existe");
  } else {
    const epoca = await obterEpocaAtiva();
    if (!epoca) return erro("Nenhuma época ativa");
    epocaId = epoca.id;
  }

  const escalao = await prisma.escalao.findFirst({
    where: { id: parsed.data.escalaoId, clubeId },
  });
  if (!escalao) return erro("O escalão selecionado não existe");

  const competicao = await prisma.competicao.create({
    data: {
      clubeId,
      escalaoId: parsed.data.escalaoId,
      epocaId,
      nome: parsed.data.nome,
      tipo: parsed.data.tipo,
      formato: parsed.data.formato,
    },
  });
  revalidatePath(PATH);
  return ok(competicao);
}

export async function atualizarCompeticao(
  id: string,
  dados: unknown,
): Promise<Resultado<Competicao>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  // O `id` do parâmetro é a autoridade (ignora um eventual id no payload).
  const parsed = atualizarCompeticaoSchema.safeParse({
    ...(typeof dados === "object" && dados !== null ? dados : {}),
    id,
  });
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.competicao.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Competição não encontrada");

  const perm = await exigirCapacidade("COMPETICOES_GERIR", existe.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  // Mudança de escalão: exige permissão no destino e que pertença ao clube.
  const novoEscalaoId = parsed.data.escalaoId;
  if (novoEscalaoId && novoEscalaoId !== existe.escalaoId) {
    const permDestino = await exigirCapacidade("COMPETICOES_GERIR", novoEscalaoId);
    if (!permDestino.ok) return erro(permDestino.erro);
    const escalao = await prisma.escalao.findFirst({
      where: { id: novoEscalaoId, clubeId },
    });
    if (!escalao) return erro("O escalão selecionado não existe");
  }

  const data: Prisma.CompeticaoUpdateInput = {};
  if (parsed.data.nome !== undefined) data.nome = parsed.data.nome;
  if (parsed.data.tipo !== undefined) data.tipo = parsed.data.tipo;
  if (parsed.data.formato !== undefined) data.formato = parsed.data.formato;
  if (novoEscalaoId !== undefined)
    data.escalao = { connect: { id: novoEscalaoId } };

  const competicao = await prisma.competicao.update({ where: { id }, data });
  revalidatePath(PATH);
  revalidatePath(`${PATH}/${id}`);
  return ok(competicao);
}

export async function apagarCompeticao(id: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const existe = await prisma.competicao.findFirst({ where: { id, clubeId } });
  if (!existe) return erro("Competição não encontrada");

  const perm = await exigirCapacidade("COMPETICOES_GERIR", existe.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  // Desliga os jogos da competição (não os apaga). Os resultados externos são
  // apagados em cascata (FK onDelete: Cascade).
  await prisma.$transaction([
    prisma.jogo.updateMany({ where: { competicaoId: id }, data: { competicaoId: null } }),
    prisma.competicao.delete({ where: { id } }),
  ]);
  revalidatePath(PATH);
  return ok(undefined);
}

// ─────────────────────────────────────────────
// Resultados externos (outras equipas)
// ─────────────────────────────────────────────

export async function registarResultadoExterno(
  dados: unknown,
): Promise<Resultado<ResultadoCompeticao>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = registarResultadoExternoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const competicao = await prisma.competicao.findFirst({
    where: { id: parsed.data.competicaoId, clubeId },
  });
  if (!competicao) return erro("Competição não encontrada");

  const perm = await exigirCapacidade("COMPETICOES_GERIR", competicao.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  if (parsed.data.equipaCasa.trim() === parsed.data.equipaFora.trim())
    return erro("As duas equipas têm de ser diferentes");

  const resultado = await prisma.resultadoCompeticao.create({
    data: {
      competicaoId: parsed.data.competicaoId,
      equipaCasa: parsed.data.equipaCasa.trim(),
      equipaFora: parsed.data.equipaFora.trim(),
      golosCasa: parsed.data.golosCasa,
      golosFora: parsed.data.golosFora,
      data: parsed.data.data ?? null,
    },
  });
  revalidatePath(`${PATH}/${parsed.data.competicaoId}`);
  return ok(resultado);
}

export async function apagarResultadoExterno(id: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const resultado = await prisma.resultadoCompeticao.findFirst({
    where: { id, competicao: { clubeId } },
    select: { id: true, competicaoId: true, competicao: { select: { escalaoId: true } } },
  });
  if (!resultado) return erro("Resultado não encontrado");

  const perm = await exigirCapacidade("COMPETICOES_GERIR", resultado.competicao.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  await prisma.resultadoCompeticao.delete({ where: { id } });
  revalidatePath(`${PATH}/${resultado.competicaoId}`);
  return ok(undefined);
}

// ─────────────────────────────────────────────
// Classificação (calculada)
// ─────────────────────────────────────────────

/**
 * Tabela de classificação de uma competição, combinando os jogos da própria
 * equipa (com resultado final) e os resultados externos inseridos manualmente.
 * A tabela é CALCULADA (não armazenada) — bíblia §3.7.
 */
export async function obterClassificacao(
  competicaoId: string,
): Promise<Resultado<LinhaClassificacao[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const competicao = await prisma.competicao.findFirst({
    where: { id: competicaoId, clubeId },
    include: { escalao: { select: { nome: true } } },
  });
  if (!competicao) return erro("Competição não encontrada");
  if (!(await podeLerEscalao(competicao.escalaoId)))
    return erro("Sem permissão neste escalão");

  // Jogos próprios com resultado final (ambos os golos preenchidos).
  const jogos = await prisma.jogo.findMany({
    where: {
      competicaoId,
      golosMarcados: { not: null },
      golosSofridos: { not: null },
    },
    select: { adversario: true, golosMarcados: true, golosSofridos: true },
  });

  const resultados = await prisma.resultadoCompeticao.findMany({
    where: { competicaoId },
    select: { equipaCasa: true, equipaFora: true, golosCasa: true, golosFora: true },
  });

  const classificacao = calcularClassificacao({
    nomeEquipaPropria: competicao.escalao.nome,
    formato: competicao.formato,
    jogosProprios: jogos.map((j) => ({
      adversario: j.adversario,
      // Não-nulos garantidos pelo filtro acima.
      golosMarcados: j.golosMarcados as number,
      golosSofridos: j.golosSofridos as number,
    })),
    resultados,
  });

  return ok(classificacao);
}
