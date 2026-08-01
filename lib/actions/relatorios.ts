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
      include: { atleta: { select: { nome: true } } },
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

  const porGolos = new Map<string, number>();
  const porAssist = new Map<string, number>();
  for (const e of estatisticas) {
    if (e.golos > 0) porGolos.set(e.atleta.nome, (porGolos.get(e.atleta.nome) ?? 0) + e.golos);
    if (e.assistencias > 0)
      porAssist.set(e.atleta.nome, (porAssist.get(e.atleta.nome) ?? 0) + e.assistencias);
  }
  const marcadores = [...porGolos.entries()]
    .map(([nome, golos]) => ({ nome, golos }))
    .sort((a, b) => b.golos - a.golos)
    .slice(0, 10);
  const assistentes = [...porAssist.entries()]
    .map(([nome, assistencias]) => ({ nome, assistencias }))
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
