"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obterEpocaAtiva, obterClubeIdAtual } from "@/lib/epoca-context";
import { ok, erro, type Resultado } from "@/lib/utils";
import type { EstadoHabilidade, Habilidade, ProgressoHabilidade } from "@prisma/client";

export interface HabilidadeComProgresso extends Habilidade {
  estado: EstadoHabilidade;
  dataDesbloqueio: Date | null;
  notas: string | null;
}

export async function obterCadernetaAtleta(
  atletaId: string,
): Promise<Resultado<HabilidadeComProgresso[]>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const atleta = await prisma.atleta.findFirst({
    where: { id: atletaId, escalao: { clubeId } },
    select: { id: true },
  });
  if (!atleta) return erro("Atleta não encontrado");

  const [habilidades, progressos] = await Promise.all([
    prisma.habilidade.findMany({
      where: { clubeId },
      orderBy: [{ nivel: "asc" }, { ordem: "asc" }],
    }),
    prisma.progressoHabilidade.findMany({
      where: { atletaId, epocaId: epoca.id },
    }),
  ]);

  const porHabilidade = new Map<string, ProgressoHabilidade>(
    progressos.map((p) => [p.habilidadeId, p]),
  );

  const resultado: HabilidadeComProgresso[] = habilidades.map((h) => {
    const p = porHabilidade.get(h.id);
    return {
      ...h,
      estado: p?.estado ?? "NAO_INICIADO",
      dataDesbloqueio: p?.dataDesbloqueio ?? null,
      notas: p?.notas ?? null,
    };
  });

  return ok(resultado);
}

export async function atualizarProgresso(
  atletaId: string,
  habilidadeId: string,
  estado: EstadoHabilidade,
  notas?: string,
): Promise<Resultado<void>> {
  const clubeId = await obterClubeIdAtual();
  if (!clubeId) return erro("Não autenticado");

  const epoca = await obterEpocaAtiva();
  if (!epoca) return erro("Nenhuma época ativa");

  const [atleta, habilidade] = await Promise.all([
    prisma.atleta.findFirst({ where: { id: atletaId, escalao: { clubeId } }, select: { id: true } }),
    prisma.habilidade.findFirst({ where: { id: habilidadeId, clubeId }, select: { id: true } }),
  ]);
  if (!atleta) return erro("Atleta não encontrado");
  if (!habilidade) return erro("Habilidade não encontrada");

  // DESBLOQUEADO regista data; voltar atrás limpa (secção 12.7)
  const dataDesbloqueio = estado === "DESBLOQUEADO" ? new Date() : null;

  await prisma.progressoHabilidade.upsert({
    where: {
      atletaId_habilidadeId_epocaId: { atletaId, habilidadeId, epocaId: epoca.id },
    },
    create: {
      atletaId,
      habilidadeId,
      epocaId: epoca.id,
      estado,
      dataDesbloqueio,
      notas: notas ?? null,
    },
    update: { estado, dataDesbloqueio, notas: notas ?? null },
  });
  revalidatePath(`/plantel/${atletaId}`);
  return ok(undefined);
}
