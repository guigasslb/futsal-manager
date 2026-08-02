"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade, podeLerEscalao, escaloesLegiveis } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import {
  jogoSchema,
  guardarEstatisticasSchema,
  eventoJogoSchema,
  isVideoUrlValido,
} from "@/lib/schemas/jogo";
import { Prisma, type Epoca, type Jogo } from "@prisma/client";

const PATH = "/jogos";

const INCLUDE_LISTA = {
  escalao: { select: { id: true, nome: true } },
} as const;

const INCLUDE_DETALHE = {
  escalao: { select: { id: true, nome: true } },
  convocatorias: {
    include: {
      atleta: { select: { id: true, nome: true, numero: true, posicoes: true } },
    },
  },
  estatisticas: { include: { valoresMetricas: true } },
  eventos: { orderBy: { criadoEm: "asc" } },
} as const;

export type JogoLista = Prisma.JogoGetPayload<{ include: typeof INCLUDE_LISTA }>;
export type JogoDetalhe = Prisma.JogoGetPayload<{ include: typeof INCLUDE_DETALHE }>;

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

export async function listarJogos(escalaoId?: string): Promise<Resultado<JogoLista[]>> {
  const ctx = await contexto();
  if (ctx.estado === "erro") return erro(ctx.erro);

  const legiveis = await escaloesLegiveis();
  let filtroEscalao: Prisma.JogoWhereInput = {};
  if (escalaoId) {
    if (!(await podeLerEscalao(escalaoId))) return ok([]);
    filtroEscalao = { escalaoId };
  } else if (legiveis !== "TODOS") {
    filtroEscalao = { escalaoId: { in: legiveis } };
  }

  const jogos = await prisma.jogo.findMany({
    where: {
      epocaId: ctx.epoca.id,
      escalao: { clubeId: ctx.clubeId },
      ...filtroEscalao,
    },
    include: INCLUDE_LISTA,
    orderBy: { data: "desc" },
  });
  return ok(jogos);
}

export async function obterJogo(id: string): Promise<Resultado<JogoDetalhe>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const jogo = await prisma.jogo.findFirst({
    where: { id, escalao: { clubeId } },
    include: INCLUDE_DETALHE,
  });
  if (!jogo) return erro("Jogo não encontrado");
  if (!(await podeLerEscalao(jogo.escalaoId))) return erro("Sem permissão neste escalão");
  return ok(jogo);
}

export async function criarJogo(dados: unknown): Promise<Resultado<Jogo>> {
  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  const ctx = await contexto();
  if (ctx.estado === "erro") return erro(ctx.erro);

  const parsed = jogoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const perm = await exigirCapacidade("JOGOS_GERIR", parsed.data.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const escalao = await prisma.escalao.findFirst({
    where: { id: parsed.data.escalaoId, clubeId: ctx.clubeId },
  });
  if (!escalao) return erro("O escalão selecionado não existe");

  const jogo = await prisma.jogo.create({
    data: {
      data: parsed.data.data,
      adversario: parsed.data.adversario,
      casaFora: parsed.data.casaFora,
      tipo: parsed.data.tipo,
      escalaoId: parsed.data.escalaoId,
      competicao: parsed.data.competicao ?? null,
      competicaoId: parsed.data.competicaoId ?? null,
      local: parsed.data.local ?? null,
      golosMarcados: parsed.data.golosMarcados ?? null,
      golosSofridos: parsed.data.golosSofridos ?? null,
      faltas1aParte: parsed.data.faltas1aParte ?? null,
      faltas2aParte: parsed.data.faltas2aParte ?? null,
      videoUrl: parsed.data.videoUrl ? parsed.data.videoUrl : null,
      epocaId: ctx.epoca.id,
      criadorId: session.user.id,
    },
  });
  revalidatePath(PATH);
  return ok(jogo);
}

export async function atualizarJogo(id: string, dados: unknown): Promise<Resultado<Jogo>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = jogoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.jogo.findFirst({ where: { id, escalao: { clubeId } } });
  if (!existe) return erro("Jogo não encontrado");

  const perm = await exigirCapacidade("JOGOS_GERIR", existe.escalaoId);
  if (!perm.ok) return erro(perm.erro);
  if (parsed.data.escalaoId !== existe.escalaoId) {
    const permDestino = await exigirCapacidade("JOGOS_GERIR", parsed.data.escalaoId);
    if (!permDestino.ok) return erro(permDestino.erro);
  }

  const jogo = await prisma.jogo.update({
    where: { id },
    data: {
      data: parsed.data.data,
      adversario: parsed.data.adversario,
      casaFora: parsed.data.casaFora,
      tipo: parsed.data.tipo,
      escalaoId: parsed.data.escalaoId,
      competicao: parsed.data.competicao ?? null,
      competicaoId: parsed.data.competicaoId ?? null,
      local: parsed.data.local ?? null,
      golosMarcados: parsed.data.golosMarcados ?? null,
      golosSofridos: parsed.data.golosSofridos ?? null,
      faltas1aParte: parsed.data.faltas1aParte ?? null,
      faltas2aParte: parsed.data.faltas2aParte ?? null,
      videoUrl: parsed.data.videoUrl ? parsed.data.videoUrl : null,
    },
  });
  revalidatePath(PATH);
  revalidatePath(`${PATH}/${id}`);
  return ok(jogo);
}

