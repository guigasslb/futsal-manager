"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import {
  exigirCapacidade,
  podeLerEscalao,
  obterMembroAtual,
} from "@/lib/permissoes";
import { ok, erro, erroDeValidacao, type Resultado } from "@/lib/utils";
import {
  registarRpeSchema,
  registarRpeSessaoSchema,
  SEMANAS_CARGA_DEFAULT,
} from "@/lib/schemas/cargaTreino";

const PATH = "/treinos";
const MS_DIA = 24 * 60 * 60 * 1000;
const MS_SEMANA = 7 * MS_DIA;

// ─────────────────────────────────────────────────────────────────────────────
// Tipos e funções puras — carga semanal + ACWR (§8.20)
// ─────────────────────────────────────────────────────────────────────────────

/** Zona de carga derivada do ACWR (bíblia §8.20). */
export type ZonaCarga = "SUBCARGA" | "IDEAL" | "RISCO";

export const LABEL_ZONA_CARGA: Record<ZonaCarga, string> = {
  SUBCARGA: "Subcarga",
  IDEAL: "Zona ideal",
  RISCO: "Risco de sobrecarga",
};

export interface DadosCargaSemanal {
  /** Rótulo curto da semana (início — "DD/MM"). */
  semana: string;
  /** Início da semana (segunda-feira) em ISO "YYYY-MM-DD". */
  inicioSemana: string;
  /** Carga acumulada da semana: Σ(duracaoMin × rpeSessao). */
  cargaAcumulada: number;
  /** RPE médio das sessões da semana (0 quando não há RPE registado). */
  rpeMedia: number;
  /** Nº de sessões da semana com RPE registado. */
  nSessoes: number;
  /** ACWR = carga da semana / média das 4 semanas anteriores; null sem histórico. */
  acwr: number | null;
  /** Zona derivada do ACWR; null quando o ACWR é null. */
  zona: ZonaCarga | null;
}

/** Sessão reduzida ao necessário para o cálculo de carga (pura, testável). */
export interface SessaoCarga {
  data: Date;
  duracaoMin: number | null;
  rpeSessao: number | null;
}

/**
 * Início da semana (segunda-feira, 00:00 local) da data dada.
 * ISO 8601: a semana começa à segunda-feira.
 */
export function inicioSemana(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diaSemana = r.getDay(); // 0=Dom … 6=Sáb
  const desvio = (diaSemana + 6) % 7; // dias desde a última segunda-feira
  r.setDate(r.getDate() - desvio);
  r.setHours(0, 0, 0, 0);
  return r;
}

/**
 * Classifica o ACWR numa zona de carga (bíblia §8.20):
 * `< 0.8` → subcarga · `0.8–1.3` → ideal · `> 1.3` → risco de sobrecarga.
 */
export function classificarAcwr(acwr: number | null): ZonaCarga | null {
  if (acwr === null) return null;
  if (acwr < 0.8) return "SUBCARGA";
  if (acwr > 1.3) return "RISCO";
  return "IDEAL";
}

