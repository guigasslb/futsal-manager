"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade, podeLerEscalao, escaloesLegiveis } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import {
  modeloJogoSchema,
  quadroTaticoSchema,
  criarQuadroTaticoSchema,
  lerSubprincipios,
} from "@/lib/schemas/modeloJogo";
import {
  Prisma,
  type MomentoJogo,
  type QuadroTatico,
  type TipoQuadroTatico,
} from "@prisma/client";

const PATH = "/modelo-jogo";
const PATH_JOGOS = "/jogos";

const SELECT_RESUMO = {
  id: true,
  nome: true,
  momento: true,
  proprietario: true,
  principios: true,
  subprincipios: true,
  diagrama: true,
  escalaoId: true,
  epocaId: true,
  atualizadoEm: true,
  escalao: { select: { id: true, nome: true } },
  epoca: { select: { id: true, nome: true } },
} satisfies Prisma.ModeloJogoSelect;

const INCLUDE_DETALHE = {
  escalao: { select: { id: true, nome: true } },
  epoca: { select: { id: true, nome: true } },
} satisfies Prisma.ModeloJogoInclude;

export type ModeloJogoResumo = Prisma.ModeloJogoGetPayload<{
  select: typeof SELECT_RESUMO;
}>;

/**
 * Detalhe do modelo de jogo. Mantém todos os campos do modelo (incluindo
 * `escalaoId`, `epocaId` e `subprincipios`) e acrescenta `subprincipiosLista`,
 * a normalização do Json em texto simples (bíblia §3.6).
 */
export type ModeloJogoDetalhe = Prisma.ModeloJogoGetPayload<{
  include: typeof INCLUDE_DETALHE;
}> & { subprincipiosLista: string[] };

/**
 * Âmbito de leitura: documentos do clube ativo + metodologia portátil do
 * próprio treinador (`proprietario = TREINADOR`, que viaja com ele).
 */
function filtroPropriedade(clubeId: string, utilizadorId: string): Prisma.ModeloJogoWhereInput {
  return {
    OR: [
      { clubeProprietarioId: clubeId },
      { proprietario: "TREINADOR", autorId: utilizadorId },
    ],
  };
}

type ContextoLeitura =
  | { estado: "erro"; erro: string }
  | { estado: "ok"; clubeId: string; utilizadorId: string };

async function contextoLeitura(): Promise<ContextoLeitura> {
  const session = await auth();
  if (!session?.user?.id) return { estado: "erro", erro: "Não autenticado" };
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return { estado: "erro", erro: "Não autenticado" };
  return { estado: "ok", clubeId, utilizadorId: session.user.id };
}

/** Valida que o escalão/época indicados pertencem ao clube ativo. */
async function validarAmbito(
  clubeId: string,
  escalaoId: string | null,
  epocaId: string | null,
): Promise<string | null> {
  if (escalaoId) {
    const escalao = await prisma.escalao.findFirst({
      where: { id: escalaoId, clubeId },
      select: { id: true },
    });
    if (!escalao) return "Escalão não encontrado neste clube";
  }
  if (epocaId) {
    const epoca = await prisma.epoca.findFirst({
      where: { id: epocaId, clubeId },
      select: { id: true },
    });
    if (!epoca) return "Época não encontrada neste clube";
  }
  return null;
}

/**
 * Lista os modelos de jogo visíveis.
 *
 * @param escalaoId Filtra pelo escalão indicado. A metodologia genérica
 *   portátil (`escalaoId = null`) é sempre incluída, por ser transversal.
 * @param momento Filtra pelo momento de jogo (inclui `BOLAS_PARADAS`).
 */
export async function listarModelosJogo(
  escalaoId?: string,
  momento?: MomentoJogo,
): Promise<Resultado<ModeloJogoResumo[]>> {
  const ctx = await contextoLeitura();
  if (ctx.estado === "erro") return erro(ctx.erro);

  let filtroEscalao: Prisma.ModeloJogoWhereInput = {};
  if (escalaoId) {
    if (!(await podeLerEscalao(escalaoId))) return erro("Sem permissão neste escalão");
    filtroEscalao = { OR: [{ escalaoId }, { escalaoId: null }] };
  } else {
    const legiveis = await escaloesLegiveis();
    if (legiveis !== "TODOS") {
      filtroEscalao = { OR: [{ escalaoId: { in: legiveis } }, { escalaoId: null }] };
    }
  }

  const modelos = await prisma.modeloJogo.findMany({
    where: {
      AND: [
        filtroPropriedade(ctx.clubeId, ctx.utilizadorId),
        filtroEscalao,
        ...(momento ? [{ momento }] : []),
      ],
    },
    select: SELECT_RESUMO,
    orderBy: [{ momento: "asc" }, { nome: "asc" }],
  });
  return ok(modelos);
}

