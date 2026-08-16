"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade, podeLerEscalao, escaloesLegiveis } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { sessaoSchema, marcarPresencasSchema } from "@/lib/schemas/treino";
import { construirSnapshotExercicio } from "@/lib/snapshot-exercicio";
import { Prisma, type Epoca, type Sessao } from "@prisma/client";

const PATH = "/treinos";

const INCLUDE_LISTA = {
  escalao: { select: { id: true, nome: true } },
  _count: { select: { exercicios: true } },
  presencas: { select: { estado: true } },
  planeamento: { select: { id: true, tipo: true, dataInicio: true, dataFim: true, microciclo: true } },
} as const;

const INCLUDE_DETALHE = {
  escalao: { select: { id: true, nome: true } },
  exercicios: {
    orderBy: { ordem: "asc" },
    include: {
      exercicio: {
        select: {
          id: true,
          nome: true,
          descricao: true,
          objetivo: true,
          duracaoMin: true,
          categoriaPrincipal: true,
          diagrama: true,
        },
      },
    },
  },
  presencas: {
    include: { atleta: { select: { id: true, nome: true, posicoes: true } } },
  },
} as const;

export type SessaoLista = Prisma.SessaoGetPayload<{ include: typeof INCLUDE_LISTA }>;

/**
 * Detalhe da sessão. O número de camisola já não vive no Atleta (F1) — é resolvido
 * a partir da participação (AtletaEscalao) no escalão/época da sessão.
 */
export type SessaoDetalhe = Prisma.SessaoGetPayload<{ include: typeof INCLUDE_DETALHE }> & {
  numeroPorAtleta: Record<string, number | null>;
};

/** Números de camisola dos atletas indicados, no escalão/época dados. */
async function resolverNumeros(
  escalaoId: string,
  epocaId: string,
  atletaIds: string[],
): Promise<Record<string, number | null>> {
  if (atletaIds.length === 0) return {};
  const participacoes = await prisma.atletaEscalao.findMany({
    where: { escalaoId, epocaId, atletaId: { in: atletaIds } },
    select: { atletaId: true, numero: true },
  });
  const numeroPorAtleta: Record<string, number | null> = {};
  for (const id of atletaIds) numeroPorAtleta[id] = null;
  for (const p of participacoes) numeroPorAtleta[p.atletaId] = p.numero;
  return numeroPorAtleta;
}

type Contexto =
  | { estado: "erro"; erro: string }
  | { estado: "ok"; clubeId: string; epoca: Epoca };

async function contexto(): Promise<Contexto> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return { estado: "erro", erro: "Não autenticado" };
  const epoca = await obterEpocaAtiva();
  if (!epoca) return { estado: "erro", erro: "Nenhuma época ativa" };
  return { estado: "ok", clubeId, epoca };
}

export async function listarSessoes(escalaoId?: string): Promise<Resultado<SessaoLista[]>> {
  const ctx = await contexto();
  if (ctx.estado === "erro") return erro(ctx.erro);

  const legiveis = await escaloesLegiveis();
  let filtroEscalao: Prisma.SessaoWhereInput = {};
  if (escalaoId) {
    if (!(await podeLerEscalao(escalaoId))) return ok([]);
    filtroEscalao = { escalaoId };
  } else if (legiveis !== "TODOS") {
    filtroEscalao = { escalaoId: { in: legiveis } };
  }

  const sessoes = await prisma.sessao.findMany({
    where: {
      epocaId: ctx.epoca.id,
      escalao: { clubeId: ctx.clubeId },
      ...filtroEscalao,
    },
    include: INCLUDE_LISTA,
    orderBy: { data: "desc" },
  });
  return ok(sessoes);
}

export async function obterSessao(id: string): Promise<Resultado<SessaoDetalhe>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const sessao = await prisma.sessao.findFirst({
    where: { id, escalao: { clubeId } },
    include: INCLUDE_DETALHE,
  });
  if (!sessao) return erro("Sessão não encontrada");
  if (!(await podeLerEscalao(sessao.escalaoId))) return erro("Sem permissão neste escalão");

  const numeroPorAtleta = await resolverNumeros(
    sessao.escalaoId,
    sessao.epocaId,
    sessao.presencas.map((p) => p.atletaId),
  );
  return ok({ ...sessao, numeroPorAtleta });
}

