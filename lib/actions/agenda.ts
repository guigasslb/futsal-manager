"use server";

import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { podeLerEscalao, escaloesLegiveis } from "@/lib/permissoes";
import { ok, erro, type Resultado } from "@/lib/utils";
import type { Prisma, Epoca, TipoSessao } from "@prisma/client";

/**
 * Vista agregada da atividade de TODOS os escalões do clube (P2.2 — §8.x).
 * Para o Diretor Técnico / Admin acompanhar treinos e jogos de todos os
 * escalões numa única linha temporal, sem navegar escalão a escalão.
 *
 * É uma leitura agregada — não há entidade nova nem migração: combina os dados
 * que já existem em `Sessao` (treinos) e `Jogo` num único stream cronológico.
 */
export interface EventoAgenda {
  id: string;
  tipo: "TREINO" | "JOGO";
  data: Date;
  escalaoNome: string;
  /** Título legível: objetivo/tipo do treino ou "vs Adversário" no jogo. */
  titulo: string;
  local?: string | null;
}

export interface FiltrosAgenda {
  escalaoId?: string;
  /** Mês 1–12 (com `ano`) para focar num mês específico. */
  mes?: number;
  ano?: number;
}

/** Rótulo pt-PT do tipo de sessão, usado como título quando não há objetivo. */
const ROTULO_TIPO_SESSAO: Record<TipoSessao, string> = {
  NORMAL: "Treino",
  ABERTO: "Treino aberto",
  CAPTACAO: "Captação",
  EVENTO: "Evento",
};

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

/**
 * Janela temporal a considerar. Com `mes` (1–12) + `ano` válidos, foca esse mês
 * completo; caso contrário, os próximos 30 dias a partir do início de hoje.
 */
function resolverJanela(mes?: number, ano?: number): { gte: Date; lte: Date } {
  const mesValido =
    typeof mes === "number" && Number.isInteger(mes) && mes >= 1 && mes <= 12;
  const anoValido =
    typeof ano === "number" && Number.isInteger(ano) && ano >= 2000 && ano <= 2100;

  if (mesValido && anoValido) {
    const gte = new Date(ano!, mes! - 1, 1, 0, 0, 0, 0);
    const lte = new Date(ano!, mes!, 0, 23, 59, 59, 999); // dia 0 do mês seguinte = último dia
    return { gte, lte };
  }

  const gte = new Date();
  gte.setHours(0, 0, 0, 0);
  const lte = new Date(gte);
  lte.setDate(lte.getDate() + 30);
  lte.setHours(23, 59, 59, 999);
  return { gte, lte };
}

/**
 * Agenda agregada do clube: treinos + jogos de todos os escalões legíveis,
 * ordenados cronologicamente. Respeita o âmbito de leitura (§6.4) — Admin/DT
 * (âmbito TODO_CLUBE) veem todos; treinadores veem os seus + os visíveis.
 * Opcionalmente filtrável por escalão e por mês/ano (defeito: próximos 30 dias).
 */
export async function obterAgendaClube(
  filtros: FiltrosAgenda = {},
): Promise<Resultado<EventoAgenda[]>> {
  const ctx = await contexto();
  if (ctx.estado === "erro") return erro(ctx.erro);

  const janela = resolverJanela(filtros.mes, filtros.ano);

  // Âmbito de leitura por escalão (mesmo padrão de listarSessoes/listarJogos).
  const legiveis = await escaloesLegiveis();
  let filtroEscalao: Prisma.SessaoWhereInput & Prisma.JogoWhereInput = {};
  if (filtros.escalaoId) {
    if (!(await podeLerEscalao(filtros.escalaoId))) return ok([]);
    filtroEscalao = { escalaoId: filtros.escalaoId };
  } else if (legiveis !== "TODOS") {
    if (legiveis.length === 0) return ok([]);
    filtroEscalao = { escalaoId: { in: legiveis } };
  }

  const [sessoes, jogos] = await Promise.all([
    prisma.sessao.findMany({
      where: {
        epocaId: ctx.epoca.id,
        escalao: { clubeId: ctx.clubeId },
        data: janela,
        ...filtroEscalao,
      },
      select: {
        id: true,
        data: true,
        local: true,
        objetivo: true,
        tipoSessao: true,
        escalao: { select: { nome: true } },
      },
      orderBy: { data: "asc" },
    }),
    prisma.jogo.findMany({
      where: {
        epocaId: ctx.epoca.id,
        escalao: { clubeId: ctx.clubeId },
        data: janela,
        ...filtroEscalao,
      },
      select: {
        id: true,
        data: true,
        local: true,
        adversario: true,
        escalao: { select: { nome: true } },
      },
      orderBy: { data: "asc" },
    }),
  ]);

  const eventos: EventoAgenda[] = [
    ...sessoes.map((s): EventoAgenda => ({
      id: s.id,
      tipo: "TREINO",
      data: s.data,
      escalaoNome: s.escalao.nome,
      titulo: s.objetivo?.trim() || ROTULO_TIPO_SESSAO[s.tipoSessao],
      local: s.local,
    })),
    ...jogos.map((j): EventoAgenda => ({
      id: j.id,
      tipo: "JOGO",
      data: j.data,
      escalaoNome: j.escalao.nome,
      titulo: `vs ${j.adversario}`,
      local: j.local,
    })),
  ];

  // Ordenação cronológica (crescente); desempate estável por tipo para saída determinística.
  eventos.sort((a, b) => {
    const diff = a.data.getTime() - b.data.getTime();
    if (diff !== 0) return diff;
    return a.tipo.localeCompare(b.tipo);
  });

  return ok(eventos);
}