export async function obterModeloJogo(id: string): Promise<Resultado<ModeloJogoDetalhe>> {
  const ctx = await contextoLeitura();
  if (ctx.estado === "erro") return erro(ctx.erro);

  const modelo = await prisma.modeloJogo.findFirst({
    where: { id, ...filtroPropriedade(ctx.clubeId, ctx.utilizadorId) },
    include: INCLUDE_DETALHE,
  });
  if (!modelo) return erro("Modelo de jogo não encontrado");
  if (modelo.escalaoId && !(await podeLerEscalao(modelo.escalaoId))) {
    return erro("Sem permissão neste escalão");
  }

  return ok({ ...modelo, subprincipiosLista: lerSubprincipios(modelo.subprincipios) });
}

export async function criarModeloJogo(dados: unknown): Promise<Resultado<ModeloJogoDetalhe>> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");
  const utilizadorId = session.user.id;

  const parsed = modeloJogoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  // Metodologia portátil do treinador: sem clube, sem escalão e sem época.
  const portatil = parsed.data.proprietario === "TREINADOR";
  const escalaoId = portatil ? null : (parsed.data.escalaoId ?? null);
  const epocaId = portatil ? null : (parsed.data.epocaId ?? null);

  const perm = await exigirCapacidade("MODELO_JOGO_GERIR", escalaoId ?? undefined);
  if (!perm.ok) return erro(perm.erro);

  const invalido = await validarAmbito(perm.ctx.clube.id, escalaoId, epocaId);
  if (invalido) return erro(invalido);

  const modelo = await prisma.modeloJogo.create({
    data: {
      autorId: utilizadorId,
      proprietario: parsed.data.proprietario,
      clubeProprietarioId: portatil ? null : perm.ctx.clube.id,
      escalaoId,
      epocaId,
      nome: parsed.data.nome,
      momento: parsed.data.momento,
      principios: parsed.data.principios ?? null,
      subprincipios: parsed.data.subprincipios ?? Prisma.DbNull,
      diagrama: parsed.data.diagrama ?? Prisma.DbNull,
    },
    include: INCLUDE_DETALHE,
  });
  revalidatePath(PATH);
  return ok({ ...modelo, subprincipiosLista: lerSubprincipios(modelo.subprincipios) });
}

export async function atualizarModeloJogo(
  id: string,
  dados: unknown,
): Promise<Resultado<ModeloJogoDetalhe>> {
  const ctx = await contextoLeitura();
  if (ctx.estado === "erro") return erro(ctx.erro);

  const parsed = modeloJogoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.modeloJogo.findFirst({
    where: { id, ...filtroPropriedade(ctx.clubeId, ctx.utilizadorId) },
    select: { id: true, escalaoId: true, epocaId: true, proprietario: true, autorId: true },
  });
  if (!existe) return erro("Modelo de jogo não encontrado");

  const portatil = parsed.data.proprietario === "TREINADOR";
  // `undefined` mantém o valor atual; `null` limpa (passa a portátil).
  const escalaoId = portatil
    ? null
    : parsed.data.escalaoId === undefined
      ? existe.escalaoId
      : parsed.data.escalaoId;
  const epocaId = portatil
    ? null
    : parsed.data.epocaId === undefined
      ? existe.epocaId
      : parsed.data.epocaId;

  // Precisa de âmbito sobre o escalão de origem e sobre o de destino.
  const permOrigem = await exigirCapacidade(
    "MODELO_JOGO_GERIR",
    existe.escalaoId ?? undefined,
  );
  if (!permOrigem.ok) return erro(permOrigem.erro);
  if (escalaoId && escalaoId !== existe.escalaoId) {
    const permDestino = await exigirCapacidade("MODELO_JOGO_GERIR", escalaoId);
    if (!permDestino.ok) return erro(permDestino.erro);
  }

  const invalido = await validarAmbito(permOrigem.ctx.clube.id, escalaoId, epocaId);
  if (invalido) return erro(invalido);

  const modelo = await prisma.modeloJogo.update({
    where: { id },
    data: {
      nome: parsed.data.nome,
      momento: parsed.data.momento,
      proprietario: parsed.data.proprietario,
      clubeProprietarioId: portatil ? null : permOrigem.ctx.clube.id,
      escalaoId,
      epocaId,
      principios: parsed.data.principios ?? null,
      // Campo omitido no formulário → não é alterado; array vazio limpa.
      ...(parsed.data.subprincipios !== undefined
        ? { subprincipios: parsed.data.subprincipios }
        : {}),
      ...(parsed.data.diagrama !== undefined ? { diagrama: parsed.data.diagrama } : {}),
    },
    include: INCLUDE_DETALHE,
  });
  revalidatePath(PATH);
  revalidatePath(`${PATH}/${id}`);
  return ok({ ...modelo, subprincipiosLista: lerSubprincipios(modelo.subprincipios) });
}