export async function criarSessao(dados: unknown): Promise<Resultado<Sessao>> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  const ctx = await contexto();
  if (ctx.estado === "erro") return erro(ctx.erro);

  const parsed = sessaoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  // Guarda de dupla validação: só treinos NORMAL podem ligar a periodização.
  if (parsed.data.tipoSessao !== "NORMAL" && parsed.data.planeamentoId) {
    return erro("Só treinos normais podem estar associados a uma periodização.", {
      planeamentoId: "Só treinos normais podem estar associados a uma periodização.",
    });
  }

  const perm = await exigirCapacidade("TREINOS_GERIR", parsed.data.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const escalao = await prisma.escalao.findFirst({
    where: { id: parsed.data.escalaoId, clubeId: ctx.clubeId },
  });
  if (!escalao) return erro("O escalão selecionado não existe");

  if (parsed.data.planeamentoId) {
    const plan = await prisma.planeamento.findFirst({
      where: { id: parsed.data.planeamentoId, escalao: { clubeId: ctx.clubeId } },
    });
    if (!plan) return erro("Planeamento não encontrado");
    if (plan.escalaoId !== parsed.data.escalaoId)
      return erro("O planeamento pertence a um escalão diferente");
  }

  const sessao = await prisma.sessao.create({
    data: {
      data: parsed.data.data,
      escalaoId: parsed.data.escalaoId,
      tipoSessao: parsed.data.tipoSessao,
      planeamentoId: parsed.data.planeamentoId ?? null,
      duracaoMin: parsed.data.duracaoMin ?? null,
      objetivo: parsed.data.objetivo ?? null,
      local: parsed.data.local ?? null,
      notas: parsed.data.notas ?? null,
      epocaId: ctx.epoca.id,
      criadorId: session.user.id,
    },
  });
  revalidatePath(PATH);
  return ok(sessao);
}

export async function atualizarSessao(id: string, dados: unknown): Promise<Resultado<Sessao>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = sessaoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  // Guarda de dupla validação: só treinos NORMAL podem ligar a periodização.
  if (parsed.data.tipoSessao !== "NORMAL" && parsed.data.planeamentoId) {
    return erro("Só treinos normais podem estar associados a uma periodização.", {
      planeamentoId: "Só treinos normais podem estar associados a uma periodização.",
    });
  }

  const existe = await prisma.sessao.findFirst({ where: { id, escalao: { clubeId } } });
  if (!existe) return erro("Sessão não encontrada");

  const perm = await exigirCapacidade("TREINOS_GERIR", existe.escalaoId);
  if (!perm.ok) return erro(perm.erro);
  if (parsed.data.escalaoId !== existe.escalaoId) {
    const permDestino = await exigirCapacidade("TREINOS_GERIR", parsed.data.escalaoId);
    if (!permDestino.ok) return erro(permDestino.erro);
  }

  if (parsed.data.planeamentoId) {
    const plan = await prisma.planeamento.findFirst({
      where: { id: parsed.data.planeamentoId, escalao: { clubeId } },
    });
    if (!plan) return erro("Planeamento não encontrado");
    if (plan.escalaoId !== parsed.data.escalaoId)
      return erro("O planeamento pertence a um escalão diferente");
  }

  const sessao = await prisma.sessao.update({
    where: { id },
    data: {
      data: parsed.data.data,
      escalaoId: parsed.data.escalaoId,
      tipoSessao: parsed.data.tipoSessao,
      planeamentoId: parsed.data.planeamentoId ?? null,
      duracaoMin: parsed.data.duracaoMin ?? null,
      objetivo: parsed.data.objetivo ?? null,
      local: parsed.data.local ?? null,
      notas: parsed.data.notas ?? null,
    },
  });
  revalidatePath(PATH);
  revalidatePath(`${PATH}/${id}`);
  return ok(sessao);
}

