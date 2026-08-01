"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade, podeLerEscalao, escaloesLegiveis } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { sessaoSchema, marcarPresencasSchema } from "@/lib/schemas/treino";
import { Prisma, type Epoca, type Sessao } from "@prisma/client";

const PATH = "/treinos";

const INCLUDE_LISTA = {
  escalao: { select: { id: true, nome: true } },
  _count: { select: { exercicios: true } },
  presencas: { select: { estado: true } },
} as const;

const INCLUDE_DETALHE = {
  escalao: { select: { id: true, nome: true } },
  exercicios: {
    orderBy: { ordem: "asc" },
    include: {
      exercicio: {
        select: { id: true, nome: true, duracaoMin: true, categoria: true, diagrama: true },
      },
    },
  },
  presencas: {
    include: { atleta: { select: { id: true, nome: true, numero: true, posicao: true } } },
  },
} as const;

export type SessaoLista = Prisma.SessaoGetPayload<{ include: typeof INCLUDE_LISTA }>;
export type SessaoDetalhe = Prisma.SessaoGetPayload<{ include: typeof INCLUDE_DETALHE }>;

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
  return ok(sessao);
}

export async function criarSessao(dados: unknown): Promise<Resultado<Sessao>> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  const ctx = await contexto();
  if (ctx.estado === "erro") return erro(ctx.erro);

  const parsed = sessaoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const perm = await exigirCapacidade("TREINOS_GERIR", parsed.data.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const escalao = await prisma.escalao.findFirst({
    where: { id: parsed.data.escalaoId, clubeId: ctx.clubeId },
  });
  if (!escalao) return erro("O escalão selecionado não existe");

  const sessao = await prisma.sessao.create({
    data: {
      ...parsed.data,
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

  const existe = await prisma.sessao.findFirst({ where: { id, escalao: { clubeId } } });
  if (!existe) return erro("Sessão não encontrada");

  const perm = await exigirCapacidade("TREINOS_GERIR", existe.escalaoId);
  if (!perm.ok) return erro(perm.erro);
  if (parsed.data.escalaoId !== existe.escalaoId) {
    const permDestino = await exigirCapacidade("TREINOS_GERIR", parsed.data.escalaoId);
    if (!permDestino.ok) return erro(permDestino.erro);
  }

  const sessao = await prisma.sessao.update({
    where: { id },
    data: {
      data: parsed.data.data,
      escalaoId: parsed.data.escalaoId,
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

  await prisma.sessaoExercicio.create({
    data: { sessaoId, exercicioId, ordem, duracaoMin: exercicio.duracaoMin },
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
  if (!parsed.success) return erro("Dados de presença inválidos");

  await prisma.$transaction(
    parsed.data.map((p) =>
      prisma.presenca.upsert({
        where: { sessaoId_atletaId: { sessaoId, atletaId: p.atletaId } },
        create: {
          sessaoId,
          atletaId: p.atletaId,
          estado: p.estado,
          justificacao: p.justificacao ?? null,
        },
        update: { estado: p.estado, justificacao: p.justificacao ?? null },
      }),
    ),
  );
  revalidatePath(`${PATH}/${sessaoId}`);
  return ok(undefined);
}
