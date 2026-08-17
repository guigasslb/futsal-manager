"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { exigirCapacidade, podeLerEscalao, escaloesLegiveis } from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { planeamentoSchema } from "@/lib/schemas/planeamento";
import { numeroSemana } from "@/lib/semana";
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
      nome: parsed.data.nome ?? null,
      modoSemana: parsed.data.modoSemana,
      notaSemana: parsed.data.notaSemana ?? null,
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
      nome: parsed.data.nome ?? null,
      modoSemana: parsed.data.modoSemana,
      notaSemana: parsed.data.notaSemana ?? null,
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

// ─── Sugestão inteligente ────────────────────────────────────────────────────

export type SugestaoPlaneamento = {
  dataInicio: string; // "YYYY-MM-DD"
  dataFim: string;
  nome: string; // §8.9.1: fallback numérico "Semana N" (desde o início da época)
  microciclo: number | undefined;
  mesociclo: number | undefined;
  periodo: "PREPARATORIO" | "COMPETITIVO" | "TRANSICAO" | undefined;
  tipo: "SEMANAL" | "MENSAL";
};

export async function sugerirPlaneamento(
  escalaoId: string,
  tipo: "SEMANAL" | "MENSAL" = "SEMANAL",
): Promise<Resultado<SugestaoPlaneamento>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");
  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const ultimo = await prisma.planeamento.findFirst({
    where: { epocaId: epoca.id, escalaoId, escalao: { clubeId } },
    orderBy: { dataInicio: "desc" },
  });

  function fmt(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  const epocaInicio = new Date(epoca.dataInicio).getTime();
  const epocaFim = new Date(epoca.dataFim).getTime();

  function inferirPeriodo(data: Date): "PREPARATORIO" | "COMPETITIVO" | "TRANSICAO" {
    const total = epocaFim - epocaInicio;
    if (total <= 0) return "COMPETITIVO";
    const pct = (data.getTime() - epocaInicio) / total;
    if (pct < 0.2) return "PREPARATORIO";
    if (pct > 0.9) return "TRANSICAO";
    return "COMPETITIVO";
  }

  const duracao = tipo === "SEMANAL" ? 6 : 27;

  if (!ultimo) {
    // Começa na próxima segunda-feira
    const hoje = new Date();
    const diaSemana = hoje.getDay(); // 0 = domingo
    const diasAteSegunda = diaSemana === 1 ? 0 : diaSemana === 0 ? 1 : 8 - diaSemana;
    const dataInicio = new Date(hoje);
    dataInicio.setDate(hoje.getDate() + diasAteSegunda);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataInicio.getDate() + duracao);
    return ok({
      dataInicio: fmt(dataInicio),
      dataFim: fmt(dataFim),
      nome: `Semana ${numeroSemana(new Date(epoca.dataInicio), dataInicio)}`,
      microciclo: 1,
      mesociclo: 1,
      periodo: inferirPeriodo(dataInicio),
      tipo,
    });
  }

  // Continua a partir do último planeamento
  const dataInicio = new Date(ultimo.dataFim);
  dataInicio.setDate(dataInicio.getDate() + 1);
  const dataFim = new Date(dataInicio);
  dataFim.setDate(dataInicio.getDate() + duracao);

  return ok({
    dataInicio: fmt(dataInicio),
    dataFim: fmt(dataFim),
    nome: `Semana ${numeroSemana(new Date(epoca.dataInicio), dataInicio)}`,
    microciclo: ultimo.microciclo != null ? ultimo.microciclo + 1 : undefined,
    mesociclo: ultimo.mesociclo ?? undefined,
    periodo: (ultimo.periodo as SugestaoPlaneamento["periodo"]) ?? inferirPeriodo(dataInicio),
    tipo,
  });
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