export async function apagarSessao(id: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const existe = await prisma.sessao.findFirst({ where: { id, escalao: { clubeId } } });
  if (!existe) return erro("Sessão não encontrada");

  const perm = await exigirCapacidade("TREINOS_GERIR", existe.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  await prisma.sessao.delete({ where: { id } });
  revalidatePath(PATH);
  return ok(undefined);
}

// ─── Exercícios da sessão ────────────────────────────────────────────────────

export async function adicionarExercicioSessao(
  sessaoId: string,
  exercicioId: string,
): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const sessao = await prisma.sessao.findFirst({ where: { id: sessaoId, escalao: { clubeId } } });
  if (!sessao) return erro("Sessão não encontrada");

  const perm = await exigirCapacidade("TREINOS_GERIR", sessao.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const exercicio = await prisma.exercicio.findFirst({ where: { id: exercicioId, clubeId } });
  if (!exercicio) return erro("Exercício não encontrado");

  const ultimo = await prisma.sessaoExercicio.findFirst({
    where: { sessaoId },
    orderBy: { ordem: "desc" },
  });
  const ordem = ultimo ? ultimo.ordem + 1 : 0;

  // §4.2.1: exercícios do treinador (portáteis) geram snapshot só-de-leitura no
  // momento da adição; exercícios do clube não geram (construirSnapshotExercicio
  // devolve null).
  const snapshot = construirSnapshotExercicio(exercicio);

  await prisma.sessaoExercicio.create({
    data: { sessaoId, exercicioId, ordem, duracaoMin: exercicio.duracaoMin, ...(snapshot ?? {}) },
  });
  revalidatePath(`${PATH}/${sessaoId}`);
  return ok(undefined);
}

export async function removerExercicioSessao(
  sessaoExercicioId: string,
): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const se = await prisma.sessaoExercicio.findFirst({
    where: { id: sessaoExercicioId, sessao: { escalao: { clubeId } } },
    select: { id: true, sessaoId: true, sessao: { select: { escalaoId: true } } },
  });
  if (!se) return erro("Exercício da sessão não encontrado");

  const perm = await exigirCapacidade("TREINOS_GERIR", se.sessao.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  await prisma.sessaoExercicio.delete({ where: { id: sessaoExercicioId } });
  revalidatePath(`${PATH}/${se.sessaoId}`);
  return ok(undefined);
}

export async function reordenarExercicios(
  sessaoId: string,
  ordens: { id: string; ordem: number }[],
): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const sessao = await prisma.sessao.findFirst({ where: { id: sessaoId, escalao: { clubeId } } });
  if (!sessao) return erro("Sessão não encontrada");

  const perm = await exigirCapacidade("TREINOS_GERIR", sessao.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  // Validação: todos os ids têm de pertencer a esta sessão (impede reordenar/corromper
  // SessaoExercicio de outra sessão via id forjado).
  const ids = ordens.map((o) => o.id);
  if (ids.length > 0) {
    const validos = await prisma.sessaoExercicio.count({
      where: { id: { in: ids }, sessaoId },
    });
    if (validos !== ids.length)
      return erro("Um ou mais exercícios não pertencem a esta sessão.");
  }

  // Evita colisões no unique [sessaoId, ordem]: desloca para offset alto, depois assenta.
  await prisma.$transaction([
    ...ordens.map((o, i) =>
      prisma.sessaoExercicio.update({ where: { id: o.id }, data: { ordem: 1000 + i } }),
    ),
    ...ordens.map((o) =>
      prisma.sessaoExercicio.update({ where: { id: o.id }, data: { ordem: o.ordem } }),
    ),
  ]);
  revalidatePath(`${PATH}/${sessaoId}`);
  return ok(undefined);
}

// ─── Presenças (Passo 8) ─────────────────────────────────────────────────────

export async function marcarPresencas(
  sessaoId: string,
  presencas: unknown,
): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const sessao = await prisma.sessao.findFirst({ where: { id: sessaoId, escalao: { clubeId } } });
  if (!sessao) return erro("Sessão não encontrada");

  const perm = await exigirCapacidade("PRESENCAS_MARCAR", sessao.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const parsed = marcarPresencasSchema.safeParse(presencas);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  // F1: a presença guarda o escalão da sessão (analytics por escalão) e o motivo da falta.
  await prisma.$transaction(
    parsed.data.map((p) =>
      prisma.presenca.upsert({
        where: { sessaoId_atletaId: { sessaoId, atletaId: p.atletaId } },
        create: {
          sessaoId,
          atletaId: p.atletaId,
          escalaoId: sessao.escalaoId,
          estado: p.estado,
          motivo: p.motivo ?? null,
          justificacao: p.justificacao ?? null,
        },
        update: {
          escalaoId: sessao.escalaoId,
          estado: p.estado,
          motivo: p.motivo ?? null,
          justificacao: p.justificacao ?? null,
        },
      }),
    ),
  );
  revalidatePath(`${PATH}/${sessaoId}`);
  return ok(undefined);
}