function isoDia(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function rotuloSemana(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Constrói a série de carga das últimas `semanas` semanas terminando na semana de
 * `agora`. Para cada semana: carga acumulada (Σ duracaoMin × rpeSessao), RPE médio,
 * e ACWR (rácio entre a carga da semana e a média das até 4 semanas anteriores).
 *
 * Função pura — não toca em I/O — para ser diretamente testável (bíblia §8.20).
 */
export function calcularCargaSemanal(
  sessoes: SessaoCarga[],
  semanas: number,
  agora: Date,
): DadosCargaSemanal[] {
  const semanaAtual = inicioSemana(agora);

  // Buckets ordenados (mais antigo → mais recente); index `semanas-1` = semana atual.
  interface Bucket {
    inicio: Date;
    carga: number;
    rpeSoma: number;
    rpeCount: number;
    nSessoes: number;
  }
  const buckets: Bucket[] = [];
  const porInicio = new Map<number, Bucket>();
  for (let i = 0; i < semanas; i++) {
    const inicio = new Date(semanaAtual.getTime() - (semanas - 1 - i) * MS_SEMANA);
    const b: Bucket = { inicio, carga: 0, rpeSoma: 0, rpeCount: 0, nSessoes: 0 };
    buckets.push(b);
    porInicio.set(inicio.getTime(), b);
  }

  for (const s of sessoes) {
    if (s.rpeSessao == null) continue; // sem RPE não há carga percebida
    const chave = inicioSemana(s.data).getTime();
    const b = porInicio.get(chave);
    if (!b) continue; // fora da janela
    if (s.duracaoMin != null) b.carga += s.duracaoMin * s.rpeSessao;
    b.rpeSoma += s.rpeSessao;
    b.rpeCount += 1;
    b.nSessoes += 1;
  }

  return buckets.map((b, i) => {
    // Crónica: média das cargas das até 4 semanas anteriores existentes na janela.
    const inicioPrev = Math.max(0, i - 4);
    const anteriores = buckets.slice(inicioPrev, i);
    const cargaCronica =
      anteriores.length > 0
        ? anteriores.reduce((acc, x) => acc + x.carga, 0) / anteriores.length
        : 0;
    const acwr = cargaCronica > 0 ? b.carga / cargaCronica : null;
    return {
      semana: rotuloSemana(b.inicio),
      inicioSemana: isoDia(b.inicio),
      cargaAcumulada: b.carga,
      rpeMedia: b.rpeCount > 0 ? b.rpeSoma / b.rpeCount : 0,
      nSessoes: b.nSessoes,
      acwr,
      zona: classificarAcwr(acwr),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Server Actions — escrita
// ─────────────────────────────────────────────────────────────────────────────

/**
 * RPE da sessão atribuído pelo treinador (1-10). Exige TREINOS_GERIR no escalão da
 * sessão. Atualiza o campo `rpeSessao` do `Sessao` (bíblia §8.20).
 */
export async function registarRpeSessao(
  sessaoId: string,
  rpeSessao: number,
): Promise<Resultado<void>> {
  const parsed = registarRpeSessaoSchema.safeParse({ sessaoId, rpeSessao });
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const sessao = await prisma.sessao.findFirst({
    where: { id: parsed.data.sessaoId, escalao: { clubeId } },
    select: { id: true, escalaoId: true },
  });
  if (!sessao) return erro("Sessão não encontrada");

  const perm = await exigirCapacidade("TREINOS_GERIR", sessao.escalaoId);
  if (!perm.ok) return erro(perm.erro);

  await prisma.sessao.update({
    where: { id: sessao.id },
    data: { rpeSessao: parsed.data.rpeSessao },
  });

  revalidatePath(PATH);
  revalidatePath(`${PATH}/${sessao.id}`);
  return ok(undefined);
}

/**
 * RPE individual reportado por um atleta para uma sessão (1-10). Upsert em
 * `RpeAtleta`. Exige autenticação; a sessão e o atleta têm de pertencer ao clube
 * do utilizador (bíblia §8.20).
 */
export async function registarRpeAtleta(
  sessaoId: string,
  atletaId: string,
  rpe: number,
): Promise<Resultado<void>> {
  const parsed = registarRpeSchema.safeParse({ sessaoId, rpe });
  if (!parsed.success) return erroDeValidacao(parsed.error);

  const session = await auth();
  if (!session?.user?.id) return erro("Não autenticado");

  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const sessao = await prisma.sessao.findFirst({
    where: { id: parsed.data.sessaoId, escalao: { clubeId } },
    select: { id: true, escalaoId: true },
  });
  if (!sessao) return erro("Sessão não encontrada");
  if (!(await podeLerEscalao(sessao.escalaoId)))
    return erro("Sem permissão neste escalão");

  const atleta = await prisma.atleta.findFirst({
    where: { id: atletaId, escalao: { clubeId } },
    select: { id: true },
  });
  if (!atleta) return erro("Atleta não encontrado");

  await prisma.rpeAtleta.upsert({
    where: { sessaoId_atletaId: { sessaoId: sessao.id, atletaId: atleta.id } },
    create: { sessaoId: sessao.id, atletaId: atleta.id, rpe: parsed.data.rpe },
    update: { rpe: parsed.data.rpe },
  });

  revalidatePath(PATH);
  revalidatePath(`${PATH}/${sessao.id}`);
  return ok(undefined);
}

// ─────────────────────────────────────────────────────────────────────────────
// Server Action — leitura
// ─────────────────────────────────────────────────────────────────────────────

export interface CargaSemanalEscalao {
  escalaoId: string;
  semanas: DadosCargaSemanal[];
  /** Verdadeiro se existe pelo menos uma sessão com RPE na janela. */
  temDados: boolean;
}

/**
 * Curva de carga das últimas `semanas` (default 8) de um escalão. Devolve, por
 * semana, a carga acumulada, o RPE médio e o ACWR (bíblia §8.20). Exige
 * RELATORIOS_VER e leitura do escalão.
 */
export async function obterCargaSemanal(
  escalaoId: string,
  semanas: number = SEMANAS_CARGA_DEFAULT,
): Promise<Resultado<CargaSemanalEscalao>> {
  const ctx = await obterMembroAtual();
  if (!ctx) return erro("Não autenticado");
  if (!ctx.capacidades.includes("RELATORIOS_VER")) return erro("Sem permissão");

  const escalao = await prisma.escalao.findFirst({
    where: { id: escalaoId, clubeId: ctx.clube.id },
    select: { id: true },
  });
  if (!escalao) return erro("Escalão não encontrado");
  if (!(await podeLerEscalao(escalaoId))) return erro("Sem permissão neste escalão");

  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const n = Math.min(Math.max(Math.trunc(semanas), 1), 52);
  const agora = new Date();
  const janelaInicio = new Date(
    inicioSemana(agora).getTime() - (n - 1) * MS_SEMANA,
  );

  const sessoes = await prisma.sessao.findMany({
    where: {
      epocaId: epoca.id,
      escalaoId,
      data: { gte: janelaInicio },
    },
    select: { data: true, duracaoMin: true, rpeSessao: true },
  });

  const dados = calcularCargaSemanal(sessoes, n, agora);
  return ok({
    escalaoId,
    semanas: dados,
    temDados: dados.some((d) => d.nSessoes > 0),
  });
}
