"use server";

import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { podeLerEscalao } from "@/lib/permissoes";
import { ok, erro, type Resultado } from "@/lib/utils";
import { segundaFeira, domingo, numeroSemana, semanaSobrepoePlaneamento } from "@/lib/semana";
import type { ModoSemana } from "@/lib/schemas/planeamento";
import type { MomentoSemana } from "@/lib/schemas/treino";
import type { TipoSessao } from "@prisma/client";

/** Resumo de uma sessão dentro da lista agrupada por semana (§8.9.1). */
export interface SessaoResumo {
  id: string;
  data: Date;
  tipoSessao: TipoSessao;
  objetivo: string | null;
  duracaoMin: number | null;
  /** Momento da semana (MD-X) no modo ESTRUTURADO; por sessão. */
  momentoSemana: MomentoSemana | null;
  numExercicios: number;
}

/**
 * Uma semana de trabalho (§8.9.1). A semana é *resultado* do agrupamento das
 * sessões pela data (segunda a domingo), não uma pré-condição. Quando existe um
 * planeamento formalizado sobreposto, a semana herda o nome e o modo desse
 * planeamento; caso contrário usa o *fallback* numérico «Semana N».
 */
export interface SemanaComSessoes {
  semanaNumero: number;
  dataInicio: Date; // segunda-feira
  dataFim: Date; // domingo
  nome: string;
  planeamentoId?: string;
  modoSemana?: ModoSemana;
  /**
   * Momento característico da semana quando todas as sessões partilham o mesmo
   * MD-X (semana ESTRUTURADO homogénea); indefinido quando divergem. O momento
   * por sessão vive em `SessaoResumo.momentoSemana`.
   */
  momentoSemana?: MomentoSemana;
  sessoes: SessaoResumo[];
}

/** Momento comum a todas as sessões da semana, se for único. */
function momentoDaSemana(sessoes: SessaoResumo[]): MomentoSemana | undefined {
  const momentos = new Set(
    sessoes
      .map((s) => s.momentoSemana)
      .filter((m): m is MomentoSemana => m != null),
  );
  return momentos.size === 1 ? [...momentos][0] : undefined;
}

/**
 * Agrupa as sessões de um escalão (época ativa) por semana ISO (segunda a
 * domingo), cruzando com os planeamentos formalizados para obter nome/modo.
 * Devolve as semanas da mais recente para a mais antiga (para a lista de treinos).
 */
export async function obterSessoesPorSemana({
  escalaoId,
}: {
  escalaoId: string;
}): Promise<Resultado<SemanaComSessoes[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");
  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");
  if (!(await podeLerEscalao(escalaoId))) return erro("Sem permissão neste escalão");

  const [sessoes, planeamentos] = await Promise.all([
    prisma.sessao.findMany({
      where: { epocaId: epoca.id, escalaoId, escalao: { clubeId } },
      select: {
        id: true,
        data: true,
        tipoSessao: true,
        objetivo: true,
        duracaoMin: true,
        momentoSemana: true,
        _count: { select: { exercicios: true } },
      },
      orderBy: { data: "asc" },
    }),
    prisma.planeamento.findMany({
      where: { epocaId: epoca.id, escalaoId, escalao: { clubeId } },
      select: { id: true, nome: true, modoSemana: true, dataInicio: true, dataFim: true },
      orderBy: { dataInicio: "asc" },
    }),
  ]);

  // Agrupa por segunda-feira da semana ISO.
  const grupos = new Map<number, { seg: Date; dom: Date; sessoes: SessaoResumo[] }>();
  for (const s of sessoes) {
    const seg = segundaFeira(s.data);
    const chave = seg.getTime();
    let grupo = grupos.get(chave);
    if (!grupo) {
      grupo = { seg, dom: domingo(s.data), sessoes: [] };
      grupos.set(chave, grupo);
    }
    grupo.sessoes.push({
      id: s.id,
      data: s.data,
      tipoSessao: s.tipoSessao,
      objetivo: s.objetivo,
      duracaoMin: s.duracaoMin,
      momentoSemana: (s.momentoSemana as MomentoSemana | null) ?? null,
      numExercicios: s._count.exercicios,
    });
  }

  const epocaInicio = new Date(epoca.dataInicio);
  const semanas: SemanaComSessoes[] = [];
  for (const grupo of grupos.values()) {
    const plan = planeamentos.find((p) =>
      semanaSobrepoePlaneamento(
        grupo.seg,
        grupo.dom,
        new Date(p.dataInicio),
        new Date(p.dataFim),
      ),
    );
    const semanaNumero = numeroSemana(epocaInicio, grupo.seg);
    grupo.sessoes.sort((a, b) => a.data.getTime() - b.data.getTime());

    const semana: SemanaComSessoes = {
      semanaNumero,
      dataInicio: grupo.seg,
      dataFim: grupo.dom,
      nome: plan?.nome ?? `Semana ${semanaNumero}`,
      sessoes: grupo.sessoes,
    };
    if (plan) {
      semana.planeamentoId = plan.id;
      if (plan.modoSemana) semana.modoSemana = plan.modoSemana as ModoSemana;
    }
    const momento = momentoDaSemana(grupo.sessoes);
    if (momento) semana.momentoSemana = momento;
    semanas.push(semana);
  }

  // Da mais recente para a mais antiga (para a lista de treinos).
  semanas.sort((a, b) => b.dataInicio.getTime() - a.dataInicio.getTime());
  return ok(semanas);
}
