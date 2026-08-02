"use server";

import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { podeLerEscalao } from "@/lib/permissoes";
import { ok, erro, type Resultado } from "@/lib/utils";

export interface RelatorioEquipa {
  escalaoNome: string;
  epocaNome: string;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golosMarcados: number;
  golosSofridos: number;
  sessoes: number;
  nAtletas: number;
  marcadores: { nome: string; golos: number }[];
  assistentes: { nome: string; assistencias: number }[];
}

export async function obterRelatorioEquipa(
  escalaoId: string,
): Promise<Resultado<RelatorioEquipa>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");
  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const escalao = await prisma.escalao.findFirst({ where: { id: escalaoId, clubeId } });
  if (!escalao) return erro("Escalão não encontrado");
  if (!(await podeLerEscalao(escalaoId))) return erro("Sem permissão neste escalão");

  const [jogos, sessoes, nAtletas, estatisticas] = await Promise.all([
    prisma.jogo.findMany({
      where: { epocaId: epoca.id, escalaoId },
      select: { golosMarcados: true, golosSofridos: true },
    }),
    prisma.sessao.count({ where: { epocaId: epoca.id, escalaoId } }),
    prisma.atleta.count({ where: { epocaId: epoca.id, escalaoId, ativo: true } }),
    prisma.estatisticaAtleta.findMany({
      where: { jogo: { epocaId: epoca.id, escalaoId } },
      include: { atleta: { select: { id: true, nome: true } } },
    }),
  ]);

  let vitorias = 0;
  let empates = 0;
  let derrotas = 0;
  let golosMarcados = 0;
  let golosSofridos = 0;
  for (const j of jogos) {
    if (j.golosMarcados == null || j.golosSofridos == null) continue;
    golosMarcados += j.golosMarcados;
    golosSofridos += j.golosSofridos;
    if (j.golosMarcados > j.golosSofridos) vitorias++;
    else if (j.golosMarcados < j.golosSofridos) derrotas++;
    else empates++;
  }

  // Agregação por atletaId (não por nome — evita fundir homónimos, secção 10.2).
  const porGolos = new Map<string, { nome: string; golos: number }>();
  const porAssist = new Map<string, { nome: string; assistencias: number }>();
  for (const e of estatisticas) {
    if (e.golos > 0) {
      const atual = porGolos.get(e.atletaId) ?? { nome: e.atleta.nome, golos: 0 };
      atual.golos += e.golos;
      porGolos.set(e.atletaId, atual);
    }
    if (e.assistencias > 0) {
      const atual = porAssist.get(e.atletaId) ?? { nome: e.atleta.nome, assistencias: 0 };
      atual.assistencias += e.assistencias;
      porAssist.set(e.atletaId, atual);
    }
  }
  const marcadores = [...porGolos.values()]
    .sort((a, b) => b.golos - a.golos)
    .slice(0, 10);
  const assistentes = [...porAssist.values()]
    .sort((a, b) => b.assistencias - a.assistencias)
    .slice(0, 10);

  return ok({
    escalaoNome: escalao.nome,
    epocaNome: epoca.nome,
    jogos: jogos.length,
    vitorias,
    empates,
    derrotas,
    golosMarcados,
    golosSofridos,
    sessoes,
    nAtletas,
    marcadores,
    assistentes,
  });
}
