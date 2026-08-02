"use server";

import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { podeLerEscalao } from "@/lib/permissoes";
import { ok, erro, type Resultado } from "@/lib/utils";

export interface JogoDadosAtleta {
  data: string; // "YYYY-MM-DD"
  adversario: string;
  golos: number;
  assistencias: number;
  defesas: number | null;
  golosSofridosGR: number | null;
  utilizado: boolean;
}

export interface PresencaMensal {
  mes: string; // "Jan", "Fev", …
  total: number;
  presentes: number;
  taxa: number; // 0–1
}

export async function obterEvolucaoAtleta(
  atletaId: string,
): Promise<Resultado<JogoDadosAtleta[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");
  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const atleta = await prisma.atleta.findFirst({
    where: { id: atletaId, escalao: { clubeId } },
    select: { escalaoId: true },
  });
  if (!atleta) return erro("Atleta não encontrado");
  if (!(await podeLerEscalao(atleta.escalaoId))) return erro("Sem permissão neste escalão");

  const estatisticas = await prisma.estatisticaAtleta.findMany({
    where: { atletaId, jogo: { epocaId: epoca.id } },
    include: { jogo: { select: { data: true, adversario: true } } },
    orderBy: { jogo: { data: "asc" } },
  });

  return ok(
    estatisticas.map((e) => ({
      data: e.jogo.data.toISOString().slice(0, 10),
      adversario: e.jogo.adversario,
      golos: e.golos,
      assistencias: e.assistencias,
      defesas: e.defesas,
      golosSofridosGR: e.golosSofridosGR,
      utilizado: e.utilizacao !== "NAO_UTILIZADO",
    })),
  );
}

export async function obterPresencasMensal(
  atletaId: string,
): Promise<Resultado<PresencaMensal[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");
  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const atleta = await prisma.atleta.findFirst({
    where: { id: atletaId, escalao: { clubeId } },
    select: { escalaoId: true, criadoEm: true },
  });
  if (!atleta) return erro("Atleta não encontrado");
  if (!(await podeLerEscalao(atleta.escalaoId))) return erro("Sem permissão neste escalão");

  const [sessoes, presencas] = await Promise.all([
    prisma.sessao.findMany({
      where: {
        epocaId: epoca.id,
        escalaoId: atleta.escalaoId,
        data: { gte: atleta.criadoEm },
      },
      select: { id: true, data: true },
      orderBy: { data: "asc" },
    }),
    prisma.presenca.findMany({
      where: {
        atletaId,
        estado: { in: ["PRESENTE", "ATRASADO"] },
        sessao: { epocaId: epoca.id },
      },
      select: { sessaoId: true },
    }),
  ]);

  const presencasSet = new Set(presencas.map((p) => p.sessaoId));
  const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const mesMap = new Map<string, { total: number; presentes: number; mesIdx: number }>();

  for (const s of sessoes) {
    const d = new Date(s.data);
    const mesIdx = d.getMonth();
    const key = `${d.getFullYear()}-${String(mesIdx + 1).padStart(2, "0")}`;
    const atual = mesMap.get(key) ?? { total: 0, presentes: 0, mesIdx };
    atual.total++;
    if (presencasSet.has(s.id)) atual.presentes++;
    mesMap.set(key, atual);
  }

  return ok(
    [...mesMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        mes: MESES[v.mesIdx],
        total: v.total,
        presentes: v.presentes,
        taxa: v.total > 0 ? v.presentes / v.total : 0,
      })),
  );
}