export async function apagarJogo(id: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const existe = await prisma.jogo.findFirst({ where: { id, escalao: { clubeId } } });
  if (!existe) return erro("Jogo não encontrado");

  const perm = await exigirCapacidade("JOGOS_GERIR", existe.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  await prisma.jogo.delete({ where: { id } });
  revalidatePath(PATH);
  return ok(undefined);
}

// ─── Convocatória ────────────────────────────────────────────────────────────

export async function definirConvocatoria(
  jogoId: string,
  atletaIds: string[],
): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const jogo = await prisma.jogo.findFirst({ where: { id: jogoId, escalao: { clubeId } } });
  if (!jogo) return erro("Jogo não encontrado");

  const perm = await exigirCapacidade("CONVOCATORIA_GERIR", jogo.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  // Validação: só atletas do clube, da época do jogo, e do escalão (principal ou
  // secundário) do jogo podem ser convocados. Impede convocar atletas alheios via id forjado.
  const idsPedidos = [...new Set(atletaIds)];
  if (idsPedidos.length > 0) {
    const validos = await prisma.atleta.count({
      where: {
        id: { in: idsPedidos },
        epocaId: jogo.epocaId,
        escalao: { clubeId },
        OR: [{ escalaoId: jogo.escalaoId }, { escalaoSecundarioId: jogo.escalaoId }],
      },
    });
    if (validos !== idsPedidos.length)
      return erro("Um ou mais atletas não pertencem a este escalão/época.");
  }

  const convocadosAtuais = await prisma.convocatoria.findMany({
    where: { jogoId },
    select: { atletaId: true },
  });
  const idsAtuais = new Set(convocadosAtuais.map((c) => c.atletaId));
  const idsNovos = new Set(atletaIds);

  const aRemover = [...idsAtuais].filter((id) => !idsNovos.has(id));
  const aAdicionar = atletaIds.filter((id) => !idsAtuais.has(id));

  await prisma.$transaction([
    // Remover convocatória e estatísticas dos removidos (secção 22.4)
    prisma.estatisticaAtleta.deleteMany({
      where: { jogoId, atletaId: { in: aRemover } },
    }),
    prisma.convocatoria.deleteMany({
      where: { jogoId, atletaId: { in: aRemover } },
    }),
    ...aAdicionar.map((atletaId) =>
      prisma.convocatoria.create({ data: { jogoId, atletaId, convocado: true } }),
    ),
  ]);
  revalidatePath(`${PATH}/${jogoId}`);
  return ok(undefined);
}

// ─── Estatísticas (Passo 10) ─────────────────────────────────────────────────

export async function guardarEstatisticas(
  jogoId: string,
  estatisticas: unknown,
): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const jogo = await prisma.jogo.findFirst({ where: { id: jogoId, escalao: { clubeId } } });
  if (!jogo) return erro("Jogo não encontrado");

  const perm = await exigirCapacidade("ESTATISTICAS_GERIR", jogo.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const parsed = guardarEstatisticasSchema.safeParse(estatisticas);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  // Só atletas convocados podem ter estatísticas (secção 12.5)
  const convocados = await prisma.convocatoria.findMany({
    where: { jogoId, convocado: true },
    select: { atletaId: true },
  });
  const idsConvocados = new Set(convocados.map((c) => c.atletaId));

  const validos = parsed.data.filter((e) => idsConvocados.has(e.atletaId));

  // Métricas ativas do clube (para validar os metricaId recebidos)
  const metricasAtivas = await prisma.metricaConfig.findMany({
    where: { clubeId },
    select: { id: true },
  });
  const idsMetricasValidas = new Set(metricasAtivas.map((m) => m.id));

  await prisma.$transaction(async (tx) => {
    for (const e of validos) {
      const dados = {
        utilizacao: e.utilizacao,
        minutos: e.minutos ?? null,
        golos: e.golos,
        assistencias: e.assistencias,
        defesas: e.defesas ?? null,
        golosSofridosGR: e.golosSofridosGR ?? null,
        faltasCometidas: e.faltasCometidas ?? null,
      };
      const estat = await tx.estatisticaAtleta.upsert({
        where: { jogoId_atletaId: { jogoId, atletaId: e.atletaId } },
        create: { jogoId, atletaId: e.atletaId, ...dados },
        update: dados,
      });

      // Valores de métricas configuráveis (upsert por métrica)
      const valores = (e.valoresMetricas ?? []).filter((v) =>
        idsMetricasValidas.has(v.metricaId),
      );
      for (const v of valores) {
        await tx.valorMetrica.upsert({
          where: {
            metricaId_estatisticaId: {
              metricaId: v.metricaId,
              estatisticaId: estat.id,
            },
          },
          create: { metricaId: v.metricaId, estatisticaId: estat.id, valor: v.valor },
          update: { valor: v.valor },
        });
      }
    }
  });
  revalidatePath(`${PATH}/${jogoId}`);
  return ok(undefined);
}

export async function guardarRelatorio(
  jogoId: string,
  relatorio: string,
): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const jogo = await prisma.jogo.findFirst({ where: { id: jogoId, escalao: { clubeId } } });
  if (!jogo) return erro("Jogo não encontrado");

  const perm = await exigirCapacidade("JOGOS_GERIR", jogo.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  await prisma.jogo.update({
    where: { id: jogoId },
    data: { relatorio: relatorio.trim() || null },
  });
  revalidatePath(`${PATH}/${jogoId}`);
  return ok(undefined);
}

export async function definirVideo(jogoId: string, videoUrl: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const jogo = await prisma.jogo.findFirst({ where: { id: jogoId, escalao: { clubeId } } });
  if (!jogo) return erro("Jogo não encontrado");

  const perm = await exigirCapacidade("JOGOS_GERIR", jogo.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const url = videoUrl.trim();
  if (!isVideoUrlValido(url)) return erro("Indica um link válido do YouTube (https)");

  await prisma.jogo.update({ where: { id: jogoId }, data: { videoUrl: url || null } });
  revalidatePath(`${PATH}/${jogoId}`);
  return ok(undefined);
}

// ─── Modo ao vivo (registo de eventos) ───────────────────────────────────────

export async function registarEventoJogo(
  jogoId: string,
  dados: unknown,
): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const jogo = await prisma.jogo.findFirst({ where: { id: jogoId, escalao: { clubeId } } });
  if (!jogo) return erro("Jogo não encontrado");

  const perm = await exigirCapacidade("ESTATISTICAS_GERIR", jogo.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  const parsed = eventoJogoSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  await prisma.eventoJogo.create({
    data: {
      jogoId,
      parte: parsed.data.parte,
      minuto: parsed.data.minuto ?? null,
      tipo: parsed.data.tipo,
      atletaId: parsed.data.atletaId ?? null,
      atletaSecundarioId: parsed.data.atletaSecundarioId ?? null,
    },
  });
  revalidatePath(`${PATH}/${jogoId}`);
  return ok(undefined);
}

export async function apagarEventoJogo(eventoId: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const evento = await prisma.eventoJogo.findFirst({
    where: { id: eventoId, jogo: { escalao: { clubeId } } },
    select: { id: true, jogoId: true, jogo: { select: { escalaoId: true } } },
  });
  if (!evento) return erro("Evento não encontrado");

  const perm = await exigirCapacidade("ESTATISTICAS_GERIR", evento.jogo.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  await prisma.eventoJogo.delete({ where: { id: eventoId } });
  revalidatePath(`${PATH}/${evento.jogoId}`);
  return ok(undefined);
}
