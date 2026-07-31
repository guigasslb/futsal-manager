"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import { atletaSchema } from "@/lib/schemas/atleta";
import { Prisma, type Atleta } from "@prisma/client";

const PATH = "/plantel";

const INCLUDE_RELACOES = {
  escalao: { select: { id: true, nome: true } },
  epoca: { select: { id: true, nome: true } },
} as const;

type AtletaComRelacoes = Prisma.AtletaGetPayload<{ include: typeof INCLUDE_RELACOES }>;

export interface EstatisticasAgregadas {
  jogosConvocado: number;
  jogosUtilizados: number;
  titularidades: number;
  totalGolos: number;
  totalAssistencias: number;
  totalMinutos: number | null;
  totalDefesas: number | null;
  totalGolosSofridos: number | null;
  sessoesTotais: number;
  presencas: number;
  taxaPresenca: number;
}

export async function listarAtletas(
  escalaoId?: string,
): Promise<Resultado<AtletaComRelacoes[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const atletas = await prisma.atleta.findMany({
    where: {
      epocaId: epoca.id,
      escalao: { clubeId },
      ativo: true,
      ...(escalaoId ? { escalaoId } : {}),
    },
    include: INCLUDE_RELACOES,
    orderBy: [{ numero: "asc" }, { nome: "asc" }],
  });
  return ok(atletas);
}

export async function obterAtleta(id: string): Promise<Resultado<AtletaComRelacoes>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const atleta = await prisma.atleta.findFirst({
    where: { id, escalao: { clubeId } },
    include: INCLUDE_RELACOES,
  });
  if (!atleta) return erro("Atleta não encontrado");
  return ok(atleta);
}

export async function criarAtleta(dados: unknown): Promise<Resultado<Atleta>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = atletaSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const epoca = await obterEpocaAtiva();
  if (!epoca)
    return erro("Nenhuma época ativa definida. Define uma época ativa antes de criar atletas.");

  const escalao = await prisma.escalao.findFirst({
    where: { id: parsed.data.escalaoId, clubeId },
  });
  if (!escalao) return erro("O escalão selecionado não existe");

  const atleta = await prisma.atleta.create({
    data: { ...parsed.data, epocaId: epoca.id },
  });
  revalidatePath(PATH);
  return ok(atleta);
}

export async function atualizarAtleta(
  id: string,
  dados: unknown,
): Promise<Resultado<Atleta>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const parsed = atletaSchema.safeParse(dados);
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const existe = await prisma.atleta.findFirst({
    where: { id, escalao: { clubeId } },
  });
  if (!existe) return erro("Atleta não encontrado");

  if (parsed.data.escalaoId !== existe.escalaoId) {
    const escalao = await prisma.escalao.findFirst({
      where: { id: parsed.data.escalaoId, clubeId },
    });
    if (!escalao) return erro("O escalão selecionado não existe");
  }

  // Campos opcionais: undefined não limpa o valor existente no Prisma — usar null explicitamente.
  const atleta = await prisma.atleta.update({
    where: { id },
    data: {
      nome: parsed.data.nome,
      escalaoId: parsed.data.escalaoId,
      posicao: parsed.data.posicao ?? null,
      numero: parsed.data.numero ?? null,
      dataNascimento: parsed.data.dataNascimento ?? null,
      observacoes: parsed.data.observacoes ?? null,
    },
  });
  revalidatePath(PATH);
  revalidatePath(`${PATH}/${id}`);
  return ok(atleta);
}

export async function apagarAtleta(id: string): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const existe = await prisma.atleta.findFirst({
    where: { id, escalao: { clubeId } },
  });
  if (!existe) return erro("Atleta não encontrado");

  await prisma.atleta.update({ where: { id }, data: { ativo: false } });
  revalidatePath(PATH);
  return ok(undefined);
}

// ─── Estatísticas agregadas (secção 15) ──────────────────────────────────────

export async function obterEstatisticasAtleta(
  id: string,
): Promise<Resultado<EstatisticasAgregadas>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const atleta = await prisma.atleta.findFirst({
    where: { id, escalao: { clubeId } },
    select: { id: true, escalaoId: true, posicao: true, criadoEm: true, epocaId: true },
  });
  if (!atleta) return erro("Atleta não encontrado");

  const eGR = atleta.posicao === "GUARDA_REDES";

  // Jogos: convocatórias e estatísticas da época
  const [jogosConvocado, estatisticas, sessoesTotais, presencas] = await Promise.all([
    prisma.convocatoria.count({
      where: { convocado: true, atletaId: id, jogo: { epocaId: epoca.id } },
    }),
    prisma.estatisticaAtleta.findMany({
      where: { atletaId: id, jogo: { epocaId: epoca.id } },
    }),
    // Sessões do escalão na época a partir da data de ingresso do atleta (secção 22.3)
    prisma.sessao.count({
      where: {
        epocaId: epoca.id,
        escalaoId: atleta.escalaoId,
        data: { gte: atleta.criadoEm },
      },
    }),
    prisma.presenca.count({
      where: {
        atletaId: id,
        estado: { in: ["PRESENTE", "ATRASADO"] },
        sessao: { epocaId: epoca.id },
      },
    }),
  ]);

  const jogosUtilizados = estatisticas.filter(
    (e) => e.utilizacao !== "NAO_UTILIZADO",
  ).length;
  const titularidades = estatisticas.filter((e) => e.utilizacao === "TITULAR").length;
  const totalGolos = estatisticas.reduce((acc, e) => acc + e.golos, 0);
  const totalAssistencias = estatisticas.reduce((acc, e) => acc + e.assistencias, 0);

  const minutosRegistados = estatisticas
    .map((e) => e.minutos)
    .filter((m): m is number => m != null);
  const totalMinutos = minutosRegistados.length
    ? minutosRegistados.reduce((acc, m) => acc + m, 0)
    : null;

  const totalDefesas = eGR
    ? estatisticas.reduce((acc, e) => acc + (e.defesas ?? 0), 0)
    : null;
  const totalGolosSofridos = eGR
    ? estatisticas.reduce((acc, e) => acc + (e.golosSofridosGR ?? 0), 0)
    : null;

  const taxaPresenca = sessoesTotais > 0 ? presencas / sessoesTotais : 0;

  return ok({
    jogosConvocado,
    jogosUtilizados,
    titularidades,
    totalGolos,
    totalAssistencias,
    totalMinutos,
    totalDefesas,
    totalGolosSofridos,
    sessoesTotais,
    presencas,
    taxaPresenca,
  });
}