export async function apagarModeloJogo(id: string): Promise<Resultado<void>> {
  const ctx = await contextoLeitura();
  if (ctx.estado === "erro") return erro(ctx.erro);

  const existe = await prisma.modeloJogo.findFirst({
    where: { id, ...filtroPropriedade(ctx.clubeId, ctx.utilizadorId) },
    select: { id: true, escalaoId: true },
  });
  if (!existe) return erro("Modelo de jogo não encontrado");

  const perm = await exigirCapacidade("MODELO_JOGO_GERIR", existe.escalaoId ?? undefined);
  if (!perm.ok) return erro(perm.erro);

  await prisma.modeloJogo.delete({ where: { id } });
  revalidatePath(PATH);
  return ok(undefined);
}

// ─────────────────────────────────────────────
// Quadros táticos (por jogo) — bíblia §3.6
// ─────────────────────────────────────────────

type ContextoQuadro =
  | { estado: "erro"; erro: string }
  | { estado: "ok"; jogoId: string; escalaoId: string };

/** Resolve o jogo dentro do clube ativo e valida a leitura do escalão. */
async function jogoLegivel(jogoId: string): Promise<ContextoQuadro> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return { estado: "erro", erro: "Não autenticado" };

  const jogo = await prisma.jogo.findFirst({
    where: { id: jogoId, escalao: { clubeId } },
    select: { id: true, escalaoId: true },
  });
  if (!jogo) return { estado: "erro", erro: "Jogo não encontrado" };
  if (!(await podeLerEscalao(jogo.escalaoId))) {
    return { estado: "erro", erro: "Sem permissão neste escalão" };
  }
  return { estado: "ok", jogoId: jogo.id, escalaoId: jogo.escalaoId };
}

/**
 * Quadros táticos de um jogo, opcionalmente filtrados por tipo
 * (`GERAL` ou `BOLA_PARADA`).
 */
export async function listarQuadrosTaticos(
  jogoId: string,
  tipo?: TipoQuadroTatico,
): Promise<Resultado<QuadroTatico[]>> {
  const ctx = await jogoLegivel(jogoId);
  if (ctx.estado === "erro") return erro(ctx.erro);

  const quadros = await prisma.quadroTatico.findMany({
    where: { jogoId: ctx.jogoId, ...(tipo ? { tipo } : {}) },
    orderBy: [{ tipo: "asc" }, { nome: "asc" }],
  });
  return ok(quadros);
}

/** Cria um quadro tático (com ou sem diagrama de campo). */
export async function criarQuadroTatico(dados: unknown): Promise<Resultado<QuadroTatico>> {
  const parsed = criarQuadroTaticoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const jogo = await prisma.jogo.findFirst({
    where: { id: parsed.data.jogoId, escalao: { clubeId } },
    select: { id: true, escalaoId: true },
  });
  if (!jogo) return erro("Jogo não encontrado");

  const perm = await exigirCapacidade("MODELO_JOGO_GERIR", jogo.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const quadro = await prisma.quadroTatico.create({
    data: {
      jogoId: jogo.id,
      nome: parsed.data.nome,
      tipo: parsed.data.tipo,
      notas: parsed.data.notas ?? null,
      diagrama: parsed.data.diagrama ?? Prisma.DbNull,
    },
  });
  revalidatePath(`${PATH_JOGOS}/${jogo.id}`);
  revalidatePath(PATH);
  return ok(quadro);
}

/** Atualiza um quadro tático (nome, tipo, notas e diagrama). */
export async function atualizarQuadroTatico(
  id: string,
  dados: unknown,
): Promise<Resultado<QuadroTatico>> {
  const parsed = quadroTaticoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const existe = await prisma.quadroTatico.findFirst({
    where: { id, jogo: { escalao: { clubeId } } },
    select: { id: true, jogoId: true, jogo: { select: { escalaoId: true } } },
  });
  if (!existe) return erro("Quadro tático não encontrado");

  const perm = await exigirCapacidade("MODELO_JOGO_GERIR", existe.jogo.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const quadro = await prisma.quadroTatico.update({
    where: { id },
    data: {
      nome: parsed.data.nome,
      tipo: parsed.data.tipo,
      notas: parsed.data.notas ?? null,
      ...(parsed.data.diagrama !== undefined ? { diagrama: parsed.data.diagrama } : {}),
    },
  });
  revalidatePath(`${PATH_JOGOS}/${existe.jogoId}`);
  revalidatePath(PATH);
  return ok(quadro);
}

/** Apaga um quadro tático. */
export async function apagarQuadroTatico(id: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const existe = await prisma.quadroTatico.findFirst({
    where: { id, jogo: { escalao: { clubeId } } },
    select: { id: true, jogoId: true, jogo: { select: { escalaoId: true } } },
  });
  if (!existe) return erro("Quadro tático não encontrado");

  const perm = await exigirCapacidade("MODELO_JOGO_GERIR", existe.jogo.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  await prisma.quadroTatico.delete({ where: { id } });
  revalidatePath(`${PATH_JOGOS}/${existe.jogoId}`);
  revalidatePath(PATH);
  return ok(undefined);
}
